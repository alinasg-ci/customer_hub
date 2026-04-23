import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { randomBytes, timingSafeEqual } from 'crypto';

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

// Cached service-role client for writes that bypass RLS.
// Untyped (no generated Database) — mirrors the pattern used by api/toggl/lib/auth.ts.
let serviceClient: ReturnType<typeof createClient> | null = null;
export function getServiceClient() {
  if (!serviceClient) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
    serviceClient = createClient(SUPABASE_URL, key);
  }
  return serviceClient;
}

export function generateErrorId(): string {
  return `err_${randomBytes(6).toString('hex')}`;
}

/**
 * Resolve the signed-in user from the Supabase auth cookie. Used by OAuth
 * start + callback routes where the browser initiates a navigation rather
 * than an Authorization header fetch.
 */
export async function getUserFromCookies(): Promise<{ id: string; email?: string } | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // No-op: route handlers may not mutate cookies in all contexts.
      },
    },
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { id: user.id, email: user.email ?? undefined };
}

/**
 * Redirect to /login if unauthenticated. Returns the signed-in user id
 * plus a helper to early-exit the route handler.
 */
export async function requireLoggedInUser():
  Promise<{ user: { id: string; email?: string }; redirect?: never } | { user?: never; redirect: NextResponse }>
{
  const user = await getUserFromCookies();
  if (!user) {
    return { redirect: NextResponse.redirect(new URL('/login', getEnv('GOOGLE_OAUTH_REDIRECT_URI').replace(/\/api\/gmail.*/, ''))) };
  }
  return { user };
}

/**
 * Verify the Vercel Cron request. Vercel sends an Authorization header with
 * `Bearer <CRON_SECRET>` when the route is invoked by the scheduler.
 */
export function verifyCronAuth(req: NextRequest): boolean {
  const header = req.headers.get('authorization') ?? '';
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : '';
  const a = Buffer.from(bearer);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { data: null, error: { code, message, id: generateErrorId() } },
    { status }
  );
}
