import type { ID } from '@obnofi/types/core';

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
