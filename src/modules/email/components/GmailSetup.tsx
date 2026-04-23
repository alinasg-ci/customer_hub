'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/shared/hooks/useSupabase';

type GmailConnectionRow = {
  readonly google_email: string;
  readonly last_sync_at: string | null;
  readonly last_error: string | null;
};

export function GmailSetup({ statusFlag }: { readonly statusFlag?: string | null }) {
  const [connection, setConnection] = useState<GmailConnectionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'disconnect' | 'sync' | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncedCount, setSyncedCount] = useState<number | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('gmail_connections')
      .select('google_email, last_sync_at, last_error')
      .maybeSingle();
    setConnection((data as GmailConnectionRow) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const onConnect = () => {
    window.location.href = '/api/gmail/oauth/start';
  };

  const onDisconnect = async () => {
    setBusy('disconnect');
    await fetch('/api/gmail/disconnect', { method: 'POST' });
    setBusy(null);
    await reload();
  };

  const onSyncNow = async () => {
    setBusy('sync');
    setSyncError(null);
    setSyncedCount(null);
    try {
      const res = await fetch('/api/gmail/sync', { method: 'POST' });
      const payload = await res.json();
      if (payload?.error) {
        setSyncError(payload.error.message ?? 'Sync failed');
      } else {
        setSyncedCount(payload?.data?.emails_synced ?? 0);
      }
    } catch {
      setSyncError('Sync failed');
    } finally {
      setBusy(null);
      await reload();
    }
  };

  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <h2 className="text-base font-semibold text-black">Gmail</h2>
        {statusFlag === 'connected' && (
          <span className="clay-sticker" style={{ transform: 'rotate(-4deg)' }}>
            ★ connected
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-charcoal-500">
        Read-only access. Emails from known clients land automatically in each client&apos;s
        Email tab; mentions of hours become notifications you can review.
      </p>

      {loading ? (
        <p className="clay-mono mt-4 text-xs text-charcoal-300">Checking connection…</p>
      ) : connection ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-[12px] border border-oat-300 bg-cream p-3">
            <div className="clay-label">ACCOUNT</div>
            <p className="clay-mono mt-0.5 text-sm text-black">{connection.google_email}</p>
            <p className="clay-mono mt-2 text-[11px] text-charcoal-300">
              Last sync: {connection.last_sync_at
                ? new Date(connection.last_sync_at).toLocaleString()
                : 'never'}
            </p>
            {connection.last_error && (
              <p className="mt-2 text-xs text-pomegranate-600">Last error: {connection.last_error}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onSyncNow}
              disabled={busy !== null}
              className="clay-btn clay-btn-secondary text-sm disabled:opacity-50"
            >
              {busy === 'sync' ? 'Syncing…' : 'Sync now'}
            </button>
            <button
              type="button"
              onClick={onDisconnect}
              disabled={busy !== null}
              className="clay-btn clay-btn-danger text-sm disabled:opacity-50"
            >
              Disconnect
            </button>
            {syncedCount !== null && (
              <span className="clay-mono text-[11px] text-charcoal-500">
                {syncedCount} emails pulled
              </span>
            )}
            {syncError && (
              <span className="text-xs text-pomegranate-600">{syncError}</span>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onConnect}
          className="clay-btn clay-btn-primary mt-4 text-sm"
        >
          Connect Gmail
        </button>
      )}

      {statusFlag && statusFlag !== 'connected' && (
        <p className="mt-3 text-xs text-pomegranate-600">
          Gmail connection error: <span className="clay-mono">{statusFlag}</span>. Try again.
        </p>
      )}
    </div>
  );
}
