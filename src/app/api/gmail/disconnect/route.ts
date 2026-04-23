import { NextRequest, NextResponse } from 'next/server';
import { getUserFromCookies, getServiceClient, errorResponse } from '../lib/auth';

/**
 * POST /api/gmail/disconnect
 *
 * Removes the stored Gmail connection. Revoking the Google-side grant must
 * be done by the user in their Google account (intentionally kept out of
 * scope — we hold only the refresh token, not the long-lived grant).
 */
export async function POST(_req: NextRequest) {
  const user = await getUserFromCookies();
  if (!user) return errorResponse('UNAUTHORIZED', 'Not signed in', 401);

  const supabase = getServiceClient();
  const { error } = await supabase
    .from('gmail_connections')
    .delete()
    .eq('user_id', user.id);

  if (error) return errorResponse('DB_ERROR', 'Failed to disconnect Gmail', 500);
  return NextResponse.json({ data: { disconnected: true }, error: null });
}
