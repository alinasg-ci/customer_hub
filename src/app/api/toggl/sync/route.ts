import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getServiceClient, generateErrorId } from '../lib/auth';
import { decrypt } from '../lib/crypto';

export async function POST(req: NextRequest) {
  const authResult = await authenticateRequest(req);
  if (authResult.error) return authResult.error;

  try {
    const { connectionId, startDate, endDate } = await req.json();

    if (!connectionId || typeof connectionId !== 'string') {
      return NextResponse.json(
        { data: null, error: { code: 'MISSING_PARAMS', message: 'Connection ID is required', id: generateErrorId() } },
        { status: 400 }
      );
    }

    // Validate date range if provided (max 12 months)
    const start = startDate ?? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate ?? new Date().toISOString();

    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    if (isNaN(startMs) || isNaN(endMs)) {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_DATES', message: 'Invalid date format', id: generateErrorId() } },
        { status: 400 }
      );
    }
    if (endMs - startMs > 365 * 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { data: null, error: { code: 'DATE_RANGE_TOO_LARGE', message: 'Date range cannot exceed 12 months', id: generateErrorId() } },
        { status: 400 }
      );
    }

    // Load and decrypt token server-side
    const supabase = getServiceClient();
    const { data: connection, error: connError } = await supabase
      .from('toggl_connections')
      .select('api_token_encrypted')
      .eq('id', connectionId)
      .eq('user_id', authResult.user.id)
      .single();

    if (connError || !connection) {
      return NextResponse.json(
        { data: null, error: { code: 'CONNECTION_NOT_FOUND', message: 'Toggl connection not found', id: generateErrorId() } },
        { status: 404 }
      );
    }

    const apiToken = decrypt(connection.api_token_encrypted);
    const auth = Buffer.from(`${apiToken}:api_token`).toString('base64');

    const url = `https://api.track.toggl.com/api/v9/me/time_entries?start_date=${encodeURIComponent(start)}&end_date=${encodeURIComponent(end)}`;

    const response = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (response.status === 429) {
      return NextResponse.json(
        { data: null, error: { code: 'TOGGL_RATE_LIMITED', message: 'Toggl rate limit reached. Please try again in a minute.', id: generateErrorId() } },
        { status: 429 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { data: null, error: { code: 'TOGGL_ERROR', message: `Toggl API error: ${response.status}`, id: generateErrorId() } },
        { status: response.status }
      );
    }

    const entries = await response.json();

    const mapped = (entries ?? [])
      .filter((e: { duration: number }) => e.duration > 0)
      .map((e: {
        id: number;
        workspace_id: number;
        project_id: number | null;
        description: string | null;
        start: string;
        stop: string | null;
        duration: number;
        billable: boolean;
        tags: string[] | null;
      }) => ({
        id: e.id,
        workspace_id: e.workspace_id,
        project_id: e.project_id,
        description: e.description ?? '',
        start: e.start,
        stop: e.stop,
        duration: e.duration,
        billable: e.billable ?? false,
        tags: e.tags ?? [],
      }));

    return NextResponse.json({ data: mapped, error: null });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: 'SYNC_ERROR', message: 'Failed to sync time entries', id: generateErrorId() } },
      { status: 500 }
    );
  }
}
