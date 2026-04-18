## 설계 방향
Notion 스타일 Database View 시스템을 단일 데이터 소스 기반으로 구현한다.
Table / Board / Calendar / Gallery / List / Timeline을 모두 같은 상태에서 파생된 View로 구성한다.
뷰는 UI 레이어에서만 분기하고, 데이터 구조는 완전히 통합한다.

---

## 구조

### 1. 데이터 구조 (Core Model)

Task (단일 소스)
- id: string
- name: string
- status: "Done" | "In Progress" | "To Do"
- date: string
- tags: string[]

Project (Relation 대응 준비)
- id: string
- name: string
- tasks: number
- status: string

---

### 2. View 상태 구조

useDatabaseViewStore (Zustand)

state:
- activeView: "table" | "board" | "calendar" | "gallery" | "list" | "timeline"

actions:
- setView(view)

---

### 3. 컴포넌트 구조

/feature/database

- DatabaseContainer
    - ViewTabs
    - ViewRenderer

- views/
    - TableView
    - BoardView
    - CalendarView
    - GalleryView
    - ListView
    - TimelineView

- components/
    - StatusBadge
    - TagBadge
    - Column (Board)
    - CalendarCell
    - TimelineBar

---

### 4. View 렌더링 구조

ViewRenderer
→ activeView 기준 switch

- table → TableView
- board → BoardView
- calendar → CalendarView
- gallery → GalleryView
- list → ListView
- timeline → TimelineView

---

### 5. Board View 파생 구조

groupBy(status)

{
"To Do": Task[],
"In Progress": Task[],
"Done": Task[]
}

---

### 6. Calendar View 파생 구조

date 기준 매핑

Map<date, Task[]>

---

### 7. Timeline View 구조

Task → range 데이터로 확장 필요

- startDate
- endDate

렌더링:
- width = 기간
- offset = 시작 위치

---

## 구현 순서

1. Task 단일 데이터 모델 정의
2. Zustand로 activeView 상태 분리
3. ViewTabs 구현 (UI만)
4. TableView 구현 (기준 View)
5. BoardView 구현 (groupBy status)
6. ListView 구현 (단순 렌더)
7. GalleryView 구현 (카드 UI)
8. CalendarView 구현 (date 매핑)
9. TimelineView 구현 (range 계산)

---

## 주의사항

- 절대 View마다 데이터 따로 만들지 말 것 (single source 유지)
- Board/Calendar는 항상 파생 데이터로 처리
- status, date 필드는 enum/표준화 필요 (추후 filter 대비)
- Timeline은 P0 아님 → 구조만 잡고 후순위 가능
- View는 “UI 레벨” 책임만 가져야 함 (로직 분리)

---

## 확장 고려 (P1)

- 필터 시스템 (where 조건)
- 정렬 시스템 (orderBy)
- 그룹핑 확장 (status 외 custom field)
- Relation 연결 (Project ↔ Task)
- Rollup 계산 (task count 자동화)