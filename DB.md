# obnofi — Database Guide

> 소스 오브 트루스: `packages/db/prisma/schema.prisma`
> 이 문서는 현재 구현 상태와 설계 의도를 함께 기술한다.

---

## 현재 데이터 레이어 상태

| 레이어 | 상태 | 위치 |
|---|---|---|
| **Prisma (PostgreSQL)** | 스키마 정의됨, **미연결** | `packages/db/` |
| **mock-db** | 모든 API 라우트가 사용 중 | `apps/web/lib/mock-db.ts` |
| **Supabase Storage** | 연결됨 (파일 업로드만) | `apps/web/lib/supabase.ts` |

**API 라우트는 현재 `mockDb`를 사용한다.** Prisma 연결을 완료하려면 `.env.local`에 `DATABASE_URL`과 `DIRECT_URL`을 Supabase PostgreSQL connection string으로 설정해야 한다.

```bash
# apps/web/.env.local 또는 루트 .env.local
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

Supabase 대시보드 → Project Settings → Database → Connection string (Transaction pooler / Session pooler)에서 복사.

---

## Supabase 역할 분리

| Supabase 기능 | 사용 여부 | 설명 |
|---|---|---|
| **Storage** (`clearing-assets` 버킷) | 사용 중 | 캔버스 이미지, 페이지 배경 업로드 |
| **Storage** (`page-canopies/` prefix) | 사용 중 | 페이지 커버 이미지 |
| **PostgreSQL (via Prisma)** | 미연결 | 목표 데이터 저장소 |
| **Auth** | 미사용 | NextAuth.js + Google OAuth 사용 중 |
| **Realtime** | 미사용 | ws-server (Fastify + WebSocket) 사용 |

---

## ER 다이어그램

```mermaid
erDiagram
    User ||--o{ Account : "has"
    User ||--o{ Session : "has"
    User ||--o{ WorkspaceMember : "belongs to"
    User ||--o{ Workspace : "owns"
    User ||--o{ Comment : "writes"
    User ||--o{ CliToken : "has"
    User ||--o{ PageCollaborator : "collaborates"

    Workspace ||--o{ WorkspaceMember : "has"
    Workspace ||--o{ Page : "contains"
    Workspace ||--o{ Subscription : "subscribes"
    Workspace ||--o{ Template : "has"
    Workspace ||--o{ File : "has"

    Page ||--o{ Page : "parent→children (PageTree)"
    Page ||--o| Database : "hosts (type=DATABASE, 1:1)"
    Page }o--|| Database : "row of (parentDatabaseId)"
    Page ||--o{ PropertyValue : "has"
    Page ||--o{ Comment : "has"
    Page ||--o{ PageLink : "source"
    Page ||--o{ PageLink : "target"
    Page ||--o{ File : "has"
    Page ||--o| YjsDocument : "has state"
    Page ||--o{ PageCollaborator : "has collaborators"

    Database ||--o{ Property : "defines columns"
    Database ||--o{ View : "has"
    Database ||--o{ Page : "owns rows"

    Property ||--o{ PropertyValue : "stores values"

    Subscription ||--o{ FeedItem : "caches"
    Comment ||--o{ Comment : "parent→replies (CommentThread)"
```

---

## 테이블 명세

### 인증 (NextAuth.js 어댑터 호환)

| 테이블 | 설명 |
|---|---|
| `Account` | OAuth 제공자 연결 (Google) |
| `Session` | 세션 토큰 |
| `VerificationToken` | 이메일 인증 토큰 |

### 핵심 도메인

| 테이블 | 설명 |
|---|---|
| `User` | 사용자. `preferences` JSONB에 폰트·다크모드 등 개인설정 보관 |
| `Workspace` | 워크스페이스. 한 유저가 여러 개 소유 가능 |
| `WorkspaceMember` | 유저↔워크스페이스 N:M. `Role` enum으로 권한 구분 |
| `Page` | **문서·캔버스·데이터베이스 페이지를 하나의 테이블로 통합**. DB 행(row)도 Page로 저장 |
| `Database` | DB 페이지의 메타데이터 (Page와 1:1). Property·View·Row를 거느림 |
| `Property` | DB 컬럼 정의. `Column`은 레거시 alias |
| `PropertyValue` | 셀 값. `(pageId, propertyId)` 복합 유니크 |
| `View` | 테이블·보드·갤러리 등 뷰 설정 |

### 부가 기능

| 테이블 | 설명 |
|---|---|
| `File` | Supabase Storage 업로드 레퍼런스 |
| `PageLink` | `[[링크]]` 파싱 결과. 그래프뷰 엣지 소스 |
| `Comment` | 페이지·블록 단위 댓글. `parentId`로 스레드 구성 |
| `Subscription` | Velog · OpenAI · Anthropic 블로그 구독 |
| `FeedItem` | 구독 피드 캐시 |
| `Template` | 저장된 템플릿 |
| `YjsDocument` | 페이지별 YJS 협업 상태 저장 |
| `PageCollaborator` | 페이지 공동 편집자 |
| `CliToken` | CLI 인증 토큰 |
| `PublishedPage` | Forest에 게시되는 immutable snapshot |
| `PublishedPageLike` | Forest snapshot 저장(북마크) |

---

## 핵심 설계 결정

| 결정 | 이유 |
|---|---|
| Page 테이블에 DB 행(row) 통합 | 행도 제목·아이콘·커버·하위 페이지를 가질 수 있음. Notion 구조와 동일 |
| `content` JSONB | TipTap JSON. 블록 단위 정규화 대비 개발 속도 우선 |
| `options` JSONB (Property) | SELECT 옵션은 항상 Property와 함께 읽힘. JOIN 불필요 |
| `value` JSONB (PropertyValue) | 18가지 타입을 별도 테이블화 시 JOIN 비용 > JSONB 유연성 |
| `config` JSONB (View) | 뷰 설정 구조가 타입마다 상이. 스키마 변경 없이 확장 가능 |
| `order Float` (Fractional Indexing) | 재정렬 시 전체 업데이트 없이 중간값 삽입 가능 |
| `sharePassword` bcrypt 해시 | 원문 저장 금지. `/api/pages/[id]/verify`에서 `bcrypt.compare` |
| `PageLink` 별도 테이블 | 백링크 쿼리를 인덱스로 O(1) 처리 |

---

## Column → Property 네이밍 전환

스키마와 `packages/types`는 `Property`를 기준 이름으로 사용한다.
`mock-db.ts`와 일부 API는 아직 `Column`을 사용하며 레거시 alias가 유지된다.

```typescript
// packages/types/src/index.ts
export type Column = Property;          // 레거시 alias
export type ColumnType = PropertyType;  // 레거시 alias
export type CreateColumnInput = CreatePropertyInput;
export type UpdateColumnInput = UpdatePropertyInput;
```

새 코드는 반드시 `Property` 이름을 사용한다.

---

## PropertyValue.value JSON 명세

`PropertyValue.value`는 Discriminated Union. `type` 필드로 분기한다.

```typescript
// packages/types/src/database.ts의 PropertyValueData 참고
{ type: "text";             value: string }
{ type: "number";           value: number | null }
{ type: "checkbox";         value: boolean }
{ type: "select";           optionId: string | null }
{ type: "multi_select";     optionIds: string[] }
{ type: "status";           optionId: string | null }
{ type: "date";             value: string | null; endValue?: string | null; includeTime?: boolean }
{ type: "person";           userId: string | null }
{ type: "people";           userIds: string[] }
{ type: "url";              value: string }
{ type: "email";            value: string }
{ type: "phone";            value: string }
{ type: "files";            files: FileReference[] }
{ type: "relation";         pageIds: string[] }
{ type: "rollup";           value: unknown; function: RollupFunction }
{ type: "formula";          value: string; resultType: PropertyType }
{ type: "created_time";     value: string }   // ISO 8601
{ type: "created_by";       userId: string }
{ type: "last_edited_time"; value: string }   // ISO 8601
{ type: "last_edited_by";   userId: string }
```

`created_*` / `last_edited_*` 타입은 DB에서 계산되므로 저장 불필요. 읽기 전용.

---

## View.config JSON 명세

`View.config`는 `ViewConfig` 인터페이스를 따른다.

```typescript
// packages/types/src/database.ts의 ViewConfig 참고
interface ViewConfig {
  visibleProperties: string[];              // propertyId 배열 (순서 = 컬럼 순서)
  propertyWidths:    Record<string, number>; // { [propertyId]: px }
  sorts:    SortConfig[];    // { propertyId, direction: "ascending"|"descending" }
  filters:  FilterConfig[];  // { propertyId, operator: FilterOperator, value? }

  // BOARD 전용
  groupBy?:      string;    // propertyId (SELECT 또는 STATUS)
  boardColumns?: string[];  // optionId 배열 (컬럼 순서)

  // CALENDAR 전용
  calendarBy?: string;  // date 타입 propertyId

  // TIMELINE 전용
  timelineBy?: { startPropertyId: string; endPropertyId?: string }
}
```

---

## Property.options JSON 명세

```typescript
// SELECT · MULTI_SELECT · STATUS 전용
interface SelectOption {
  id:    string;           // nanoid
  label: string;
  color: SelectOptionColor; // "default"|"gray"|"brown"|"orange"|"yellow"|"green"|"blue"|"purple"|"pink"|"red"
}
```

---

## 인덱스 전략

| 인덱스 | 이유 |
|---|---|
| `Page(workspaceId)` | 사이드바 페이지 목록 조회 |
| `Page(parentId)` | 하위 페이지 조회 |
| `Page(parentDatabaseId)` | DB 행 목록 조회 |
| `Page(shareId)` UNIQUE | 공유 링크 접근 |
| `PropertyValue(pageId, propertyId)` UNIQUE | 셀 upsert |
| `PropertyValue(propertyId)` | 컬럼 삭제 cascade |
| `PageLink(targetId)` | 백링크(backlinks) 조회 |
| `FeedItem(subscriptionId, url)` UNIQUE | 중복 피드 방지 |

---

## 카스케이드 삭제 규칙

```
Workspace 삭제
  └─ Page 삭제 (cascade)
       ├─ 하위 Page 삭제 (cascade)
       ├─ PropertyValue 삭제 (cascade)
       ├─ Comment 삭제 (cascade)
       ├─ PageLink 삭제 (cascade)
       ├─ File.pageId = null (SetNull)
       └─ Database 삭제 (cascade)
            ├─ Property 삭제 (cascade)
            │    └─ PropertyValue 삭제 (cascade)
            └─ View 삭제 (cascade)
```

---

## mock-db와 Prisma 스키마 차이점

Prisma로 전환 시 아래 차이를 반드시 확인한다.

| 항목 | mock-db | Prisma 스키마 |
|---|---|---|
| 컬럼 이름 | `Column` / `columnId` | `Property` / `propertyId` |
| `PropertyValue.columnId` | 존재 (레거시) | 없음 (`propertyId`만) |
| `Page.databaseId` | 존재 (mock에서 직접 참조) | 없음 (Database.pageId로 역방향 조회) |
| ID 생성 | `Date.now()` prefix | `cuid()` |
| `Database.rows` | mock에서 직접 포함 | `Page[]` @relation("DatabaseRows") |

---

## API 라우트 → 테이블 매핑

| API 경로 | 메서드 | 대상 테이블 |
|---|---|---|
| `/api/pages` | GET, POST | `Page` |
| `/api/pages/[pageId]` | GET, PATCH, DELETE | `Page` |
| `/api/pages/[pageId]/share` | PATCH | `Page` (shareId, isPublic) |
| `/api/pages/[pageId]/ancestors` | GET | `Page` (재귀 트리 탐색) |
| `/api/databases` | GET, POST | `Database`, `Page` |
| `/api/databases/[databaseId]` | GET, PATCH, DELETE | `Database` |
| `/api/databases/[databaseId]/columns` | GET, POST | `Property` |
| `/api/databases/[databaseId]/rows` | GET, POST | `Page` (parentDatabaseId) |
| `/api/databases/[databaseId]/views` | GET, POST | `View` |
| `/api/databases/[databaseId]/page` | GET | `Page` + `Database` join |
| `/api/databases/search` | GET | `Database`, `Page` |
| `/api/columns/[columnId]` | PATCH, DELETE | `Property` |
| `/api/property-values` | GET, POST | `PropertyValue` |
| `/api/property-values/[id]` | PATCH, DELETE | `PropertyValue` |
| `/api/public/pages/[shareId]` | GET | `Page` (shareId) |
| `/api/public/pages/[shareId]/verify` | POST | `Page` (sharePassword) |
