# obnofi API Documentation

현재 구현된 백엔드 API 명세서입니다. 이 문서는 `apps/web/app/api/**`와 `apps/ws-server/src/index.ts`의 실제 구현만 기준으로 작성했습니다.

## Runtime

- Web API: `http://localhost:3000/api/*`
- Public share API: `http://localhost:3000/api/public/*`
- NextAuth handler: `http://localhost:3000/api/auth/*`
- WebSocket server: `ws://localhost:3001/ws`

## 현재 상태

- 대부분의 HTTP API는 `apps/web`의 Next.js Route Handler로 구현되어 있습니다.
- 데이터 저장은 현재 Prisma를 통해 이뤄집니다.
- 응답 래핑이 일관되지 않습니다. 일부는 배열/객체를 그대로 반환하고, 일부는 `{ success: true }` 또는 `{ error: "..." }`를 반환합니다.
- 라우트 단위 인증/인가 검사는 아직 문서상 공통 규약으로 통일되어 있지 않습니다. 실제 접근 제어는 호출 위치와 세션 흐름을 함께 확인해야 합니다.

## 공통 에러 응답

```json
{
  "error": "Error message"
}
```

자주 쓰이는 상태 코드는 다음과 같습니다.

| 코드 | 의미 |
|---|---|
| `200` | 성공 |
| `201` | 생성 성공 |
| `400` | 잘못된 요청 |
| `401` | 비밀번호 검증 실패 등 인증 실패 |
| `404` | 리소스를 찾을 수 없음 |
| `500` | 서버 처리 실패 |

## 인증 (Authentication)

API는 두 가지 인증 방식을 지원합니다.

| 방식 | 대상 | 헤더/쿠키 |
|---|---|---|
| NextAuth 세션 (쿠키) | 웹 브라우저 | `Cookie: next-auth.session-token=...` |
| Bearer 토큰 | CLI / 외부 클라이언트 | `Authorization: Bearer obnofi_<token>` |

요청에 `Authorization: Bearer ...` 헤더가 있으면 Bearer 토큰을 먼저 검증하고, 없으면 NextAuth 세션 쿠키를 사용합니다.

### `GET|POST /api/auth/[...nextauth]`

NextAuth 핸들러입니다. 상세 인증 플로우는 `apps/web/lib/auth` 설정을 따릅니다.

---

### CLI 자동 인증 흐름 (브라우저 기반)

복붙 없이 브라우저 세션을 통해 CLI 토큰을 자동 발급합니다.

#### 전체 흐름

```
1. CLI     → 로컬 HTTP 서버 시작 (임의 포트 P)
2. CLI     → 브라우저 열기:
             GET /cli-auth?callbackUrl=http://127.0.0.1:P/callback
                           &state=<RANDOM>
                           &name=my-cli
3. 백엔드  → 세션 확인
             ├── 미로그인 → /api/auth/signin?callbackUrl=<현재URL> 으로 리다이렉트
             └── 로그인됨 → "CLI 연결 허용" 화면 표시
4. 사용자  → "허용" 버튼 클릭
5. 브라우저 → POST /api/cli-auth/complete
6. 백엔드  → CLI 토큰 생성 → 서버에서 직접 http://127.0.0.1:P/callback 으로 POST
7. CLI     → 로컬 서버에서 {token, state} 수신 → state 검증 → 토큰 저장
8. 백엔드  → 브라우저에 완료 화면 표시
```

#### `GET /cli-auth`

브라우저로 열 CLI 인증 페이지.

| 파라미터 | 필수 | 설명 |
|---|---|---|
| `callbackUrl` | 예 | CLI 로컬 서버 URL. `http://127.0.0.1:<port>/callback` 형태만 허용 |
| `state` | 예 | CSRF 방지용 랜덤 문자열. CLI가 생성해 전달, 응답에 그대로 포함됨 |
| `name` | 아니오 | 토큰 이름 (기본값: `"CLI Token"`) |

**보안 제약:**
- `callbackUrl`은 `http://127.0.0.1` 또는 `http://localhost` 프로토콜+호스트만 허용
- `https:` 포함 외부 도메인 전부 거부 → `400` 반환
- 세션 없으면 로그인 후 이 URL로 돌아옴

#### `POST /api/cli-auth/complete`

"허용" 버튼 클릭 시 브라우저 JS가 호출. **웹 세션 필수.**

