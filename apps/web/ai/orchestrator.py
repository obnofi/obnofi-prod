#!/usr/bin/env python3
from __future__ import annotations

import os
import sys
import shlex
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

import httpx
from google.genai import errors as genai_errors

# ── 환경변수 로드 ──────────────────────────────────────────────
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            os.environ[k.strip()] = v.strip()

GEMINI_KEY    = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL  = os.environ.get("GEMINI_MODEL", "gemini-2.5-pro")
GEMINI_FALLBACK_MODEL = os.environ.get("GEMINI_FALLBACK_MODEL", "gemini-2.5-flash")
KIMI_CMD      = os.environ.get("KIMI_CMD", "").strip()
CODEX_CMD     = os.environ.get("CODEX_CMD", "codex").strip()
GEMINI_CLI_CMD = os.environ.get("GEMINI_CLI_CMD", "gemini").strip()

PROMPTS = Path(__file__).parent / "prompts"
PROJECT_ROOT = Path(__file__).resolve().parent.parent

def read_prompt(name: str) -> str:
    return (PROMPTS / f"{name}.md").read_text()

def separator(title: str):
    print(f"\n{'─'*50}")
    print(f"  {title}")
    print(f"{'─'*50}\n")

def require_env(name: str, feature: str) -> str:
    value = os.environ.get(name, "").strip()
    if value:
        return value
    print(f"❌ {feature} 실행에 필요한 환경변수가 없습니다: {name}")
    print(f"   {Path(__file__).parent / '.env'} 에 {name}=... 형식으로 추가하세요.")
    sys.exit(1)

def resolve_kimi_command() -> list[str]:
    if KIMI_CMD:
        parts = shlex.split(KIMI_CMD)
        if parts and shutil.which(parts[0]):
            return parts
        print(f"❌ KIMI_CMD로 지정한 실행 파일을 찾을 수 없습니다: {KIMI_CMD}")
        sys.exit(1)

    for candidate in ("kmi", "kimi"):
        if shutil.which(candidate):
            return [candidate]

    print("❌ Kimi CLI를 찾을 수 없습니다.")
    print("   `kmi` 또는 `kimi`를 설치하거나, .env에 KIMI_CMD=실행명 형식으로 지정하세요.")
    sys.exit(1)

def resolve_codex_command() -> list[str]:
    parts = shlex.split(CODEX_CMD)
    if parts and shutil.which(parts[0]):
        return parts
    print(f"❌ Codex CLI를 찾을 수 없습니다: {CODEX_CMD}")
    print("   `codex`를 설치하거나, .env에 CODEX_CMD=실행명 형식으로 지정하세요.")
    sys.exit(1)

def resolve_gemini_cli_command() -> list[str]:
    parts = shlex.split(GEMINI_CLI_CMD)
    if parts and shutil.which(parts[0]):
        return parts
    print(f"❌ Gemini CLI를 찾을 수 없습니다: {GEMINI_CLI_CMD}")
    print("   `gemini`를 설치하거나, .env에 GEMINI_CLI_CMD=실행명 형식으로 지정하세요.")
    sys.exit(1)

def run_codex_fallback(prompt: str, title: str = "💻 Fallback — Codex") -> str:
    separator(title)
    codex_cmd = resolve_codex_command()
    with tempfile.NamedTemporaryFile(mode="w+", suffix=".txt", delete=False) as f:
        output_path = f.name

    try:
        result = subprocess.run(
            [
                *codex_cmd,
                "exec",
                "--skip-git-repo-check",
                "--sandbox",
                "read-only",
                "--cd",
                str(PROJECT_ROOT),
                "--output-last-message",
                output_path,
                prompt,
            ],
            capture_output=True,
            text=True,
            cwd=PROJECT_ROOT,
        )
        final_output = Path(output_path).read_text().strip() if Path(output_path).exists() else ""
    finally:
        Path(output_path).unlink(missing_ok=True)

    if result.returncode != 0:
        print("❌ Codex 폴백 실행 실패")
        print(f"   종료 코드: {result.returncode}")
        output = ((result.stdout or "") + (("\n" + result.stderr) if result.stderr else "")).strip()
        if "/.codex/sessions" in output and "permission denied" in output.lower():
            print("   원인: Codex 세션 디렉터리 권한 문제")
            print("   해결: sudo chown -R $(whoami) ~/.codex")
        print(output)
        sys.exit(1)
    output = final_output or result.stdout or result.stderr
    print(output)
    return output

