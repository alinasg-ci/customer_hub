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
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (clientError || !client) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
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
      <div className="mb-6">
        <button
          onClick={() => router.push('/')}
          className="mb-2 text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to clients
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            {client.company && (
              <p className="text-sm text-gray-500">{client.company}</p>
            )}
          </div>
          <button
            onClick={() => setShowProjectForm(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New Project
          </button>
        </div>
      </div>

      {projectsLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : projectsError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{projectsError}</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500">No projects yet.</p>
          <button
            onClick={() => setShowProjectForm(true)}
            className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Create your first project
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {activeProjects.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Active ({activeProjects.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {activeProjects.map((project) => (
                  <div key={project.id}>
                    <ProjectCard project={project} onStatusChange={setStatus} onDelete={handleDeleteClick} onClick={(pid) => router.push(`/client/${id}/project/${pid}`)} />
                    {project.type === 'hour_bank' && (
                      <div className="mt-1">
                        <button
                          onClick={() => setExpandedHourBank(expandedHourBank === project.id ? null : project.id)}
                          className="text-xs text-blue-600 hover:text-blue-800"
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
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
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
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
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
