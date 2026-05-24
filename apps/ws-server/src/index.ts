import Fastify from 'fastify'
import websocket from '@fastify/websocket'
import type { WebSocket } from 'ws'
import { setupConnection } from './collaboration/connection.js'
import { checkPageAccess } from './collaboration/access.js'

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

fastify.listen({ port: 3001, host: '0.0.0.0' }).catch((err) => {
  fastify.log.error(err)
  process.exit(1)
})
