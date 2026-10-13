// Shapes returned by the VPSPilot API (/api/v1/auth, /api/v1/users).

export type User = {
  id: number;
  email: string;
  name: string | null;
  role: "user" | "admin";
  two_factor_enabled: boolean;
  two_factor_method: "email" | "totp" | null;
  totp_enabled: boolean;
  email_verified: boolean;
  onboarding_completed: boolean;
  created_at: string;
};

export type Challenge = {
  status: "two_factor_required";
  challenge_id: string;
  purpose: "login" | "setup";
  /** "email": we sent a code. "totp": the authenticator app (or a recovery code). */
  method: "email" | "totp";
  email_hint: string;
  expires_in: number;
  resend_in: number;
};

export type AuthResponse = {
  status: "authenticated";
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  user: User;
};

export type LoginResult = Challenge | AuthResponse;

export type SessionInfo = {
  id: string;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
  last_used_at: string;
  current: boolean;
};

export type Message = { message: string };

export type TotpSetup = { secret: string; otpauth_uri: string; qr_svg: string };

export type TwoFactorStatus = {
  method: "email" | "totp" | null;
  totp_enabled: boolean;
  recovery_codes_remaining: number;
};
