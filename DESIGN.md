#  Obnofi Design System

> 디자인 철학: **조용한 도구(Quiet Tool)** — 콘텐츠가 주인공이 되고, 인터페이스는 뒤로 물러난다.

> 🎨 **브랜드 포인트 컬러**: `#2E7D45` (로고 그린) — 강조, CTA에 일관되게 사용한다.

## Jungle System Extension

| Jungle term | Meaning |
|---|---|
| `Canopy` | Page cover image / page hero image |
| `MossNote` | Sticky memo attached to a Grove page, database page, or selected text |

---

## 1. 디자인 철학 (Design Philosophy)

obnofi는 **편집기 우선(Editor-first)** 디자인을 추구한다. 모든 UI 결정은 아래 원칙을 따른다:

- **최소 간섭 (Minimum Interference)** — 툴바, 버튼, 장식 요소는 사용자가 집중할 때 사라진다.
- **블록 기반 (Block-based Thinking)** — 모든 콘텐츠는 독립적인 블록 단위로 구성된다.
- **유연한 구조 (Flexible Structure)** — 같은 데이터를 표, 칸반, 갤러리, 캘린더 등 다양한 뷰로 전환할 수 있다.
- **조용한 색상 (Subdued Color)** — 색상은 강조가 아닌 분류와 상태 표시에만 사용된다.

--## ❌ 절대 금지 사항 (Hard Rules — No Exceptions)

이 규칙들은 AI 에이전트, 코드 리뷰, 어떤 상황에서도 예외 없이 적용된다.

### 연한 회색 보더 금지

**연한 회색 border를 임의로 추가하지 않는다.** 이는 obnofi의 "조용한 도구" 철학을 가장 많이 위반하는 패턴이다.

### 배경 색 임의로 추가 금지.
**배경의 색또한 임의로 추가하지 않는다.** obnofi는 배경색을 최소화하여 콘텐츠가 돋보이도록 설계되었다. 불필요한 배경색은 시각적 잡음을 증가시키고, 사용자 경험을 저해할 수 있다.

### 이모티콘 사용 금지
**이모티콘을 UI 요소에 임의로 사용하지 않는다.** obnofi는 이모티콘을 페이지 아이콘으로 광범위하게 활용하지만, 버튼이나 레이블에 이모티콘을 추가하는 것은 브랜드 일관성을 해치고, 전문성을 저해할 수 있다.
**icon**을 사용한다.

금지 예시:
```css
/* ❌ 절대 하지 말 것 */
border: 1px solid #e5e7eb;
border: 1px solid #d1d5db;
border: 1px solid #e2e8f0;
border: 1px solid rgba(0, 0, 0, 0.1);
border: 1px solid gray;
border-bottom: 1px solid #eee;
border-top: 1px solid lightgray;
/* Tailwind: border, border-gray-*, divide-gray-* 도 동일하게 금지 */
```

보더가 정말 필요한 경우:
```css
/* ✅ 반드시 디자인 토큰만 사용 */
border: 1px solid var(--color-border);
```

그러나 대부분의 경우 보더 없이 **간격(spacing)** 또는 **배경색 차이**로 구분을 표현한다. 보더를 추가하기 전에 먼저 공백과 배경색으로 해결할 수 있는지 검토할 것.

---

## 2. 색상 시스템 (Color System)

### 기본 팔레트

| 토큰명 | 용도 | Light Mode | Dark Mode |
|---|---|---|---|
| `--color-background` | 페이지 배경 | `#FFFFFF` | `#191919` |
| `--color-surface` | 사이드바, 패널 | `#F7F7F5` | `#202020` |
| `--color-hover` | 호버 상태 배경 | `#EBEBEA` | `#2F2F2F` |
| `--color-border` | 구분선, 테두리 | `#E3E2E0` | `#373737` |
| `--color-text-primary` | 본문 텍스트 | `#37352F` | `#FFFCED` |
| `--color-text-secondary` | 설명, 힌트 텍스트 | `#787774` | `#7F7F7F` |
| `--color-text-placeholder` | 플레이스홀더 | `#C7C6C4` | `#4A4A4A` |
| `--color-accent` | 강조, CTA 버튼 (로고 그린) | `#2E7D45` | `#3DA05A` |
| `--color-accent-hover` | 강조 버튼 호버 | `#246138` | `#2E7D45` |
| `--color-accent-subtle` | 강조 배경 (연한 그린) | `#E8F5EC` | `#1A3327` |

