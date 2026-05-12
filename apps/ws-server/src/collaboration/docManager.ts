import * as Y from 'yjs'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as encoding from 'lib0/encoding'
import type { WebSocket } from 'ws'
import type { DocEntry } from './types.js'
import { loadDoc, persistDoc } from './persistence.js'

const MSG_SYNC = 0
const MSG_AWARENESS = 1
const PERSIST_DEBOUNCE = 1000
const MAX_BUFFERED_BYTES = 1024 * 1024 // 1MB — 초과 시 해당 conn 전송 스킵

const docs = new Map<string, DocEntry>()
// 동시 연결이 몰렸을 때 loadDoc을 한 번만 실행하도록 Promise 캐시
const loadingDocs = new Map<string, Promise<DocEntry>>()

export function safeSend(conn: WebSocket, msg: Uint8Array): void {
  if (conn.readyState !== 1 /* OPEN */) return
  // backpressure: 버퍼가 가득 찬 느린 클라이언트는 스킵
  if ((conn as unknown as { bufferedAmount?: number }).bufferedAmount ?? 0 > MAX_BUFFERED_BYTES) return
  conn.send(msg)
}

function broadcast(docId: string, entry: DocEntry, msg: Uint8Array, exclude?: WebSocket): void {
  const stale: WebSocket[] = []
  entry.conns.forEach((conn) => {
    if (conn.readyState !== 1 /* OPEN */) {
      stale.push(conn)
      return
    }
    if (conn === exclude) return
    safeSend(conn, msg)
  })
  // stale 연결도 일반 종료 경로를 타게 해서 마지막 연결 정리와 doc 해제를 보장한다.
  for (const conn of stale) closeConn(entry, conn, docId)
}

async function createDoc(docId: string): Promise<DocEntry> {
  const doc = new Y.Doc()
  const awareness = new awarenessProtocol.Awareness(doc)
  const entry: DocEntry = { doc, awareness, conns: new Set(), persistTimer: null }

  // loadDoc 완료 후에 docs 등록 + 이벤트 핸들러 부착
  // 이렇게 해야 두 번째 동시 연결이 빈 doc 상태를 받는 경쟁 조건이 없음
  await loadDoc(docId, doc)
  docs.set(docId, entry)

  doc.on('update', (update: Uint8Array, origin: unknown) => {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MSG_SYNC)
    syncProtocol.writeUpdate(encoder, update)
    const msg = encoding.toUint8Array(encoder)
    broadcast(docId, entry, msg, origin as WebSocket | undefined)

    if (entry.persistTimer) clearTimeout(entry.persistTimer)
    entry.persistTimer = setTimeout(() => {
      persistDoc(docId, doc).catch(() => {})
      entry.persistTimer = null
    }, PERSIST_DEBOUNCE)
  })

  awareness.on('update', ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }) => {
    const changedClients = [...added, ...updated, ...removed]
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MSG_AWARENESS)
    encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients))
    const msg = encoding.toUint8Array(encoder)
    broadcast(docId, entry, msg)
  })

  return entry
}

export function getOrCreateDoc(docId: string): Promise<DocEntry> {
  const existing = docs.get(docId)
  if (existing) return Promise.resolve(existing)

  // 이미 로딩 중이면 같은 Promise 반환 (동시 연결 경쟁 조건 방지)
  const pending = loadingDocs.get(docId)
  if (pending) return pending

  const promise = createDoc(docId).finally(() => loadingDocs.delete(docId))
  loadingDocs.set(docId, promise)
  return promise
}

export function closeConn(entry: DocEntry, conn: WebSocket, docId: string): void {
  if (!entry.conns.has(conn)) return
  entry.conns.delete(conn)

  if (entry.conns.size === 0) {
    if (entry.persistTimer) {
      clearTimeout(entry.persistTimer)
      entry.persistTimer = null
    }
    persistDoc(docId, entry.doc).catch(() => {})
    entry.doc.destroy()
    docs.delete(docId)
  }
}
