#!/bin/bash
source "$(dirname "$0")/.env"

TASK=$1
MODE=$2

case $MODE in
  plan)
    echo "🧠 Planner: Gemini"
    python3 -c "
import google.generativeai as genai
import sys
genai.configure(api_key='$GEMINI_API_KEY')
model = genai.GenerativeModel('gemini-1.5-pro')
prompt = open('ai/prompts/planner.md').read()
response = model.generate_content(prompt + '\n\n태스크: ' + sys.argv[1])
print(response.text)
" "$TASK"
    ;;

  code-front)
    echo "💻 Coder A: Kimi (thinking OFF)"
    if ! kimi --quiet --no-thinking -p "$TASK"; then
      echo "❌ Kimi 실패 → Codex로 폴백"
      codex exec "$TASK"
    fi
    ;;

  code-back)
    echo "💻 Coder B: Codex"
    codex "$TASK"
    ;;

  review)
    echo "🔍 Reviewer: Gemini"
    gemini -p "$TASK"
    ;;

  test)
    echo "🧪 Playwright E2E 테스트"
    npx playwright test
    if [ $? -ne 0 ]; then
      echo "❌ 테스트 실패 → Gemini 재리뷰"
      ./ai/obnofi-ai.sh "$(cat playwright-report/results.json)" review
    else
      echo "✅ 테스트 통과"
    fi
    ;;

  all)
    echo "🔄 전체 파이프라인 실행"
    ./ai/obnofi-ai.sh "$TASK" plan
    echo "---"
    ./ai/obnofi-ai.sh "$TASK" code-front
    echo "---"
    ./ai/obnofi-ai.sh "$TASK" review
    echo "---"
    ./ai/obnofi-ai.sh "" test
    ;;

  *)
    echo "사용법:"
    echo "  ./ai/obnofi-ai.sh [task] plan        → Gemini 설계"
    echo "  ./ai/obnofi-ai.sh [task] code-front  → Kimi 프론트 코딩"
    echo "  ./ai/obnofi-ai.sh [task] code-back   → Codex 백엔드 코딩"
    echo "  ./ai/obnofi-ai.sh [task] review      → Gemini 리뷰"
    echo "  ./ai/obnofi-ai.sh [task] test        → Playwright E2E"
    echo "  ./ai/obnofi-ai.sh [task] all         → 전체 파이프라인"
    ;;
esac
