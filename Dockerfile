# VPSPilot dashboard. Built by deploy/compose.yaml in the API repository.
FROM node:26-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Where the dashboard forwards /api/* (the API container on the private network).
ARG API_URL=http://vpspilot-api:8000
ENV API_URL=$API_URL NEXT_OUTPUT=standalone NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:26-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
# npm, Yarn and Corepack come with the base image but the server is plain
# `node`: removing them drops their bundled packages (and their advisories).
RUN useradd --system --uid 1001 nextjs \
    && rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx \
       /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
