import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@/shared/hooks/useSupabaseServer';

const PUBLIC_PATHS = ['/login', '/api/'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip auth check for public paths and static assets
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res;
  }

  const supabase = createMiddlewareClient(req, res);

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
