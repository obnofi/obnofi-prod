import * as Y from 'yjs'
import { prisma } from '@obnofi/db'

const DB_OPERATION_TIMEOUT = 5000
const DB_RETRY_COOLDOWN = 30000

let dbDisabledUntil = 0
let consecutiveDbFailures = 0

export function isDbTemporarilyDisabled(): boolean {
  return Date.now() < dbDisabledUntil
}

function recordDbSuccess(): void {
  consecutiveDbFailures = 0
}

function recordDbFailure(context: string, error: unknown): void {
  consecutiveDbFailures += 1

  if (consecutiveDbFailures < 3) {
    console.warn('[ws-server] Yjs persistence operation failed', {
      context,
      consecutiveDbFailures,
      error,
    })
    return
  }

  dbDisabledUntil = Date.now() + DB_RETRY_COOLDOWN
  consecutiveDbFailures = 0
  console.warn(
    `[ws-server] Yjs persistence disabled temporarily (retry at ${new Date(dbDisabledUntil).toISOString()})`,
    { context, error }
  )
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, context: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`${context} timed out after ${timeoutMs}ms`)),
          timeoutMs
        )
      }),
    ])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export async function persistDoc(pageId: string, doc: Y.Doc): Promise<void> {
  if (isDbTemporarilyDisabled()) return

  const state = Y.encodeStateAsUpdate(doc)

  try {
    await withTimeout(
      prisma.yjsDocument.upsert({
        where: { pageId },
        update: { state: Buffer.from(state) },
        create: { pageId, state: Buffer.from(state) },
      }),
      DB_OPERATION_TIMEOUT,
      `persistDoc(${pageId})`
    )
    recordDbSuccess()
  } catch (error) {
    recordDbFailure(`persistDoc(${pageId})`, error)
  }
}

export async function loadDoc(pageId: string, doc: Y.Doc): Promise<boolean> {
  if (isDbTemporarilyDisabled()) return false

  try {
    const record = await withTimeout(
      prisma.yjsDocument.findUnique({ where: { pageId } }),
      DB_OPERATION_TIMEOUT,
      `loadDoc(${pageId})`
    )
    if (record) {
      Y.applyUpdate(doc, new Uint8Array(record.state))
    }
    recordDbSuccess()
    return Boolean(record)
  } catch (error) {
    recordDbFailure(`loadDoc(${pageId})`, error)
  }
  return false
}