요청 본문:

```json
{
  "callbackUrl": "http://127.0.0.1:43123/callback",
  "state": "abc123",
  "name": "my-cli"
}
```

동작:
1. 세션에서 userId 확인
2. callbackUrl 유효성 재검증 (로컬호스트만 허용)
3. CLI 토큰 생성 (hash 저장)
4. **서버에서 직접** callbackUrl로 POST `{token, state}` 전달 — 토큰이 브라우저 URL/히스토리에 노출되지 않음

성공 응답:

```json
{ "success": true }
```

오류: CLI 서버에 연결할 수 없으면 `502` 반환.

#### CLI 로컬 서버가 받는 POST payload

```json
{
  "token": "obnofi_<64-hex>",
  "state": "abc123"
}
```

CLI는 `state`를 자신이 생성한 값과 비교 검증 후 `token`을 저장합니다.

---

### CLI 토큰 발급 및 관리

CLI 토큰은 웹 세션으로 로그인한 뒤 아래 API로 발급합니다. 토큰 평문은 **생성 응답에서만 한 번** 반환되며, DB에는 SHA-256 해시만 저장됩니다.

#### `POST /api/cli-tokens`

새 CLI 토큰을 발급합니다. **웹 세션 필수.**

요청 본문:

```json
{ "name": "my-laptop" }
```

성공 응답 (`201`):

```json
{
  "id": "token_id",
  "name": "my-laptop",
  "createdAt": "2026-04-28T00:00:00.000Z",
  "token": "obnofi_<64-hex>"
}
```

`token` 필드는 이 응답에서만 반환됩니다. 반드시 복사해 두세요.

#### `GET /api/cli-tokens`

현재 유저의 활성 토큰 목록을 조회합니다. **웹 세션 필수.**

성공 응답:

```json
[
  {
    "id": "token_id",
    "name": "my-laptop",
    "createdAt": "2026-04-28T00:00:00.000Z",
    "lastUsedAt": "2026-04-28T01:00:00.000Z"
  }
]
```

#### `DELETE /api/cli-tokens/[tokenId]`

토큰을 폐기합니다. **웹 세션 필수.**

성공 응답:

```json
{ "success": true }
```

### 빠른 시작 (curl)

```bash
# 1. 브라우저로 로그인 후 쿠키를 복사해 두기

# 2. 토큰 발급
TOKEN=$(curl -s -X POST http://localhost:3000/api/cli-tokens \
  -H "Content-Type: application/json" \
  -H "Cookie: <next-auth-cookie>" \
  -d '{"name":"my-cli"}' | jq -r '.token')

# 3. CLI 등록
obnofi auth login --url http://localhost:3000 --token "$TOKEN"

# 4. 토큰으로 API 호출
curl -s http://localhost:3000/api/pages \
  -H "Authorization: Bearer $TOKEN"

curl -s -X POST http://localhost:3000/api/pages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"테스트","type":"document"}'

curl -s "http://localhost:3000/api/databases/search" \
  -H "Authorization: Bearer $TOKEN"
```

## Pages

### `POST /api/crawl-import`

크롤러 마이크로서비스에 URL 가져오기를 위임하고, 결과를 그대로 프런트엔드에 반환합니다.

요청 본문:

```json
{
  "url": "https://example.com/article"
}
```

성공 응답:

```json
{
  "title": "Page Title",
  "url": "https://example.com/article",
  "markdown": "# Page Title\n\n...",
  "crawledAt": "2026-05-06T10:00:00.000Z",
  "wordCount": 342
}
```

오류 응답:

```json
{
  "error": "CrawlImportError",
  "message": "....",
  "url": "https://example.com/article"
}
```

동작:
- 웹 앱의 `/api/crawl-import`는 `CRAWLER_URL` 환경변수(기본값 `http://localhost:3100`)를 사용해 `POST {CRAWLER_URL}/crawl`을 직접 호출한다. (이전엔 ws-server를 거쳤으나 의미 없는 홉이라 제거됨)
- 30초 안에 응답이 없으면 `408`로 끊는다.
- crawler가 `408`, `500`, `502`를 반환하면 상태 코드를 그대로 전달하고, 그 외 비정상 응답은 `502`로 정규화한다.

### `GET /api/pages/search`

