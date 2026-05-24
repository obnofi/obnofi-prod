import type { ID } from '@obnofi/types/core';
import type { CRDTDocument, CRDTOperation } from './crdt';
import { CRDTDocumentManager } from './crdt';
import { AwarenessManager, AwarenessState } from './awarenessManager';

export interface SyncMessage {
  type: 'init' | 'operation' | 'awareness' | 'ping' | 'pong';
  documentId: ID;
  data: unknown;
}

export interface InitMessage {
  document: CRDTDocument;
  operations: CRDTOperation[];
  version: number;
}

export class SyncProtocol {
  private docManager: CRDTDocumentManager;
  private awareness: AwarenessManager;
  private sendMessage: (msg: SyncMessage) => void;

  constructor(
    docManager: CRDTDocumentManager,
    awareness: AwarenessManager,
    sendMessage: (msg: SyncMessage) => void
  ) {
    this.docManager = docManager;
    this.awareness = awareness;
    this.sendMessage = sendMessage;
  }

  handleMessage(msg: SyncMessage): void {
    switch (msg.type) {
      case 'init':
        this.handleInit(msg.data as InitMessage);
        break;
      case 'operation':
        this.handleOperation(msg.data as CRDTOperation);
        break;
      case 'awareness':
        this.handleAwareness(msg.data as AwarenessState);
        break;
      case 'ping':
        this.sendMessage({ type: 'pong', documentId: msg.documentId, data: null });
        break;
    }
  }

  sendOperation(op: CRDTOperation): void {
    this.sendMessage({
      type: 'operation',
      documentId: this.docManager.getDocument().id,
      data: op,
    });
  }

  sendAwareness(state: AwarenessState): void {
    this.sendMessage({
      type: 'awareness',
      documentId: this.docManager.getDocument().id,
      data: state,
    });
  }

  private handleInit(data: InitMessage): void {
    for (const op of data.operations) {
      this.docManager.applyRemote(op);
    }
  }

  private handleOperation(op: CRDTOperation): void {
    this.docManager.applyRemote(op);
  }

  private handleAwareness(state: AwarenessState): void {
    this.awareness.setRemoteState(state);
  }
}
