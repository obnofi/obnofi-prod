# AGENTS.md

This file is the authoritative guide for AI agents (Claude, Cursor, Copilot, etc.) working in the `obnofi` repository. Read this file first. Follow all rules below without exception.

---

## What is obnofi?

`obnofi` is a productivity workspace that combines Notion-style page editing, Obsidian-style graph view, and FigJam-style canvas — plus additional productivity features — in a single product.

This is **not a simple app**. The repository contains three separate runtimes:

- **Root / `apps/web/`** — Next.js 15 App Router (frontend + API routes)
- **`apps/ws-server/`** — Fastify + WebSocket, Yjs 문서 동기화 전용
- **`packages/db/`** — Prisma 스키마 + DB 클라이언트
- **`packages/types/`** — 프런트/서버 공유 타입
- **`apps/web/ai/`** — Python 오케스트레이터 (실사용 연결 제한적)

Do not treat this as a monorepo with shared configs. Each runtime has its own `package.json`, `tsconfig.json`, and environment variables.

---

## Before You Write Any Code

Read these files **in this order** before starting any task:

1. **`DB.md`** — Database notes and schema overview. Required before any feature that touches data.
2. **`packages/db/prisma/schema.prisma`** — Source of truth for the actual schema. Cross-reference with `DB.md`.
3. **`DESIGN.md`** — Design system, Jungle System naming conventions, and visual rules.
4. **`APIDOCS.md`** — All API endpoint specs. Required before adding or modifying any route.
5. **`docs/architecture.md`** — Data model and architecture notes.
6. **`docs/implementation-plan.md`** — Current implementation status and planned work.

For design or UI tasks, also check:

- **`figma_design_context.txt`** — Design reference context exported from Figma.
- **`figma_screenshot.png`** — Visual reference.

---

## Next.js Version Warning

<!-- BEGIN:nextjs-agent-rules -->
This version has breaking changes — APIs, conventions, and file structure may differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## Jungle System Naming Convention

All features, components, and code variables follow the **Jungle System** metaphor. This is not optional — use these names consistently across UI labels, function names, variable names, and comments.

| Jungle term | Meaning |
|---|---|
| `plantSeed` | Create a new note/page |
| `fossilize` | Snapshot / version history |
| `Grove` | Editor area |
| `Clearing` | Canvas area |
| `Canopy` | Page cover image / hero image (GrovePageCanopy) |
| `Glyph` | Page icon display — emoji or type fallback icon (PageGlyph) |
| `Chrome` | Full page header wrapper — Canopy + title + Glyph (GrovePageChrome) |
| `Undergrowth` | Database block (inline spreadsheet/kanban) |
| `Specimen` | A database row (a Page with `parentDatabaseId`) |
| `Trait` | A database property/column (Property model) |
| `Marking` | A SELECT / MULTI_SELECT option tag |
| `Parrot` (앵무새) | Speech-to-text (음성인식) — `useSpeechRecognition` hook + `SpeechRecognitionButton` |

When adding new features, extend this metaphor. Do not use generic names (`create`, `save`, `editor`) where a Jungle System equivalent exists or can be defined. If unsure, propose a name and document it in `DESIGN.md`.

---

## Design System Rules

1. **Always use existing design tokens and components first.** Before writing new styles or components, check `DESIGN.md` and the existing `components/` directory.
2. **If a token or component doesn't exist, create it** — do not hardcode values inline.
3. **Never hardcode colors, spacing, or font sizes** outside of design token definitions.
4. **Component location**: feature-specific components go in their feature folder under `components/`. Shared primitives go at the top level of `components/`.

---

## Feature Addition Checklist

Before implementing any new feature:

- [ ] Read `DB.md` and `packages/db/prisma/schema.prisma`
- [ ] Confirm whether a schema migration is needed
- [ ] Check `APIDOCS.md` — add new endpoints to the spec before implementing
- [ ] Check `DESIGN.md` for relevant tokens and components
- [ ] Apply Jungle System naming to all new identifiers
- [ ] Identify which runtime the feature touches (frontend / backend / AI layer)

---

## Page Icon & Cover Image — Rules

### icon 필드

- `Page.icon`은 **이모지 문자열** (`"🌱"`)이다. 이모지 코드나 ID가 아님.
- 아이콘이 없으면 `PageGlyph`가 `Page.type`에 따라 기본 SVG 아이콘을 렌더링한다 (DOCUMENT / CANVAS / DATABASE).
- 아이콘 표시가 필요한 곳 어디서나 `<PageGlyph page={page} />` 재사용. 직접 이모지 렌더링 금지.

