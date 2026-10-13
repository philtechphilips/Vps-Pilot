import { create } from "zustand";
import type { AuthResponse, User } from "@/lib/api/types";

type Status = "unknown" | "authenticated" | "anonymous";

type AuthState = {
  /** Short-lived access token. Kept in memory only; the httpOnly refresh cookie restores it. */
  accessToken: string | null;
  user: User | null;
  status: Status;
  setSession: (auth: AuthResponse) => void;
  setUser: (user: User) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  user: null,
  status: "unknown",
  setSession: (auth) => set({ accessToken: auth.access_token, user: auth.user, status: "authenticated" }),
  setUser: (user) => set({ user }),
  clear: () => set({ accessToken: null, user: null, status: "anonymous" }),
}));

/** First name for greetings, falling back to the email's local part. */
export function displayName(user: User | null) {
  if (!user) return "there";
  return user.name?.split(" ")[0] || user.email.split("@")[0];
}