### 텍스트 하이라이트 & 배경 컬러 (7가지)

obnofi는 7가지 의미론적 색상을 제공한다. 각각 텍스트 색상과 배경 색상(연한 버전)으로 쌍을 이룬다.

| 이름 | 텍스트 | 배경 |
|---|---|---|
| Default | `#37352F` | `#F7F7F5` |
| Gray | `#9B9A97` | `#EBECED` |
| Brown | `#64473A` | `#E9E5E3` |
| Orange | `#D9730D` | `#FAEBDD` |
| Yellow | `#CB912F` | `#FBF3DB` |
| Green | `#448361` | `#DDedea` |
| Blue | `#337EA9` | `#DDEBF1` |
| Purple | `#9065B0` | `#EAE4F2` |
| Pink | `#C14C8A` | `#F4DFEB` |
| Red | `#D44C47` | `#FDDEDE` |

---

## 3. 타이포그래피 (Typography)

obnofi는 시스템 폰트 스택을 사용해 운영체제별 최적 가독성을 제공한다.

```css
font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont,
  "Segoe UI", Helvetica, "Apple Color Emoji", Arial,
  sans-serif, "Segoe UI Emoji", "Segoe UI Symbol";
```

### 텍스트 스케일

| 용도 | 크기 | 굵기 | 줄 높이 |
|---|---|---|---|
| H1 (제목 1) | `40px` (2em) | `700` | `1.2` |
| H2 (제목 2) | `30px` (1.875em) | `600` | `1.3` |
| H3 (제목 3) | `24px` (1.25em) | `600` | `1.3` |
| Body (본문) | `16px` | `400` | `1.5` |
| Small | `14px` | `400` | `1.4` |
| Caption | `12px` | `400` | `1.4` |
| Code | `85%` (em) | `400` | `1.5` |

### 폰트 규칙

- 본문은 기본적으로 `16px`, 소형 화면에서는 `14px`
- 줄 길이(line length)는 최대 `65ch`로 제한 (가독성 최적화)
- `font-weight`는 400(기본)과 600(강조) 두 가지만 주로 사용
- 코드 폰트: `"SFMono-Regular", Menlo, Consolas, monospace`

---

## 4. 간격 & 레이아웃 (Spacing & Layout)

### 8pt 그리드 시스템

obnofi는 `4px` 베이스 유닛을 사용한다. 모든 간격은 4의 배수.

| 토큰 | 값 | 용도 |
|---|---|---|
| `space-1` | `4px` | 아이콘 내부 패딩 |
| `space-2` | `8px` | 버튼 내부 패딩 (상하) |
| `space-3` | `12px` | 인라인 요소 간격 |
| `space-4` | `16px` | 블록 간 기본 간격 |
| `space-6` | `24px` | 섹션 내 간격 |
| `space-8` | `32px` | 섹션 간 간격 |
| `space-12` | `48px` | 페이지 상단 여백 |

### 페이지 레이아웃

```
┌────────────────────────────────────────────┐
│  Sidebar (240px)  │    Content Area        │
│                   │  max-width: 900px      │
│  - 워크스페이스    │  padding: 96px 96px    │
│  - 페이지 목록    │                        │
│  - 즐겨찾기       │   [Title]              │
│                   │   [Cover / Icon]       │
│                   │   [Blocks...]          │
└────────────────────────────────────────────┘
```

