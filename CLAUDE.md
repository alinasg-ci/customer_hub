# CLAUDE.md

## Project overview

Client Management Hub — a single-user web application for managing freelance client work. Central hub for hours tracking, project planning, profitability monitoring, and (in future milestones) communication, files, contacts, and tasks.

**Read `/docs/PRD.md` for the full product requirements.** This file covers coding conventions and rules that apply to every piece of code in the repo.

**Read `/DESIGN.md` before touching any UI.** It is the authoritative style guide for the Warm Clay design system — tokens, utility classes, mandatory page chrome (hero + stripe + sticker + hatch), and global-change rules. Every page, component, and fix must follow it.

## Stack

- **Frontend:** React (TypeScript) — deployed on Vercel
- **Backend:** Vercel serverless functions (API routes, TypeScript)
- **Database:** Supabase (PostgreSQL) — use `@supabase/supabase-js` client library
- **Auth:** Supabase Auth — email/password, 30-day session
- **Styling:** Tailwind CSS v4 + Warm Clay design system. Tokens + utilities live in `src/app/globals.css` (`@theme` + `@layer utilities`). Component-specific CSS Modules allowed only when Tailwind can't express the pattern. See `/DESIGN.md` for the full guide — treat it as non-negotiable.
- **Drag-and-drop:** @dnd-kit/core + @dnd-kit/sortable
- **State management:** React hooks (useState, useReducer, useContext). No Redux. Keep state as local as possible; lift only when shared across siblings.

## Project structure

```
/
├── CLAUDE.md                  ← You are here
├── docs/
│   ├── PRD.md                 ← Full product requirements (read this first)
│   └── BUILD_SEQUENCE.md      ← Feature build order with checkpoints
├── src/
│   ├── modules/               ← Feature modules (see PRD section 4.8)
│   │   ├── clients/
│   │   ├── projects/
│   │   ├── planning/
│   │   ├── time-tracking/
│   │   ├── profitability/
│   │   ├── expenses/
│   │   ├── reports/
│   │   ├── notifications/
│   │   └── notes/
│   ├── shared/
│   │   ├── ui/                ← Shared UI components
│   │   ├── hooks/             ← Shared hooks (useAuth, useSupabase)
│   │   ├── types/             ← Global types (Currency, MoneyAmount)
│   │   └── utils/             ← Formatting, validation helpers
│   └── app/                   ← Pages / routes
├── api/                       ← Vercel serverless functions
├── supabase/
│   └── migrations/            ← SQL migration files (numbered)
├── tests/
│   ├── unit/                  ← Pure function tests (calculations, currency, triggers)
│   └── integration/           ← API and Supabase tests
└── package.json
```

## Module rules

1. **Each module has an `index.ts` that exports its public API.** Other modules import ONLY from this file. Never reach into another module's `components/`, `hooks/`, or `api/` directly.

2. **Module internal structure:**
   ```
   modules/[name]/
   ├── components/    ← React components
   ├── hooks/         ← React hooks
   ├── api/           ← Supabase queries and external API calls
   ├── types.ts       ← Module-specific TypeScript types
   └── index.ts       ← Public exports
   ```

3. **Calculation logic lives in pure functions, separate from components.** Put formulas in dedicated `.ts` files (e.g., `profitability/calculations.ts`, `notifications/triggers.ts`, `expenses/currency.ts`). No math inside React components. These pure functions are the primary unit test targets.

4. **The time-tracking module uses an adapter pattern.** All time entry access goes through `time-tracking/adapter.ts`. In M1, the adapter calls the Toggl API. In M7, it switches to native storage. No other module imports from `toggl.ts` directly.

## TypeScript conventions

- **Strict mode enabled.** `"strict": true` in tsconfig.
- **No `any` type.** Use `unknown` and narrow with type guards if the type is genuinely uncertain.
- **Use `type` for data shapes, `interface` for contracts that may be extended.**
- **Enums:** Use string literal unions, not TypeScript enums. Example: `type ProjectType = 'project' | 'retainer' | 'hour_bank'`
- **Null handling:** Use `null` for intentionally absent values (from database). Use `undefined` for optional parameters. Never mix them for the same field.
- **Naming:** camelCase for variables/functions, PascalCase for types/components, UPPER_SNAKE_CASE for constants/env vars.

## Database conventions

- **All tables use `uuid` primary keys.** Use `gen_random_uuid()` as default in Supabase.
- **Every table has `user_id` (FK to `auth.users`).** Even though this is single-user. This is a future-proofing requirement.
- **Every table has `created_at` (timestamp with time zone, default `now()`).** Add `updated_at` where records are frequently modified.
- **Row Level Security (RLS) enabled on all tables.** Policy: `WHERE user_id = auth.uid()`.
- **Migration files are numbered sequentially:** `001_create_clients.sql`, `002_create_projects.sql`, etc.
- **Never use raw SQL strings in application code.** Use the Supabase client library's query builder. Parameterized queries only.
- **Money fields are `decimal(12,2)`.** Always store ILS-converted amounts alongside originals. See PRD section 1.6 and 4.6 for currency handling.

## Supabase client rules (CRITICAL — see docs/AUTH_COOKIE_FIX.md)

