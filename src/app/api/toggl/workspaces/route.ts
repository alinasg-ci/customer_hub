import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { apiToken } = await req.json();

    if (!apiToken) {
      return NextResponse.json(
        { data: null, error: { code: 'MISSING_TOKEN', message: 'API token is required' } },
        { status: 400 }
      );
    }

    const auth = Buffer.from(`${apiToken}:api_token`).toString('base64');

    const response = await fetch('https://api.track.toggl.com/api/v9/workspaces', {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (!response.ok) {
      return NextResponse.json(
        { data: null, error: { code: 'TOGGL_ERROR', message: 'Failed to fetch workspaces' } },
        { status: response.status }
      );
    }

    const workspaces = await response.json();
    const mapped = workspaces.map((ws: { id: number; name: string }) => ({
      id: ws.id,
      name: ws.name,
    }));

    return NextResponse.json({ data: mapped, error: null });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: 'FETCH_ERROR', message: 'Failed to fetch workspaces' } },
      { status: 500 }
    );
  }
}
