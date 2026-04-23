import Fastify from 'fastify'
import websocket from '@fastify/websocket'
import * as Y from 'yjs'
import { prisma } from '@obnofi/db'

const fastify = Fastify({
  logger: true
})

fastify.register(websocket)

fastify.register(async (fastify) => {
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    connection.socket.on('message', message => {
      // message handling logic here
      fastify.log.info('Received message')
    })
  })
})

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
