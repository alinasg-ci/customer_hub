'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { fetchProjectById } from '@/modules/projects';
import { PlanningBoard, usePlanning } from '@/modules/planning';
import { SubProjectList } from '@/modules/projects';
import { NoteList } from '@/modules/notes';
import { ExpenseList } from '@/modules/expenses';
import { TimeEntryList, UnassignedQueue, useTimeEntries } from '@/modules/time-tracking';
import { ProfitabilityCard } from '@/modules/profitability';
import { useExpenses } from '@/modules/expenses';
import { ReportTable } from '@/modules/reports';
import { Skeleton } from '@/shared/ui/Skeleton';
import type { Project } from '@/modules/projects';

const TYPE_LABELS: Record<string, string> = {
  project: 'Project',
  retainer: 'Retainer',
  hour_bank: 'Hour Bank',
};

const CURRENCY_SYMBOLS: Record<string, string> = { ILS: '₪', USD: '$', EUR: '€' };

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
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
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
        className="mb-2 text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Back to client
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {TYPE_LABELS[project.type]}
          </span>
        </div>

        {/* Project summary */}
        <div className="mt-3 grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 text-sm sm:grid-cols-4">
          {project.type === 'project' && (
            <>
              <div>
                <span className="text-gray-500">Fee</span>
                <p className="font-semibold">{formatMoney(project.total_fee, project.total_fee_currency)}</p>
              </div>
              <div>
                <span className="text-gray-500">Scoped Hours</span>
                <p className="font-semibold">{project.total_scoped_hours ?? '-'}h</p>
              </div>
              <div>
                <span className="text-gray-500">Rate</span>
                <p className="font-semibold">{formatMoney(project.rate_per_hour, project.rate_currency)}/h</p>
              </div>
              {project.deadline && (
                <div>
                  <span className="text-gray-500">Deadline</span>
                  <p className="font-semibold">{new Date(project.deadline).toLocaleDateString()}</p>
                </div>
              )}
            </>
          )}
          {project.type === 'retainer' && (
            <>
              <div>
                <span className="text-gray-500">Periodic Fee</span>
                <p className="font-semibold">{formatMoney(project.retainer_fee, project.retainer_fee_currency)}</p>
              </div>
              <div>
                <span className="text-gray-500">Billing Period</span>
                <p className="font-semibold capitalize">{project.billing_period}</p>
              </div>
              {project.start_date && (
                <div>
                  <span className="text-gray-500">Start Date</span>
                  <p className="font-semibold">{new Date(project.start_date).toLocaleDateString()}</p>
                </div>
              )}
            </>
          )}
          {project.type === 'hour_bank' && (
            <>
              <div>
                <span className="text-gray-500">Bank Hours</span>
                <p className="font-semibold">{project.total_scoped_hours ?? '-'}h</p>
              </div>
              <div>
                <span className="text-gray-500">Total Cost</span>
                <p className="font-semibold">{formatMoney(project.total_fee, project.total_fee_currency)}</p>
              </div>
              <div>
                <span className="text-gray-500">Rate</span>
                <p className="font-semibold">{formatMoney(project.rate_per_hour, project.rate_currency)}/h</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Profitability */}
      <div className="mb-6">
        <ProfitabilityWithData project={project} />
      </div>

      {/* Sub-projects for hour banks */}
      {project.type === 'hour_bank' && (
        <div className="mb-6">
          <SubProjectList projectId={project.id} totalBankHours={project.total_scoped_hours} />
        </div>
      )}

      {/* Planning board */}
      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Planning</h2>
        <PlanningBoard projectId={project.id} />
      </div>

      {/* Time entries */}
      <div className="mb-6">
        <TimeEntryList projectId={project.id} />
      </div>

      {/* Phase keyword mapping */}
      <div className="mb-6">
        <PhaseMapperWithPhases projectId={project.id} />
      </div>

      {/* Dynamic report */}
      <div className="mb-6">
        <ReportWithPhases projectId={project.id} />
      </div>

      {/* Expenses */}
      <div className="mb-6">
        <ExpenseListWithPhases projectId={project.id} />
      </div>

      {/* Project-level notes */}
      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Notes</h2>
        <NoteList parentType="project" parentId={project.id} />
      </div>
    </div>
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