- 사이드바 너비: `240px` (기본), 접기 시 `0px`
- 콘텐츠 최대 너비: `900px` (일반), `1200px` (전체 너비 옵션)
- 페이지 좌우 패딩: `96px` (데스크탑), `24px` (모바일)

---

## 5. 컴포넌트 (Components)

### 5.1 블록 (Block)

obnofi의 핵심 단위. 모든 콘텐츠는 블록으로 구성된다.

```
[⠿] [📝] 텍스트 내용이 여기 들어갑니다...
 ↑    ↑
드래그  블록 타입 아이콘
핸들
```

- 호버 시 왼쪽에 드래그 핸들(`⠿`)과 `+` 버튼 표시
- 블록 선택 시 배경색 `--color-hover` 적용
- 블록 타입: Paragraph, Heading, Bulleted List, Numbered List, Toggle, Quote, Callout, Code, Divider, Table, Database 등

### 5.2 버튼 (Button)

```css
/* Primary Button */
.btn-primary {
  background: var(--color-accent);        /* #2E7D45 — 로고 그린 */
  color: #FFFFFF;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background 120ms ease;
}
.btn-primary:hover {
  background: var(--color-accent-hover);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 4px;
  padding: 6px 12px;
}
.btn-ghost:hover {
  background: var(--color-hover);
  color: var(--color-text-primary);
}
```

### 5.3 사이드바 아이템

```css
.sidebar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  color: var(--color-text-secondary);
  cursor: pointer;
  user-select: none;
}
.sidebar-item:hover {
  background: var(--color-hover);
  color: var(--color-text-primary);
}
.sidebar-item.active {
  background: var(--color-hover);
  color: var(--color-text-primary);
  font-weight: 500;
}
```

### 5.4 툴팁 & 팝오버

- 배경: `#1F1F1E` (다크, 라이트 모드 모두 동일)
- 텍스트: `#FFFFFF`
- border-radius: `6px`
- 패딩: `6px 10px`
- 폰트 크기: `12px`
- 애니메이션: `fadeIn 80ms ease`

### 5.5 Callout 블록

```css
.callout {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-radius: 4px;
  background: var(--color-surface);
  border-left: none; /* obnofi는 border-left 없이 배경색만 사용 */
}
.callout-icon {
  font-size: 20px;
  flex-shrink: 0;
}
```

---

## 6. 아이콘 시스템 (Icon System)

- 아이콘 크기: `16px` (기본), `20px` (블록 타입), `24px` (이모지 아이콘)
- obnofi는 이모지를 페이지 아이콘으로 광범위하게 활용
- 커스텀 SVG 아이콘은 `currentColor`로 색상 상속
- 아이콘 색상: `--color-text-secondary` (기본), 호버 시 `--color-text-primary`

---

## 7. 모션 & 인터랙션 (Motion & Interaction)

### 원칙

obnofi의 애니메이션은 **기능적 목적**에만 존재한다. 장식적 애니메이션은 사용하지 않는다.

| 상황 | Duration | Easing |
|---|---|---|
| 버튼 hover | `120ms` | `ease` |
| 사이드바 열기/닫기 | `200ms` | `ease-in-out` |
| 모달 등장 | `180ms` | `ease-out` |
| 드롭다운 | `120ms` | `ease-out` |
| 페이지 전환 | `없음 (instant)` | — |
| 블록 드래그 | `실시간` | `cubic-bezier(0.2, 0, 0, 1)` |

### 슬래시 커맨드 (`/`)

- 타이핑 즉시 팝오버 등장 (지연 없음)
- 검색 결과 필터링: `debounce 0ms` (실시간)
- 선택 항목 이동: 키보드 화살표 지원

---

## 8. 반응형 디자인 (Responsive Design)

| 브레이크포인트 | 범위 | 변경사항 |
|---|---|---|
| Desktop | `> 1024px` | 사이드바 상시 표시 |
| Tablet | `768px ~ 1024px` | 사이드바 오버레이로 전환 |
| Mobile | `< 768px` | 사이드바 숨김, 하단 탐색 바 |

