import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { apiToken, startDate, endDate } = await req.json();

    if (!apiToken) {
      return NextResponse.json(
        { data: null, error: { code: 'MISSING_TOKEN', message: 'API token is required' } },
        { status: 400 }
      );
    }

    const auth = Buffer.from(`${apiToken}:api_token`).toString('base64');

    // Default: last 3 months if no start date
    const start = startDate ?? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate ?? new Date().toISOString();

    const url = `https://api.track.toggl.com/api/v9/me/time_entries?start_date=${encodeURIComponent(start)}&end_date=${encodeURIComponent(end)}`;

    const response = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (response.status === 429) {
      return NextResponse.json(
        { data: null, error: { code: 'TOGGL_RATE_LIMITED', message: 'Toggl rate limit reached. Please try again in a minute.' } },
        { status: 429 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { data: null, error: { code: 'TOGGL_ERROR', message: `Toggl API error: ${response.status}` } },
        { status: response.status }
      );
    }

    const entries = await response.json();

    const mapped = (entries ?? [])
      .filter((e: { duration: number }) => e.duration > 0) // Skip running entries
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
      { data: null, error: { code: 'SYNC_ERROR', message: 'Failed to sync time entries' } },
      { status: 500 }
    );
  }
}
