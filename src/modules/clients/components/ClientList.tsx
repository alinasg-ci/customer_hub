'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useClients } from '../hooks/useClients';
import { ClientForm } from './ClientForm';
import { ConfirmDeleteDialog } from '@/shared/ui/ConfirmDeleteDialog';
import { Skeleton } from '@/shared/ui/Skeleton';
import { fetchAllProjects } from '@/modules/projects';
import { fetchHoursByProject } from '@/modules/time-tracking';
import { cn } from '@/shared/utils/cn';
import type { Client, CreateClientInput, UpdateClientInput } from '../types';
import type { Project } from '@/modules/projects';
import { formatHours } from '@/shared/utils/formatHours';

const CLIENT_SWATCHES = [
  'bg-matcha-600',
  'bg-slushie-500',
  'bg-ube-500',
  'bg-lemon-500 !text-black',
  'bg-pomegranate-400',
  'bg-blueberry-500',
  'bg-dragonfruit-500',
] as const;

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getClientSwatch(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CLIENT_SWATCHES[Math.abs(hash) % CLIENT_SWATCHES.length];
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-matcha-300/20 text-matcha-800 border-matcha-300',
  pending: 'bg-lemon-400/20 text-lemon-800 border-lemon-400',
  closed: 'bg-oat-100 text-charcoal-500 border-oat-300',
};

const TYPE_ICONS: Record<string, string> = {
  project: '📋',
  retainer: '🔄',
  hour_bank: '🏦',
};

const CURRENCY_SYMBOLS: Record<string, string> = { ILS: '₪', USD: '$', EUR: '€' };