### 모바일 특이사항
- 페이지 패딩: `24px`
- 블록 드래그&드롭 비활성화 (탭&홀드 대체)
- 슬래시 커맨드는 키보드 툴바로 접근

---

## 9. 다크 모드 (Dark Mode)

obnofi 다크 모드는 단순 색상 반전이 아닌, **별도 설계된 팔레트**를 사용한다.

### 다크 모드 설계 원칙

- 배경은 순수 검정(`#000`) 대신 따뜻한 짙은 회색(`#191919`) 사용 → 눈부심 방지
- 텍스트는 순수 흰색 대신 크림색(`#FFFCED`) 사용 → 눈 피로 감소
- 경계선은 명도 대비를 낮춰 부드럽게 처리
- 포인트 컬러(그린)는 다크 배경에서 명도를 높여 가독성 확보 (`#3DA05A`)
- 강조 배경(subtle)은 짙은 초록 계열(`#1A3327`)로 대체

### 다크 모드 색상 토큰

| 토큰명 | 라이트 모드 | 다크 모드 | 변경 이유 |
|---|---|---|---|
| `--color-background` | `#FFFFFF` | `#191919` | 따뜻한 다크 배경 |
| `--color-surface` | `#F7F7F5` | `#202020` | 사이드바/패널 구분 |
| `--color-hover` | `#EBEBEA` | `#2F2F2F` | 호버 피드백 유지 |
| `--color-selected` | `#E7E7E6` | `#383838` | 선택 블록 강조 |
| `--color-border` | `#E3E2E0` | `#373737` | 낮은 대비 구분선 |
| `--color-text-primary` | `#37352F` | `#FFFCED` | 크림 화이트 — 눈 피로 감소 |
| `--color-text-secondary` | `#787774` | `#7F7F7F` | 보조 텍스트 |
| `--color-text-placeholder` | `#C7C6C4` | `#4A4A4A` | 플레이스홀더 |
| `--color-accent` | `#2E7D45` | `#3DA05A` | 밝기 올려 대비 확보 |
| `--color-accent-hover` | `#246138` | `#2E7D45` | 호버 시 원색으로 |
| `--color-accent-subtle` | `#E8F5EC` | `#1A3327` | 강조 배경 (짙은 그린) |
| `--color-tooltip-bg` | `#1F1F1E` | `#111111` | 툴팁 배경 |

### 다크 모드 하이라이트 컬러

다크 모드에서는 텍스트 하이라이트 색상도 전체적으로 채도를 낮추고 밝기를 조정한다.

| 이름 | 텍스트 (다크) | 배경 (다크) |
|---|---|---|
| Default | `#FFFCED` | `#2F2F2F` |
| Gray | `#9B9A97` | `#2E2E2E` |
| Brown | `#937264` | `#2E2521` |
| Orange | `#FFA344` | `#3D2514` |
| Yellow | `#FFDC49` | `#3B2F00` |
| Green | `#4DAB9A` | `#0F2926` |
| Blue | `#529CCA` | `#102942` |
| Purple | `#9A6DD7` | `#1F1535` |
| Pink | `#E255A1` | `#35152A` |
| Red | `#FF7369` | `#3D0F0E` |

### CSS 구현

