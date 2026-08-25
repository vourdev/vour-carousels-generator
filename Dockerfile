# Built on a GitHub runner, never on the VPS: that box loses 12-60% of its outbound
# packets, so `npm ci` there does not finish. The finished image is shipped in over SSH,
# which is the direction that measures 0% loss.
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
