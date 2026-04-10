'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useClients } from '../hooks/useClients';
import { ClientForm } from './ClientForm';
import { ConfirmDeleteDialog } from '@/shared/ui/ConfirmDeleteDialog';
import { Skeleton } from '@/shared/ui/Skeleton';
import { fetchAllProjects } from '@/modules/projects';
import { fetchHoursByProject } from '@/modules/time-tracking';
import type { Client, CreateClientInput, UpdateClientInput } from '../types';
import type { Project } from '@/modules/projects';
import { formatHours } from '@/shared/utils/formatHours';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  closed: 'bg-slate-100 text-slate-500 border-slate-200',
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
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">{error}</p>
        <button onClick={reload} className="mt-2 text-sm font-medium text-red-600 hover:text-red-800">
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

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">
            {clients.length} {clients.length === 1 ? 'client' : 'clients'} · {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Client
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-20">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
            <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">No clients yet</h2>
          <p className="mt-1.5 max-w-sm text-center text-sm text-slate-500">
            Add your first client to start tracking projects, hours, and profitability.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-6 flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create your first client
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                <th className="py-3 pl-4 pr-2">Project / Client</th>
                <th className="py-3 px-3 text-center">Due date</th>
                <th className="py-3 px-3 text-right">Estimated</th>
                <th className="py-3 px-3 text-right">Actual</th>
                <th className="py-3 px-3 w-40">Progress</th>
                <th className="py-3 px-3 text-right">Value</th>
                <th className="py-3 px-3 text-center">Status</th>
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
      <tr className="group border-b border-slate-100 bg-slate-50/50">
        <td className="py-3 pl-4 pr-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggle}
              className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-600"
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
            <button
              onClick={onClientClick}
              className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              {client.name}
            </button>
            {client.company && (
              <span className="text-xs text-slate-400">{client.company}</span>
            )}
            <span className="text-[11px] text-slate-400">
              ({projects.length} {projects.length === 1 ? 'project' : 'projects'})
            </span>
          </div>
        </td>
        <td className="py-3 px-3"></td>
        <td className="py-3 px-3 text-right text-slate-500 font-medium">
          {totalEstimated > 0 ? formatHours(totalEstimated) : ''}
        </td>
        <td className="py-3 px-3 text-right text-slate-500 font-medium">
          {totalActual > 0 ? formatHours(totalActual) : ''}
        </td>
        <td className="py-3 px-3"></td>
        <td className="py-3 px-3"></td>
        <td className="py-3 px-3"></td>
        <td className="py-3 pr-4">
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={onEdit}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              aria-label="Edit client"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
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
            className="group cursor-pointer border-b border-slate-50 transition-colors hover:bg-slate-50"
            onClick={() => onProjectClick(project.id)}
          >
            <td className="py-2.5 pl-12 pr-2">
              <div className="flex items-center gap-2">
                <span className="text-base" title={project.type}>{TYPE_ICONS[project.type]}</span>
                <span className="font-medium text-slate-900">{project.name}</span>
              </div>
            </td>
            <td className="py-2.5 px-3 text-center text-slate-500">
              {formatDate(project.deadline ?? project.start_date)}
            </td>
            <td className="py-2.5 px-3 text-right text-slate-600">
              {estimated > 0 ? formatHours(estimated) : '—'}
            </td>
            <td className="py-2.5 px-3 text-right font-medium text-slate-900">
              {actual > 0 ? formatHours(actual) : '0h'}
            </td>
            <td className="py-2.5 px-3">
              {estimated > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOverBudget ? 'bg-red-500' : progressPercent >= 80 ? 'bg-amber-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(100, progressPercent)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${isOverBudget ? 'text-red-600' : 'text-slate-500'}`}>
                    {progressPercent.toFixed(0)}%
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">—</span>
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
          <td colSpan={8} className="py-3 pl-12 text-sm text-slate-400 italic">
            No projects yet
          </td>
        </tr>
      )}
    </>
  );
}

function getProfitDisplay(project: Project, actualHours: number, fee: number | null): { text: string; color: string } {
  if (!fee || fee === 0) return { text: '—', color: 'text-slate-400' };

  if (project.type === 'retainer') {
    return { text: formatMoney(fee, project.retainer_fee_currency), color: 'text-slate-700' };
  }

  if (project.type === 'project' || project.type === 'hour_bank') {
    const scopedHours = project.total_scoped_hours ?? 0;
    if (scopedHours === 0) return { text: formatMoney(fee, project.total_fee_currency), color: 'text-slate-700' };

    const consumedPercent = scopedHours > 0 ? (actualHours / scopedHours) * 100 : 0;
    const feeText = formatMoney(fee, project.total_fee_currency);

    if (consumedPercent > 100) {
      return { text: `${feeText} (${consumedPercent.toFixed(0)}%)`, color: 'text-red-600' };
    }
    if (consumedPercent >= 80) {
      return { text: `${feeText} (${consumedPercent.toFixed(0)}%)`, color: 'text-amber-600' };
    }
    return { text: `${feeText} (${consumedPercent.toFixed(0)}%)`, color: 'text-emerald-600' };
  }

  return { text: '—', color: 'text-slate-400' };
}
