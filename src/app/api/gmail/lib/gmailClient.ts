/**
 * Gmail API client helpers. Server-side only — never import from browser code.
 *
 * Refresh tokens live in gmail_connections.refresh_token_encrypted encrypted
 * with EMAIL_ENCRYPTION_KEY. Access tokens are cached briefly on the row and
 * refreshed on demand.
 */

import { google, gmail_v1 } from 'googleapis';
import { encryptWith, decryptWith } from '@/shared/utils/crypto';
import { getServiceClient } from './auth';

const EMAIL_KEY_ENV = 'EMAIL_ENCRYPTION_KEY';
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function encryptEmailSecret(plaintext: string): string {
  return encryptWith(EMAIL_KEY_ENV, plaintext);
}

export function decryptEmailSecret(ciphertext: string): string {
  return decryptWith(EMAIL_KEY_ENV, ciphertext);
}

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    getEnv('GOOGLE_CLIENT_ID'),
    getEnv('GOOGLE_CLIENT_SECRET'),
    getEnv('GOOGLE_OAUTH_REDIRECT_URI')
  );
}

export function buildConsentUrl(state: string): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // force a refresh_token on every connect
    scope: SCOPES,
    state,
    include_granted_scopes: true,
  });
}

export type GmailTokens = {
  refreshToken: string;
  accessToken: string;
  accessTokenExpiresAt: Date;
  googleEmail: string;
};

/**
 * Exchange the one-time `code` from Google for refresh + access tokens.
 */
export async function exchangeCodeForTokens(code: string): Promise<GmailTokens> {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error('Google did not return a refresh_token. Consent screen may have been previously granted; disconnect and retry.');
  }
  if (!tokens.access_token) throw new Error('Google did not return an access_token');

  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ auth: client, version: 'v2' });
  const profile = await oauth2.userinfo.get();
  const email = profile.data.email;
  if (!email) throw new Error('Could not read Google email from userinfo');

  return {
    refreshToken: tokens.refresh_token,
    accessToken: tokens.access_token,
    accessTokenExpiresAt: tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 55 * 60 * 1000),
    googleEmail: email,
  };
}

/**
 * Fetch a valid access token for a connected user, refreshing if needed.
 */
export async function getAccessTokenForUser(userId: string): Promise<{
  accessToken: string;
  googleEmail: string;
  historyId: string | null;
} | null> {
  const supabase = getServiceClient();
  const { data: row } = await supabase
    .from('gmail_connections')
    .select('refresh_token_encrypted, access_token_cached, access_token_expires_at, google_email, history_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!row) return null;

  const typedRow = row as {
    refresh_token_encrypted: string;
    access_token_cached: string | null;
    access_token_expires_at: string | null;
    google_email: string;
    history_id: string | null;
  };

  const cached = typedRow.access_token_cached;
  const expiresAt = typedRow.access_token_expires_at ? new Date(typedRow.access_token_expires_at) : null;
  const now = Date.now();
  const stillFresh = cached && expiresAt && expiresAt.getTime() - now > 60_000; // 1 min safety margin

  if (stillFresh) {
    return {
      accessToken: cached,
      googleEmail: typedRow.google_email,
      historyId: typedRow.history_id,
    };
  }

  const client = getOAuth2Client();
  client.setCredentials({ refresh_token: decryptEmailSecret(typedRow.refresh_token_encrypted) });
  const refreshed = await client.getAccessToken();
  const newAccessToken = refreshed.token;
  if (!newAccessToken) throw new Error('Failed to refresh Gmail access token');
  const newExpiresAt = new Date(Date.now() + 55 * 60 * 1000);

  await (supabase.from('gmail_connections') as any)
    .update({
      access_token_cached: newAccessToken,
      access_token_expires_at: newExpiresAt.toISOString(),
    })
    .eq('user_id', userId);

  return {
    accessToken: newAccessToken,
    googleEmail: typedRow.google_email,
    historyId: typedRow.history_id,
  };
}

export function gmailForToken(accessToken: string): gmail_v1.Gmail {
  const client = getOAuth2Client();
  client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth: client });
}