- **Client-side code** must use `createBrowserClient` from `@supabase/ssr` (via `src/shared/hooks/useSupabase.ts`). **Never** use `createClient` from `@supabase/supabase-js` in browser code — it stores auth in localStorage which the middleware cannot read, causing a login redirect loop.
- **Middleware** must use `createServerClient` from `@supabase/ssr` (via `src/shared/hooks/useSupabaseServer.ts`).
- **API routes** (server-side only) may use `createClient` from `@supabase/supabase-js` with the service role key.

## API conventions

- **All API routes require authentication.** Check Supabase session at the start of every serverless function. Return 401 if no valid session.
- **Toggl API calls go through server-side functions only.** The Toggl API token must never appear in client-side code.
- **Response format:**
  ```json
  { "data": { ... }, "error": null }
  ```
  On error:
  ```json
  { "data": null, "error": { "code": "ERROR_CODE", "message": "Human-readable message", "id": "err_abc123" } }
  ```
- **Error IDs:** Generate a unique error ID for every server-side error. Return it in the response and log it. The UI displays: "Something went wrong. Error ID: err_abc123".

## Component conventions

- **One component per file.** File name matches component name: `ClientCard.tsx` exports `ClientCard`.
- **Props types defined in the same file**, above the component.
- **No inline styles.** Use Tailwind classes. For complex conditional styling, use `clsx` or `cn` utility.
- **Loading states:** Every component that fetches data must show a loading state. Use skeleton loaders, not spinners (skeletons communicate layout while loading).
- **Empty states:** Every list component must handle the empty case with a helpful message. See PRD section F1.7 for the first-time experience pattern.
- **Error states:** Every component that can fail must show a user-readable error. Never show raw error objects, stack traces, or technical details to the user.

## Logging conventions

- **Use structured JSON logging.** See PRD section 4.7 for the full spec.
- **Log levels:** ERROR (something broke), WARN (handled but unexpected), INFO (normal operations worth recording), DEBUG (detailed troubleshooting, off in production).
- **Never log:** client names, project names, financial amounts, API tokens, email addresses, phone numbers, Toggl entry descriptions.
- **Always log:** entity IDs (uuids are safe), operation type, success/failure, duration, error codes.

## Testing conventions

- **Unit tests for all pure functions.** Every function in `calculations.ts`, `currency.ts`, `triggers.ts` must have tests. Target: 100% coverage on calculation functions.
- **Test file location:** `tests/unit/[module]/[filename].test.ts`
- **Test naming:** `describe('[function name]', () => { it('should [expected behavior] when [condition]', ...) })`
- **Use realistic test data.** Don't test with 0, 1, or round numbers only. Use numbers that look like real project data: 47.5 hours, ₪12,400, 83% consumption.
- **Edge cases to always test:** zero hours, negative values (should never occur — test that they're rejected), division by zero (retainer with 0 hours worked), currency conversion with missing rate, date on a weekend/holiday.

## Git conventions

- **Branch naming:** `feature/[module]-[description]` (e.g., `feature/clients-archive`, `feature/toggl-sync`)
- **Commit messages:** Imperative mood, concise. `Add client archive functionality` not `Added client archive` or `client archive feature`.
- **One feature per branch.** Don't mix client CRUD and Toggl sync in the same branch.
- **Migration files must be committed with the feature that uses them.** Never commit a migration without the corresponding application code.

## Environment variables

Required in `.env.local` (and Vercel environment settings):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TOGGL_ENCRYPTION_KEY=           # AES-256 key for encrypting Toggl API tokens
EMAIL_ENCRYPTION_KEY=           # AES-256 key for encrypting Gmail refresh tokens + email bodies
ANTHROPIC_API_KEY=              # Claude API key for email classification + hours extraction
GOOGLE_CLIENT_ID=               # Google OAuth client ID (Gmail integration)
GOOGLE_CLIENT_SECRET=           # Google OAuth client secret
GOOGLE_OAUTH_REDIRECT_URI=      # e.g. https://<host>/api/gmail/oauth/callback
CRON_SECRET=                    # Shared secret for Vercel cron auth (gmail sync)
```

- `NEXT_PUBLIC_` prefix = exposed to browser (only Supabase URL and anon key).
- Everything else is server-side only.
- Never commit `.env.local` or any file containing secrets.

## What NOT to build in M1

- No Google Drive connection (M2)
- No Google Calendar (M3)
- No Slack or WhatsApp (M5)
- No task management (M6)
- No native time tracking (M7)
- No push notifications

## Milestone gates intentionally crossed

The following features have been pulled forward and are now allowed:

- **Gmail integration (was M3)** — `googleapis` is permitted. Scope is read-only (`gmail.readonly`); no compose/reply/label/send. Polled every 5 min via Vercel cron. See the `email` module and `docs/PRD.md` §8.
- **Claude LLM (was M2)** — `@anthropic-ai/sdk` is permitted. Used only server-side, only for email classification + hours extraction. Never expose the key to the browser. Use `claude-haiku-4-5-20251001` as default; upgrade to Sonnet on low confidence.

Security rules around these features are in `DESIGN.md` and the `email` module README:
- Email bodies stored AES-256 encrypted in `emails.body_encrypted` (`EMAIL_ENCRYPTION_KEY`).
- Google refresh tokens stored AES-256 encrypted in `gmail_connections.refresh_token_encrypted`.
- Never log email content — only UUIDs, sender domain, routing decision path, confidence.
- Sanitize HTML/tracking pixels before sending to Claude; truncate body to 4000 chars.
- Per-user LLM rate limit; refuse beyond quota.
