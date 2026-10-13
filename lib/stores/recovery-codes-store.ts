import { create } from "zustand";

type RecoveryCodesState = {
  /** Codes from the last authenticator confirmation, until the owner saves them. */
  codes: string[] | null;
  set: (codes: string[]) => void;
  clear: () => void;
};

// Deliberately not persisted: recovery codes exist only in memory and are
// shown once. Kept in a store (not component state) so they survive the
// re-render that happens when the user flips to "authenticator enabled".
export const useRecoveryCodesStore = create<RecoveryCodesState>()((set) => ({
  codes: null,
  set: (codes) => set({ codes }),
  clear: () => set({ codes: null }),
}));
