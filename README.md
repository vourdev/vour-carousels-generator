# Vour Carousels (web)

Mobile-first single-user tool that turns a content idea into an on-brand
@vourdev photo carousel and schedules it to Buffer (Instagram + TikTok).

This app is the display layer. Brief and plan generation, revision, rendering,
capture, image hosting and publishing all live in the Hono backend
(`backend-vour-carousels`); every call to it goes through `lib/backend.ts`,
which forwards the signed-in user's session cookie.

## Setup
1. `cp .env.example .env` and fill values. `BETTER_AUTH_SECRET` and the database
   must match the backend's.
2. `npm install`
3. `npm run db:migrate` — create the auth schema.
4. `npm run db:seed` — create the single user (runs with `ALLOW_SIGNUP=true`).
5. Start the backend, then `npm run dev` — open http://localhost:3000.

## Deploy
Self-hosted on the VPS next to the backend, built as Next.js `standalone`.
Dokploy builds and rolls it on push to `vour-carousels-saas`; the GitHub workflow
only gates lint/test/build (and keeps a manual rsync deploy, see
`.github/workflows/deploy-vps.yml` and `deploy/ci-deploy-carousels.sh`).

## Notes
- `proxy.ts` (Next.js 16's renamed `middleware`) only checks that a session
  cookie is present and sends cookie-less requests to `/login`. It never treats
  the cookie as proof of a live session; `requireSession()` validates on the page.
- Automation callers (n8n) authenticate with `x-api-key: $AUTOMATION_SECRET`.
- Failed backend calls are kept in memory and readable at `/api/diag/errors`
  (Server Action errors are redacted in production builds).