function formatMoney(amount: number | null, currency: string): string {
  if (amount === null || amount === 0) return '—';
  const symbol = CURRENCY_SYMBOLS[currency] ?? '';
  return `${symbol}${amount.toLocaleString('en-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
}

export function ClientList() {
  const { clients, loading, error, add, edit, archive, remove, reload } = useClients('active');
  const [projects, setProjects] = useState<readonly Project[]>([]);
  const [hoursByProject, setHoursByProject] = useState<ReadonlyMap<string, number>>(new Map());
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const router = useRouter();

  // Fetch all projects + hours once clients are loaded
  useEffect(() => {
    if (loading || clients.length === 0) {
      setProjectsLoading(false);
      return;
    }
    async function loadProjectData() {
      setProjectsLoading(true);
      try {
        const [allProjects, hours] = await Promise.all([
          fetchAllProjects(),
          fetchHoursByProject(),
        ]);
        setProjects(allProjects);
        setHoursByProject(hours);
        // Auto-expand all clients
        setExpandedClients(new Set(clients.map((c) => c.id)));
      } catch {
        // Non-critical — table still shows clients
      } finally {
        setProjectsLoading(false);
      }
    }
    loadProjectData();
  }, [clients, loading]);

  const handleCreate = useCallback(async (data: CreateClientInput | UpdateClientInput) => {
    await add(data as CreateClientInput);
    setShowForm(false);
  }, [add]);

  const handleEdit = useCallback(async (data: CreateClientInput | UpdateClientInput) => {
    if (!editingClient) return;
    await edit(editingClient.id, data as UpdateClientInput);
    setEditingClient(null);
  }, [edit, editingClient]);

  const handleDeleteClick = useCallback((id: string) => {
    const client = clients.find((c) => c.id === id);
    if (client) setDeletingClient(client);
  }, [clients]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingClient) return;
    setDeleteLoading(true);
    try {
      await remove(deletingClient.id);
      setDeletingClient(null);
    } catch {
      // Error handled by hook
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingClient, remove]);

  const toggleClient = useCallback((clientId: string) => {
    setExpandedClients((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="mb-8 flex items-end justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="clay-card-sm border-pomegranate-300 bg-pomegranate-300/10 p-4">
        <p className="text-sm text-pomegranate-600">{error}</p>
        <button onClick={reload} className="mt-2 text-sm font-medium text-pomegranate-600 hover:text-pomegranate-600/80">
          Try again
        </button>
      </div>
    );
  }

  // Group projects by client
  const projectsByClient = new Map<string, Project[]>();
  for (const project of projects) {
    const list = projectsByClient.get(project.client_id) ?? [];
    list.push(project);
    projectsByClient.set(project.client_id, list);
  }

  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative mb-10">
        <div className="clay-label">{dateLabel.toUpperCase()}</div>
        <h1
          className="my-2 font-semibold text-black"
          style={{
            fontSize: 'clamp(44px, 6vw, 72px)',
            lineHeight: 0.98,
            letterSpacing: '-0.03em',
            fontFeatureSettings: '"ss01","ss03"',
          }}
        >
          Your <em className="not-italic text-matcha-600">clients</em>.
        </h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-charcoal-500">
          {clients.length} {clients.length === 1 ? 'client' : 'clients'} · {projects.length} {projects.length === 1 ? 'project' : 'projects'} — tap a project to drill into time, finances, and comments.
        </p>
        {clients.length > 0 && (
          <div className="clay-sticker absolute right-2 top-2 hidden sm:inline-flex">
            ★ {clients.length} active
          </div>
        )}
      </section>

      {/* ── Actions ── */}
      <div className="mb-6 flex items-center justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="clay-btn clay-btn-primary flex items-center gap-2 text-sm"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Client
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="clay-card-dashed relative flex flex-col items-center justify-center overflow-hidden py-20">
          <div className="clay-hatch absolute inset-0 opacity-60" />
          <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-[24px] bg-lemon-500 border-[1.5px] border-black shadow-[var(--shadow-hard-sm)]" style={{ transform: 'rotate(-6deg)' }}>
            <svg className="h-8 w-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <h2 className="relative text-lg font-semibold text-black">No clients yet</h2>
          <p className="relative mt-1.5 max-w-sm text-center text-sm text-charcoal-500">
            Add your first client to start tracking projects, hours, and profitability.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="clay-btn clay-btn-primary relative mt-6 flex items-center gap-2 text-sm"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create your first client
          </button>
        </div>
      ) : (
        <div className="clay-card-static overflow-hidden">
          {/* Colored stripe (matches overview KPI tiles) */}
          <div className="h-[6px] bg-matcha-500" />
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="relative border-b border-oat-300 bg-cream-dark text-left">
                <th className="clay-label clay-mono py-3 pl-5 pr-2">Project / Client</th>
                <th className="clay-label clay-mono py-3 px-3 text-center">Due date</th>
                <th className="clay-label clay-mono py-3 px-3 text-right">Estimated</th>
                <th className="clay-label clay-mono py-3 px-3 text-right">Actual</th>
                <th className="clay-label clay-mono py-3 px-3 w-40">Progress</th>
                <th className="clay-label clay-mono py-3 px-3 text-right">Value</th>
                <th className="clay-label clay-mono py-3 px-3 text-center">Status</th>
                <th className="w-10 py-3 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => {
                const clientProjects = projectsByClient.get(client.id) ?? [];
                const isExpanded = expandedClients.has(client.id);
                const totalEstimated = clientProjects.reduce((s, p) => s + (p.total_scoped_hours ?? 0), 0);
                const totalActual = clientProjects.reduce((s, p) => s + (hoursByProject.get(p.id) ?? 0), 0);

                return (
                  <ClientSection
                    key={client.id}
                    client={client}
                    projects={clientProjects}
                    hoursByProject={hoursByProject}
                    isExpanded={isExpanded}
                    totalEstimated={totalEstimated}
                    totalActual={totalActual}
                    projectsLoading={projectsLoading}
                    onToggle={() => toggleClient(client.id)}
                    onClientClick={() => router.push(`/client/${client.id}`)}
                    onProjectClick={(pid) => router.push(`/client/${client.id}/project/${pid}`)}
                    onEdit={() => setEditingClient(client)}
                    onDelete={() => handleDeleteClick(client.id)}
                  />
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {showForm && (
        <ClientForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingClient && (
        <ClientForm
          client={editingClient}
          onSubmit={handleEdit}
          onCancel={() => setEditingClient(null)}
        />
      )}

      <ConfirmDeleteDialog
        open={deletingClient !== null}
        title="Delete client"
        message={`Permanently delete "${deletingClient?.name ?? ''}" and all its projects, data, and history? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingClient(null)}
        loading={deleteLoading}
      />
    </div>
  );
}

