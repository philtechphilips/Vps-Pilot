// Mock data for the UI. Shapes follow the PRD data model (§10) so they can be
// swapped for /api/v1 responses later.

import type { Brand } from "@/components/brand-chip";
import type { Tone } from "@/components/ui";
import { series } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Servers                                                             */
/* ------------------------------------------------------------------ */

export type ServerStatus = "online" | "degraded" | "offline" | "enrolling";

export type Server = {
  id: string;
  name: string;
  hostname: string;
  ip: string;
  provider: string;
  region: string;
  os: "Ubuntu" | "Debian";
  osVersion: string;
  arch: "x86_64" | "arm64";
  vcpu: number;
  memoryGb: number;
  diskGb: number;
  status: ServerStatus;
  agentVersion: string;
  heartbeat: string;
  uptime: string;
  cpu: number;
  memory: number;
  disk: number;
  swap: number;
  inodes: number;
  netIn: string;
  netOut: string;
  load: [number, number, number];
  controlPlane?: boolean;
  /** [latitude, longitude] of the provider region, for the fleet map. */
  coords: [number, number];
  fingerprint: string;
  enrolledAt: string;
  tags: string[];
};

export const servers: Server[] = [
  {
    id: "pilot-control",
    name: "pilot-control",
    hostname: "pilot-control.fsn1",
    ip: "49.12.188.21",
    provider: "Hetzner",
    region: "Falkenstein",
    os: "Ubuntu",
    osVersion: "24.04 LTS",
    arch: "x86_64",
    vcpu: 4,
    memoryGb: 8,
    diskGb: 160,
    status: "online",
    agentVersion: "0.4.2",
    heartbeat: "3s ago",
    uptime: "41d 6h",
    cpu: 18,
    memory: 54,
    disk: 38,
    swap: 2,
    inodes: 11,
    netIn: "1.2 MB/s",
    netOut: "640 KB/s",
    load: [0.42, 0.51, 0.48],
    controlPlane: true,
    coords: [50.48, 12.37],
    fingerprint: "SHA256:k3Zp…9fQa",
    enrolledAt: "Aug 31, 2026",
    tags: ["control-plane"],
  },
  {
    id: "web-prod-01",
    name: "web-prod-01",
    hostname: "web-prod-01.ams3",
    ip: "167.99.42.118",
    provider: "DigitalOcean",
    region: "Amsterdam",
    os: "Ubuntu",
    osVersion: "22.04 LTS",
    arch: "x86_64",
    vcpu: 4,
    memoryGb: 8,
    diskGb: 160,
    status: "online",
    agentVersion: "0.4.2",
    heartbeat: "5s ago",
    uptime: "18d 2h",
    cpu: 64,
    memory: 72,
    disk: 51,
    swap: 6,
    inodes: 19,
    netIn: "8.4 MB/s",
    netOut: "21.7 MB/s",
    load: [2.61, 2.34, 2.12],
    coords: [52.37, 4.9],
    fingerprint: "SHA256:Qm8v…2LxR",
    enrolledAt: "Sep 2, 2026",
    tags: ["production", "web"],
  },
  {
    id: "web-prod-02",
    name: "web-prod-02",
    hostname: "web-prod-02.ams3",
    ip: "167.99.51.7",
    provider: "DigitalOcean",
    region: "Amsterdam",
    os: "Ubuntu",
    osVersion: "22.04 LTS",
    arch: "x86_64",
    vcpu: 2,
    memoryGb: 4,
    diskGb: 80,
    status: "online",
    agentVersion: "0.4.2",
    heartbeat: "2s ago",
    uptime: "18d 2h",
    cpu: 37,
    memory: 61,
    disk: 44,
    swap: 0,
    inodes: 14,
    netIn: "3.1 MB/s",
    netOut: "6.9 MB/s",
    load: [0.88, 0.92, 1.01],
    coords: [52.37, 4.9],
    fingerprint: "SHA256:7tWd…eP0c",
    enrolledAt: "Sep 2, 2026",
    tags: ["production", "web"],
  },
  {
    id: "db-primary",
    name: "db-primary",
    hostname: "db-primary.fsn1",
    ip: "10.0.0.12",
    provider: "Hetzner",
    region: "Falkenstein",
    os: "Debian",
    osVersion: "12 (bookworm)",
    arch: "x86_64",
    vcpu: 8,
    memoryGb: 32,
    diskGb: 480,
    status: "degraded",
    agentVersion: "0.4.2",
    heartbeat: "4s ago",
    uptime: "63d 11h",
    cpu: 41,
    memory: 88,
    disk: 67,
    swap: 21,
    inodes: 9,
    netIn: "14.2 MB/s",
    netOut: "11.8 MB/s",
    load: [3.12, 3.4, 3.05],
    coords: [50.48, 12.37],
    fingerprint: "SHA256:Hx2n…Ub7s",
    enrolledAt: "Aug 31, 2026",
    tags: ["production", "database"],
  },
  {
    id: "edge-jnb-01",
    name: "edge-jnb-01",
    hostname: "edge-jnb-01.vultr",
    ip: "139.84.226.40",
    provider: "Vultr",
    region: "Johannesburg",
    os: "Debian",
    osVersion: "12 (bookworm)",
    arch: "arm64",
    vcpu: 2,
    memoryGb: 4,
    diskGb: 55,
    status: "online",
    agentVersion: "0.4.1",
    heartbeat: "6s ago",
    uptime: "9d 19h",
    cpu: 12,
    memory: 39,
    disk: 22,
    swap: 0,
    inodes: 6,
    netIn: "820 KB/s",
    netOut: "1.9 MB/s",
    load: [0.21, 0.24, 0.19],
    coords: [-26.2, 28.05],
    fingerprint: "SHA256:aP4r…Kk1z",
    enrolledAt: "Oct 3, 2026",
    tags: ["edge"],
  },
  {
    id: "staging-01",
    name: "staging-01",
    hostname: "staging-01.fsn1",
    ip: "49.12.201.95",
    provider: "Hetzner",
    region: "Falkenstein",
    os: "Ubuntu",
    osVersion: "24.04 LTS",
    arch: "x86_64",
    vcpu: 2,
    memoryGb: 4,
    diskGb: 80,
    status: "offline",
    agentVersion: "0.3.9",
    heartbeat: "18m ago",
    uptime: "—",
    cpu: 0,
    memory: 0,
    disk: 71,
    swap: 0,
    inodes: 0,
    netIn: "—",
    netOut: "—",
    load: [0, 0, 0],
    coords: [50.48, 12.37],
    fingerprint: "SHA256:Lr0e…3Vtm",
    enrolledAt: "Sep 14, 2026",
    tags: ["staging"],
  },
];

