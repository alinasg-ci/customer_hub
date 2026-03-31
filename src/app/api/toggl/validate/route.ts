import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, generateErrorId } from '../lib/auth';

export async function POST(req: NextRequest) {
  const authResult = await authenticateRequest(req);
  if (authResult.error) return authResult.error;

  try {
    const { apiToken } = await req.json();

    if (!apiToken || typeof apiToken !== 'string') {
      return NextResponse.json(
        { data: null, error: { code: 'MISSING_TOKEN', message: 'API token is required', id: generateErrorId() } },
        { status: 400 }
      );
    }

    const auth = Buffer.from(`${apiToken}:api_token`).toString('base64');

    const response = await fetch('https://api.track.toggl.com/api/v9/me', {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (!response.ok) {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_TOKEN', message: 'Invalid API token. You can find your token in Toggl under Profile Settings.', id: generateErrorId() } },
        { status: 401 }
      );
    }

    const user = await response.json();
    return NextResponse.json({ data: { email: user.email, fullname: user.fullname }, error: null });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: 'VALIDATION_ERROR', message: 'Failed to validate token', id: generateErrorId() } },
      { status: 500 }
    );
  }
}
