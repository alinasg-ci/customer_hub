import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getServiceClient, generateErrorId } from '../lib/auth';
import { encrypt } from '../lib/crypto';

export async function POST(req: NextRequest) {
  const authResult = await authenticateRequest(req);
  if (authResult.error) return authResult.error;

  try {
    const { apiToken, workspaceId, workspaceName } = await req.json();

    if (!apiToken || typeof apiToken !== 'string') {
      return NextResponse.json(
        { data: null, error: { code: 'MISSING_TOKEN', message: 'API token is required', id: generateErrorId() } },
        { status: 400 }
      );
    }

    if (!workspaceId || !workspaceName) {
      return NextResponse.json(
        { data: null, error: { code: 'MISSING_WORKSPACE', message: 'Workspace ID and name are required', id: generateErrorId() } },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();
    const userId = authResult.user.id;

    // Deactivate any existing connection
    await supabase
      .from('toggl_connections')
      .update({ status: 'disconnected' })
      .eq('user_id', userId)
      .eq('status', 'active');

    // Encrypt the token server-side
    const encryptedToken = encrypt(apiToken);

    const { data, error } = await supabase
      .from('toggl_connections')
      .insert({
        api_token_encrypted: encryptedToken,
        workspace_id: workspaceId,
        workspace_name: workspaceName,
        status: 'active',
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { data: null, error: { code: 'DB_ERROR', message: 'Failed to save connection', id: generateErrorId() } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data, error: null });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: 'CONNECT_ERROR', message: 'Failed to save Toggl connection', id: generateErrorId() } },
      { status: 500 }
    );
  }
}
