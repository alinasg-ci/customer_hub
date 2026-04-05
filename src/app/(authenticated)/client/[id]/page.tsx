'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { fetchClientById } from '@/modules/clients';
import { ProjectCard, ProjectForm, SubProjectList, useProjects } from '@/modules/projects';
import { ConfirmDeleteDialog } from '@/shared/ui/ConfirmDeleteDialog';
import { Skeleton } from '@/shared/ui/Skeleton';
import type { Client } from '@/modules/clients';
import type { CreateProjectInput, Project } from '@/modules/projects';

export default function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [clientLoading, setClientLoading] = useState(true);
  const [clientError, setClientError] = useState<string | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [expandedHourBank, setExpandedHourBank] = useState<string | null>(null);
  const { projects, loading: projectsLoading, error: projectsError, add, setStatus, remove } = useProjects(id);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadClient() {
      try {
        const data = await fetchClientById(id);
        setClient(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load client';
        setClientError(message);
      } finally {
        setClientLoading(false);
      }
    }
    loadClient();
  }, [id]);

  const handleCreateProject = useCallback(async (data: CreateProjectInput) => {
    await add(data);
    setShowProjectForm(false);
  }, [add]);

  const handleDeleteClick = useCallback((projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) setDeletingProject(project);
  }, [projects]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingProject) return;
    setDeleteLoading(true);
    try {
      await remove(deletingProject.id);
      setDeletingProject(null);
    } catch {
      // Error handled by hook
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingProject, remove]);

  if (clientLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (clientError || !client) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">{clientError ?? 'Client not found'}</p>
        <button onClick={() => router.push('/')} className="mt-2 text-sm font-medium text-red-600 hover:text-red-800">
          Back to clients
        </button>
      </div>
    );
  }

  const activeProjects = projects.filter((p) => p.status === 'active');
  const pendingProjects = projects.filter((p) => p.status === 'pending');
  const closedProjects = projects.filter((p) => p.status === 'closed');

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => router.push('/')}
          className="mb-3 flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-slate-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to clients
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{client.name}</h1>
            {client.company && (
              <p className="mt-0.5 text-sm text-slate-500">{client.company}</p>
            )}
          </div>
          <button
            onClick={() => setShowProjectForm(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Project
          </button>
        </div>
      </div>

      {projectsLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ) : projectsError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{projectsError}</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
            <svg className="h-7 w-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-900">No projects yet</h3>
          <p className="mt-1 text-sm text-slate-500">Create your first project to start tracking.</p>
          <button
            onClick={() => setShowProjectForm(true)}
            className="mt-5 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create project
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {activeProjects.length > 0 && (
            <section>
              <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Active ({activeProjects.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {activeProjects.map((project) => (
                  <div key={project.id}>
                    <ProjectCard project={project} onStatusChange={setStatus} onDelete={handleDeleteClick} onClick={(pid) => router.push(`/client/${id}/project/${pid}`)} />
                    {project.type === 'hour_bank' && (
                      <div className="mt-1.5">
                        <button
                          onClick={() => setExpandedHourBank(expandedHourBank === project.id ? null : project.id)}
                          className="text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-800"
                        >
                          {expandedHourBank === project.id ? 'Hide' : 'Show'} sub-projects
                        </button>
                        {expandedHourBank === project.id && (
                          <SubProjectList projectId={project.id} totalBankHours={project.total_scoped_hours} />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {pendingProjects.length > 0 && (
            <section>
              <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Pending ({pendingProjects.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {pendingProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} onStatusChange={setStatus} onDelete={handleDeleteClick} onClick={(pid) => router.push(`/client/${id}/project/${pid}`)} />
                ))}
              </div>
            </section>
          )}

          {closedProjects.length > 0 && (
            <section>
              <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Closed ({closedProjects.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {closedProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} onStatusChange={setStatus} onDelete={handleDeleteClick} onClick={(pid) => router.push(`/client/${id}/project/${pid}`)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {showProjectForm && (
        <ProjectForm
          clientId={id}
          onSubmit={handleCreateProject}
          onCancel={() => setShowProjectForm(false)}
        />
      )}

      <ConfirmDeleteDialog
        open={deletingProject !== null}
        title="Delete project"
        message={`Permanently delete "${deletingProject?.name ?? ''}" and all its phases, time entries, expenses, and planning table? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingProject(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
