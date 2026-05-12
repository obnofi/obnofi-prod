import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import type { WebSocket } from 'ws'
import type { DocEntry } from './types.js'
import { getOrCreateDoc, closeConn, safeSend } from './docManager.js'

const MSG_SYNC = 0
const MSG_AWARENESS = 1
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
  }
}

function sendInitialState(conn: WebSocket, entry: DocEntry): void {
  const syncEncoder = encoding.createEncoder()
  encoding.writeVarUint(syncEncoder, MSG_SYNC)
  syncProtocol.writeSyncStep1(syncEncoder, entry.doc)
  safeSend(conn, encoding.toUint8Array(syncEncoder))

  const awarenessStates = entry.awareness.getStates()
  if (awarenessStates.size > 0) {
    const aEncoder = encoding.createEncoder()
    encoding.writeVarUint(aEncoder, MSG_AWARENESS)
    encoding.writeVarUint8Array(aEncoder, awarenessProtocol.encodeAwarenessUpdate(entry.awareness, [...awarenessStates.keys()]))
    safeSend(conn, encoding.toUint8Array(aEncoder))
  }
}

export async function setupConnection(conn: WebSocket, docId: string): Promise<void> {
  conn.binaryType = 'arraybuffer'
  const entry = await getOrCreateDoc(docId)
  entry.conns.add(conn)

  conn.on('message', (rawData: ArrayBuffer | Buffer) => {
    const data = rawData instanceof ArrayBuffer
      ? new Uint8Array(rawData)
      : new Uint8Array(rawData.buffer, rawData.byteOffset, rawData.byteLength)
    handleMessage(conn, entry, data)
  })

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
}