```css
/* 시스템 설정 자동 감지 */
@media (prefers-color-scheme: dark) {
  :root {
    --color-background:       #191919;
    --color-surface:          #202020;
    --color-hover:            #2F2F2F;
    --color-selected:         #383838;
    --color-border:           #373737;
    --color-text-primary:     #FFFCED;
    --color-text-secondary:   #7F7F7F;
    --color-text-placeholder: #4A4A4A;
    --color-accent:           #3DA05A;
    --color-accent-hover:     #2E7D45;
    --color-accent-subtle:    #1A3327;
    --color-tooltip-bg:       #111111;
  }
}

/* 수동 토글 — [data-theme="dark"] 클래스 */
[data-theme="dark"] {
  --color-background:       #191919;
  --color-surface:          #202020;
  --color-hover:            #2F2F2F;
  --color-selected:         #383838;
  --color-border:           #373737;
  --color-text-primary:     #FFFCED;
  --color-text-secondary:   #7F7F7F;
  --color-text-placeholder: #4A4A4A;
  --color-accent:           #3DA05A;
  --color-accent-hover:     #2E7D45;
  --color-accent-subtle:    #1A3327;
  --color-tooltip-bg:       #111111;
}

/* 수동 토글 — [data-theme="light"] 클래스 */
[data-theme="light"] {
  --color-background:       #FFFFFF;
  --color-surface:          #F7F7F5;
  --color-hover:            #EBEBEA;
  --color-selected:         #E7E7E6;
  --color-border:           #E3E2E0;
  --color-text-primary:     #37352F;
  --color-text-secondary:   #787774;
  --color-text-placeholder: #C7C6C4;
  --color-accent:           #2E7D45;
  --color-accent-hover:     #246138;
  --color-accent-subtle:    #E8F5EC;
  --color-tooltip-bg:       #1F1F1E;
}
```

## 9.1 Jungle Theme

`Jungle`은 라이트 테마 계열이지만, 제품 전체를 정글 메타포에 더 가깝게 보이도록 만든 별도 팔레트다. 기본 베이스는 파치먼트 톤을 쓰고, 액션 컬러는 `Canopy Green`, 강조는 `Opera Pink`를 사용한다.

### Jungle 팔레트

| 그룹 | 이름 | 값 |
|---|---|---|
| Base | Parchment | `#F5EDD8` |
| Base | Dry Grass | `#EDE5CC` |
| Base | Dark Root | `#3B3224` |
| Base | Forest Night | `#252518` |
| Base | Jungle Night | `#1A1A12` |
| Green | Canopy | `#2E7D45` |
| Green | Fern | `#3D9E5A` |
| Green | Undergrowth | `#1F5230` |
| Green | Moss | `#8FA85C` |
| Green | Swamp Teal | `#3B6B5E` |
| Accent | Opera Pink | `#C2547A` |
| Accent | Deep Rose | `#A3365C` |
| Accent | Blossom | `#D9839F` |
| Accent | Petal | `#F2C4D0` |
| Accent | Jungle Berry | `#6B1F3A` |

### Jungle UI 토큰

| 토큰명 | 값 | 용도 |
|---|---|---|
| `--color-background` | `#F5EDD8` | 페이지 기본 배경 |
| `--color-surface` | `#EDE5CC` | 패널/카드 표면 |
| `--color-text-primary` | `#3B3224` | 기본 본문 텍스트 |
| `--color-accent` | `#2E7D45` | Primary CTA |
| `--color-highlight` | `#C2547A` | 선택/강조 포인트 |
| `--color-danger` | `#A3365C` | 위험 액션 |

### Jungle CSS 구현

```css
html.jungle {
  --color-accent:           #2E7D45;
  --color-accent-hover:     #1F5230;
  --color-accent-subtle:    #DDE8CD;
  --color-background:       #F5EDD8;
  --color-surface:          #EDE5CC;
  --color-hover:            #E2D8BA;
  --color-selected:         #D7C9A6;
  --color-border:           #CABB98;
  --color-text-primary:     #3B3224;
  --color-text-secondary:   #6B624D;
  --color-text-placeholder: #9B9075;
  --color-tooltip-bg:       #252518;
  --color-board-surface:    #F1E7D0;
  --color-board-grid:       rgba(59, 50, 36, 0.09);
  --color-board-card:       #FBF2DE;
  --color-sticky-sun:       #8FA85C;
  --color-sticky-rose:      #F2C4D0;
  --color-sticky-sky:       #3B6B5E;
  --color-page-bg:          #F5EDD8;
  --color-highlight:        #C2547A;
  --color-danger:           #A3365C;
  color-scheme: light;
}
```

