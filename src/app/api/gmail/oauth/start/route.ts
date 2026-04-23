import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getUserFromCookies } from '../../lib/auth';
import { buildConsentUrl } from '../../lib/gmailClient';

/**
 * GET /api/gmail/oauth/start
 *
 * Browser navigation starts the Google OAuth flow. Uses the Supabase session
 * cookie to identify the user. `state` is a signed-like token that includes
 * the user_id so the callback knows who authorized.
 */
export async function GET(_req: NextRequest) {
  const user = await getUserFromCookies();
  if (!user) {
    const origin = process.env.GOOGLE_OAUTH_REDIRECT_URI
      ? new URL(process.env.GOOGLE_OAUTH_REDIRECT_URI).origin
      : '';
    return NextResponse.redirect(`${origin}/login?next=/settings`);
  }

  // state = userId.randomHex — simple anti-CSRF + user binding. Cookie-based
  // session already prevents cross-account attacks; this just binds the
  // response back to the user who initiated the flow.
  const nonce = randomBytes(12).toString('hex');
  const state = `${user.id}.${nonce}`;

  const consentUrl = buildConsentUrl(state);
  return NextResponse.redirect(consentUrl);
}