def planner_fallback(prompt: str, reason: str) -> str:
    print(f"🔁 Planner를 Codex로 폴백합니다.")
    print(f"   사유: {reason}")
    return run_codex_fallback(prompt, "💻 Fallback Planner — Codex")

def reviewer_fallback(prompt: str, reason: str) -> tuple[str, bool]:
    print(f"🔁 Reviewer를 Codex로 폴백합니다.")
    print(f"   사유: {reason}")
    output = run_codex_fallback(prompt, "💻 Fallback Reviewer — Codex")
    has_critical = "critical" in output.lower() and "없음" not in output.lower()
    return output, has_critical

# ── Planner (Gemini) ───────────────────────────────────────────
def plan(task: str) -> str:
    from google import genai

    separator("🧠 Planner — Gemini")
    prompt = read_prompt("planner") + f"\n\n## 태스크\n{task}"
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        return planner_fallback(prompt, "GEMINI_API_KEY가 없어 Gemini Planner를 사용할 수 없습니다.")

    client = genai.Client(api_key=api_key)
    models_to_try = [GEMINI_MODEL]
    if GEMINI_FALLBACK_MODEL and GEMINI_FALLBACK_MODEL != GEMINI_MODEL:
        models_to_try.append(GEMINI_FALLBACK_MODEL)

    for model_name in models_to_try:
        for attempt in range(1, 4):
            try:
                if model_name != GEMINI_MODEL:
                    print(f"🔁 Planner 모델 폴백: {model_name}")
                elif attempt > 1:
                    print(f"🔁 Planner 재시도 ({attempt}/3): {model_name}")

                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )
                result = response.text
                print(result)
                return result
            except genai_errors.ServerError as exc:
                print(f"⚠️ Gemini 서버 오류: {exc}")
                if attempt < 3:
                    time.sleep(attempt * 2)
                    continue
                break
            except genai_errors.ClientError as exc:
                print(f"❌ Gemini 요청 실패: {exc}")
                if "API key not valid" in str(exc):
                    print("   GEMINI_API_KEY 값이 비었거나 잘못되었습니다.")
                if "is not found" in str(exc) or "not supported for generateContent" in str(exc):
                    print(f"   현재 모델 설정값 '{model_name}' 이 유효하지 않습니다.")
                    print("   권장값: GEMINI_MODEL=gemini-2.5-pro 또는 GEMINI_MODEL=gemini-2.5-flash")
                if model_name == GEMINI_MODEL and len(models_to_try) > 1:
                    print(f"   다음 모델로 폴백합니다: {GEMINI_FALLBACK_MODEL}")
                    break
                return planner_fallback(prompt, f"Gemini 요청 실패: {exc}")
            except httpx.ConnectError as exc:
                return planner_fallback(prompt, f"Gemini API 네트워크 연결 실패: {exc}")
            except httpx.RequestError as exc:
                return planner_fallback(prompt, f"Gemini API 요청 오류: {exc}")

    return planner_fallback(
        prompt,
        f"Gemini Planner 실행 실패. 시도한 모델: {', '.join(models_to_try)}"
    )

# ── Coder (Kimi CLI) ───────────────────────────────────────────
def code(plan_result: str, task: str) -> str:
    separator("💻 Coder — Kimi K2.5 (thinking OFF)")
    prompt = read_prompt("coder") + f"\n\n## 플래너 설계\n{plan_result}\n\n## 구현 태스크\n{task}"
    kimi_cmd = resolve_kimi_command()

    result = subprocess.run(
        [*kimi_cmd, "--quiet", "--no-thinking", "-p", prompt],
        capture_output=True,
        text=True,
        cwd=PROJECT_ROOT,
    )
    if result.returncode != 0:
        print("❌ Kimi 실행 실패")
        print(f"   종료 코드: {result.returncode}")
        output = (result.stdout or "") + (("\n" + result.stderr) if result.stderr else "")
        if "rate limit" in output.lower() or "429" in output:
            print("   원인: Kimi 계정/조직의 요청 한도 초과")
        print(output.strip())
        print("🔁 Codex로 자동 폴백합니다.")
        return run_codex_fallback(prompt)
    output = result.stdout or result.stderr

    print(output)
    return output