// --- Client group header + project rows ---

type ClientSectionProps = {
  readonly client: Client;
  readonly projects: readonly Project[];
  readonly hoursByProject: ReadonlyMap<string, number>;
  readonly isExpanded: boolean;
  readonly totalEstimated: number;
  readonly totalActual: number;
  readonly projectsLoading: boolean;
  readonly onToggle: () => void;
  readonly onClientClick: () => void;
  readonly onProjectClick: (projectId: string) => void;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
};

function ClientSection({
  client,
  projects,
  hoursByProject,
  isExpanded,
  totalEstimated,
  totalActual,
  projectsLoading,
  onToggle,
  onClientClick,
  onProjectClick,
  onEdit,
  onDelete,
}: ClientSectionProps) {
  return (
    <>
      {/* Client header row */}
      <tr className="group border-b-2 border-oat-300 bg-cream-dark">
        <td className="py-3 pl-5 pr-2">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggle}
              className="flex h-5 w-5 items-center justify-center rounded text-oat-500 hover:bg-oat-200 hover:text-charcoal-700"
            >
              <svg
                className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-[8px] text-[11px] font-semibold text-white shadow-[var(--shadow-hard-sm)]',
                getClientSwatch(client.name)
              )}
              style={{ transform: 'rotate(-4deg)' }}
              aria-hidden="true"
            >
              {getInitials(client.name)}
            </div>
            <button
              onClick={onClientClick}
              className="text-[15px] font-semibold text-black hover:underline underline-offset-4 decoration-dashed"
            >
              {client.name}
            </button>
            {client.company && (
              <span className="text-xs text-charcoal-500">· {client.company}</span>
            )}
            <span className="clay-mono text-[11px] text-oat-500">
              {projects.length}&nbsp;{projects.length === 1 ? 'project' : 'projects'}
            </span>
          </div>
        </td>
        <td className="py-3 px-3"></td>
        <td className="py-3 px-3 text-right text-charcoal-500 font-medium">
          {totalEstimated > 0 ? formatHours(totalEstimated) : ''}
        </td>
        <td className="py-3 px-3 text-right text-charcoal-500 font-medium">
          {totalActual > 0 ? formatHours(totalActual) : ''}
        </td>
        <td className="py-3 px-3"></td>
        <td className="py-3 px-3"></td>
        <td className="py-3 px-3"></td>
        <td className="py-3 pr-4">
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={onEdit}
              className="rounded-[12px] p-1.5 text-oat-500 hover:bg-oat-200 hover:text-charcoal-700"
              aria-label="Edit client"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="rounded-[12px] p-1.5 text-oat-500 hover:bg-pomegranate-400/10 hover:text-pomegranate-600"
              aria-label="Delete client"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        </td>
      </tr>

      {/* Project rows */}
      {isExpanded && !projectsLoading && projects.map((project) => {
        const estimated = project.total_scoped_hours ?? 0;
        const actual = hoursByProject.get(project.id) ?? 0;
        const progressPercent = estimated > 0 ? Math.min(100, (actual / estimated) * 100) : 0;
        const isOverBudget = estimated > 0 && actual > estimated;

        const fee = project.type === 'retainer'
          ? project.retainer_fee
          : project.total_fee;
        const feeCurrency = project.type === 'retainer'
          ? project.retainer_fee_currency
          : project.total_fee_currency;

        // Profit calculation (simplified for table view)
        const profitDisplay = getProfitDisplay(project, actual, fee);

        return (
          <tr
            key={project.id}
            className="group cursor-pointer border-b border-oat-100 transition-colors hover:bg-oat-100/50"
            onClick={() => onProjectClick(project.id)}
          >
            <td className="py-2.5 pl-12 pr-2">
              <div className="flex items-center gap-2">
                <HealthDot progressPercent={progressPercent} deadline={project.deadline} />
                <span className="text-base" title={project.type}>{TYPE_ICONS[project.type]}</span>
                <span className="font-medium text-black">{project.name}</span>
              </div>
            </td>
            <td className="py-2.5 px-3 text-center text-charcoal-500">
              {formatDate(project.deadline ?? project.start_date)}
            </td>
            <td className="py-2.5 px-3 text-right text-charcoal-500">
              {estimated > 0 ? formatHours(estimated) : '—'}
            </td>
            <td className="py-2.5 px-3 text-right font-medium text-black">
              {actual > 0 ? formatHours(actual) : '0h'}
            </td>
            <td className="py-2.5 px-3">
              {estimated > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-oat-200">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOverBudget ? 'bg-pomegranate-400' : progressPercent >= 80 ? 'bg-lemon-500' : 'bg-matcha-500'
                      }`}
                      style={{ width: `${Math.min(100, progressPercent)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${isOverBudget ? 'text-pomegranate-600' : 'text-charcoal-500'}`}>
                    {progressPercent.toFixed(0)}%
                  </span>
                </div>
              ) : (
                <span className="text-xs text-oat-500">—</span>
              )}
            </td>
            <td className="py-2.5 px-3 text-right">
              <span className={`text-sm font-medium ${profitDisplay.color}`}>
                {profitDisplay.text}
              </span>
            </td>
            <td className="py-2.5 px-3 text-center">
              <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[project.status]}`}>
                {project.status}
              </span>
            </td>
            <td className="py-2.5 pr-4"></td>
          </tr>
        );
      })}

      {/* Loading state for projects */}
      {isExpanded && projectsLoading && (
        <tr>
          <td colSpan={8} className="py-2 pl-12">
            <Skeleton className="h-6 w-48" />
          </td>
        </tr>
      )}

      {/* No projects */}
      {isExpanded && !projectsLoading && projects.length === 0 && (
        <tr>
          <td colSpan={8} className="py-3 pl-12 text-sm text-oat-500 italic">
            No projects yet
          </td>
        </tr>
      )}
    </>
  );
}

