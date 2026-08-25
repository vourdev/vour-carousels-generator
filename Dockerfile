# NOT the deploy path any more -- kept for building and running the app locally.
# CI stopped shipping an image on 25 Aug 2026: streaming one over the VPS's uplink took
# 56 minutes at the 36 KB/s that link sustains, and the job timed out three runs running.
# Deploys now rsync the build output and assemble the image on the box. See
# .github/workflows/deploy-vps.yml and deploy/ci-deploy-carousels.sh.
#
# bookworm rather than alpine on purpose. @libsql/client ships per-platform native
# bindings and the glibc build (@libsql/linux-x64-gnu) is the one npm resolves here;
# musl would need a different package and fails at require() time, not at build time.
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# standalone carries its own traced node_modules; static and public are not traced
# because nothing imports them, so they are copied beside it.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