현재 사용자가 접근 가능한 워크스페이스 안에서 페이지를 검색합니다. 사이드바 `Search`에서 사용됩니다.

쿼리 파라미터:

| 파라미터 | 필수 | 설명 |
|---|---|---|
| `workspaceId` | 예 | 검색 대상 워크스페이스 ID |
| `q` | 예 | 검색어 |
| `mode` | 아니오 | 검색 범위. `title`, `content`, `title_content` 중 하나. 기본값 `title_content` |

동작:
- `title`: 페이지 제목만 검색
- `content`: 페이지 본문만 검색
- `title_content`: 제목 + 본문 모두 검색
- 데이터베이스 row (`parentDatabaseId != null`)는 제외
- 본문 검색 시 Yjs 저장본이 있으면 그 내용을 우선 사용

성공 응답:

```json
[
  {
    "id": "page_id",
    "title": "Weekly plan",
    "type": "document",
    "icon": "🌱",
    "parentId": null,
    "updatedAt": "2026-05-06T09:00:00.000Z",
    "snippet": "이번 주 목표는 검색 모달과 페이지 본문 검색을 붙이는 것이다...",
    "matchedIn": "title_content"
  }
]
```

## Profile

현재 로그인한 사용자의 프로필을 조회/수정합니다. 웹 세션이 필요합니다.

대표 응답 shape:

```json
{
  "id": "user_id",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "image": "https://lh3.googleusercontent.com/...",
  "createdAt": "2026-04-30T00:00:00.000Z",
  "preferences": {},
  "connectedAccounts": ["google"]
}
```

### `GET /api/profile`

현재 세션 유저의 프로필을 반환합니다.

- 인증되지 않았으면 `401`
- 유저 레코드가 없으면 `404`

### `PATCH /api/profile`

현재 세션 유저의 프로필을 수정합니다.

요청 본문:

```json
{
  "name": "Jane Doe",
  "image": "/profile/parrot.png"
}
```

규칙:

- `name`은 필수이며 공백 제거 후 1~80자입니다.
- `image`는 선택값이며, 전달하면 해당 URL 문자열로 저장합니다.
- `image`를 생략하면 기존 프로필 이미지를 유지합니다.

## Workspaces

사용자가 접근 가능한 워크스페이스 목록을 조회합니다.

### `GET /api/workspaces`

현재 사용자가 접근 가능한 워크스페이스 목록을 반환합니다.

응답 예시:

```json
[
  {
    "id": "ws_123",
    "name": "Product Grove",
    "slug": "product-grove",
    "icon": "🌿",
    "ownerId": "user_123",
    "role": "OWNER",
    "createdAt": "2026-05-01T00:00:00.000Z",
    "updatedAt": "2026-05-02T00:00:00.000Z"
  }
]
```

### `GET /api/workspaces/[workspaceId]/settings`

워크스페이스 설정 모달에 필요한 읽기 전용 데이터를 반환합니다. 웹 세션이 필요하며, 해당 워크스페이스 멤버만 조회할 수 있습니다.

응답 예시:

```json
{
  "workspace": {
    "id": "ws_123",
    "name": "Product Grove",
    "slug": "product-grove",
    "icon": "🌿",
    "ownerId": "user_123",
    "createdAt": "2026-05-01T00:00:00.000Z",
    "updatedAt": "2026-05-02T00:00:00.000Z",
    "settings": {
      "defaultPageVisibility": "workspace",
      "allowGuestAccess": false
    }
  },
  "viewerRole": "OWNER",
  "members": [
    {
      "id": "member_123",
      "role": "OWNER",
      "joinedAt": "2026-05-01T00:00:00.000Z",
      "user": {
        "id": "user_123",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "image": "/profile/otter.png"
      }
    }
  ]
}
```

규칙:

- `defaultPageVisibility`는 현재 `"workspace" | "public_link" | "private"` 중 하나로 반환됩니다.
- 설정 JSON에 값이 없으면 기본값은 `workspace` / `false`입니다.
- 쓰기 API는 아직 없으므로 이 엔드포인트는 조회 전용입니다.

현재 사용자 멤버십 기준의 워크스페이스 목록을 반환합니다. 세션 쿠키 또는 Bearer 토큰이 필요합니다.

성공 응답:

