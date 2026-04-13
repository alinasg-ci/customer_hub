import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PUBLIC_PATHS = ['/login', '/api/'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip auth check for public paths and static assets
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // Check for Supabase auth cookie/token
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  // Extract access token from cookies (Supabase stores as sb-<ref>-auth-token)
  const authCookie = req.cookies.getAll().find((c) => c.name.includes('auth-token'));

  if (!authCookie?.value) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    // Parse the cookie value — Supabase stores JSON with access_token
    const parsed = JSON.parse(authCookie.value);
    const accessToken = parsed?.access_token ?? parsed?.[0]?.access_token;

    if (!accessToken) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Verify token server-side
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
