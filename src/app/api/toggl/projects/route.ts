import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, generateErrorId } from '../lib/auth';

export async function POST(req: NextRequest) {
  const authResult = await authenticateRequest(req);
  if (authResult.error) return authResult.error;

  try {
    const { apiToken, workspaceId } = await req.json();

    if (!apiToken || typeof apiToken !== 'string') {
      return NextResponse.json(
        { data: null, error: { code: 'MISSING_TOKEN', message: 'API token is required', id: generateErrorId() } },
        { status: 400 }
      );
    }

    // Validate workspaceId is a positive integer to prevent path traversal
    const wsId = parseInt(String(workspaceId), 10);
    if (isNaN(wsId) || wsId <= 0) {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_WORKSPACE', message: 'Invalid workspace ID', id: generateErrorId() } },
        { status: 400 }
      );
    }

    const auth = Buffer.from(`${apiToken}:api_token`).toString('base64');

    const response = await fetch(
      `https://api.track.toggl.com/api/v9/workspaces/${wsId}/projects?active=true`,
      { headers: { Authorization: `Basic ${auth}` } }
    );

    if (!response.ok) {
      return NextResponse.json(
        { data: null, error: { code: 'TOGGL_ERROR', message: 'Failed to fetch projects', id: generateErrorId() } },
        { status: response.status }
      );
    }

    const projects = await response.json();
    const mapped = (projects ?? []).map((p: { id: number; name: string; workspace_id: number }) => ({
      id: p.id,
      name: p.name,
      workspace_id: p.workspace_id,
    }));

    return NextResponse.json({ data: mapped, error: null });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: 'FETCH_ERROR', message: 'Failed to fetch projects', id: generateErrorId() } },
      { status: 500 }
    );
  }
}
