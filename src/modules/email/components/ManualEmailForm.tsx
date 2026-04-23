'use client';

import { useState, type FormEvent } from 'react';
import { supabase } from '@/shared/hooks/useSupabase';
import type { ManualEmailInput } from '../types';

type Props = {
  readonly clientId: string;
  readonly projectId: string | null;
  readonly projectsForClient?: readonly { id: string; name: string }[];
  readonly onSaved: () => void;
  readonly onCancel: () => void;
};

export function ManualEmailForm({ clientId, projectId, projectsForClient = [], onSaved, onCancel }: Props) {
  const [fromName, setFromName] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sentAt, setSentAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [selectedProject, setSelectedProject] = useState<string | null>(projectId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      const payload: ManualEmailInput & { user_id: string; routing_source: string; is_manual: boolean; snippet: string } = {
        user_id: user.id,
        from_email: fromEmail.trim().toLowerCase(),
        from_name: fromName.trim() || undefined,
        subject: subject.trim(),
        body,
        sent_at: new Date(sentAt).toISOString(),
        client_id: clientId,
        project_id: selectedProject,
        routing_source: 'manual',
        is_manual: true,
        snippet: body.slice(0, 200),
      };
      const emails = supabase.from('emails') as unknown as {
        insert: (row: Record<string, unknown>) => Promise<{ error: Error | null }>;
      };
      const { error: insertErr } = await emails.insert({
        user_id: payload.user_id,
        from_email: payload.from_email,
        from_name: payload.from_name ?? null,
        subject: payload.subject,
        snippet: payload.snippet,
        sent_at: payload.sent_at,
        client_id: payload.client_id,
        project_id: payload.project_id,
        routing_source: 'manual',
        routing_confidence: 1.0,
        is_manual: true,
        to_emails: [],
        cc_emails: [],
      });
      if (insertErr) throw insertErr;
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 py-8 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="clay-card-static w-full max-w-lg overflow-hidden">
        <div className="h-[6px] bg-slushie-500" />
        <div className="space-y-4 p-6">
          <div>
            <div className="clay-label">NEW EMAIL</div>
            <h2 className="mt-1 text-lg font-semibold text-black">Add email manually</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="block font-medium text-charcoal-700">From name</span>
              <input
                className="clay-input mt-1 w-full text-sm"
                placeholder="Jane Doe"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="block font-medium text-charcoal-700">From email *</span>
              <input
                required
                type="email"
                className="clay-input mt-1 w-full text-sm"
                placeholder="jane@acme.com"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="block font-medium text-charcoal-700">Subject *</span>
            <input
              required
              className="clay-input mt-1 w-full text-sm"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </label>

          <label className="block text-sm">
            <span className="block font-medium text-charcoal-700">Body *</span>
            <textarea
              required
              rows={6}
              className="clay-input mt-1 w-full text-sm"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="block font-medium text-charcoal-700">Date *</span>
              <input
                required
                type="datetime-local"
                className="clay-input mt-1 w-full text-sm"
                value={sentAt}
                onChange={(e) => setSentAt(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="block font-medium text-charcoal-700">Project</span>
              <select
                className="clay-input mt-1 w-full text-sm"
                value={selectedProject ?? ''}
                onChange={(e) => setSelectedProject(e.target.value || null)}
              >
                <option value="">(client-level, no project)</option>
                {projectsForClient.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
          </div>

          {error && <p className="text-sm text-pomegranate-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onCancel} className="clay-btn clay-btn-secondary text-sm" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="clay-btn clay-btn-primary text-sm" disabled={loading}>
              {loading ? 'Saving…' : 'Save email'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