### coverImage 필드

- `Page.coverImage`는 **완전한 URL 문자열**이다. Preset이든 업로드든 저장 형식은 동일.
  - Preset: `data:image/svg+xml;charset=UTF-8,...` (Data URL)
  - 업로드: `https://{supabase}/storage/v1/object/public/clearing-assets/page-canopies/{pageId}/{uuid}.ext`
- 업로드는 **클라이언트 → Supabase Storage 직접** (`uploadPageCanopyAsset(file, pageId)`). 별도 서버 API 경유 없음.
- 업로드 후 반환된 URL을 `PATCH /api/pages/[pageId]`로 저장.
- Preset은 `apps/web/lib/pageCanopyPresets.ts`에서 관리. 새 Preset 추가는 이 파일에만.

### 컴포넌트 역할 분리

| 컴포넌트 | 역할 |
|---|---|
| `PageGlyph` | 아이콘 **표시만** (읽기 전용) |
| `GrovePageCanopy` | icon + coverImage **선택 및 편집** UI |
| `GrovePageChrome` | GrovePageCanopy + PageTitleBlock **통합 래퍼** |

페이지 헤더를 렌더링할 때는 항상 `GrovePageChrome`을 사용한다.

---

## Database Block — Critical Rules

The Database block (`Undergrowth`) is the most complex feature. Violations here cause hard-to-trace bugs.

### Naming — never mix old and new

| Correct (use this) | Forbidden (legacy alias only) |
|---|---|
| `Property` | `Field`, `Column` |
| `PropertyValue` | `Cell` |
| `Page` (with `parentDatabaseId`) | `Row` as a standalone model |
| `View` | `DatabaseView` |

`Column` / `Field` / `Row` / `Cell` exist only as TypeScript aliases in `packages/types`. Never introduce new variables or API routes using these names.

### Row = Page

A database row **is a `Page`** with `parentDatabaseId` set. Do not create a separate `Row` model. When querying rows: `prisma.page.findMany({ where: { parentDatabaseId: id } })`.

### Cell values live in PropertyValue

Cell data is stored in `PropertyValue.value` as JSONB. The shape is a Discriminated Union on `type` — see `DB.md` for the full spec. Never store cell values anywhere else.

### View config is JSONB

Filters, sorts, groupBy, column widths, and visible properties are all in `View.config` (JSONB). Do not add new Prisma columns for these — extend `ViewConfig` in `packages/types` instead.

### Optimistic updates

`updateCell` in the Zustand store must apply the change to local state immediately, then sync to server. On failure, roll back to the previous value. Never await the server call before updating UI.

---

## Navigation Guide

