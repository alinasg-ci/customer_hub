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

    const response = await fetch('https://api.track.toggl.com/api/v9/me', {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (!response.ok) {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_TOKEN', message: 'Invalid API token. You can find your token in Toggl under Profile Settings.' } },
        { status: 401 }
      );
    }

    const user = await response.json();
    return NextResponse.json({ data: { email: user.email, fullname: user.fullname }, error: null });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: 'VALIDATION_ERROR', message: 'Failed to validate token' } },
      { status: 500 }
    );
  }
}
