import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { apiToken, workspaceId } = await req.json();

    if (!apiToken || !workspaceId) {
      return NextResponse.json(
        { data: null, error: { code: 'MISSING_PARAMS', message: 'API token and workspace ID are required' } },
        { status: 400 }
      );
    }

    const auth = Buffer.from(`${apiToken}:api_token`).toString('base64');

    const response = await fetch(
      `https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/projects?active=true`,
      { headers: { Authorization: `Basic ${auth}` } }
    );

    if (!response.ok) {
      return NextResponse.json(
        { data: null, error: { code: 'TOGGL_ERROR', message: 'Failed to fetch projects' } },
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
      { data: null, error: { code: 'FETCH_ERROR', message: 'Failed to fetch projects' } },
      { status: 500 }
    );
  }
}