# ── Reviewer (Gemini CLI) ─────────────────────────────────────
def review(code_result: str) -> tuple[str, bool]:
    separator("🔍 Reviewer — Gemini")
    prompt = read_prompt("reviewer") + f"\n\n## 리뷰할 코드\n{code_result}"
    try:
        gemini_cmd = resolve_gemini_cli_command()
    except SystemExit:
        return reviewer_fallback(prompt, "Gemini CLI를 찾을 수 없습니다.")

    result = subprocess.run(
        [*gemini_cmd, "-p", prompt],
        capture_output=True,
        text=True,
        cwd=PROJECT_ROOT,
    )
    if result.returncode != 0:
        print("❌ Gemini 실행 실패")
        print(f"   종료 코드: {result.returncode}")
        output = (result.stdout or "") + (("\n" + result.stderr) if result.stderr else "")
        if "not logged in" in output.lower() or "/login" in output.lower():
            print("   원인: Gemini CLI 로그인 필요")
        print(output.strip())
        return reviewer_fallback(prompt, f"Gemini CLI 실행 실패 (exit {result.returncode})")
    output = (result.stdout or result.stderr).strip()
    print(output)
    has_critical = "critical" in output.lower() and "없음" not in output.lower()
    return output, has_critical

# ── E2E 테스트 (Playwright) ────────────────────────────────────
def test() -> tuple[bool, str]:
    separator("🧪 E2E — Playwright")
    result = subprocess.run(
        ["npx", "playwright", "test", "--reporter=line"],
        capture_output=True, text=True
    )
    output = result.stdout + result.stderr
    print(output)
    passed = result.returncode == 0
    print("✅ 테스트 통과" if passed else "❌ 테스트 실패")
    return passed, output

# ── 전체 파이프라인 ────────────────────────────────────────────
def pipeline(task: str, max_retry: int = 2):
    print(f"\n🚀 obnofi AI 파이프라인 시작")
    print(f"   태스크: {task}\n")

    # 1. Planner
    plan_result = plan(task)

    # 2. Coder + Reviewer 루프
    code_result = code(plan_result, task)
    for attempt in range(1, max_retry + 1):
        review_result, has_critical = review(code_result)
        if not has_critical:
            print("\n✅ Critical 없음 — 다음 단계로")
            break
        if attempt < max_retry:
            separator(f"🔁 Critical 발견 → Kimi 재시도 ({attempt}/{max_retry})")
            code_result = code(review_result, task)
        else:
            print(f"\n⚠️  {max_retry}회 재시도 후에도 Critical 남음 — 수동 확인 필요")

    # 3. Playwright
    passed, test_output = test()
    if not passed:
        separator("🔁 테스트 실패 → Gemini 재리뷰")
        review_result, _ = review(code_result + "\n\n## 테스트 실패 로그\n" + test_output)

    separator("🏁 파이프라인 완료")

# ── CLI 진입점 ─────────────────────────────────────────────────
if __name__ == "__main__":
    args = sys.argv[1:]

    if not args:
        print("사용법:")
        print("  python orchestrator.py plan   '태스크'   # Gemini만")
        print("  python orchestrator.py code   '태스크'   # Kimi만")
        print("  python orchestrator.py review '코드'     # Claude만")
        print("  python orchestrator.py test              # Playwright만")
        print("  python orchestrator.py all    '태스크'   # 전체 파이프라인")
        sys.exit(0)

    mode = args[0]
    task = args[1] if len(args) > 1 else ""

    if mode == "plan":
        plan(task)
    elif mode == "code":
        code("", task)
    elif mode == "review":
        review(task)
    elif mode == "test":
        test()
    elif mode == "all":
        pipeline(task)
    else:
        print(f"알 수 없는 모드: {mode}")
        sys.exit(1)