export const serverTone: Record<ServerStatus, Tone> = {
  online: "ok",
  degraded: "warn",
  offline: "err",
  enrolling: "blue",
};

export function getServer(id: string) {
  return servers.find((s) => s.id === id);
}

/** 60 points of history at 1m resolution. */
export function serverHistory(id: string) {
  const s = getServer(id);
  const seed = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const off = s?.status === "offline";
  return {
    cpu: off ? series(seed, 60, 30, 10).map((v, i) => (i > 41 ? 0 : v)) : series(seed, 60, s?.cpu ?? 30, 14),
    memory: off ? series(seed + 1, 60, 48, 3).map((v, i) => (i > 41 ? 0 : v)) : series(seed + 1, 60, s?.memory ?? 50, 4),
    disk: series(seed + 2, 60, s?.disk ?? 40, 0.6),
    netIn: series(seed + 3, 60, 22, 18, 0, 100),
    netOut: series(seed + 4, 60, 34, 22, 0, 100),
  };
}

export const timeLabels = Array.from({ length: 60 }, (_, i) => {
  const m = 14 * 60 + 2 + i - 59;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(((m % 60) + 60) % 60).padStart(2, "0")}`;
});

export type Service = { name: string; kind: "systemd" | "container"; status: "running" | "exited" | "restarting" | "failed"; cpu: string; memory: string; uptime: string; image?: string };

export const services: Record<string, Service[]> = {
  "pilot-control": [
    { name: "vpspilot-api", kind: "container", image: "vpspilot/api:1.1.0", status: "running", cpu: "3.1%", memory: "212 MB", uptime: "6d" },
    { name: "vpspilot-dashboard", kind: "container", image: "vpspilot/dashboard:1.1.0", status: "running", cpu: "0.8%", memory: "148 MB", uptime: "6d" },
    { name: "vpspilot-worker", kind: "container", image: "vpspilot/worker:1.1.0", status: "running", cpu: "1.4%", memory: "176 MB", uptime: "6d" },
    { name: "postgres", kind: "container", image: "postgres:16.4-alpine", status: "running", cpu: "0.9%", memory: "301 MB", uptime: "41d" },
    { name: "redis", kind: "systemd", status: "running", cpu: "0.2%", memory: "38 MB", uptime: "41d" },
    { name: "caddy", kind: "systemd", status: "running", cpu: "0.1%", memory: "29 MB", uptime: "41d" },
    { name: "vpspilot-agent", kind: "systemd", status: "running", cpu: "0.3%", memory: "24 MB", uptime: "6d" },
  ],
  "web-prod-01": [
    { name: "storefront-web", kind: "container", image: "storefront:4c1e9a2", status: "running", cpu: "22.4%", memory: "1.1 GB", uptime: "12m" },
    { name: "worker-queue", kind: "container", image: "worker-queue:91ab0f3", status: "running", cpu: "8.2%", memory: "640 MB", uptime: "2d" },
    { name: "redis-cache", kind: "container", image: "redis:7.4-alpine", status: "running", cpu: "2.0%", memory: "412 MB", uptime: "18d" },
    { name: "mariadb-wp", kind: "container", image: "mariadb:11.4", status: "running", cpu: "4.6%", memory: "820 MB", uptime: "18d" },
    { name: "nginx", kind: "systemd", status: "running", cpu: "1.2%", memory: "64 MB", uptime: "18d" },
    { name: "vpspilot-agent", kind: "systemd", status: "running", cpu: "0.4%", memory: "26 MB", uptime: "18d" },
  ],
  "web-prod-02": [
    { name: "api-gateway", kind: "systemd", status: "running", cpu: "14.9%", memory: "380 MB", uptime: "3h" },
    { name: "marketing-site", kind: "systemd", status: "running", cpu: "1.1%", memory: "122 MB", uptime: "5d" },
    { name: "mysql-legacy", kind: "container", image: "mysql:8.0.39", status: "running", cpu: "6.3%", memory: "1.4 GB", uptime: "18d" },
    { name: "nginx", kind: "systemd", status: "running", cpu: "0.9%", memory: "58 MB", uptime: "18d" },
    { name: "vpspilot-agent", kind: "systemd", status: "running", cpu: "0.3%", memory: "25 MB", uptime: "18d" },
  ],
  "db-primary": [
    { name: "postgresql@16-main", kind: "systemd", status: "running", cpu: "31.0%", memory: "24.6 GB", uptime: "63d" },
    { name: "pgbouncer", kind: "systemd", status: "running", cpu: "1.8%", memory: "44 MB", uptime: "63d" },
    { name: "wal-g-backup.timer", kind: "systemd", status: "running", cpu: "0.0%", memory: "—", uptime: "63d" },
    { name: "vpspilot-agent", kind: "systemd", status: "running", cpu: "0.4%", memory: "27 MB", uptime: "9d" },
  ],
  "edge-jnb-01": [
    { name: "metabase", kind: "container", image: "metabase/metabase:v0.50.21", status: "restarting", cpu: "0.0%", memory: "0 MB", uptime: "—" },
    { name: "caddy", kind: "systemd", status: "running", cpu: "0.4%", memory: "31 MB", uptime: "9d" },
    { name: "vpspilot-agent", kind: "systemd", status: "running", cpu: "0.2%", memory: "22 MB", uptime: "9d" },
  ],
  "staging-01": [
    { name: "storefront-web", kind: "container", image: "storefront:e7d0c4b", status: "exited", cpu: "—", memory: "—", uptime: "—" },
    { name: "vpspilot-agent", kind: "systemd", status: "failed", cpu: "—", memory: "—", uptime: "—" },
  ],
};

/* ------------------------------------------------------------------ */
/* Applications & deployments                                          */
/* ------------------------------------------------------------------ */

export type DeployStatus = "ready" | "error" | "building" | "queued" | "canceled" | "rolled-back";

export const deployTone: Record<DeployStatus, Tone> = {
  ready: "ok",
  error: "err",
  building: "warn",
  queued: "neutral",
  canceled: "neutral",
  "rolled-back": "violet",
};

export const deployLabel: Record<DeployStatus, string> = {
  ready: "Ready",
  error: "Error",
  building: "Building",
  queued: "Queued",
  canceled: "Canceled",
  "rolled-back": "Rolled back",
};

export type App = {
  id: string;
  name: string;
  framework: Brand;
  runtime: "Docker" | "systemd" | "PM2";
  repo: string;
  branch: string;
  commit: string;
  commitMessage: string;
  serverId: string;
  status: DeployStatus;
  domains: string[];
  updated: string;
  port: number;
  healthCheck: string;
  limits: { cpu: string; memory: string };
  requests: number[];
};

export const apps: App[] = [
  {
    id: "storefront",
    name: "storefront",
    framework: "Next.js",
    runtime: "Docker",
    repo: "acme/storefront",
    branch: "main",
    commit: "4c1e9a2",
    commitMessage: "feat(checkout): add saved payment methods",
    serverId: "web-prod-01",
    status: "ready",
    domains: ["shop.example.com", "www.shop.example.com"],
    updated: "12m ago",
    port: 3000,
    healthCheck: "GET /api/health → 200 within 5s",
    limits: { cpu: "2 vCPU", memory: "1.5 GB" },
    requests: series(11, 30, 55, 20),
  },
  {
    id: "api-gateway",
    name: "api-gateway",
    framework: "FastAPI",
    runtime: "systemd",
    repo: "acme/api-gateway",
    branch: "main",
    commit: "b72d1e0",
    commitMessage: "fix: raise pool size for /orders under load",
    serverId: "web-prod-02",
    status: "ready",
    domains: ["api.example.com"],
    updated: "3h ago",
    port: 8000,
    healthCheck: "GET /healthz → 200 within 3s",
    limits: { cpu: "1 vCPU", memory: "768 MB" },
    requests: series(12, 30, 70, 18),
  },
  {
    id: "worker-queue",
    name: "worker-queue",
    framework: "Python",
    runtime: "Docker",
    repo: "acme/worker-queue",
    branch: "main",
    commit: "91ab0f3",
    commitMessage: "chore: bump celery to 5.4.0",
    serverId: "web-prod-01",
    status: "building",
    domains: [],
    updated: "Just now",
    port: 0,
    healthCheck: "celery inspect ping",
    limits: { cpu: "1 vCPU", memory: "1 GB" },
    requests: series(13, 30, 30, 15),
  },
  {
    id: "marketing-site",
    name: "marketing-site",
    framework: "Node.js",
    runtime: "PM2",
    repo: "acme/marketing",
    branch: "main",
    commit: "0e44c19",
    commitMessage: "content: october pricing update",
    serverId: "web-prod-02",
    status: "ready",
    domains: ["example.com", "www.example.com"],
    updated: "5d ago",
    port: 4000,
    healthCheck: "GET / → 200 within 5s",
    limits: { cpu: "0.5 vCPU", memory: "512 MB" },
    requests: series(14, 30, 40, 22),
  },
  {
    id: "metabase",
    name: "metabase",
    framework: "Docker",
    runtime: "Docker",
    repo: "metabase/metabase:v0.50.21",
    branch: "image",
    commit: "v0.50.21",
    commitMessage: "Pinned image digest sha256:9a1f…c03e",
    serverId: "edge-jnb-01",
    status: "error",
    domains: ["bi.example.com"],
    updated: "26m ago",
    port: 3000,
    healthCheck: "GET /api/health → 200 within 10s",
    limits: { cpu: "1 vCPU", memory: "2 GB" },
    requests: series(15, 30, 10, 8),
  },
  {
    id: "auth-service",
    name: "auth-service",
    framework: "Go",
    runtime: "Docker",
    repo: "acme/auth-service",
    branch: "release/2.3",
    commit: "5fa8d11",
    commitMessage: "feat: rotate signing keys every 30 days",
    serverId: "web-prod-02",
    status: "ready",
    domains: ["auth.example.com"],
    updated: "2d ago",
    port: 8080,
    healthCheck: "GET /ready → 200 within 2s",
    limits: { cpu: "0.5 vCPU", memory: "256 MB" },
    requests: series(16, 30, 45, 12),
  },
];

export function getApp(id: string) {
  return apps.find((a) => a.id === id);
}

export type Deployment = {
  id: string;
  appId: string;
  env: "Production" | "Staging";
  status: DeployStatus;
  branch: string;
  commit: string;
  message: string;
  author: string;
  created: string;
  duration: string;
  serverId: string;
  current?: boolean;
  trigger: "git push" | "manual" | "rollback";
};

export const deployments: Deployment[] = [
  { id: "dpl_7Hq2kPz9", appId: "worker-queue", env: "Production", status: "building", branch: "main", commit: "91ab0f3", message: "chore: bump celery to 5.4.0", author: "pelumi", created: "Just now", duration: "48s", serverId: "web-prod-01", trigger: "git push" },
  { id: "dpl_4xLm0aQe", appId: "storefront", env: "Production", status: "ready", branch: "main", commit: "4c1e9a2", message: "feat(checkout): add saved payment methods", author: "pelumi", created: "12m ago", duration: "1m 54s", serverId: "web-prod-01", current: true, trigger: "git push" },
  { id: "dpl_9TnB3sWc", appId: "metabase", env: "Production", status: "error", branch: "image", commit: "v0.50.21", message: "Health check failed: GET /api/health timed out after 10s", author: "pelumi", created: "26m ago", duration: "2m 31s", serverId: "edge-jnb-01", trigger: "manual" },
  { id: "dpl_2pVx8eRt", appId: "storefront", env: "Staging", status: "canceled", branch: "feat/reviews", commit: "e7d0c4b", message: "wip: product reviews carousel", author: "pelumi", created: "1h ago", duration: "22s", serverId: "staging-01", trigger: "git push" },
  { id: "dpl_6Ky1uFgH", appId: "api-gateway", env: "Production", status: "ready", branch: "main", commit: "b72d1e0", message: "fix: raise pool size for /orders under load", author: "pelumi", created: "3h ago", duration: "41s", serverId: "web-prod-02", current: true, trigger: "git push" },
  { id: "dpl_3Rz5wNbJ", appId: "api-gateway", env: "Production", status: "rolled-back", branch: "main", commit: "a91c3f7", message: "feat: experimental streaming responses", author: "pelumi", created: "4h ago", duration: "39s", serverId: "web-prod-02", trigger: "git push" },
  { id: "dpl_8Mf4tLqA", appId: "auth-service", env: "Production", status: "ready", branch: "release/2.3", commit: "5fa8d11", message: "feat: rotate signing keys every 30 days", author: "pelumi", created: "2d ago", duration: "1m 12s", serverId: "web-prod-02", current: true, trigger: "git push" },
  { id: "dpl_1Gd7yXcV", appId: "storefront", env: "Production", status: "ready", branch: "main", commit: "d3b81f6", message: "perf: cache category pages for 60s", author: "pelumi", created: "2d ago", duration: "2m 03s", serverId: "web-prod-01", trigger: "git push" },
  { id: "dpl_5Ws9oPkE", appId: "metabase", env: "Production", status: "ready", branch: "image", commit: "v0.50.20", message: "Pinned image digest sha256:2be0…71d4", author: "pelumi", created: "4d ago", duration: "1m 47s", serverId: "edge-jnb-01", current: true, trigger: "manual" },
  { id: "dpl_0Qa2hZuY", appId: "marketing-site", env: "Production", status: "ready", branch: "main", commit: "0e44c19", message: "content: october pricing update", author: "pelumi", created: "5d ago", duration: "36s", serverId: "web-prod-02", current: true, trigger: "git push" },
  { id: "dpl_7Bx3jTnM", appId: "worker-queue", env: "Production", status: "ready", branch: "main", commit: "c40e7a9", message: "feat: retry webhooks with exponential backoff", author: "pelumi", created: "6d ago", duration: "1m 08s", serverId: "web-prod-01", current: true, trigger: "git push" },
  { id: "dpl_4Ec8vRsQ", appId: "storefront", env: "Production", status: "error", branch: "main", commit: "77fa20e", message: "Build failed: next build exited with code 1", author: "pelumi", created: "1w ago", duration: "58s", serverId: "web-prod-01", trigger: "git push" },
];

export function getDeployment(id: string) {
  return deployments.find((d) => d.id === id);
}

export const buildLog: { t: string; text: string; level?: "info" | "warn" | "err" | "ok" | "muted" }[] = [
  { t: "14:01:02.114", text: "Job dpl_4xLm0aQe claimed by agent web-prod-01 (0.4.2)", level: "muted" },
  { t: "14:01:02.380", text: "Cloning github.com/acme/storefront (Branch: main, Commit: 4c1e9a2)" },
  { t: "14:01:03.902", text: "Cloning completed: 1.521s" },
  { t: "14:01:04.011", text: "Build sandbox: rootless BuildKit · 2 vCPU · 3 GB · timeout 15m", level: "muted" },
  { t: "14:01:04.230", text: "#1 [internal] load build definition from Dockerfile" },
  { t: "14:01:04.611", text: "#2 [deps 1/3] FROM node:22-alpine@sha256:6e80…a3b1" },
  { t: "14:01:05.018", text: "#5 [deps 3/3] RUN npm ci --omit=dev" },
  { t: "14:01:21.744", text: "added 412 packages in 16s" },
  { t: "14:01:22.090", text: "#7 [builder 4/4] RUN npm run build" },
  { t: "14:01:23.501", text: "   ▲ Next.js 16.4.0" },
  { t: "14:01:23.502", text: "   Creating an optimized production build ..." },
  { t: "14:02:31.877", text: " ✓ Compiled successfully in 67s", level: "ok" },
  { t: "14:02:33.104", text: " ⚠ 2 images are missing width/height attributes", level: "warn" },
  { t: "14:02:41.665", text: " ✓ Generating static pages (128/128)", level: "ok" },
  { t: "14:02:44.230", text: "#9 exporting to image sha256:4f9c…d21e (182 MB)" },
  { t: "14:02:46.012", text: "Starting candidate container storefront-web-4c1e9a2 on :3001", level: "muted" },
  { t: "14:02:49.448", text: "Health check GET /api/health → 200 OK (312ms) [1/3]" },
  { t: "14:02:51.452", text: "Health check GET /api/health → 200 OK (98ms) [2/3]" },
  { t: "14:02:53.455", text: "Health check GET /api/health → 200 OK (91ms) [3/3]", level: "ok" },
  { t: "14:02:53.902", text: "nginx -t: configuration file /etc/nginx/nginx.conf test is successful" },
  { t: "14:02:54.118", text: "Promoted 4c1e9a2 → production. Previous release d3b81f6 kept as rollback target.", level: "ok" },
  { t: "14:02:56.001", text: "Deployment completed in 1m 54s", level: "ok" },
];

export const failedLog: typeof buildLog = [
  { t: "13:36:10.021", text: "Job dpl_9TnB3sWc claimed by agent edge-jnb-01 (0.4.1)", level: "muted" },
  { t: "13:36:10.300", text: "Pulling metabase/metabase:v0.50.21 (pinned digest sha256:9a1f…c03e)" },
  { t: "13:37:42.811", text: "Pulled 512 MB in 92.5s" },
  { t: "13:37:43.002", text: "Starting candidate container metabase-v0.50.21 on :3001", level: "muted" },
  { t: "13:37:53.010", text: "Health check GET /api/health → timeout after 10s [1/3]", level: "warn" },
  { t: "13:38:03.015", text: "Health check GET /api/health → timeout after 10s [2/3]", level: "warn" },
  { t: "13:38:13.019", text: "Health check GET /api/health → timeout after 10s [3/3]", level: "err" },
  { t: "13:38:13.220", text: "container logs (last 3 lines, redacted):", level: "muted" },
  { t: "13:38:13.221", text: "  WARN metabase.db.setup :: Running Database Migrations… (this may take a while)" },
  { t: "13:38:13.221", text: "  ERROR java.lang.OutOfMemoryError: Java heap space", level: "err" },
  { t: "13:38:13.400", text: "Candidate removed. Production traffic still served by v0.50.20 (dpl_5Ws9oPkE).", level: "ok" },
  { t: "13:38:13.512", text: "Deployment failed: health check did not pass. No changes promoted.", level: "err" },
];

/* ------------------------------------------------------------------ */
/* Databases                                                           */
/* ------------------------------------------------------------------ */

export type Engine = "PostgreSQL" | "MySQL" | "MariaDB" | "Redis";
export type DbStatus = "healthy" | "degraded" | "unreachable";

export type DatabaseInstance = {
  id: string;
  name: string;
  engine: Engine;
  version: string;
  mode: "Local" | "Docker" | "Remote";
  serverId: string | null;
  endpoint: string;
  env: "production" | "staging" | "internal";
  status: DbStatus;
  lastCheck: string;
  size: string;
  connections: [number, number];
  tls: boolean;
  credential: string;
  rotated: string;
  metrics: { label: string; value: string; sub?: string }[];
};

export const dbTone: Record<DbStatus, Tone> = { healthy: "ok", degraded: "warn", unreachable: "err" };

export const databases: DatabaseInstance[] = [
  {
    id: "pg-main",
    name: "pg-main",
    engine: "PostgreSQL",
    version: "16.4",
    mode: "Local",
    serverId: "db-primary",
    endpoint: "127.0.0.1:5432",
    env: "production",
    status: "healthy",
    lastCheck: "12s ago",
    size: "18.4 GB",
    connections: [42, 200],
    tls: true,
    credential: "vpspilot_monitor",
    rotated: "12 days ago",
    metrics: [
      { label: "Cache hit ratio", value: "99.2%", sub: "shared_buffers 8 GB" },
      { label: "Transactions/s", value: "1,284", sub: "commit 99.7%" },
      { label: "Replication lag", value: "0.4s", sub: "1 streaming replica" },
      { label: "Longest query", value: "2.1s", sub: "pid 48122 · storefront" },
    ],
  },
  {
    id: "mysql-legacy",
    name: "mysql-legacy",
    engine: "MySQL",
    version: "8.0.39",
    mode: "Docker",
    serverId: "web-prod-02",
    endpoint: "container:mysql-legacy:3306",
    env: "production",
    status: "healthy",
    lastCheck: "9s ago",
    size: "6.1 GB",
    connections: [18, 151],
    tls: true,
    credential: "vpspilot_monitor",
    rotated: "30 days ago",
    metrics: [
      { label: "InnoDB buffer hit", value: "98.7%", sub: "pool 1 GB" },
      { label: "Queries/s", value: "412", sub: "slow 0.02/s" },
      { label: "Row lock waits", value: "3", sub: "last 5m" },
      { label: "Threads running", value: "4", sub: "of 18 connected" },
    ],
  },
  {
    id: "mariadb-wp",
    name: "mariadb-wp",
    engine: "MariaDB",
    version: "11.4.3",
    mode: "Docker",
    serverId: "web-prod-01",
    endpoint: "container:mariadb-wp:3306",
    env: "production",
    status: "degraded",
    lastCheck: "14s ago",
    size: "2.7 GB",
    connections: [96, 100],
    tls: false,
    credential: "vpspilot_monitor",
    rotated: "45 days ago",
    metrics: [
      { label: "InnoDB buffer hit", value: "91.3%", sub: "pool 256 MB" },
      { label: "Queries/s", value: "188", sub: "slow 1.4/s" },
      { label: "Connections", value: "96 / 100", sub: "near max_connections" },
      { label: "Aborted clients", value: "27", sub: "last 1h" },
    ],
  },
  {
    id: "redis-cache",
    name: "redis-cache",
    engine: "Redis",
    version: "7.4.1",
    mode: "Docker",
    serverId: "web-prod-01",
    endpoint: "container:redis-cache:6379",
    env: "production",
    status: "healthy",
    lastCheck: "4s ago",
    size: "412 MB",
    connections: [37, 10000],
    tls: false,
    credential: "acl:vpspilot-ro",
    rotated: "8 days ago",
    metrics: [
      { label: "Memory", value: "412 MB", sub: "maxmemory 1 GB · allkeys-lru" },
      { label: "Ops/s", value: "8,912", sub: "hit ratio 94.6%" },
      { label: "Keys", value: "184,201", sub: "db0 · 61% with TTL" },
      { label: "Persistence", value: "RDB", sub: "last save 6m ago · OK" },
    ],
  },
  {
    id: "redis-queue",
    name: "redis-queue",
    engine: "Redis",
    version: "7.2.5",
    mode: "Local",
    serverId: "pilot-control",
    endpoint: "unix:/run/redis/redis.sock",
    env: "internal",
    status: "healthy",
    lastCheck: "2s ago",
    size: "38 MB",
    connections: [9, 10000],
    tls: false,
    credential: "acl:vpspilot-ro",
    rotated: "8 days ago",
    metrics: [
      { label: "Memory", value: "38 MB", sub: "maxmemory 256 MB · noeviction" },
      { label: "Ops/s", value: "142", sub: "hit ratio 99.1%" },
      { label: "Keys", value: "1,204", sub: "db0, db1" },
      { label: "Persistence", value: "AOF", sub: "everysec · rewrite OK" },
    ],
  },
  {
    id: "pg-analytics",
    name: "pg-analytics",
    engine: "PostgreSQL",
    version: "15.8",
    mode: "Remote",
    serverId: null,
    endpoint: "analytics.db.example.net:5432",
    env: "production",
    status: "unreachable",
    lastCheck: "3m ago",
    size: "—",
    connections: [0, 100],
    tls: true,
    credential: "vpspilot_readonly",
    rotated: "60 days ago",
    metrics: [
      { label: "Cache hit ratio", value: "—" },
      { label: "Transactions/s", value: "—" },
      { label: "Replication lag", value: "—" },
      { label: "Last error", value: "TLS", sub: "certificate expired 2026-10-12" },
    ],
  },
];

export function getDatabase(id: string) {
  return databases.find((d) => d.id === id);
}

export const dbTree = {
  sql: [
    {
      name: "storefront",
      schemas: [
        { name: "public", tables: ["orders", "order_items", "customers", "products", "categories", "inventory_movements"] },
        { name: "billing", tables: ["invoices", "payment_methods", "refunds"] },
        { name: "auth", tables: ["sessions", "users"] },
      ],
    },
    { name: "analytics_staging", schemas: [{ name: "public", tables: ["events", "daily_rollups"] }] },
    { name: "postgres", schemas: [{ name: "public", tables: [] }] },
  ],
};

export const tableInfo = {
  name: "public.orders",
  rows: "2,481,920",
  size: "1.9 GB",
  indexSize: "612 MB",
  columns: [
    { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()", key: "PK" },
    { name: "customer_id", type: "uuid", nullable: false, default: "", key: "FK → customers.id" },
    { name: "customer_email", type: "text", nullable: false, default: "", key: "" },
    { name: "status", type: "order_status", nullable: false, default: "'pending'", key: "" },
    { name: "currency", type: "char(3)", nullable: false, default: "'EUR'", key: "" },
    { name: "total", type: "numeric(12,2)", nullable: false, default: "0", key: "" },
    { name: "created_at", type: "timestamptz", nullable: false, default: "now()", key: "" },
    { name: "updated_at", type: "timestamptz", nullable: true, default: "", key: "" },
  ],
  indexes: [
    { name: "orders_pkey", def: "UNIQUE btree (id)", size: "188 MB" },
    { name: "orders_customer_id_idx", def: "btree (customer_id)", size: "174 MB" },
    { name: "orders_created_at_idx", def: "btree (created_at DESC)", size: "142 MB" },
    { name: "orders_status_partial_idx", def: "btree (status) WHERE status <> 'delivered'", size: "108 MB" },
  ],
  constraints: [
    { name: "orders_customer_id_fkey", def: "FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT" },
    { name: "orders_total_check", def: "CHECK (total >= 0)" },
  ],
};

export const sampleQuery = `SELECT id, customer_email, status, total, created_at
FROM public.orders
WHERE created_at > now() - interval '24 hours'
ORDER BY created_at DESC
LIMIT 50;`;

export const queryResult = {
  columns: ["id", "customer_email", "status", "total", "created_at"],
  rows: [
    ["8f3c…a1d2", "a•••@example.com", "paid", "129.00", "2026-10-13 14:01:44+00"],
    ["c21e…09fb", "m•••@example.org", "pending", "42.50", "2026-10-13 13:58:02+00"],
    ["0b9d…77ce", "j•••@example.com", "shipped", "310.99", "2026-10-13 13:51:19+00"],
    ["e4a0…5c3b", "k•••@example.net", "paid", "18.00", "2026-10-13 13:47:55+00"],
    ["71fd…e2a8", "s•••@example.com", "refunded", "64.20", "2026-10-13 13:40:31+00"],
    ["a6b2…3f10", "t•••@example.com", "paid", "999.00", "2026-10-13 13:38:07+00"],
    ["5e88…d4c7", "o•••@example.org", "pending", "75.75", "2026-10-13 13:29:12+00"],
    ["3c17…8a9e", "l•••@example.com", "shipped", "220.00", "2026-10-13 13:22:48+00"],
  ],
  duration: "38 ms",
  rowCount: 50,
};

export const dbUsers: { name: string; attrs: string[]; grants: string; purpose: string; lastLogin: string; managed: boolean }[] = [
  { name: "vpspilot_monitor", attrs: ["LOGIN"], grants: "pg_monitor", purpose: "Health & metrics", lastLogin: "12s ago", managed: true },
  { name: "vpspilot_readonly", attrs: ["LOGIN"], grants: "pg_read_all_data on storefront", purpose: "Query browsing (default)", lastLogin: "4m ago", managed: true },
  { name: "vpspilot_admin", attrs: ["LOGIN", "CREATEROLE"], grants: "Administrative operations, confirmation required", purpose: "Users & grants", lastLogin: "2d ago", managed: true },
  { name: "storefront_app", attrs: ["LOGIN"], grants: "SELECT, INSERT, UPDATE on storefront.public.*", purpose: "Application", lastLogin: "1s ago", managed: false },
  { name: "replicator", attrs: ["LOGIN", "REPLICATION"], grants: "—", purpose: "Streaming replica", lastLogin: "Connected", managed: false },
  { name: "postgres", attrs: ["SUPERUSER"], grants: "All", purpose: "Not used by VPSPilot", lastLogin: "41d ago", managed: false },
];

export const redisKeys: { key: string; type: "string" | "hash" | "list" | "set" | "zset" | "stream"; ttl: string; size: string }[] = [
  { key: "session:9f2a7c41e0b3", type: "hash", ttl: "58m", size: "1.2 KB" },
  { key: "session:1be0d77a42c9", type: "hash", ttl: "41m", size: "1.1 KB" },
  { key: "cart:user:1042", type: "hash", ttl: "6d", size: "3.4 KB" },
  { key: "cart:user:2310", type: "hash", ttl: "6d", size: "812 B" },
  { key: "rate:ip:203.0.113.24", type: "string", ttl: "42s", size: "8 B" },
  { key: "rate:ip:198.51.100.7", type: "string", ttl: "13s", size: "8 B" },
  { key: "queue:emails", type: "list", ttl: "—", size: "88 KB" },
  { key: "leaderboard:weekly", type: "zset", ttl: "3d", size: "24 KB" },
  { key: "feature-flags", type: "hash", ttl: "—", size: "2.1 KB" },
  { key: "page:/category/shoes", type: "string", ttl: "51s", size: "148 KB" },
  { key: "online-users", type: "set", ttl: "—", size: "16 KB" },
  { key: "events:checkout", type: "stream", ttl: "—", size: "1.8 MB" },
];

export const redisHashSample = [
  ["user_id", "1042"],
  ["items", '[{"sku":"SH-0193","qty":1},{"sku":"TS-2201","qty":2}]'],
  ["currency", "EUR"],
  ["subtotal", "96.00"],
  ["updated_at", "2026-10-13T13:58:41Z"],
];

/* ------------------------------------------------------------------ */
/* Backups                                                             */
/* ------------------------------------------------------------------ */

export type Backup = {
  id: string;
  target: string;
  targetType: "database" | "volume" | "control-plane";
  engine: string;
  location: string;
  size: string;
  checksum: string;
  encrypted: boolean;
  status: "verified" | "completed" | "running" | "failed" | "stale";
  created: string;
  retention: string;
  restoreTest: string;
};

export const backups: Backup[] = [
  { id: "bk_01JA9Q", target: "pg-main", targetType: "database", engine: "PostgreSQL", location: "s3://acme-backups/pg-main/", size: "4.12 GB", checksum: "sha256:9c1e…f04a", encrypted: true, status: "verified", created: "Today, 03:00", retention: "30 days", restoreTest: "Restored to pg-restore-test · 11m ago" },
  { id: "bk_01JA9R", target: "redis-cache", targetType: "database", engine: "Redis", location: "s3://acme-backups/redis-cache/", size: "96 MB", checksum: "sha256:2be8…aa19", encrypted: true, status: "completed", created: "Today, 03:10", retention: "7 days", restoreTest: "Not tested" },
  { id: "bk_01JA9S", target: "mysql-legacy", targetType: "database", engine: "MySQL", location: "s3://acme-backups/mysql-legacy/", size: "1.48 GB", checksum: "sha256:77d0…31c6", encrypted: true, status: "verified", created: "Today, 03:20", retention: "30 days", restoreTest: "Restored to mysql-restore-test · 2d ago" },
  { id: "bk_01JA9T", target: "mariadb-wp", targetType: "database", engine: "MariaDB", location: "/var/backups/vpspilot/mariadb-wp/", size: "612 MB", checksum: "sha256:e019…5b7d", encrypted: false, status: "completed", created: "Today, 03:25", retention: "14 days", restoreTest: "Not tested" },
  { id: "bk_01JA9U", target: "control-plane", targetType: "control-plane", engine: "VPSPilot", location: "s3://acme-backups/vpspilot/", size: "82 MB", checksum: "sha256:41af…0c92", encrypted: true, status: "verified", created: "Today, 02:00", retention: "90 days", restoreTest: "Restored to staging · 6d ago" },
  { id: "bk_01JA9V", target: "redis-queue", targetType: "database", engine: "Redis", location: "s3://acme-backups/redis-queue/", size: "4 MB", checksum: "sha256:8f20…dd31", encrypted: true, status: "stale", created: "Yesterday, 01:00", retention: "7 days", restoreTest: "Not tested" },
  { id: "bk_01JA9W", target: "pg-main", targetType: "database", engine: "PostgreSQL", location: "s3://acme-backups/pg-main/", size: "—", checksum: "—", encrypted: true, status: "running", created: "Now", retention: "30 days", restoreTest: "—" },
  { id: "bk_01JA9X", target: "pg-analytics", targetType: "database", engine: "PostgreSQL", location: "s3://acme-backups/pg-analytics/", size: "—", checksum: "—", encrypted: true, status: "failed", created: "Today, 03:05", retention: "30 days", restoreTest: "—" },
];

export const backupTone: Record<Backup["status"], Tone> = { verified: "ok", completed: "blue", running: "warn", failed: "err", stale: "warn" };

/* ------------------------------------------------------------------ */
/* Domains                                                             */
/* ------------------------------------------------------------------ */

export type Domain = {
  host: string;
  appId: string;
  serverId: string;
  proxy: "valid" | "invalid" | "pending";
  tls: "active" | "expiring" | "issuing" | "failed";
  expires: string;
  issuer: string;
  redirect?: string;
  added: string;
};

export const domains: Domain[] = [
  { host: "shop.example.com", appId: "storefront", serverId: "web-prod-01", proxy: "valid", tls: "active", expires: "Dec 21, 2026", issuer: "Let's Encrypt R11", added: "Sep 2" },
  { host: "www.shop.example.com", appId: "storefront", serverId: "web-prod-01", proxy: "valid", tls: "active", expires: "Dec 21, 2026", issuer: "Let's Encrypt R11", redirect: "shop.example.com", added: "Sep 2" },
  { host: "api.example.com", appId: "api-gateway", serverId: "web-prod-02", proxy: "valid", tls: "active", expires: "Dec 4, 2026", issuer: "Let's Encrypt R10", added: "Sep 3" },
  { host: "auth.example.com", appId: "auth-service", serverId: "web-prod-02", proxy: "valid", tls: "active", expires: "Nov 30, 2026", issuer: "Let's Encrypt R10", added: "Sep 3" },
  { host: "example.com", appId: "marketing-site", serverId: "web-prod-02", proxy: "valid", tls: "active", expires: "Jan 2, 2027", issuer: "Let's Encrypt E6", added: "Sep 5" },
  { host: "www.example.com", appId: "marketing-site", serverId: "web-prod-02", proxy: "valid", tls: "active", expires: "Jan 2, 2027", issuer: "Let's Encrypt E6", redirect: "example.com", added: "Sep 5" },
  { host: "bi.example.com", appId: "metabase", serverId: "edge-jnb-01", proxy: "valid", tls: "expiring", expires: "Oct 22, 2026", issuer: "Let's Encrypt R11", added: "Oct 3" },
  { host: "staging.shop.example.com", appId: "storefront", serverId: "staging-01", proxy: "invalid", tls: "failed", expires: "—", issuer: "—", added: "Oct 12" },
];

/* ------------------------------------------------------------------ */
/* Monitoring, logs, audit, jobs                                        */
/* ------------------------------------------------------------------ */

export type Alert = {
  id: string;
  title: string;
  target: string;
  severity: "critical" | "warning" | "info";
  state: "firing" | "acknowledged" | "resolved";
  since: string;
  rule: string;
};

export const alerts: Alert[] = [
  { id: "al_1", title: "Agent offline", target: "staging-01", severity: "critical", state: "firing", since: "18m", rule: "No heartbeat for > 5m" },
  { id: "al_2", title: "Memory pressure", target: "db-primary", severity: "warning", state: "firing", since: "42m", rule: "memory > 85% for 10m" },
  { id: "al_3", title: "Health check failing", target: "metabase · edge-jnb-01", severity: "critical", state: "acknowledged", since: "26m", rule: "3 consecutive failures" },
  { id: "al_4", title: "TLS certificate expiring", target: "bi.example.com", severity: "warning", state: "firing", since: "2d", rule: "expires in < 14 days" },
  { id: "al_5", title: "Backup stale", target: "redis-queue", severity: "warning", state: "firing", since: "2h", rule: "no successful backup in 24h" },
  { id: "al_6", title: "Database unreachable", target: "pg-analytics", severity: "critical", state: "firing", since: "3m", rule: "connection test failed" },
  { id: "al_7", title: "Connections near limit", target: "mariadb-wp", severity: "warning", state: "firing", since: "9m", rule: "connections > 90% of max" },
  { id: "al_8", title: "Disk usage high", target: "web-prod-01", severity: "warning", state: "resolved", since: "1d", rule: "disk > 80% for 30m" },
  { id: "al_9", title: "CPU sustained high", target: "web-prod-01", severity: "info", state: "resolved", since: "3d", rule: "cpu > 90% for 15m" },
];

export const alertRules = [
  { name: "Agent offline", condition: "No heartbeat for 5 minutes", scope: "All servers", channel: "Email, Webhook", enabled: true },
  { name: "Memory pressure", condition: "Memory > 85% for 10 minutes", scope: "All servers", channel: "Email", enabled: true },
  { name: "Disk usage high", condition: "Disk or inodes > 80% for 30 minutes", scope: "All servers", channel: "Email", enabled: true },
  { name: "Health check failing", condition: "3 consecutive failures", scope: "All applications", channel: "Email, Webhook", enabled: true },
  { name: "TLS certificate expiring", condition: "Expires in < 14 days", scope: "All domains", channel: "Email", enabled: true },
  { name: "Backup stale", condition: "No successful backup in 24 hours", scope: "All backup targets", channel: "Email", enabled: true },
  { name: "CPU sustained high", condition: "CPU > 90% for 15 minutes", scope: "production", channel: "Webhook", enabled: false },
];

export type LogLine = { id: number; time: string; level: "info" | "warn" | "error" | "debug"; source: string; server: string; message: string };

const logTemplates: Omit<LogLine, "id" | "time">[] = [
  { level: "info", source: "storefront", server: "web-prod-01", message: 'GET /api/products?category=shoes 200 in 42ms' },
  { level: "info", source: "api-gateway", server: "web-prod-02", message: 'POST /v1/orders 201 in 118ms request_id=req_8Hn2' },
  { level: "warn", source: "postgresql", server: "db-primary", message: "duration: 2104.551 ms  statement: SELECT … FROM order_items WHERE …" },
  { level: "error", source: "metabase", server: "edge-jnb-01", message: "java.lang.OutOfMemoryError: Java heap space" },
  { level: "info", source: "nginx", server: "web-prod-01", message: '203.0.113.24 "GET /checkout HTTP/2.0" 200 18234' },
  { level: "debug", source: "vpspilot-agent", server: "web-prod-02", message: "heartbeat ok rtt=38ms jobs_claimed=0" },
  { level: "info", source: "worker-queue", server: "web-prod-01", message: "Task send_receipt_email[7c1f…] succeeded in 0.84s" },
  { level: "warn", source: "mariadb-wp", server: "web-prod-01", message: "Aborted connection 48211 to db: 'wp' user: 'wp' (Got timeout reading communication packets)" },
  { level: "info", source: "auth-service", server: "web-prod-02", message: "token issued sub=usr_1042 aud=storefront exp=3600" },
  { level: "error", source: "vpspilot-agent", server: "staging-01", message: "heartbeat failed: dial tcp 49.12.188.21:443: i/o timeout" },
  { level: "info", source: "caddy", server: "edge-jnb-01", message: "certificate renewal scheduled for bi.example.com in 2d" },
  { level: "warn", source: "storefront", server: "web-prod-01", message: "Slow render /category/[slug] 1.8s (threshold 1s)" },
  { level: "info", source: "redis", server: "web-prod-01", message: "Background saving terminated with success" },
  { level: "debug", source: "vpspilot-agent", server: "db-primary", message: "metrics submitted samples=48 bytes=6.1KB" },
];

export const logs: LogLine[] = Array.from({ length: 64 }, (_, i) => {
  const tpl = logTemplates[(i * 7 + (i % 5)) % logTemplates.length];
  const sec = 59 - (i % 60);
  const ms = String((i * 137) % 1000).padStart(3, "0");
  const min = 2 - Math.floor(i / 22);
  return { id: i, time: `14:0${Math.max(0, min)}:${String(sec).padStart(2, "0")}.${ms}`, ...tpl };
});

export const auditLog = [
  { id: "aud_01", actor: "pelumi", action: "deployment.create", target: "worker-queue", result: "accepted", ip: "102.89.4.17", time: "Oct 13, 14:02:11", correlation: "c0rr-7Hq2-kPz9" },
  { id: "aud_02", actor: "pelumi", action: "database.query.execute", target: "pg-main / storefront", result: "success · 50 rows · 38ms", ip: "102.89.4.17", time: "Oct 13, 13:59:40", correlation: "c0rr-Qm1x-4aEe" },
  { id: "aud_03", actor: "system", action: "backup.restore.verify", target: "pg-main → pg-restore-test", result: "success", ip: "—", time: "Oct 13, 13:51:02", correlation: "c0rr-Rs8T-0nVb" },
  { id: "aud_04", actor: "pelumi", action: "alert.acknowledge", target: "metabase health check", result: "success", ip: "102.89.4.17", time: "Oct 13, 13:40:27", correlation: "c0rr-3Bz1-YtQp" },
  { id: "aud_05", actor: "pelumi", action: "deployment.create", target: "metabase", result: "failed · health check", ip: "102.89.4.17", time: "Oct 13, 13:36:09", correlation: "c0rr-9TnB-3sWc" },
  { id: "aud_06", actor: "pelumi", action: "database.query.execute", target: "pg-main / storefront", result: "rejected · write statement on read-only role", ip: "102.89.4.17", time: "Oct 13, 12:18:44", correlation: "c0rr-Lm7d-Pp2s" },
  { id: "aud_07", actor: "pelumi", action: "deployment.rollback", target: "api-gateway → b72d1e0", result: "success", ip: "102.89.4.17", time: "Oct 13, 10:12:51", correlation: "c0rr-3Rz5-wNbJ" },
  { id: "aud_08", actor: "pelumi", action: "database.user.create", target: "pg-main / vpspilot_readonly", result: "success", ip: "102.89.4.17", time: "Oct 12, 18:04:15", correlation: "c0rr-Uu0p-aa1Z" },
  { id: "aud_09", actor: "pelumi", action: "domain.create", target: "staging.shop.example.com", result: "proxy validation failed", ip: "102.89.4.17", time: "Oct 12, 16:22:38", correlation: "c0rr-Dd4k-0bWr" },
  { id: "aud_10", actor: "pelumi", action: "enrollment_token.create", target: "edge-jnb-01", result: "redeemed", ip: "102.89.4.17", time: "Oct 3, 09:11:20", correlation: "c0rr-Ee9n-Rr4x" },
  { id: "aud_11", actor: "pelumi", action: "auth.mfa.enable", target: "owner", result: "success", ip: "102.89.4.17", time: "Sep 1, 08:00:02", correlation: "c0rr-Mf0a-1Ss3" },
  { id: "aud_12", actor: "system", action: "agent.credential.rotate", target: "db-primary", result: "success", ip: "—", time: "Oct 4, 00:00:00", correlation: "c0rr-Ag3t-R0t8" },
];

export const jobs = [
  { id: "job_8812", type: "deploy.docker", target: "worker-queue · web-prod-01", status: "running", progress: 62, time: "48s" },
  { id: "job_8811", type: "backup.postgres", target: "pg-main · db-primary", status: "running", progress: 34, time: "2m 10s" },
  { id: "job_8810", type: "backup.restore_verify", target: "pg-main → pg-restore-test", status: "succeeded", progress: 100, time: "11m" },
  { id: "job_8809", type: "deploy.docker", target: "storefront · web-prod-01", status: "succeeded", progress: 100, time: "1m 54s" },
  { id: "job_8808", type: "deploy.docker", target: "metabase · edge-jnb-01", status: "failed", progress: 100, time: "2m 31s" },
  { id: "job_8807", type: "proxy.reload", target: "nginx · web-prod-01", status: "succeeded", progress: 100, time: "1s" },
] as const;

export const owner = { name: "Pelumi", email: "owner@example.com" };

export const overview = {
  deploysPerDay: [6, 9, 4, 11, 7, 3, 2, 8, 12, 9, 5, 7, 10, 14],
  deployLabels: ["Sep 30", "", "", "", "", "", "", "", "", "", "", "", "", "Oct 13"],
};
