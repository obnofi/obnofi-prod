import Fastify from 'fastify'
import websocket from '@fastify/websocket'
import type { WebSocket } from 'ws'
import { setupConnection } from './collaboration/connection.js'
import { checkPageAccess } from './collaboration/access.js'
import { flushAllDocs } from './collaboration/docManager.js'

const fastify = Fastify({ logger: true })
// Yjs 바이너리 업데이트는 압축 효과가 낮고 CPU 비용만 높아서 비활성화
fastify.register(websocket, { options: { perMessageDeflate: false } })

fastify.register(async (fastify) => {
  fastify.get('/ws', { websocket: true }, (socket, req) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
    const docId = url.searchParams.get('docId') ?? 'default'
    const userId = url.searchParams.get('userId')
    const cookieHeader = req.headers.cookie ?? null
    const pendingMessages: Array<ArrayBuffer | Buffer | Buffer[]> = []
    let connectionReady = false

    const queueMessage = (rawData: ArrayBuffer | Buffer | Buffer[]) => {
      if (!connectionReady) {
        pendingMessages.push(rawData)
      }
    }

    socket.on('message', queueMessage)

    checkPageAccess(docId, cookieHeader, userId)
      .then((allowed) => {
        if (!allowed) {
          fastify.log.warn({ docId, userId, hasCookie: Boolean(cookieHeader) }, 'collaboration access denied')
          socket.close(4403, 'Forbidden')
          return
        }
        fastify.log.info({ docId, userId }, 'collaboration access granted')
        connectionReady = true
        socket.off('message', queueMessage)
        return setupConnection(socket as unknown as WebSocket, docId, pendingMessages)
      })
      .catch((err) => {
        fastify.log.error(err)
        socket.close()
      })
  })

  fastify.get('/ws/:docId', { websocket: true }, (socket, req) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
    const docId =
      typeof (req.params as { docId?: unknown } | undefined)?.docId === 'string'
        ? (req.params as { docId: string }).docId
        : url.searchParams.get('docId') ?? 'default'
    const userId = url.searchParams.get('userId')
    const cookieHeader = req.headers.cookie ?? null
    const pendingMessages: Array<ArrayBuffer | Buffer | Buffer[]> = []
    let connectionReady = false

    const queueMessage = (rawData: ArrayBuffer | Buffer | Buffer[]) => {
      if (!connectionReady) {
        pendingMessages.push(rawData)
      }
    }

    socket.on('message', queueMessage)

    checkPageAccess(docId, cookieHeader, userId)
      .then((allowed) => {
        if (!allowed) {
          fastify.log.warn({ docId, userId, hasCookie: Boolean(cookieHeader) }, 'collaboration access denied')
          socket.close(4403, 'Forbidden')
          return
        }
        fastify.log.info({ docId, userId }, 'collaboration access granted')
        connectionReady = true
        socket.off('message', queueMessage)
        return setupConnection(socket as unknown as WebSocket, docId, pendingMessages)
      })
      .catch((err) => {
        fastify.log.error(err)
        socket.close()
      })
  })
})

const port = Number(process.env.PORT ?? 3001)

if (!Number.isFinite(port) || port <= 0) {
  fastify.log.error({ port: process.env.PORT }, 'invalid PORT')
  process.exit(1)
}

fastify.listen({ port, host: '0.0.0.0' }).catch((err) => {
  fastify.log.error(err)
  process.exit(1)
})

// Graceful shutdown: 배포/재시작(SIGTERM, SIGINT) 시 디바운스 대기 중인 변경을 먼저 flush한 뒤 종료한다.
// flush를 close보다 먼저 await 해서, 컨테이너가 꺼지는 순간 1초 디바운스 큐에 남아있던 사용자 글이 유실되지 않도록 한다.
let shuttingDown = false
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return
  shuttingDown = true
  fastify.log.info({ signal }, 'graceful shutdown: flushing yjs docs')
  try {
    await flushAllDocs()
    await fastify.close()
  } catch (err) {
    fastify.log.error(err)
  } finally {
    process.exit(0)
  }
}

process.on('SIGTERM', () => { void shutdown('SIGTERM') })
process.on('SIGINT', () => { void shutdown('SIGINT') })
