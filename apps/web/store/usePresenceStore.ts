import { create } from "zustand";
import type { Point } from "@obnofi/types/clearing";

export type PresenceUser = {
  id: string;
  name: string;
  color: string;
  cursor: Point | null;
  selectedIds: string[];
  lastActiveAt: number;
};

type PresenceState = {
  currentUser: PresenceUser | null;
  peers: PresenceUser[];
  setCurrentUser: (user: PresenceUser | null) => void;
  updateCurrentUser: (patch: Partial<PresenceUser>) => void;
  setPeers: (users: PresenceUser[]) => void;
  pruneInactivePeers: (maxAgeMs: number) => void;
};

export const usePresenceStore = create<PresenceState>((set) => ({
  currentUser: null,
  peers: [],
  setCurrentUser: (user) => set({ currentUser: user }),
  updateCurrentUser: (patch) =>
    set((state) => ({
      currentUser: state.currentUser
        ? {
            ...state.currentUser,
            ...patch,
            lastActiveAt: patch.lastActiveAt ?? Date.now(),
          }
        : state.currentUser,
    })),
  setPeers: (users) => set({ peers: users }),
  pruneInactivePeers: (maxAgeMs) =>
    set((state) => ({
      peers: state.peers.filter((user) => Date.now() - user.lastActiveAt < maxAgeMs),
    })),
}));
