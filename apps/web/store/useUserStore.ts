import { create } from "zustand";
import type { User } from "@obnofi/types/clearing";

type UserState = {
  currentUser: User | null;
  others: User[];
  setCurrentUser: (user: User) => void;
  setPresenceUsers: (users: User[]) => void;
};

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  others: [],
  setCurrentUser: (user) => set({ currentUser: user }),
  setPresenceUsers: (users) =>
    set((state) => ({
      currentUser:
        state.currentUser && users.some((user) => user.id === state.currentUser?.id)
          ? users.find((user) => user.id === state.currentUser?.id) ?? state.currentUser
          : state.currentUser,
      others: state.currentUser
        ? users.filter((user) => user.id !== state.currentUser?.id)
        : users,
    })),
}));
