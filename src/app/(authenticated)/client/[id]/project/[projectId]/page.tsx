'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { fetchProjectById } from '@/modules/projects';
import { PlanningBoard, usePlanning } from '@/modules/planning';
import { SubProjectList } from '@/modules/projects';
import { NoteList } from '@/modules/notes';
import { ExpenseList } from '@/modules/expenses';
import { TimeEntryList, UnassignedQueue, SyncPreview, useTimeEntries } from '@/modules/time-tracking';
import { ProfitabilityCard } from '@/modules/profitability';
import { useExpenses } from '@/modules/expenses';
import { ReportTable } from '@/modules/reports';
import { PlanningTableView } from '@/modules/planning-table';
import { ComparisonPanel } from '@/modules/comparison';
import { Skeleton } from '@/shared/ui/Skeleton';
import type { Project } from '@/modules/projects';

const TYPE_LABELS: Record<string, string> = {
  project: 'Project',
  retainer: 'Retainer',
  hour_bank: 'Hour Bank',
};

const CURRENCY_SYMBOLS: Record<string, string> = { ILS: '\u20AA', USD: '$', EUR: '\u20AC' };

export default function ProjectPage({ params }: { params: Promise<{ id: string; projectId: string }> }) {
  const { id: clientId, projectId } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadProject() {
      try {
        const data = await fetchProjectById(projectId);
        setProject(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load project';
        setError(message);
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">{error ?? 'Project not found'}</p>
        <button onClick={() => router.back()} className="mt-2 text-sm font-medium text-red-600 hover:text-red-800">
          Go back
        </button>
      </div>
    );
  }

  function formatMoney(amount: number | null, currency: string): string {
    if (amount === null) return '-';
    const symbol = CURRENCY_SYMBOLS[currency] ?? '';
    return `${symbol}${amount.toLocaleString('en-IL', { minimumFractionDigits: 2 })}`;
  }

  return (
    <div>
      <button
        onClick={() => router.push(`/client/${clientId}`)}
        className="mb-3 flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-slate-700"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to client
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{project.name}</h1>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            {TYPE_LABELS[project.type]}
          </span>
        </div>

        {/* Project summary */}
        <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-5 text-sm sm:grid-cols-4">
          {project.type === 'project' && (
            <>
              <div>
                <span className="text-xs text-slate-400">Fee</span>
                <p className="font-semibold text-slate-900">{formatMoney(project.total_fee, project.total_fee_currency)}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Scoped Hours</span>
                <p className="font-semibold text-slate-900">{project.total_scoped_hours ?? '-'}h</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Rate</span>
                <p className="font-semibold text-slate-900">{formatMoney(project.rate_per_hour, project.rate_currency)}/h</p>
              </div>
              {project.deadline && (
                <div>
                  <span className="text-xs text-slate-400">Deadline</span>
                  <p className="font-semibold text-slate-900">{new Date(project.deadline).toLocaleDateString()}</p>
                </div>
              )}
            </>
          )}
          {project.type === 'retainer' && (
            <>
              <div>
                <span className="text-xs text-slate-400">Periodic Fee</span>
                <p className="font-semibold text-slate-900">{formatMoney(project.retainer_fee, project.retainer_fee_currency)}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Billing Period</span>
                <p className="font-semibold capitalize text-slate-900">{project.billing_period}</p>
              </div>
              {project.start_date && (
                <div>
                  <span className="text-xs text-slate-400">Start Date</span>
                  <p className="font-semibold text-slate-900">{new Date(project.start_date).toLocaleDateString()}</p>
                </div>
              )}
            </>
          )}
          {project.type === 'hour_bank' && (
            <>
              <div>
                <span className="text-xs text-slate-400">Bank Hours</span>
                <p className="font-semibold text-slate-900">{project.total_scoped_hours ?? '-'}h</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Total Cost</span>
                <p className="font-semibold text-slate-900">{formatMoney(project.total_fee, project.total_fee_currency)}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Rate</span>
                <p className="font-semibold text-slate-900">{formatMoney(project.rate_per_hour, project.rate_currency)}/h</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Profitability */}
      <div className="mb-8">
        <ProfitabilityWithData project={project} />
      </div>

      {/* Sub-projects for hour banks */}
      {project.type === 'hour_bank' && (
        <div className="mb-8">
          <SubProjectList projectId={project.id} totalBankHours={project.total_scoped_hours} />
        </div>
      )}

      {/* Planning board (M1 — budget/internal tiles) */}
      <div className="mb-8">
        <SectionHeader title="Planning" />
        <PlanningBoard projectId={project.id} />
      </div>

      {/* Budget vs Plan vs Actual comparison (M2) */}
      <div className="mb-8">
        <SectionHeader title="Budget vs Plan vs Actual" />
        <ComparisonWithData projectId={project.id} />
      </div>

      {/* Internal planning table (M2 — hierarchical project plan) */}
      <div className="mb-8">
        <SectionHeader title="Project Plan" />
        <PlanningTableView projectId={project.id} clientId={clientId} />
      </div>

      {/* Toggl sync preview (M2) */}
      <div className="mb-8">
        <SyncPreviewWithPhases projectId={project.id} />
      </div>

      {/* Time entries */}
      <div className="mb-8">
        <TimeEntryList projectId={project.id} />
      </div>

      {/* Phase keyword mapping */}
      <div className="mb-8">
        <PhaseMapperWithPhases projectId={project.id} />
      </div>

      {/* Dynamic report */}
      <div className="mb-8">
        <ReportWithPhases projectId={project.id} />
      </div>

      {/* Expenses */}
      <div className="mb-8">
        <ExpenseListWithPhases projectId={project.id} />
      </div>

      {/* Project-level notes */}
      <div className="mb-8">
        <SectionHeader title="Notes" />
        <NoteList parentType="project" parentId={project.id} />
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="mb-4 text-base font-semibold text-slate-900">{title}</h2>
  );
}

// Wrapper to load phases for the expense form's phase dropdown
function ExpenseListWithPhases({ projectId }: { projectId: string }) {
  const { phases } = usePlanning(projectId);
  return <ExpenseList projectId={projectId} phases={phases} />;
}

// Wrapper to load phases for the phase mapping UI
function PhaseMapperWithPhases({ projectId }: { projectId: string }) {
  const { phases } = usePlanning(projectId);
  return <UnassignedQueue projectId={projectId} phases={phases} />;
}

// Wrapper to load actual hours + expenses for profitability
function ProfitabilityWithData({ project }: { project: Project }) {
  const { totalHours } = useTimeEntries(project.id);
  const { totalIls } = useExpenses(project.id);
  return <ProfitabilityCard project={project} actualHours={totalHours} totalExpensesIls={totalIls} />;
}

// Wrapper to load phases for the report table
function ReportWithPhases({ projectId }: { projectId: string }) {
  const { phases } = usePlanning(projectId);
  return <ReportTable projectId={projectId} phases={phases} />;
}

// Wrapper to load phases + time entries for comparison panel
function ComparisonWithData({ projectId }: { projectId: string }) {
  const { phases } = usePlanning(projectId);
  const { entries } = useTimeEntries(projectId);
  return <ComparisonPanel projectId={projectId} phases={phases} timeEntries={entries} />;
}

// Wrapper to load phases for sync preview
function SyncPreviewWithPhases({ projectId }: { projectId: string }) {
  const { phases } = usePlanning(projectId);
  const { reload } = useTimeEntries(projectId);
  return <SyncPreview phases={phases} onSyncComplete={reload} />;
}