```json
[
  {
    "id": "workspace_id",
    "name": "My Workspace",
    "slug": "ws-user-123",
    "icon": null,
    "ownerId": "user_id",
    "role": "OWNER",
    "createdAt": "2026-04-30T00:00:00.000Z",
    "updatedAt": "2026-04-30T00:00:00.000Z"
  }
]
```

- 반환 순서는 소유자 워크스페이스가 먼저 오고, 그다음 가입 순서입니다.
- 인증되지 않았으면 `401`
- 조회 실패 시 `500`

## Pages

페이지 타입은 소문자 문자열을 사용합니다.

- `document`
- `canvas`
- `database`

대표 `Page` 응답 shape:

```json
{
  "id": "page_id",
  "title": "Untitled",
  "content": {},
  "type": "document",
  "icon": null,
  "coverImage": null,
  "parentId": null,
  "workspaceId": "workspace_id",
  "createdAt": "2026-04-27T00:00:00.000Z",
  "updatedAt": "2026-04-27T00:00:00.000Z",
  "isPublic": false,
  "shareId": null,
  "sharePassword": null,
  "databaseId": null,
  "parentDatabaseId": null
}
```

### `GET /api/pages`

워크스페이스의 최상위 페이지 목록을 조회합니다.

쿼리 파라미터:

| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `workspaceId` | `string` | 아니오 | 조회할 워크스페이스 ID. 없으면 로그인 유저의 기본 워크스페이스를 사용 |

동작:

- 인증된 사용자만 호출할 수 있습니다.
- `workspaceId`가 있으면 해당 워크스페이스 멤버인지 검증합니다.
- `workspaceId`가 없으면 로그인 유저의 기본 워크스페이스를 자동 선택합니다.
  - 우선순위: 가장 먼저 생성된 OWNER 워크스페이스
  - fallback: 가장 먼저 가입한 멤버 워크스페이스
- `parentDatabaseId: null` 조건으로 조회하므로 데이터베이스 row 페이지는 제외됩니다.
- `updatedAt desc` 정렬입니다.

성공 응답:

```json
[
  {
    "id": "page_id",
    "title": "Project",
    "type": "document",
    "workspaceId": "workspace_id"
  }
]
```

### `POST /api/pages`

새 페이지를 생성합니다.

요청 본문:

```json
{
  "title": "New page",
  "type": "document",
  "workspaceId": "optional_workspace_id",
  "parentId": "optional_parent_page_id"
}
```

검증:

- `title`, `type` 필수
- `type`은 `document | canvas | database`
- `workspaceId`가 있으면 해당 워크스페이스 멤버인지 검증하고, 없으면 로그인 유저의 기본 워크스페이스를 사용

특이사항:

- `document`는 기본 TipTap 문서 본문이 생성됩니다.
- `database`는 Page 생성과 함께 Database, 기본 Property들, 기본 `Table` View까지 트랜잭션으로 생성됩니다.

성공 응답:

- 일반 페이지: `Page` 객체
- 데이터베이스 페이지: `databaseId`가 포함된 `Page` 객체

### `GET /api/pages/[pageId]`

페이지 1개를 조회합니다.

성공 응답:

- 기본: `Page` 객체
- `?view=full` 사용 시:
  - 해당 페이지가 database 페이지여야 함
  - 응답에 `database` 전체 객체가 포함됨

`view=full` 응답 예시:

```json
{
  "id": "page_id",
  "title": "Tasks",
  "type": "database",
  "databaseId": "database_id",
  "database": {
    "id": "database_id",
    "pageId": "page_id",
    "properties": [],
    "columns": [],
    "rows": [],
    "views": []
  }
}
```

### `PATCH /api/pages/[pageId]`

페이지를 부분 수정합니다.

지원 필드:

```json
{
  "title": "optional",
  "bodyFontSizePt": 12,
  "headingFontSizes": {
    "h1": 30,
    "h2": 23,
    "h3": 18,
    "h4": 16,
    "h5": 14
  },
  "highlightColors": ["yellow", "green", "blue", "pink"],
  "content": {},
  "icon": "🌱",
  "coverImage": "https://... or data:image/...",
  "parentId": "optional_parent_id_or_null",
  "isPublic": true
}
```

규칙:

- `bodyFontSizePt`는 페이지 본문 글꼴 크기이며 `8`~`32` 사이 정수만 허용됩니다.
- 값의 단위는 `pt`입니다.
- `headingFontSizes`는 페이지 heading 표시 크기이며 `h1`~`h5` 각각 `8`~`48` 사이 정수 `pt`만 허용됩니다.
- `highlightColors`는 페이지 형광펜 팔레트이며 비어 있지 않은 배열이어야 합니다.
- 허용 색상은 `yellow | green | blue | purple | pink | red | orange` 입니다.

성공 응답:

- 수정된 `Page` 객체

### `DELETE /api/pages/[pageId]`

페이지를 삭제합니다.

성공 응답:

```json
{
  "success": true
}
```

### `GET /api/pages/[pageId]/ancestors`

페이지의 조상 목록을 브레드크럼 순서로 반환합니다.

성공 응답:

```json
[
  {
    "id": "ancestor_page_id",
    "title": "Parent",
    "icon": null
  }
]
```

### `PATCH /api/pages/[pageId]/share`

공유 상태를 변경합니다.

요청 본문:

```json
{
  "isPublic": true,
  "password": "optional password"
}
```

동작:

- `isPublic: true`일 때 `shareId`가 없으면 새로 생성
- `password`가 있으면 bcrypt 해시로 저장
- `isPublic: false`일 때 `shareId`, `sharePassword` 제거

성공 응답:

```json
{
  "success": true,
  "shareId": "share_token_or_null",
  "isPublic": true
}
```

## Public Share

### `GET /api/public/pages/[shareId]`

공개 공유 페이지를 조회합니다.

동작:

- `isPublic: true`이면서 `shareId`가 일치하는 페이지를 조회
- 비밀번호가 걸린 경우 콘텐츠는 반환하지 않음
- 공개 콘텐츠는 `sanitizePublicContent`를 거쳐 workspace 내부 링크를 정리한 뒤 반환

비밀번호 보호 페이지 응답:

```json
{
  "id": "page_id",
  "title": "Shared page",
  "content": null,
  "isPasswordProtected": true,
  "createdAt": "2026-04-27T00:00:00.000Z",
  "updatedAt": "2026-04-27T00:00:00.000Z"
}
```

비밀번호 없는 페이지 응답:

```json
{
  "id": "page_id",
  "title": "Shared page",
  "content": {},
  "isPasswordProtected": false,
  "createdAt": "2026-04-27T00:00:00.000Z",
  "updatedAt": "2026-04-27T00:00:00.000Z"
}
```

### `POST /api/public/pages/[shareId]/verify`

비밀번호 보호된 공유 페이지의 비밀번호를 검증합니다.

요청 본문:

```json
{
  "password": "plain_text_password"
}
```

동작:

- 비밀번호가 없는 페이지라면 즉시 콘텐츠를 반환
- 비밀번호가 있으면 bcrypt 비교 후 성공 시 콘텐츠를 반환

실패 응답:

```json
{
  "error": "Invalid password"
}
```

상태 코드는 `401`입니다.

## Databases

`Database` 응답 shape:

```json
{
  "id": "database_id",
  "pageId": "page_id",
  "properties": [],
  "columns": [],
  "rows": [],
  "views": []
}
```

주의:

- `columns`는 `properties`의 레거시 alias입니다.
- row는 별도 모델이 아니라 `parentDatabaseId`가 설정된 `Page`입니다.

### `POST /api/databases`

기존 페이지를 데이터베이스로 초기화합니다.

요청 본문:

```json
{
  "pageId": "page_id"
}
```

동작:

- 해당 `pageId`가 존재해야 함
- 이미 Database가 붙어 있으면 기존 Database를 그대로 반환
- 없으면 Database, 기본 Property들, 기본 `Table` View를 생성

성공 응답:

- `Database` 객체

### `GET /api/databases/[databaseId]`

데이터베이스 상세를 조회합니다.

포함 항목:

- `properties` 오름차순
- `views` 오름차순
- `rows`와 각 row의 `propertyValues`

성공 응답:

- `Database` 객체

### `DELETE /api/databases/[databaseId]`

데이터베이스를 삭제합니다.

성공 응답:

```json
{
  "success": true
}
```

주의:

- 실제 구현은 `Database` 레코드만 삭제합니다.
- `Page`까지 함께 삭제한다는 보장은 현재 구현에 없습니다.

### `GET /api/databases/[databaseId]/page`

해당 데이터베이스에 연결된 page의 최소 정보를 반환합니다.

