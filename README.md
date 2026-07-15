# Vour Carousels (web)

Mobile-first single-user tool that turns a content idea into an on-brand
@vourdev photo carousel and pushes it to Buffer. Replaces the legacy
GitHub Actions + Playwright + n8n pipeline at repo root.

## Setup
1. `cp .env.example .env` and fill values (`BETTER_AUTH_SECRET`, `APP_USERNAME`, `APP_PASSWORD`, Turso `DATABASE_URL`/`DATABASE_AUTH_TOKEN` for prod).
2. `npm install`
3. `npm run db:migrate` — create the auth schema.
4. `npm run db:seed` — create the single user (runs with `ALLOW_SIGNUP=true`).
5. `npm run dev` — open http://localhost:3000 (redirects to /login).

## Deploy (Vercel)
- Set all `.env` vars in the Vercel project (use Turso for `DATABASE_URL`).
- Run `npm run db:migrate` and `npm run db:seed` against the Turso db once.

## Notes
- `proxy.ts` (Next.js 16's renamed `middleware` convention — runs on the
  Node.js runtime) does a fast cookie-presence check (`better-auth/cookies`
  `getSessionCookie`) before any app route renders; full session validation
  happens in `requireSession()` on the page itself via `auth.api.getSession`.
  The exported function is named `proxy` and `config.matcher` is unchanged.
