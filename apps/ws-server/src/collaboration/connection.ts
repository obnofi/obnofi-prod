import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import * as Y from 'yjs'
import type { WebSocket } from 'ws'
import type { DocEntry } from './types.js'
import { getOrCreateDoc, closeConn, safeSend } from './docManager.js'

const MSG_SYNC = 0
const MSG_AWARENESS = 1
const MSG_QUERY_AWARENESS = 3
const PING_TIMEOUT = 30000

function handleMessage(conn: WebSocket, entry: DocEntry, data: Uint8Array): void {
  const decoder = decoding.createDecoder(data)
  const encoder = encoding.createEncoder()
  const msgType = decoding.readVarUint(decoder)

  switch (msgType) {
    case MSG_SYNC: {
      encoding.writeVarUint(encoder, MSG_SYNC)
      const syncMsgType = syncProtocol.readSyncMessage(decoder, encoder, entry.doc, conn)
      if (syncMsgType === syncProtocol.messageYjsSyncStep1 || encoding.length(encoder) > 1) {
        safeSend(conn, encoding.toUint8Array(encoder))
      }
      break
    }
    case MSG_AWARENESS: {
      awarenessProtocol.applyAwarenessUpdate(entry.awareness, decoding.readVarUint8Array(decoder), conn)
      break
    }
    case MSG_QUERY_AWARENESS: {
      const awarenessStates = entry.awareness.getStates()
      if (awarenessStates.size > 0) {
        encoding.writeVarUint(encoder, MSG_AWARENESS)
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(entry.awareness, [...awarenessStates.keys()])
        )
        safeSend(conn, encoding.toUint8Array(encoder))
      }
      break
    }
  }
}

function sendInitialState(conn: WebSocket, entry: DocEntry): void {
  const syncEncoder = encoding.createEncoder()
  encoding.writeVarUint(syncEncoder, MSG_SYNC)
  syncProtocol.writeSyncStep1(syncEncoder, entry.doc)
  safeSend(conn, encoding.toUint8Array(syncEncoder))

  // 신규 클라이언트가 즉시 synced 상태가 되도록 현재 문서 전체를 한 번 더 내려준다.
  // 일부 클라이언트 환경에서는 step1 왕복 타이밍만으로는 synced 이벤트가 늦게 오거나
  // 초기 문서 복원이 비는 경로가 있어서, 초기 접속 시 full step2를 명시적으로 보낸다.
  const fullStateEncoder = encoding.createEncoder()
  encoding.writeVarUint(fullStateEncoder, MSG_SYNC)
  encoding.writeVarUint(fullStateEncoder, syncProtocol.messageYjsSyncStep2)
  encoding.writeVarUint8Array(fullStateEncoder, Y.encodeStateAsUpdate(entry.doc))
  safeSend(conn, encoding.toUint8Array(fullStateEncoder))

  const awarenessStates = entry.awareness.getStates()
  if (awarenessStates.size > 0) {
    const aEncoder = encoding.createEncoder()
    encoding.writeVarUint(aEncoder, MSG_AWARENESS)
    encoding.writeVarUint8Array(aEncoder, awarenessProtocol.encodeAwarenessUpdate(entry.awareness, [...awarenessStates.keys()]))
    safeSend(conn, encoding.toUint8Array(aEncoder))
  }
}

function normalizeMessage(rawData: ArrayBuffer | Buffer | Buffer[]): Uint8Array | null {
  if (Array.isArray(rawData)) {
    const chunks = rawData.map((chunk) =>
      chunk instanceof Buffer
        ? chunk
        : Buffer.from(chunk)
    )
    return new Uint8Array(Buffer.concat(chunks))
  }

  if (rawData instanceof ArrayBuffer) {
    return new Uint8Array(rawData)
  }

  if (rawData instanceof Buffer) {
    return new Uint8Array(rawData.buffer, rawData.byteOffset, rawData.byteLength)
  }

  return null
}

export async function setupConnection(
  conn: WebSocket,
  docId: string,
  initialMessages: Array<ArrayBuffer | Buffer | Buffer[]> = []
): Promise<void> {
  conn.binaryType = 'arraybuffer'
  const entry = await getOrCreateDoc(docId)
  entry.conns.add(conn)

  const processRawMessage = (rawData: ArrayBuffer | Buffer | Buffer[]) => {
    const data = normalizeMessage(rawData)
    if (!data) return
    handleMessage(conn, entry, data)
  }

  conn.on('message', processRawMessage)

  let pongReceived = true
  const pingInterval = setInterval(() => {
    if (!pongReceived) {
      closeConn(entry, conn, docId)
      clearInterval(pingInterval)
      return
    }
    if (entry.conns.has(conn)) {
      pongReceived = false
      try {
        conn.ping()
      } catch {
        closeConn(entry, conn, docId)
        clearInterval(pingInterval)
      }
    }
  }, PING_TIMEOUT)

  conn.on('pong', () => { pongReceived = true })
  conn.on('close', () => {
    closeConn(entry, conn, docId)
    clearInterval(pingInterval)
  })

  sendInitialState(conn, entry)
  initialMessages.forEach(processRawMessage)
}
