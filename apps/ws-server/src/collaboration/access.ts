import { prisma } from '@obnofi/db'

function resolveWebAppUrl(): string {
  const configuredUrl =
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL

  return (configuredUrl?.trim() || 'http://localhost:3000').replace(/\/+$/, '')
}

async function getUserIdFromSessionCookie(cookieHeader: string): Promise<string | null> {
  try {
    const response = await fetch(`${resolveWebAppUrl()}/api/profile`, {
      headers: {
        cookie: cookieHeader,
      },
    })

    if (!response.ok) return null

    const profile = await response.json() as { id?: unknown }
    return typeof profile.id === 'string' ? profile.id : null
  } catch {
    return null
  }
}

// Google sub 등 providerAccountId가 전달된 경우 DB User.id(CUID)로 변환
async function resolveToDbUserId(candidateId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: candidateId },
    select: { id: true },
  }).catch(() => null)
  if (user) return user.id

  const account = await prisma.account.findFirst({
    where: { providerAccountId: candidateId },
    select: { userId: true },
  }).catch(() => null)
  return account?.userId ?? null
}

export async function checkPageAccess(
  pageId: string,
  cookieHeader: string | null,
  explicitUserId: string | null
): Promise<boolean> {
  // 페이지 조회 (collaborationEnabled + 워크스페이스 오너/멤버 확인용)
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: {
      collaborationEnabled: true,
      workspaceId: true,
      workspace: { select: { ownerId: true } },
    },
  }).catch(() => null)

  if (!page) return false
  if (!page.collaborationEnabled) return false

  const cookieUserId = cookieHeader
    ? await getUserIdFromSessionCookie(cookieHeader)
    : null

  const rawCandidates = [explicitUserId, cookieUserId].filter(Boolean) as string[]
  if (rawCandidates.length === 0) return false

  // providerAccountId(예: Google sub)를 DB User.id(CUID)로 변환
  const resolvedIds = await Promise.all(rawCandidates.map(resolveToDbUserId))
  const candidateUserIds = [...new Set(resolvedIds.filter(Boolean))] as string[]
  if (candidateUserIds.length === 0) return false

  for (const userId of candidateUserIds) {
    // 워크스페이스 오너는 항상 허용
    if (page.workspace.ownerId === userId) return true

    // 워크스페이스 멤버는 페이지 협업이 켜진 문서에 기본 접근 가능
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: page.workspaceId,
          userId,
        },
      },
      select: { id: true },
    }).catch(() => null)

    if (membership) return true

    // 개별 초대 collaborator도 허용
    const collaborator = await prisma.pageCollaborator.findUnique({
      where: { pageId_userId: { pageId, userId } },
      select: { id: true },
    }).catch(() => null)

    if (collaborator) return true
  }

  // 현재 웹 앱은 공동 편집 링크를 받은 로그인 사용자가 페이지를 열고 편집까지 할 수 있다.
  // WS만 별도로 막히면 로컬 편집은 되는데 실시간 동기화만 실패하는 불일치가 생긴다.
  // 따라서 협업이 켜진 페이지는 인증된 사용자라면 WS 접속도 허용해 HTTP/WS 권한 모델을 맞춘다.
  return candidateUserIds.length > 0

}
