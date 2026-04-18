/**
 * CRDT (Conflict-free Replicated Data Types) implementation
 * For real-time collaborative editing
 */

import type { ID, Block, BlockOperation, OperationType } from '@/types/core';

// ============================================
// Types
// ============================================

export interface CRDTDocument {
  id: ID;
  blocks: Map<ID, CRDTBlock>;
  order: ID[]; // Ordered list of block IDs
  version: number;
}

export interface CRDTBlock {
  id: ID;
  type: string;
  content: unknown;
  children: ID[];
  parentId: ID | null;
  
  // CRDT metadata
  createdAt: number;
  createdBy: ID;
  modifiedAt: number;
  modifiedBy: ID;
  
  // Tombstone for deletion
  isDeleted: boolean;
}

export interface CRDTOperation {
  id: ID;
  type: OperationType;
  timestamp: number;
  userId: ID;
  
  // Operation data
  blockId: ID;
  parentId?: ID;
  afterId?: ID; // For ordering
  content?: unknown;
  updates?: Partial<CRDTBlock>;
}

// ============================================
// CRDT Document Manager
// ============================================

export class CRDTDocumentManager {
  private doc: CRDTDocument;
  private operationLog: CRDTOperation[] = [];
  private userId: ID;

  constructor(docId: ID, userId: ID) {
    this.userId = userId;
    this.doc = {
      id: docId,
      blocks: new Map(),
      order: [],
      version: 0,
    };
  }

  /**
   * Apply a local operation
   */
  applyLocal(op: Omit<CRDTOperation, 'id' | 'timestamp'>): CRDTOperation {
    const operation: CRDTOperation = {
      ...op,
      id: this.generateId(),
      timestamp: Date.now(),
    };

    this.applyOperation(operation);
    this.operationLog.push(operation);
    
    return operation;
  }

  /**
   * Apply a remote operation (from another user)
   */
  applyRemote(operation: CRDTOperation): void {
    // Check if we've already applied this operation
    if (this.operationLog.some(op => op.id === operation.id)) {
      return;
    }

    // Transform against concurrent operations
    const transformed = this.transformOperation(operation);
    
    this.applyOperation(transformed);
    this.operationLog.push(transformed);
  }

  /**
   * Apply operation to document state
   */
  private applyOperation(op: CRDTOperation): void {
    switch (op.type) {
      case 'insert_block':
        this.applyInsert(op);
        break;
      case 'update_block':
        this.applyUpdate(op);
        break;
      case 'delete_block':
        this.applyDelete(op);
        break;
      case 'move_block':
        this.applyMove(op);
        break;
    }

    this.doc.version++;
  }

  private applyInsert(op: CRDTOperation): void {
    const block: CRDTBlock = {
      id: op.blockId,
      type: (op.content as { type: string }).type,
      content: (op.content as { content: unknown }).content,
      children: [],
      parentId: op.parentId || null,
      createdAt: op.timestamp,
      createdBy: op.userId,
      modifiedAt: op.timestamp,
      modifiedBy: op.userId,
      isDeleted: false,
    };

    this.doc.blocks.set(op.blockId, block);

    // Insert into order
    if (op.afterId) {
      const index = this.doc.order.indexOf(op.afterId);
      if (index !== -1) {
        this.doc.order.splice(index + 1, 0, op.blockId);
      } else {
        this.doc.order.push(op.blockId);
      }
    } else if (op.parentId) {
      // Insert as child
      const parent = this.doc.blocks.get(op.parentId);
      if (parent) {
        parent.children.push(op.blockId);
      }
    } else {
      this.doc.order.push(op.blockId);
    }
  }

  private applyUpdate(op: CRDTOperation): void {
    const block = this.doc.blocks.get(op.blockId);
    if (!block || block.isDeleted) return;

    if (op.updates) {
      Object.assign(block, op.updates);
      block.modifiedAt = op.timestamp;
      block.modifiedBy = op.userId;
    }
  }

  private applyDelete(op: CRDTOperation): void {
    const block = this.doc.blocks.get(op.blockId);
    if (!block) return;

    // Soft delete (tombstone)
    block.isDeleted = true;
    block.modifiedAt = op.timestamp;
    block.modifiedBy = op.userId;

    // Remove from order
    const index = this.doc.order.indexOf(op.blockId);
    if (index !== -1) {
      this.doc.order.splice(index, 1);
    }

    // Remove from parent's children
    if (block.parentId) {
      const parent = this.doc.blocks.get(block.parentId);
      if (parent) {
        const childIndex = parent.children.indexOf(op.blockId);
        if (childIndex !== -1) {
          parent.children.splice(childIndex, 1);
        }
      }
    }
  }

  private applyMove(op: CRDTOperation): void {
    const block = this.doc.blocks.get(op.blockId);
    if (!block || block.isDeleted) return;

    // Remove from old position
    const oldIndex = this.doc.order.indexOf(op.blockId);
    if (oldIndex !== -1) {
      this.doc.order.splice(oldIndex, 1);
    }

    if (block.parentId) {
      const oldParent = this.doc.blocks.get(block.parentId);
      if (oldParent) {
        const childIndex = oldParent.children.indexOf(op.blockId);
        if (childIndex !== -1) {
          oldParent.children.splice(childIndex, 1);
        }
      }
    }

    // Update parent
    block.parentId = op.parentId || null;

    // Insert at new position
    if (op.afterId) {
      const index = this.doc.order.indexOf(op.afterId);
      if (index !== -1) {
        this.doc.order.splice(index + 1, 0, op.blockId);
      } else {
        this.doc.order.push(op.blockId);
      }
    } else if (op.parentId) {
      const parent = this.doc.blocks.get(op.parentId);
      if (parent) {
        parent.children.push(op.blockId);
      }
    } else {
      this.doc.order.push(op.blockId);
    }

    block.modifiedAt = op.timestamp;
    block.modifiedBy = op.userId;
  }

