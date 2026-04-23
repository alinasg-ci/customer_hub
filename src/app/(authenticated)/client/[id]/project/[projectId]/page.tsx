'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { fetchProjectById, updateProject, ProjectForm } from '@/modules/projects';
import { usePlanning, useTasks, MyPlanningView, CustomerPlanningView, ProgressTree } from '@/modules/planning';
import { useTimeEntries } from '@/modules/time-tracking';
import { RecordButton, RecordedTimeTable, useRecordedEntries } from '@/modules/recording';
import { ManualEntryForm } from '@/modules/reports';
import { ProfitabilityCard } from '@/modules/profitability';
import { ExpenseList, useExpenses } from '@/modules/expenses';
import { EmailsTab } from '@/modules/email';
import { Skeleton } from '@/shared/ui/Skeleton';
import { cn } from '@/shared/utils/cn';
import type { Project, CreateProjectInput, UpdateProjectInput } from '@/modules/projects';

const TYPE_LABELS: Record<string, string> = {
  project: 'Project',
  retainer: 'Retainer',
  hour_bank: 'Hour Bank',
};

const CURRENCY_SYMBOLS: Record<string, string> = { ILS: '\u20AA', USD: '$', EUR: '\u20AC' };

type Tab = 'planner' | 'time' | 'finances' | 'emails' | 'comments';
type PlannerSubTab = 'my-planning' | 'customer-planning';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'planner', label: 'Planner', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
{ id: 'time', label: 'Time Logged', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'finances', label: 'Finances', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'emails', label: 'Emails', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { id: 'comments', label: 'Comments', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
];

export default function ProjectPage({ params }: { params: Promise<{ id: string; projectId: string }> }) {
  const { id: clientId, projectId } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('planner');
  const [plannerSubTab, setPlannerSubTab] = useState<PlannerSubTab>('my-planning');
  const [showEditForm, setShowEditForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  const loadProject = useCallback(async () => {
    try {
      const data = await fetchProjectById(projectId);
      setProject(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load project';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const handleEditSubmit = useCallback(async (data: CreateProjectInput) => {
    const { client_id: _, type: __, ...fields } = data;
    await updateProject(projectId, fields as UpdateProjectInput);
    await loadProject();
    setShowEditForm(false);
  }, [projectId, loadProject]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="rounded-[12px] border border-pomegranate-400 bg-pomegranate-300/20 p-4">
        <p className="text-sm text-pomegranate-600">{error ?? 'Project not found'}</p>
        <button onClick={() => router.back()} className="mt-2 text-sm font-medium text-pomegranate-600 underline underline-offset-4 decoration-dashed hover:text-black">
          Go back
        </button>
      </div>
    );
  }

  const tintColor =
    project.type === 'retainer' ? 'var(--color-slushie-500)' :
    project.type === 'hour_bank' ? 'var(--color-ube-500)' :
    'var(--color-matcha-500)';

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => router.push(`/client/${clientId}`)}
        className="mb-3 flex items-center gap-1 text-sm text-charcoal-500 transition-colors hover:text-black"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to client
      </button>

      {/* Hero greeting */}
      <section className="relative mb-8">
        <div className="clay-label">{TYPE_LABELS[project.type].toUpperCase()} · {project.status.toUpperCase()}</div>
        <h1
          className="my-2 font-semibold text-black"
          style={{
            fontSize: 'clamp(40px, 5vw, 64px)',
            lineHeight: 0.98,
            letterSpacing: '-0.03em',
            fontFeatureSettings: '"ss01","ss03"',
          }}
        >
          <em className="not-italic" style={{ color: tintColor }}>{project.name}</em>
        </h1>
        {project.deadline && (
          <p className="clay-mono mt-2 text-[13px] text-charcoal-500">
            Due {new Date(project.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        )}
        <div
          className="clay-sticker absolute right-2 top-2 hidden sm:inline-flex"
          style={{ transform: 'rotate(-6deg)' }}
        >
          ★ Active project
        </div>
      </section>

      {/* Project header card */}
      <ProjectHeaderCard
        project={project}
        clientId={clientId}
        refreshKey={refreshKey}
        tintColor={tintColor}
        onEdit={() => setShowEditForm(true)}
        onRecordingSaved={() => setRefreshKey((k) => k + 1)}
      />

      {/* Tab navigation — pill bar */}
      <div className="mb-6 mt-2 inline-flex items-center gap-1 rounded-[12px] border border-oat-300 bg-cream-dark p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-black text-white shadow-[var(--shadow-hard-sm)]'
                : 'text-charcoal-500 hover:bg-white hover:text-black'
            )}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === 'planner' && (
          <PlannerTab projectId={project.id} projectName={project.name} activeSubTab={plannerSubTab} onSubTabChange={setPlannerSubTab} onDataChanged={() => setRefreshKey((k) => k + 1)} />
        )}
        {activeTab === 'time' && (
          <TimeLoggedTab projectId={project.id} onDataChanged={() => setRefreshKey((k) => k + 1)} />
        )}
        {activeTab === 'finances' && (
          <FinancesTab project={project} projectId={project.id} />
        )}
        {activeTab === 'emails' && <EmailsTab clientId={clientId} projectId={project.id} />}
        {activeTab === 'comments' && <EmptyTabPlaceholder icon="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" title="Comments" description="Project notes and comments will appear here." />}
      </div>

      {/* Edit project form */}
      {showEditForm && (
        <ProjectForm
          clientId={clientId}
          project={project}
          onSubmit={handleEditSubmit}
          onCancel={() => setShowEditForm(false)}
        />
      )}
    </div>
  );
}

