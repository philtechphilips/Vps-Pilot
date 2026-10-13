import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Challenge } from "@/lib/api/types";

type ChallengeState = {
  /** The pending emailed-code challenge for login or setup. */
  challenge: Challenge | null;
  /** When the code was (re)sent, to drive the resend countdown. */
  sentAt: number | null;
  setChallenge: (challenge: Challenge) => void;
  reset: () => void;
};

// Persisted to sessionStorage so a reload on the code step doesn't lose the
// challenge. It holds no secret: the code itself only exists in the email.
export const useChallengeStore = create<ChallengeState>()(
  persist(
    (set) => ({
      challenge: null,
      sentAt: null,
      setChallenge: (challenge) => set({ challenge, sentAt: Date.now() }),
      reset: () => set({ challenge: null, sentAt: null }),
    }),
    {
      name: "vpspilot-challenge",
      storage: createJSONStorage(() => sessionStorage),
      // Rehydrated from an effect on the auth pages, so the server render and
      // the first client render agree (no hydration mismatch).
      skipHydration: true,
    },
  ),
);