| Task type | Start here |
|---|---|
| Page editing, workspace UX | `app/workspace/`, `components/editor/`, `components/workspace/`, `store/` |
| Workspace sidebar | `components/workspace/WorkspaceSidebar.tsx`, `hooks/useSidebarSearch.ts`, `hooks/useSidebarDrag.ts`, `hooks/useSidebarNavigation.ts`, `hooks/usePageSettings.ts`, `hooks/useWorkspaceSidebar.ts` |
| Page settings menu | `components/workspace/PageSettingsMenu.tsx` |
| Database or views | `components/database/`, `lib/database/`, `app/api/databases/`, `packages/db/prisma/schema.prisma` |
| Database table accessors | `lib/database/tableAccessors.ts` |
| Database property meta/values | `lib/database/propertyMeta.ts`, `lib/database/propertyValues.ts`, `lib/database/selectOptions.ts` |
| Database view utils | `lib/databaseViewUtils.ts`, `components/database/DatabaseViewTable.tsx`, `components/database/DatabaseViewGrid.tsx` |
| Database query panel | `components/database/DatabaseQueryPanel.tsx` |
| Database client state (GroveCatalog) | `store/useGroveCatalogStore.ts`, `lib/groveCatalogApi.ts`, `hooks/useDatabasePage.ts`, `hooks/useDatabaseRealtime.ts`, `store/useDatabaseViewStore.ts` |
| Database engine (query/filter/formula) | `lib/database/queryEngine.ts`, `lib/database/filterEvaluator.ts`, `lib/database/computedPropertyEngine.ts` |
| Collaboration / realtime (Yjs) | `apps/ws-server/src/collaboration/`, `lib/collaboration/` |
| Realtime sync utils | `lib/realtime/timerUtils.ts`, `lib/realtime/presenceUtils.ts`, `lib/realtime/channelUtils.ts` |
| Collaboration awareness | `lib/collaboration/useCollaborationAwareness.ts`, `lib/collaboration/wsUrl.ts` |
| Collaboration provider lifecycle | `lib/collaboration/useProviderConnection.ts`, `lib/collaboration/usePresenceSync.ts` |
| AI text transforms (generate) | `app/api/ai/generate/route.ts`, `components/editor/AiCommandList.tsx`, `components/editor/extensions/AiExtension.ts` |
| AI chat (Owl) | `app/api/ai/owl/route.ts`, `components/editor/OwlChatPanel.tsx` |
| AI Python orchestrator | `apps/web/ai/orchestrator.py`, `apps/web/ai/prompts/` |
| Public sharing | `app/share/`, `components/share/` |
| Forest (public feed + publishing) | `app/forest/`, `app/p/[publishId]/`, `components/published/`, `lib/publishedPages.ts`, `lib/publishedPageTypes.ts`, `app/api/published-pages/` |
| Graph view | `components/graph/`, `lib/graph/` |
| Graph layout/data | `lib/graph/graphLayout.ts`, `lib/graph/graphDataUtils.ts`, `components/graph/useGraphPages.ts`, `components/graph/useGraphFlowNodes.ts`, `components/graph/graphStore.ts`, `components/graph/useGraphSimulation.ts` |
| Canvas (Clearing) | `components/canvas/`, `lib/canvas/` |
| Canvas board hooks | `hooks/useClearingBoardState.ts`, `hooks/useClearingSync.ts`, `hooks/useClearingBootstrap.ts`, `hooks/useClearingPersistence.ts`, `hooks/useClearingPointerHandlers.ts`, `hooks/useClearingDragHandlers.ts`, `hooks/useClearingActions.ts`, `hooks/useClearingKeyboard.ts` |
| Canvas drawing (simple canvas) | `hooks/useCanvasDrawing.ts` |
| Canvas utilities | `lib/canvas/clearingBoardUtils.ts`, `lib/canvas/clearingBoardElementBuilders.ts`, `lib/canvas/clearingBoardSupabase.ts`, `lib/canvas/clearingBoardTypes.ts` |
| Canvas timer / presence panel | `components/canvas/TimerWidget.tsx`, `components/canvas/ClearingPresencePanel.tsx`, `components/canvas/CursorChat.tsx` |
| Sticky note (canvas) | `components/elements/StickyNote.tsx`, `lib/canvas/stickyNoteColors.ts`, `lib/canvas/stickyNoteUtils.ts`, `lib/canvas/stickyToolUtils.ts` |
| Clearing toolbar | `components/toolbar/ClearingToolbar.tsx`, `components/toolbar/ClearingToolbarParts.tsx`, `lib/editor/clearingToolbarConstants.tsx` |
| MossNote (inline annotations) | `components/workspace/MossNoteDock.tsx`, `components/workspace/MossNoteCard.tsx`, `components/workspace/MossNoteContextMenu.tsx`, `hooks/useMossNotes.ts`, `lib/moss-notes.ts`, `components/workspace/mossNoteUtils.ts` |
| MindGrove (mind map) | `components/mindmap/MindGroveBoard.tsx`, `components/mindmap/MindGroveNode.tsx` |
| DB Diagram block | `src/components/blocks/db-diagram/`, `src/components/editor/extensions/DbDiagramExtension.tsx`, `src/hooks/useDbDiagramSync.ts` |
| Speech-to-text (Parrot / 앵무새) | `hooks/useSpeechRecognition.ts`, `components/editor/SpeechRecognitionButton.tsx`, `components/editor/SpeechInputIndicator.tsx` |
| Slash command data/types | `lib/editor/slashCommandTypes.ts`, `lib/editor/slashCommandItemsCore.ts`, `lib/editor/slashCommandItemsExtended.ts` |
| Block drag/drop | `lib/editor/blockDragHandlers.ts`, `lib/editor/blockUtils.ts`, `lib/editor/blockDomUtils.ts`, `lib/editor/blockActionsPlugin.ts` |
| Column layout block | `components/editor/blocks/ColumnLayoutBlock.tsx`, `lib/editor/columnBlockDragPlugin.ts` |
| Editor insertion blocks | `components/editor/blocks/` |
| Editor hooks | `hooks/useEditorContentSync.ts`, `hooks/useGroveEditorExtensions.ts`, `hooks/useCanvasPageState.ts`, `hooks/usePageCursorTracking.ts`, `hooks/useDatabaseBlockData.ts` |
| Insertion toolbar | `components/toolbar/GroveInsertionToolbar.tsx`, `components/toolbar/LinkEmbedModal.tsx` |
| Page export (HTML/PDF) | `lib/exportPage.ts` (facade), `lib/export/htmlTemplate.ts`, `lib/export/domUtils.ts` |
| GroveSideTab data | `hooks/useGroveSideTabPage.ts` |
| WorkspacePage handlers | `hooks/useWorkspacePageHandlers.ts`, `app/workspace/[workspaceId]/WorkspacePageContent.tsx` |
| Markdown → Tiptap | `lib/markdownToTiptap.ts`, `lib/markdown/patterns.ts`, `lib/markdown/inlineParsers.ts`, `lib/markdown/blockParsers.ts` |
| Page store utils | `lib/page/pageUtils.ts`, `lib/page/pageFetch.ts` |
| Prisma selects | `lib/prisma/selects.ts` |
| API route helpers | `lib/api/pageUpdateValidation.ts`, `lib/api/pageDeleteUtils.ts` |
| Emoji picker | `components/editor/PersonalEmojiList.tsx`, `lib/editor/emojiData.ts`, `components/editor/EmojiCropEditor.tsx`, `components/editor/EmojiPickerGrid.tsx` |
| Landing page | `components/landing/LandingPage.tsx`, `components/landing/LandingSections.tsx`, `components/landing/LandingMockups.tsx` |
| TOC utils | `lib/tocUtils.ts` |