### 다크 모드 전환 애니메이션

```css
/* 테마 전환 시 부드럽게 */
*, *::before, *::after {
  transition:
    background-color 200ms ease,
    border-color 200ms ease,
    color 150ms ease;
}

/* 단, 성능 민감 요소는 제외 */
.block-drag-handle,
.no-transition {
  transition: none !important;
}
```

---

## 10. 접근성 (Accessibility)

- **키보드 내비게이션** 완전 지원 (Tab, Arrow, Enter, Escape)
- **포커스 링**: `outline: 2px solid var(--color-accent)` → `#2E7D45` (로고 그린, 기본 outline 제거 후 커스텀)
- **색상 대비**: WCAG AA 기준 충족 (4.5:1 이상)
- **aria-label**: 모든 아이콘 버튼에 필수 적용
- **스크린 리더**: 블록 타입 변경 시 `aria-live` 알림

---

## 11. 디자인 토큰 요약 (CSS Custom Properties)

```css
/* ===== Light Mode (Default) ===== */
:root {
  /* Colors — Brand */
  --color-accent:           #2E7D45;   /* 로고 그린 — 포인트 컬러 */
  --color-accent-hover:     #246138;
  --color-accent-subtle:    #E8F5EC;   /* 강조 배경 (연한 그린) */

  /* Colors — Base */
  --color-background:       #FFFFFF;
  --color-surface:          #F7F7F5;
  --color-hover:            #EBEBEA;
  --color-selected:         #E7E7E6;
  --color-border:           #E3E2E0;

  /* Colors — Text */
  --color-text-primary:     #37352F;
  --color-text-secondary:   #787774;
  --color-text-placeholder: #C7C6C4;

  /* Colors — UI */
  --color-tooltip-bg:       #1F1F1E;

  /* Typography */
  --font-sans: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "SFMono-Regular", Menlo, Consolas, monospace;
  --font-size-base: 16px;
  --line-height-base: 1.5;

  /* Spacing */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-6:  24px;
  --space-8:  32px;
  --space-12: 48px;

  /* Border Radius */
  --radius-sm: 3px;
  --radius-md: 6px;
  --radius-lg: 12px;

  /* Transitions */
  --transition-fast: 120ms ease;
  --transition-base: 200ms ease-in-out;

  /* Layout */
  --sidebar-width:      240px;
  --content-max-width:  900px;
  --page-padding:       96px;
}
```

---

## 12. 페이지 아이콘 (Glyph)

`PageGlyph`는 아이콘 **표시 전용** 컴포넌트다. 편집 UI는 `GrovePageCanopy`가 담당한다.

### 크기 규격

| 사용 위치 | 크기 | 비고 |
|---|---|---|
| 사이드바 목록 | `16px` | 아이콘 없으면 타입 기본 SVG (14px) |
| 페이지 헤더 (Chrome) | `56px` | 이모지 large, hover 시 편집 오버레이 표시 |
| 그래프 뷰 노드 | `20px` | — |
| 탭 / 브레드크럼 | `16px` | — |

### 폴백 아이콘 (icon === null)

| `Page.type` | 표시 아이콘 |
|---|---|
| `DOCUMENT` | Document SVG (파일 모양) |
| `CANVAS` | Canvas SVG (사각형 + 펜) |
| `DATABASE` | Database SVG (원통형 스택) |

### 이모지 선택 피커 (GrovePageCanopy 내부)

- 기본 이모지 30개 그리드 표시 (`6 × 5`)
- 직접 입력 필드: 사용자가 임의 이모지 붙여넣기 가능
- 피커 배경: `--color-surface`, `border-radius: var(--radius-md)`
- 각 이모지 셀: `32px × 32px`, hover 시 `--color-hover` 배경
- "Remove icon" 버튼: ghost, 피커 하단

---

