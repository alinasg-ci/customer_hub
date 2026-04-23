'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useTogglSetup } from '../hooks/useTogglSetup';
import { createTogglMapping, fetchTogglMappings, deleteTogglMapping } from '../api/toggl';
import { Skeleton } from '@/shared/ui/Skeleton';
import type { TogglWorkspace, TogglProject, TogglMapping } from '../types';
import type { Project } from '@/modules/projects';

type TogglSetupProps = {
  readonly hubProjects: readonly Project[];
};

type SetupStep = 'token' | 'workspace' | 'mapping' | 'connected';

export function TogglSetup({ hubProjects }: TogglSetupProps) {
  const {
    connection,
    loading,
    loadConnection,
    validateToken,
    fetchWorkspaces,
    fetchProjects,
    connect,
    disconnect,
  } = useTogglSetup();

  const [step, setStep] = useState<SetupStep>('token');
  const [apiToken, setApiToken] = useState('');
  const [workspaces, setWorkspaces] = useState<readonly TogglWorkspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<TogglWorkspace | null>(null);
  const [togglProjects, setTogglProjects] = useState<readonly TogglProject[]>([]);
  const [mappings, setMappings] = useState<readonly TogglMapping[]>([]);
  const [validating, setValidating] = useState(false);
  const [selectingWorkspace, setSelectingWorkspace] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadConnection();
  }, [loadConnection]);

  useEffect(() => {
    if (connection && connection.status === 'active') {
      setStep('connected');
      fetchTogglMappings().then(setMappings);
    }
  }, [connection]);

  async function handleValidateToken(e: FormEvent) {
    e.preventDefault();
    if (!apiToken.trim()) return;

    setValidating(true);
    setError(null);
    try {
      const result = await validateToken(apiToken);
      if (!result.valid) {
        setError(result.error ?? 'Invalid token');
        return;
      }

      const ws = await fetchWorkspaces(apiToken);
      setWorkspaces(ws);
      setStep('workspace');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setValidating(false);
    }
  }

  async function handleSelectWorkspace(ws: TogglWorkspace) {
    setSelectedWorkspace(ws);
    setError(null);
    setSelectingWorkspace(true);
    try {
      const projects = await fetchProjects(apiToken, String(ws.id));
      setTogglProjects(projects);
      await connect(apiToken, String(ws.id), ws.name);
      setApiToken(''); // Clear token from memory after successful connect
      const existing = await fetchTogglMappings();
      setMappings(existing);
      setStep('mapping');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setSelectingWorkspace(false);
    }
  }

  async function handleCreateMapping(togglProjectId: number, togglProjectName: string, hubProjectId: string) {
    try {
      const mapping = await createTogglMapping(hubProjectId, togglProjectId, togglProjectName);
      setMappings((prev) => [...prev, mapping]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create mapping');
    }
  }

  async function handleDeleteMapping(id: string) {
    try {
      await deleteTogglMapping(id);
      setMappings((prev) => prev.filter((m) => m.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove mapping');
    }
  }

  async function handleDisconnect() {
    await disconnect();
    setStep('token');
    setApiToken('');
    setWorkspaces([]);
    setTogglProjects([]);
    setMappings([]);
  }

  if (loading) {
    return <Skeleton className="h-32 w-full" />;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-black">Toggl Connection</h2>

      {error && (
        <div className="rounded-lg border border-pomegranate-400 bg-pomegranate-300/20 px-3 py-2 text-sm text-pomegranate-600">
          {error}
        </div>
      )}

      {/* Step 1: Token input */}
      {step === 'token' && (
        <form onSubmit={handleValidateToken} className="space-y-3">
          <p className="text-sm text-charcoal-500">
            Enter your Toggl API token to connect. Find it in Toggl under Profile Settings.
          </p>
          <input
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder="Your Toggl API token"
            className="block w-full max-w-md rounded-lg border border-oat-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
          />
          <button
            type="submit"
            disabled={validating || !apiToken.trim()}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-charcoal-900 disabled:opacity-50"
          >
            {validating ? 'Validating...' : 'Validate & Connect'}
          </button>
        </form>
      )}

      {/* Step 2: Workspace selection */}
      {step === 'workspace' && (
        <div className="space-y-3">
          <p className="text-sm text-charcoal-500">Select a workspace:</p>
          <div className="space-y-2">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => handleSelectWorkspace(ws)}
                disabled={selectingWorkspace}
                className="block w-full max-w-md rounded-xl border border-oat-300 bg-white px-4 py-3 text-left text-sm shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-oat-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectingWorkspace && selectedWorkspace?.id === ws.id ? 'Connecting...' : ws.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Project mapping */}
      {step === 'mapping' && (
        <div className="space-y-3">
          <p className="text-sm text-charcoal-500">
            Map your Toggl projects to hub projects. Workspace: <strong>{selectedWorkspace?.name}</strong>
          </p>

          {togglProjects.length === 0 ? (
            <p className="text-sm text-charcoal-300">No projects found in this workspace.</p>
          ) : (
            <div className="space-y-2">
              {togglProjects.map((tp) => {
                const existing = mappings.find((m) => m.toggl_project_id === tp.id);
                return (
                  <div key={tp.id} className="flex items-center gap-3 rounded-xl border border-oat-300 bg-white px-3 py-2 shadow-sm">
                    <span className="min-w-[140px] text-sm font-medium text-black">{tp.name}</span>
                    <span className="text-charcoal-300">&rarr;</span>
                    {existing ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-matcha-600">
                          {hubProjects.find((hp) => hp.id === existing.project_id)?.name ?? 'Mapped'}
                        </span>
                        <button
                          onClick={() => handleDeleteMapping(existing.id)}
                          aria-label={`Remove mapping for ${tp.name}`}
                          className="text-xs text-charcoal-300 hover:text-pomegranate-600"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) handleCreateMapping(tp.id, tp.name, e.target.value);
                        }}
                        className="rounded-lg border border-oat-300 px-2 py-1 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
                      >
                        <option value="">Select hub project...</option>
                        {hubProjects.map((hp) => (
                          <option key={hp.id} value={hp.id}>{hp.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={() => setStep('connected')}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-charcoal-900"
          >
            Done
          </button>
        </div>
      )}

      {/* Connected state */}
      {step === 'connected' && connection && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-matcha-500" />
            <span className="text-sm text-charcoal-700">
              Connected to workspace: <strong>{connection.workspace_name}</strong>
            </span>
          </div>
          {connection.last_sync_at && (
            <p className="text-xs text-charcoal-300">
              Last sync: {new Date(connection.last_sync_at).toLocaleString()}
            </p>
          )}

          {/* Show existing mappings */}
          {mappings.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-charcoal-500">Project mappings:</p>
              {mappings.map((m) => (
                <div key={m.id} className="flex items-center gap-2 text-sm text-charcoal-500">
                  <span>{m.toggl_project_name}</span>
                  <span className="text-charcoal-300">&rarr;</span>
                  <span>{hubProjects.find((hp) => hp.id === m.project_id)?.name ?? m.project_id}</span>
                  <button
                    onClick={() => handleDeleteMapping(m.id)}
                    aria-label={`Remove mapping for ${m.toggl_project_name}`}
                    className="text-xs text-charcoal-300 hover:text-pomegranate-600"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setStep('mapping')}
              className="rounded-lg border border-oat-300 px-3 py-1.5 text-sm text-charcoal-700 hover:bg-cream"
            >
              Edit Mappings
            </button>
            <button
              onClick={handleDisconnect}
              className="rounded-lg border border-pomegranate-400 px-3 py-1.5 text-sm text-pomegranate-600 hover:bg-pomegranate-300/20"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