// ─── Project Header Card ──────────────────────────────────────────────────────

function ProjectHeaderCard({ project, clientId, refreshKey, tintColor, onEdit, onRecordingSaved }: {
  readonly project: Project;
  readonly clientId: string;
  readonly refreshKey: number;
  readonly tintColor: string;
  readonly onEdit: () => void;
  readonly onRecordingSaved: () => void;
}) {
  return (
    <div className="clay-card-static mb-6 overflow-hidden">
      {/* Colored top stripe matching overview KPI/card pattern */}
      <div className="h-[6px]" style={{ background: tintColor }} />

      {/* Top section: badges, actions */}
      <div className="relative flex items-center justify-between border-b border-oat-200 px-6 py-4">
        <div className="clay-hatch absolute inset-0 opacity-40 pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <span
            className="rounded-[8px] border-[1.5px] border-black px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
            style={{ background: tintColor, color: project.type === 'hour_bank' ? '#fff' : '#000' }}
          >
            {TYPE_LABELS[project.type]}
          </span>
          <span className={cn(
            'rounded-md border px-1.5 py-0.5 text-[11px] font-medium',
            project.status === 'active' ? 'bg-matcha-300/30 text-matcha-800 border-matcha-500' :
            project.status === 'pending' ? 'bg-lemon-400/30 text-lemon-800 border-lemon-700' :
            'bg-oat-100 text-charcoal-500 border-oat-300'
          )}>
            {project.status}
          </span>
          {project.deadline && (
            <span className="clay-mono flex items-center gap-1 text-[11px] text-charcoal-500">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              {new Date(project.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
            </span>
          )}
        </div>
        <div className="relative flex items-center gap-2">
          <button
            onClick={onEdit}
            className="clay-btn clay-btn-secondary flex items-center gap-1.5 text-sm"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
            Edit
          </button>
          <RecordButtonWithPhases projectId={project.id} projectName={project.name} clientId={clientId} onEntrySaved={onRecordingSaved} />
        </div>
      </div>

      {/* Expandable progress tree */}
      <ProgressTree projectId={project.id} refreshKey={refreshKey} />
    </div>
  );
}

// ─── Tab components ───────────────────────────────────────────────────────────

function PlannerTab({ projectId, projectName, activeSubTab, onSubTabChange, onDataChanged }: {
  readonly projectId: string;
  readonly projectName: string;
  readonly activeSubTab: PlannerSubTab;
  readonly onSubTabChange: (tab: PlannerSubTab) => void;
  readonly onDataChanged?: () => void;
}) {
  return (
    <div>
      <div className="mb-6 inline-flex gap-1 rounded-[12px] border border-oat-300 bg-cream-dark p-1">
        <button
          onClick={() => onSubTabChange('my-planning')}
          className={cn(
            'rounded-[10px] px-4 py-2 text-sm font-medium transition-all',
            activeSubTab === 'my-planning' ? 'bg-white text-black shadow-[var(--shadow-clay)] border border-oat-300' : 'text-charcoal-500 hover:text-black'
          )}
        >
          My Planning
        </button>
        <button
          onClick={() => onSubTabChange('customer-planning')}
          className={cn(
            'rounded-[10px] px-4 py-2 text-sm font-medium transition-all',
            activeSubTab === 'customer-planning' ? 'bg-white text-black shadow-[var(--shadow-clay)] border border-oat-300' : 'text-charcoal-500 hover:text-black'
          )}
        >
          Customer Planning
        </button>
      </div>

      {activeSubTab === 'my-planning' && (
        <MyPlanningView projectId={projectId} onDataChanged={onDataChanged} />
      )}
      {activeSubTab === 'customer-planning' && (
        <CustomerPlanningView projectId={projectId} projectName={projectName} />
      )}
    </div>
  );
}

function TimeLoggedTab({ projectId, onDataChanged }: { readonly projectId: string; readonly onDataChanged: () => void }) {
  const { phases } = usePlanning(projectId);
  const { tasks } = useTasks(projectId);
  const { entries, loading, totalHours, editEntry, removeEntry, addEntry } = useRecordedEntries(projectId);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAdd = async (input: Parameters<typeof addEntry>[0]) => {
    await addEntry(input);
    setShowAddForm(false);
    onDataChanged();
  };

  const handleEdit = async (id: string, input: Parameters<typeof editEntry>[1]) => {
    await editEntry(id, input);
    onDataChanged();
  };

  const handleDelete = async (id: string) => {
    await removeEntry(id);
    onDataChanged();
  };

  return (
    <>
      <RecordedTimeTable
        entries={entries}
        phases={phases}
        tasks={tasks}
        loading={loading}
        totalHours={totalHours}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={() => setShowAddForm(true)}
      />
      {showAddForm && (
        <ManualEntryForm
          projectId={projectId}
          phases={phases}
          tasks={tasks}
          onSubmit={handleAdd}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </>
  );
}

function FinancesTab({ project, projectId }: { readonly project: Project; readonly projectId: string }) {
  const { phases } = usePlanning(projectId);
  const { totalHours } = useTimeEntries(projectId);
  const { totalIls } = useExpenses(projectId);

  return (
    <div className="space-y-6">
      <ProfitabilityCard project={project} actualHours={totalHours} totalExpensesIls={totalIls} />
      <ExpenseList projectId={projectId} phases={phases} />
    </div>
  );
}

function EmptyTabPlaceholder({ icon, title, description }: {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}) {
  return (
    <div className="clay-card-dashed relative flex flex-col items-center justify-center overflow-hidden py-16">
      <div className="clay-hatch absolute inset-0 opacity-50" />
      <div
        className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-[12px] border-[1.5px] border-black bg-lemon-500 shadow-[var(--shadow-hard-sm)]"
        style={{ transform: 'rotate(-6deg)' }}
      >
        <svg className="h-6 w-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <h3 className="relative text-base font-semibold text-black">{title}</h3>
      <p className="relative mt-1 max-w-sm text-center text-sm text-charcoal-500">{description}</p>
    </div>
  );
}

// ─── Data wrapper components ──────────────────────────────────────────────────

function RecordButtonWithPhases({ projectId, projectName, clientId, onEntrySaved }: { projectId: string; projectName: string; clientId: string; onEntrySaved?: () => void }) {
  const { phases } = usePlanning(projectId);
  const { tasks } = useTasks(projectId);
  const { reload } = useTimeEntries(projectId);
  const handleSaved = useCallback(() => {
    reload();
    onEntrySaved?.();
  }, [reload, onEntrySaved]);
  return <RecordButton projectId={projectId} projectName={projectName} clientId={clientId} phases={phases} tasks={tasks} onEntrySaved={handleSaved} />;
}