## 13. 페이지 커버 이미지 (Canopy)

Canopy는 페이지 상단 전체 너비 히어로 이미지다.

### 레이아웃

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                   Canopy 이미지                            │  height: 180px (기본)
│                                                            │
│  [변경]  [제거]                      (hover 시 오버레이)   │
└────────────────────────────────────────────────────────────┘
  [📷 Add cover]  ← Canopy 없을 때, 제목 hover 시 표시
┌────────────────────────────────────────────────────────────┐
│  [🌱]  페이지 제목                                         │  ← Chrome (Glyph + 제목)
└────────────────────────────────────────────────────────────┘
```

### Canopy 이미지 규격

| 항목 | 값 |
|---|---|
| 높이 | `180px` (고정) |
| 너비 | 콘텐츠 컨테이너 전체 너비 (`100%`) |
| `object-fit` | `cover` |
| `object-position` | `center` (기본), 사용자 드래그로 Y축 조정 가능 |

### Canopy 없을 때

- Canopy 영역 표시 안 함 (공간 차지 없음)
- 제목 또는 Glyph hover 시 → `[📷 Add cover]` ghost 버튼 나타남

### Canopy hover 오버레이

- 배경: `rgba(0, 0, 0, 0.25)` (반투명 어둡게)
- 버튼: `[Change cover]` `[Remove]` — 우측 하단에 위치
- 버튼 스타일: `background: rgba(255,255,255,0.9)`, `color: --color-text-primary`, `border-radius: var(--radius-sm)`

### Preset 시스템

Preset은 `apps/web/lib/pageCanopyPresets.ts`에서 관리. 현재 4종:

| ID | 이름 |
|---|---|
| `fern-dawn` | Fern Dawn |
| `grove-mist` | Grove Mist |
| `sunset-ridge` | Sunset Ridge |
| `midnight-canopy` | Midnight Canopy |

- Preset은 SVG 기반 Data URL. 네트워크 요청 없음.
- Preset 피커 UI: 섬네일 그리드 (`80px × 45px`, `16:9` 비율)
- 직접 업로드는 Supabase `clearing-assets` 버킷 `page-canopies/{pageId}/` 경로

### 공통 금지

- Canopy 이미지에 `border` 추가 금지
- Canopy 없을 때 빈 플레이스홀더 박스(배경색 + border) 렌더링 금지 — 완전히 숨길 것

---

## 14. 데이터베이스 블록 (Undergrowth Block)

Undergrowth(DB 블록)는 페이지 안에 인라인으로 삽입되는 가장 복잡한 블록이다.
모든 뷰는 하나의 `DatabaseBlock` 컨테이너 안에서 렌더링된다.

### 전체 구조

```
┌─────────────────────────────────────────────────┐
│  [🗂 TableView] [📋 BoardView] [+]              │  ← 뷰 탭 바
│  [필터 ▾] [정렬 ▾] [그룹화 ▾]                  │  ← 툴바
├─────────────────────────────────────────────────┤
│                                                 │
│  뷰 콘텐츠 (TableView, BoardView, ...)          │
│                                                 │
│  + New                                          │  ← row 추가
└─────────────────────────────────────────────────┘
```

### 뷰 탭 바

- 활성 탭: `--color-text-primary`, `font-weight: 500`, 하단 `2px solid var(--color-accent)` 언더라인
- 비활성 탭: `--color-text-secondary`, 호버 시 `--color-hover` 배경
- 탭 추가(`+`): ghost 버튼, 탭 바 맨 우측

### TableView

- 헤더 행: 배경 없음, `14px`, `font-weight: 500`, `--color-text-secondary`
- 셀 높이: `34px`
- **행 사이 구분선 없음** — 호버 배경(`--color-hover`)으로만 구분
- 열 너비: 사용자 드래그 리사이즈 가능, 최소 `100px`
- 체크박스 선택 열: 너비 `32px`, 호버 시 표시
- 필드 헤더 우클릭 → 컨텍스트 메뉴 (타입 변경 / 이름 수정 / 숨기기 / 삭제)

### Cell 타입별 렌더링

| 타입 | 기본 표시 | 편집 UI |
|------|-----------|---------|
| `text` | 인라인 텍스트 | 클릭 → `<input>` 인플레이스 |
| `number` | 우정렬 숫자 | 클릭 → `<input type="number">` |
| `date` | `YYYY. MM. DD` | 클릭 → date picker 팝오버 |
| `select` | 단색 태그 pill | 클릭 → 옵션 드롭다운 |
| `multi_select` | 복수 태그 pill | 클릭 → 옵션 드롭다운 (체크박스) |
| `relation` | 연결 페이지 제목 chip | 클릭 → 검색 팝오버 |
| `checkbox` | `☑` / `☐` | 클릭으로 토글 |
| `url`, `email`, `phone` | 텍스트 (링크 아이콘) | 클릭 → `<input>` |

**태그 pill 규격:**
- `border-radius: var(--radius-sm)` (`3px`)
- 배경: 각 `SelectOptionColor`에 대응하는 `--color-{name}-subtle` 계열
- 텍스트: `12px`, `--color-text-primary`
- 패딩: `2px 6px`
- **배경색으로만 구분, pill에 border 없음**

### RowDetailPanel (Specimen 상세 패널)

```
┌─────── 480px ───────────────────────────┐
│  [← ] 페이지 제목                        │
│  ─────────────────────────────────────  │  ← var(--color-border) 구분선 한 줄만 허용
│  Trait 이름          값                  │
│  Trait 이름          값                  │
│  ...                                    │
│  [+ Add Trait]                          │
│                                         │
│  [본문 에디터 영역]                      │
└─────────────────────────────────────────┘
```

- 배경: `--color-background`
- 레이블(Trait 이름): `--color-text-secondary`, `12px`
- 값: `--color-text-primary`, `14px`
- 패널 열기: row 클릭 / 닫기: ESC 또는 패널 바깥 클릭
- 모바일: full-screen 모달로 전환

### FilterBar / SortBar

- 상단 툴바에 인라인으로 펼쳐짐 (모달 아님)
- 각 필터·정렬 칩: `background: var(--color-surface)`, `border: 1px solid var(--color-border)`, `border-radius: var(--radius-sm)`
  *(이것이 `var(--color-border)` 토큰 사용이 허용되는 케이스 중 하나)*
- 칩 우측 `×` 버튼으로 개별 삭제

### BoardView (칸반)

- 컬럼(그룹) 배경: `--color-surface`, `border-radius: var(--radius-md)`
- 카드 배경: `--color-background`
- 카드 간격: `var(--space-2)` (`8px`)
- **그림자 없음** — obnofi는 `box-shadow` 사용 안 함
- 카드 hover: `--color-hover` 배경

### GalleryView

- 커버 이미지 비율: `16:9`
- 그리드: `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))`
- 카드 배경: `--color-surface`
- 카드 하단 제목: `14px`, `--color-text-primary`

### 공통 금지

- 테이블 행, 보드 카드, 갤러리 카드 사이에 **border 추가 금지**
- 배경색 차이(`--color-hover`, `--color-surface`)로 구분할 것
- `box-shadow` 사용 금지

---

```css
/* ===== Dark Mode (토큰 요약) ===== */
@media (prefers-color-scheme: dark) {
  :root {
    --color-accent:           #3DA05A;
    --color-accent-hover:     #2E7D45;
    --color-accent-subtle:    #1A3327;
    --color-background:       #191919;
    --color-surface:          #202020;
    --color-hover:            #2F2F2F;
    --color-selected:         #383838;
    --color-border:           #373737;
    --color-text-primary:     #FFFCED;
    --color-text-secondary:   #7F7F7F;
    --color-text-placeholder: #4A4A4A;
    --color-tooltip-bg:       #111111;
  }
}
```
