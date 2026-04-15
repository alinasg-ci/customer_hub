# Auth Cookie Architecture Fix

**Date:** 2026-04-15
**Status:** Resolved

## Problem

After login, users were redirected back to `/login` in an infinite loop. The page appeared as a white screen on the deployed site.

## Root Cause

The Supabase auth system had two incompatible clients:

| Layer | Package | Storage | File |
|-------|---------|---------|------|
| Client-side (browser) | `@supabase/supabase-js` `createClient` | **localStorage** | `src/shared/hooks/useSupabase.ts` |
| Middleware (Edge) | `@supabase/ssr` `createServerClient` | **cookies** | `src/middleware.ts` |

After `signInWithPassword` succeeded, the auth token was stored in localStorage by the browser client. But the Next.js middleware ran on the Edge and read cookies. It never saw the token, so it redirected every authenticated request back to `/login`.

## Fix

Changed `src/shared/hooks/useSupabase.ts` from:

```ts
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(url, key);
```

To:

```ts
import { createBrowserClient } from '@supabase/ssr';
export const supabase = createBrowserClient(url, key);
```

`createBrowserClient` stores auth tokens in cookies instead of localStorage, so the middleware can read them.

## Architecture Rules (do not break)

1. **Client-side code** must use `createBrowserClient` from `@supabase/ssr` (in `src/shared/hooks/useSupabase.ts`). This is the single browser-side Supabase instance. All modules import from here.

2. **Middleware** must use `createServerClient` from `@supabase/ssr` (via `src/shared/hooks/useSupabaseServer.ts`). It reads/writes cookies on the request/response pair.

3. **API routes** (server-side only) may use `createClient` from `@supabase/supabase-js` with the service role key. These don't need cookies — they authenticate via Bearer tokens passed in headers and verified with `getUser(token)`.

```
Browser (useSupabase.ts)     --> createBrowserClient  --> cookies
Middleware (middleware.ts)    --> createServerClient   --> cookies (same)
API routes (api/toggl/*)     --> createClient          --> service role key (no cookies)
```

4. **Never import `createClient` from `@supabase/supabase-js` in client-side code.** This creates a localStorage-based client that the middleware cannot see.

## How to Verify

After any auth-related change, test this sequence:
1. Clear cookies and localStorage
2. Visit `/` -- should redirect to `/login`
3. Sign in with valid credentials
4. Should redirect to `/` and show the dashboard (not redirect back to `/login`)
5. Refresh the page -- should stay on dashboard (cookie persists)