---

## Parrot (앵무새) — Speech-to-Text Feature

The Parrot feature adds microphone-based dictation to the Grove editor.

### Files

| File | Role |
|---|---|
| `apps/web/hooks/useSpeechRecognition.ts` | Core hook — wraps Web Speech API, exposes `start/stop/isListening/transcript/interimTranscript/isSupported` |
| `apps/web/components/editor/SpeechRecognitionButton.tsx` | Mic toggle button + real-time interim text badge |

### Integration point

`SpeechRecognitionButton` is rendered in `Editor.tsx` in a small toolbar strip above `EditorContent` (only when `editable={true}`).
Final text is inserted at the current TipTap cursor via `editor.chain().focus().insertContent(text).run()`.
Interim text is displayed in gray next to the mic button — it is **not** inserted into the document.

### Browser restrictions

- **Supported**: Chrome 33+, Edge (Chromium-based)
- **Not supported**: Firefox, Safari — `isSupported` returns `false`; the button renders as disabled with a tooltip explaining the limitation
- No external libraries — uses `window.SpeechRecognition` / `window.webkitSpeechRecognition` only
- Recognition config: `lang: 'ko-KR'`, `continuous: true`, `interimResults: true`

### Do NOT

- Add `@tiptap/extension-color` or `@tiptap/extension-text-style` just for interim gray text — show it in the UI widget instead
- Make the hook depend on the editor instance — pass `onFinalResult` callback instead

---

## Do Not Touch

- `node_modules/`, `server/node_modules/`, `.next/`, `.venv/` — generated, do not edit
- `test-results/` — generated Playwright output
- `pnpm-lock.yaml` / `package-lock.json` — do not modify manually; the repo has both npm and pnpm lockfiles at root, treat with care
- `.git/`, `.idea/`, `.claude/` — local tooling, do not modify

---

## Environment Variables

- Frontend: see `.env.local.example` at root (또는 `apps/web/.env.local`)
- DB: `packages/db/.env` (`DATABASE_URL` 등)
- ws-server: 별도 `.env` 없음 — 환경변수는 `apps/ws-server/src/index.ts` 참고

Never commit actual secrets. Never hardcode env values in source files.

---

## Testing

- E2E tests live in `tests/` and use Playwright (`playwright.config.ts`)
- Run tests before submitting any change that touches routing, auth, or collaboration

---

## README Warning

`README.md` is mostly boilerplate and is **not a reliable source of truth**. Use this file (`AGENTS.md`), `docs/architecture.md`, and `docs/implementation-plan.md` instead.