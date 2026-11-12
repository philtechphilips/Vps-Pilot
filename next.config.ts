import type { NextConfig } from "next";

// The FastAPI control plane. The browser talks to it through the /api/*
// rewrite below, so the refresh cookie is first-party and no CORS is needed.
const API_URL = process.env.API_URL ?? "http://localhost:8000";

// Everything the dashboard loads comes from its own origin. Inline scripts stay
// allowed: nonces don't work with Partial Prerendering (Next.js CSP guide), and
// React needs eval only in development. No upgrade-insecure-requests: some
// control planes are reached over plain HTTP by IP.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Ignored by browsers over plain HTTP, so it only takes effect behind HTTPS.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

const nextConfig: NextConfig = {
  // The Docker image (deploy/) builds a self-contained server; local dev and
  // `next start` are unaffected.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // The landing page and docs are on the website; here / is the dashboard,
  // which sends visitors who aren't signed in to /login.
  async redirects() {
    return [{ source: "/", destination: "/dashboard", permanent: false }];
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