성공 응답:

```json
{
  "id": "page_id",
  "title": "Database Page",
  "type": "database"
}
```

### `POST /api/databases/[databaseId]/rows`

새 row를 생성합니다.

요청 본문:

```json
{
  "title": "Untitled"
}
```

동작:

- row는 `type: "DOCUMENT"`인 Page로 생성
- `parentId`는 database page ID
- `parentDatabaseId`는 database ID
- 현재 database의 모든 Property에 대한 기본 `PropertyValue`도 함께 생성

성공 응답:

```json
{
  "id": "row_page_id",
  "title": "Untitled",
  "type": "document",
  "parentDatabaseId": "database_id",
  "propertyValues": [
    {
      "id": "pv_id",
      "pageId": "row_page_id",
      "propertyId": "property_id",
      "columnId": "property_id",
      "value": {}
    }
  ]
}
```

### `POST /api/databases/[databaseId]/columns`

새 Property를 추가합니다.

요청 본문:

```json
{
  "name": "Status",
  "type": "status",
  "options": [
    { "id": "todo", "label": "To do", "color": "gray" }
  ]
}
```

지원 타입:

- `text`
- `number`
- `select`
- `multi_select`
- `status`
- `date`
- `person`
- `checkbox`
- `url`
- `email`
- `phone`
- `files`
- `relation`
- `rollup`
- `formula`
- `created_time`
- `created_by`
- `last_edited_time`
- `last_edited_by`

동작:

- `name`, `type` 필수
- 기존 row가 있으면 각 row에 기본 `PropertyValue`도 생성

성공 응답:

```json
{
  "id": "property_id",
  "databaseId": "database_id",
  "name": "Status",
  "type": "status",
  "options": [],
  "order": 0
}
```

### `GET /api/databases/[databaseId]/views`

데이터베이스의 View 목록을 조회합니다.

성공 응답:

```json
[
  {
    "id": "view_id",
    "databaseId": "database_id",
    "name": "Table",
    "type": "table",
    "config": {
      "visibleProperties": [],
      "propertyWidths": {},
      "sorts": [],
      "filters": []
    },
    "createdAt": "2026-04-27T00:00:00.000Z",
    "updatedAt": "2026-04-27T00:00:00.000Z"
  }
]
```

### `POST /api/databases/[databaseId]/views`

새 View를 생성합니다.

요청 본문:

```json
{
  "name": "Board",
  "type": "board",
  "config": {
    "visibleProperties": ["property_id"],
    "propertyWidths": {},
    "sorts": [],
    "filters": []
  }
}
```

동작:

- `name`이 없으면 `New ${Type}` 형식으로 생성
- `config`가 없으면 현재 Property 목록을 기준으로 기본 config 자동 생성

성공 응답:

- `View` 객체

### `GET /api/databases/search`

워크스페이스의 데이터베이스 페이지를 검색합니다.

쿼리 파라미터:

| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `workspaceId` | `string` | 아니오 | 검색할 워크스페이스 ID. 없으면 로그인 유저의 기본 워크스페이스를 사용 |
| `q` | `string` | 아니오 | 제목 검색어 |

동작:

- 인증된 사용자만 호출할 수 있습니다.
- `workspaceId`가 있으면 해당 워크스페이스 멤버인지 검증합니다.
- `workspaceId`가 없으면 로그인 유저의 기본 워크스페이스를 자동 선택합니다.

성공 응답:

```json
[
  {
    "id": "page_id",
    "title": "Tasks",
    "icon": null,
    "databaseId": "database_id"
  }
]
```

## Columns Legacy API

아래 엔드포인트는 레거시 naming을 유지합니다. `columnId`는 실제로 `Property.id`입니다.

### `POST /api/columns`

새 Property를 생성합니다.

요청 본문:

```json
{
  "databaseId": "database_id",
  "name": "Priority",
  "type": "select",
  "options": [
    { "id": "high", "label": "High", "color": "red" }
  ]
}
```

지원 타입은 현재 구현상 다음으로 제한됩니다.

- `text`
- `number`
- `select`
- `multi_select`
- `date`
- `person`
- `checkbox`
- `url`
- `email`

성공 응답:

- `Property` 객체

### `PATCH /api/columns/[columnId]`

Property를 수정합니다.

요청 본문:

```json
{
  "name": "optional",
  "type": "optional",
  "options": [],
  "order": 1
}
```

성공 응답:

- 수정된 `Property` 객체

### `DELETE /api/columns/[columnId]`

Property를 삭제합니다.

성공 응답:

```json
{
  "success": true
}
```

## Property Values

`columnId`는 레거시 alias이고 실제 의미는 `propertyId`입니다.

대표 `PropertyValue` 응답 shape:

```json
{
  "id": "pv_id",
  "pageId": "page_id",
  "propertyId": "property_id",
  "columnId": "property_id",
  "value": {}
}
```

### `POST /api/property-values`

PropertyValue를 upsert합니다. 성공 시 상태 코드는 `201`입니다.

요청 본문:

```json
{
  "pageId": "page_id",
  "columnId": "property_id",
  "value": {}
}
```

검증:

- `pageId`, `columnId`, `value` 필수
- page와 property 존재 여부 확인

성공 응답:

- `PropertyValue` 객체

### `PUT /api/property-values`

PropertyValue를 upsert합니다. `POST`와 거의 동일하지만 성공 상태 코드는 `200`입니다.

요청 본문:

```json
{
  "pageId": "page_id",
  "columnId": "property_id",
  "value": {}
}
```

성공 응답:

- `PropertyValue` 객체

### `PATCH /api/property-values/[propertyValueId]`

기존 PropertyValue를 수정합니다.

요청 본문:

```json
{
  "value": {}
}
```

성공 응답:

- 수정된 `PropertyValue` 객체

### `DELETE /api/property-values/[propertyValueId]`

PropertyValue를 삭제합니다.

성공 응답:

```json
{
  "success": true
}
```

## AI

### `POST /api/ai/generate`

AI 텍스트 생성 스트림 API입니다.

요청 본문:

```json
{
  "prompt": "string",
  "context": "optional string",
  "command": "summarize"
}
```

지원 `command`:

- `summarize`
- `translate`
- `continue`
- `improve`
- `shorter`
- `longer`
- `explain`
- `code`

동작:

- `prompt`, `command` 필수
- 모델은 현재 `gpt-4o-mini`
- `streamText(...).toTextStreamResponse()`를 그대로 반환

실패 응답:

```json
{
  "error": "Failed to generate response"
}
```

## WebSocket

### `GET ws://localhost:3001/ws`

`apps/ws-server`의 WebSocket 엔드포인트입니다.

현재 구현 상태:

- 연결 수립 가능
- 클라이언트 메시지를 수신하면 서버 로그에 `Received message`를 남김
- Yjs import는 있으나 문서 동기화 로직은 아직 구현되지 않음

즉, 엔드포인트는 열려 있지만 협업 프로토콜 자체는 아직 초안 단계입니다.

---

## 클라이언트 훅 API

### `useSpeechRecognition` — 앵무새(음성인식) 훅

**파일**: `apps/web/hooks/useSpeechRecognition.ts`

브라우저 내장 Web Speech API를 감싸는 커스텀 훅. 서버 API 호출 없음.

#### 옵션

| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `onFinalResult` | `(text: string) => void` | 선택 | 최종 확정된 텍스트 조각이 나올 때마다 호출됨. 에디터 삽입 등에 사용. |

#### 반환값

| 필드 | 타입 | 설명 |
|---|---|---|
| `transcript` | `string` | 이번 세션에서 확정된 텍스트 전체 누적본 |
| `interimTranscript` | `string` | 현재 처리 중인 미확정(interim) 텍스트 — 실시간 회색 미리보기용 |
| `isListening` | `boolean` | 녹음이 진행 중인지 여부 |
| `isSupported` | `boolean` | 브라우저가 Web Speech API를 지원하는지 여부 |
| `start` | `() => void` | 음성인식 시작 |
| `stop` | `() => void` | 음성인식 중지 |

#### 브라우저 제한

- **지원**: Chrome, Edge (Chromium 기반)
- **미지원**: Firefox, Safari — `isSupported: false` 반환, 버튼 툴팁으로 안내
- `lang: 'ko-KR'`, `continuous: true`, `interimResults: true` 고정

#### 사용 예시

```typescript
const { interimTranscript, isListening, isSupported, start, stop } =
  useSpeechRecognition({
    onFinalResult: (text) => {
      editor?.chain().focus().insertContent(text).run();
    },
  });
```
