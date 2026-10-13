import { useAuthStore } from "@/lib/stores/auth-store";
import type { AuthResponse } from "@/lib/api/types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfter: number | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type FastApiDetail = string | { msg: string; loc?: (string | number)[] }[];

async function toError(response: Response): Promise<ApiError> {
  let message = response.status >= 500 ? "Something went wrong. Try again." : "Request failed";
  try {
    const body = (await response.json()) as { detail?: FastApiDetail };
    if (typeof body.detail === "string") message = body.detail;
    else if (Array.isArray(body.detail) && body.detail[0]) {
      // Pydantic validation error: "Value error, ..." -> readable sentence.
      const first = body.detail[0];
      const field = first.loc?.at(-1);
      message = `${field ? `${String(field)}: ` : ""}${first.msg.replace(/^Value error, /, "")}`;
    }
  } catch {
    // Non-JSON body (e.g. the API is down behind the proxy).
    if (response.status === 500 || response.status === 502 || response.status === 504) {
      message = "Can't reach the VPSPilot API. Is it running?";
    }
  }
  const retry = response.headers.get("retry-after");
  return new ApiError(response.status, message, retry ? Number(retry) : null);
}

let refreshing: Promise<AuthResponse | null> | null = null;

/**
 * Exchange the httpOnly refresh cookie for a new access token.
 * Concurrent callers share one request, since the cookie rotates on use.
 */
export function refreshSession(): Promise<AuthResponse | null> {
  refreshing ??= (async () => {
    try {
      const response = await fetch("/api/v1/auth/refresh", { method: "POST", credentials: "same-origin" });
      if (!response.ok) {
        useAuthStore.getState().clear();
        return null;
      }
      const auth = (await response.json()) as AuthResponse;
      useAuthStore.getState().setSession(auth);
      return auth;
    } catch {
      useAuthStore.getState().clear();
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

type Options = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Send the access token and retry once after refreshing on 401. */
  auth?: boolean;
};

export async function api<T>(path: string, { method = "GET", body, auth = false }: Options = {}): Promise<T> {
  const send = () => {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const token = useAuthStore.getState().accessToken;
    if (auth && token) headers.Authorization = `Bearer ${token}`;
    return fetch(`/api/v1${path}`, {
      method,
      headers,
      credentials: "same-origin",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  };

  let response = await send();
  if (auth && response.status === 401 && (await refreshSession())) {
    response = await send();
  }
  if (!response.ok) throw await toError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

declare module "@tanstack/react-query" {
  // Every query/mutation in the app fails with an ApiError.
  interface Register {
    defaultError: ApiError;
  }
}