  /**
   * Transform operation against concurrent operations
   */
  private transformOperation(op: CRDTOperation): CRDTOperation {
    // Get concurrent operations (same document, different user, similar time)
    const concurrentOps = this.operationLog.filter(
      existing => 
        existing.userId !== op.userId &&
        Math.abs(existing.timestamp - op.timestamp) < 5000 // 5 second window
    );

    let transformed = { ...op };

    for (const concurrent of concurrentOps) {
      transformed = this.transformAgainst(transformed, concurrent);
    }

    return transformed;
  }

  private transformAgainst(op: CRDTOperation, against: CRDTOperation): CRDTOperation {
    // If operations don't affect the same block, no transformation needed
    if (op.blockId !== against.blockId) {
      // But check for ordering conflicts
      if (op.type === 'insert_block' && against.type === 'insert_block') {
        if (op.afterId === against.afterId) {
          // Both inserting after same block - use timestamp to break tie
          if (against.timestamp < op.timestamp) {
            return { ...op, afterId: against.blockId };
          }
        }
      }
      return op;
    }

    // Same block - apply transformation rules
    switch (op.type) {
      case 'update_block':
        if (against.type === 'update_block') {
          // Merge updates
          return {
            ...op,
            updates: { ...against.updates, ...op.updates },
          };
        }
        if (against.type === 'delete_block') {
          // Update after delete - cancel update
          return { ...op, type: 'noop' as OperationType };
        }
        break;

      case 'delete_block':
        if (against.type === 'delete_block') {
          // Double delete - noop
          return { ...op, type: 'noop' as OperationType };
        }
        break;
    }

    return op;
  }

  /**
   * Get current document state
   */
  getDocument(): CRDTDocument {
    return {
      ...this.doc,
      blocks: new Map(this.doc.blocks),
      order: [...this.doc.order],
    };
  }

  /**
   * Get ordered list of blocks (excluding deleted)
   */
  getBlocks(): CRDTBlock[] {
    return this.doc.order
      .map(id => this.doc.blocks.get(id))
      .filter((b): b is CRDTBlock => b !== undefined && !b.isDeleted);
  }

  /**
   * Get children of a block
   */
  getChildren(blockId: ID): CRDTBlock[] {
    const block = this.doc.blocks.get(blockId);
    if (!block) return [];

    return block.children
      .map(id => this.doc.blocks.get(id))
      .filter((b): b is CRDTBlock => b !== undefined && !b.isDeleted);
  }

  /**
   * Get operations since a version
   */
  getOperationsSince(version: number): CRDTOperation[] {
    return this.operationLog.slice(version);
  }

  private generateId(): ID {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================
// Awareness (Cursor/Selection)
// ============================================

export interface AwarenessState {
  userId: ID;
  userName: string;
  userColor: string;
  cursor: CursorPosition | null;
  selection: TextSelection | null;
}

export interface CursorPosition {
  blockId: ID;
  offset: number;
}

export interface TextSelection {
  blockId: ID;
  start: number;
  end: number;
}

export class AwarenessManager {
  private states = new Map<ID, AwarenessState>();
  private localUserId: ID;
  private listeners = new Set<(states: Map<ID, AwarenessState>) => void>();

  constructor(localUserId: ID) {
    this.localUserId = localUserId;
  }

  setLocalState(state: Omit<AwarenessState, 'userId'>): void {
    const fullState: AwarenessState = {
      ...state,
      userId: this.localUserId,
    };
    
    this.states.set(this.localUserId, fullState);
    this.notifyListeners();
  }

  setRemoteState(state: AwarenessState): void {
    this.states.set(state.userId, state);
    this.notifyListeners();
  }

  removeRemoteState(userId: ID): void {
    this.states.delete(userId);
    this.notifyListeners();
  }

  getStates(): Map<ID, AwarenessState> {
    return new Map(this.states);
  }

  getOtherStates(): Map<ID, AwarenessState> {
    const others = new Map(this.states);
    others.delete(this.localUserId);
    return others;
  }

  subscribe(callback: (states: Map<ID, AwarenessState>) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.getStates());
    }
  }
}

// ============================================
// Sync Protocol
// ============================================

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

  /**
   * Handle incoming sync message
   */
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

  /**
   * Send local operation to server
   */
  sendOperation(op: CRDTOperation): void {
    this.sendMessage({
      type: 'operation',
      documentId: this.docManager.getDocument().id,
      data: op,
    });
  }

  /**
   * Send awareness update
   */
  sendAwareness(state: AwarenessState): void {
    this.sendMessage({
      type: 'awareness',
      documentId: this.docManager.getDocument().id,
      data: state,
    });
  }

  private handleInit(data: InitMessage): void {
    // Merge server document with local
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
