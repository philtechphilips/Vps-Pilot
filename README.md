# VPSPilot Dashboard

The web UI for VPSPilot: a marketing site and the control-plane dashboard
(servers, applications, deployments, databases, domains, monitoring, logs,
backups, audit and settings). Next.js 16, React 19, Tailwind CSS 4.

## Running it

```bash
npm install
npm run dev            # http://localhost:3000
```

The dashboard needs the API ([VPSPilot API](https://github.com/philtechphilips/VPS-PIlot-BE))
running on `http://localhost:8000`. Requests to `/api/*` are proxied there by
a rewrite in `next.config.ts`, so the refresh cookie is first-party and no
CORS setup is needed. Point it elsewhere with `API_URL`:

```bash
API_URL=https://pilot.example.com npm run dev
```

First run: open `/setup` to create the owner account. A code is emailed to
verify the address.

## Auth on the client

- **React Query** (`lib/api/auth.ts`) wraps every auth endpoint: setup status,
  setup, login, code verify/resend, logout, password reset and sessions.
- **Zustand** holds client state:
  - `lib/stores/auth-store.ts`: the access token (memory only) and user.
  - `lib/stores/challenge-store.ts`: the pending emailed-code challenge,
    kept in `sessionStorage` so a reload on the code step doesn't lose it.
- `lib/api/client.ts` adds the bearer token, and on a 401 refreshes once via
  the httpOnly cookie (one shared request, since the cookie rotates) before
  retrying.
- `components/auth/auth-gate.tsx` protects `/dashboard`: it restores the
  session from the cookie, or sends the visitor to `/login?next=…`.

## Layout

```
app/
├── (marketing)/      # landing page
├── (auth)/           # login, setup, forgot/reset password
└── dashboard/        # the control-plane UI (mock data except auth)
components/
├── auth/             # code step, auth gate, sessions card
├── dashboard/        # shell, navigation, cards
└── marketing/        # header, footer, illustrations, product tour
lib/
├── api/              # fetch client, React Query hooks, API types
├── stores/           # Zustand stores
└── data.ts           # mock data for dashboard pages not yet on the API
```
