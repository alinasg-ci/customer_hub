import { NextRequest, NextResponse } from 'next/server';
import { getUserFromCookies, getServiceClient } from '../../lib/auth';
import { exchangeCodeForTokens, encryptEmailSecret } from '../../lib/gmailClient';

/**
 * GET /api/gmail/oauth/callback
 *
 * Handles Google's redirect with `code` + `state`. Verifies state binding
 * to the signed-in user, exchanges the code, and upserts gmail_connections.
 * Redirects back to /settings on both success and error (with a query flag).
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const err = url.searchParams.get('error');

  const origin = url.origin;
  const settingsUrl = (params: Record<string, string>) =>
    `${origin}/settings?${new URLSearchParams(params).toString()}`;

  if (err) {
    return NextResponse.redirect(settingsUrl({ gmail: 'denied' }));
  }
  if (!code || !state) {
    return NextResponse.redirect(settingsUrl({ gmail: 'invalid' }));
  }

  const user = await getUserFromCookies();
  if (!user) {
    return NextResponse.redirect(`${origin}/login?next=/settings`);
  }

  const [stateUserId] = state.split('.');
  if (stateUserId !== user.id) {
    return NextResponse.redirect(settingsUrl({ gmail: 'state_mismatch' }));
  }

  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch {
    return NextResponse.redirect(settingsUrl({ gmail: 'exchange_failed' }));
  }

  const supabase = getServiceClient();
  const refreshTokenEncrypted = encryptEmailSecret(tokens.refreshToken);

  const { error: upsertError } = await (supabase.from('gmail_connections') as any)
    .upsert(
      {
        user_id: user.id,
        google_email: tokens.googleEmail,
        refresh_token_encrypted: refreshTokenEncrypted,
        access_token_cached: tokens.accessToken,
        access_token_expires_at: tokens.accessTokenExpiresAt.toISOString(),
        last_sync_at: null,
        last_error: null,
      },
      { onConflict: 'user_id' }
    );

  if (upsertError) {
    return NextResponse.redirect(settingsUrl({ gmail: 'store_failed' }));
  }

  return NextResponse.redirect(settingsUrl({ gmail: 'connected' }));
}