function getHealthLevel(progressPercent: number, deadline: string | null): 'green' | 'amber' | 'red' {
  if (progressPercent >= 90) return 'red';
  if (progressPercent >= 70) return 'amber';

  if (deadline) {
    const daysUntil = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) return 'red';
    if (daysUntil <= 7 && progressPercent < 70) return 'amber';
  }

  return 'green';
}

const HEALTH_COLORS = {
  green: 'bg-matcha-500',
  amber: 'bg-lemon-500',
  red: 'bg-pomegranate-400',
} as const;

function HealthDot({ progressPercent, deadline }: { readonly progressPercent: number; readonly deadline: string | null }) {
  const level = getHealthLevel(progressPercent, deadline);
  return (
    <span
      className={`inline-block h-2 w-2 flex-shrink-0 rounded-full ${HEALTH_COLORS[level]}`}
      title={level === 'red' ? 'Over budget or overdue' : level === 'amber' ? 'Approaching budget or deadline' : 'On track'}
    />
  );
}

function getProfitDisplay(project: Project, actualHours: number, fee: number | null): { text: string; color: string } {
  if (!fee || fee === 0) return { text: '—', color: 'text-oat-500' };

  if (project.type === 'retainer') {
    return { text: formatMoney(fee, project.retainer_fee_currency), color: 'text-charcoal-700' };
  }

  if (project.type === 'project' || project.type === 'hour_bank') {
    const scopedHours = project.total_scoped_hours ?? 0;
    if (scopedHours === 0) return { text: formatMoney(fee, project.total_fee_currency), color: 'text-charcoal-700' };

    const consumedPercent = scopedHours > 0 ? (actualHours / scopedHours) * 100 : 0;
    const feeText = formatMoney(fee, project.total_fee_currency);

    if (consumedPercent > 100) {
      return { text: `${feeText} (${consumedPercent.toFixed(0)}%)`, color: 'text-pomegranate-600' };
    }
    if (consumedPercent >= 80) {
      return { text: `${feeText} (${consumedPercent.toFixed(0)}%)`, color: 'text-lemon-700' };
    }
    return { text: `${feeText} (${consumedPercent.toFixed(0)}%)`, color: 'text-matcha-600' };
  }

  return { text: '—', color: 'text-oat-500' };
}
