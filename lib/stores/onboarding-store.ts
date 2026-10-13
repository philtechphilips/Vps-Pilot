import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type OnboardingState = {
  /** Second factor picked in the wizard. "totp" is confirmed server-side; "email" is just a choice. */
  twoFactorChoice: "totp" | "email" | null;
  /** Install the agent on the control-plane host. */
  selfManage: boolean;
  /** Recovery codes were shown and the owner confirmed saving them. */
  savedRecoveryCodes: boolean;
  chooseTwoFactor: (choice: "totp" | "email" | null) => void;
  setSelfManage: (value: boolean) => void;
  confirmSavedCodes: () => void;
  reset: () => void;
};

const initial = { twoFactorChoice: null, selfManage: true, savedRecoveryCodes: false } as const;

// Wizard choices survive a reload (sessionStorage). Nothing secret is stored:
// recovery codes themselves are only ever held in memory.
export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initial,
      chooseTwoFactor: (twoFactorChoice) => set({ twoFactorChoice }),
      setSelfManage: (selfManage) => set({ selfManage }),
      confirmSavedCodes: () => set({ savedRecoveryCodes: true }),
      reset: () => set({ ...initial }),
    }),
    {
      name: "vpspilot-onboarding",
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
    },
  ),
);
