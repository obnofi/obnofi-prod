import * as Y from 'yjs'
import * as awarenessProtocol from 'y-protocols/awareness'
import type { WebSocket } from 'ws'

export interface DocEntry {
  doc: Y.Doc
  awareness: awarenessProtocol.Awareness
  conns: Set<WebSocket>
  persistTimer: ReturnType<typeof setTimeout> | null
}
