'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePlanning } from '../hooks/usePlanning';
import { useTasks } from '../hooks/useTasks';
import { useTimeEntries } from '@/modules/time-tracking';
import { formatHours } from '@/shared/utils/formatHours';
import { cn } from '@/shared/utils/cn';
import { Skeleton } from '@/shared/ui/Skeleton';

type ProgressTreeProps = {
  readonly projectId: string;
  readonly refreshKey?: number;
};

const STRIPE_STYLE = {
  backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(99,102,241,0.25) 3px, rgba(99,102,241,0.25) 6px)',
  backgroundColor: 'rgba(99,102,241,0.15)',
};

const STRIPE_LEGEND_STYLE = {
  backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(99,102,241,0.4) 2px, rgba(99,102,241,0.4) 4px)',
  backgroundColor: 'rgba(99,102,241,0.15)',
};

export function ProgressTree({ projectId, refreshKey }: ProgressTreeProps) {
  const { phases, totalQuotedHours, totalInternalHours, loading: phasesLoading, reload: reloadPhases } = usePlanning(projectId);
  const { tasksByPhase, loading: tasksLoading, reload: reloadTasks } = useTasks(projectId);
  const { entries, totalHours, loading: entriesLoading, reload: reloadEntries } = useTimeEntries(projectId);

  const [projectExpanded, setProjectExpanded] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  // Reload all data when refreshKey changes (e.g., after recording stops)
  useEffect(() => {
    if (refreshKey !== undefined && refreshKey > 0) {
      reloadEntries();
      reloadTasks();
      reloadPhases();
    }
  }, [refreshKey, reloadEntries, reloadTasks, reloadPhases]);

  // Build hours maps
  const { hoursByPhase, hoursByTask } = useMemo(() => {
    const byPhase = new Map<string, number>();
    const byTask = new Map<string, number>();
    for (const e of entries) {
      if (e.phaseId) {
        byPhase.set(e.phaseId, (byPhase.get(e.phaseId) ?? 0) + e.durationHours);
      }
      if (e.taskId) {
        byTask.set(e.taskId, (byTask.get(e.taskId) ?? 0) + e.durationHours);
      }
    }
    return { hoursByPhase: byPhase, hoursByTask: byTask };
  }, [entries]);

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
  };

  if (phasesLoading || tasksLoading || entriesLoading) {
    return (
      <div className="px-6 py-4 space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-6 w-3/4" />
      </div>
    );
  }

  return (
    <div className="px-6 py-4">
      {/* Legend */}
      <div className="mb-3 flex gap-5 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-indigo-500" />
          Recorded
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={STRIPE_LEGEND_STYLE} />
          My plan
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-200" />
          Client
        </span>
      </div>

      {/* Project total row */}
      <ProgressRow
        label="Project Total"
        recorded={totalHours}
        plan={totalInternalHours}
        client={totalQuotedHours}
        expandable
        expanded={projectExpanded}
        onToggle={() => setProjectExpanded(!projectExpanded)}
        depth={0}
        bold
      />

      {/* Phase rows */}
      {projectExpanded && phases.map((phase) => {
        const tasks = tasksByPhase.get(phase.id) ?? [];
        const phaseRecorded = hoursByPhase.get(phase.id) ?? 0;
        const hasTasks = tasks.length > 0;
        const isExpanded = expandedPhases.has(phase.id);

        return (
          <div key={phase.id}>
            <ProgressRow
              label={phase.name}
              recorded={phaseRecorded}
              plan={phase.internal_planned_hours}
              client={phase.quoted_hours}
              expandable={hasTasks}
              expanded={isExpanded}
              onToggle={() => togglePhase(phase.id)}
              depth={1}
            />

            {/* Task rows */}
            {isExpanded && tasks.map((task) => {
              const taskRecorded = hoursByTask.get(task.id) ?? 0;
              return (
                <ProgressRow
                  key={task.id}
                  label={task.name || 'Untitled'}
                  recorded={taskRecorded}
                  plan={task.planned_hours}
                  client={0}
                  expandable={false}
                  expanded={false}
                  onToggle={() => {}}
                  depth={2}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── Single Progress Row ──────────────────────────────────────────────────────

function ProgressRow({ label, recorded, plan, client, expandable, expanded, onToggle, depth, bold }: {
  readonly label: string;
  readonly recorded: number;
  readonly plan: number;
  readonly client: number;
  readonly expandable: boolean;
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly depth: 0 | 1 | 2;
  readonly bold?: boolean;
}) {
  // Scale based on the largest capacity (plan or client), not recorded.
  // If recorded exceeds capacity, it caps at 100%.
  // If no plan/client exists, fall back to recorded as the scale.
  const capacity = Math.max(plan, client);
  const maxVal = capacity > 0 ? capacity : Math.max(recorded, 0.01);
  const scale = 100 / maxVal;
  const recordedW = Math.min(100, recorded * scale);
  const planW = Math.min(100, plan * scale);
  const clientW = Math.min(100, client * scale);

  const indent = depth === 0 ? '' : depth === 1 ? 'pl-6' : 'pl-12';
  const barHeight = depth === 0 ? 'h-3' : depth === 1 ? 'h-2.5' : 'h-2';

  return (
    <div className={cn('py-2', indent, depth > 0 && 'border-t border-slate-50')}>
      {/* Header line */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {expandable ? (
            <button onClick={onToggle} className="rounded p-0.5 text-slate-400 hover:text-slate-600">
              <svg
                className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-90')}
                fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <span className="w-4" />
          )}
          <span className={cn(
            'text-sm text-slate-800',
            bold && 'font-semibold',
            depth === 2 && 'text-xs text-slate-600'
          )}>
            {label}
          </span>
        </div>

        <div className={cn('flex gap-3', depth === 2 ? 'text-[10px]' : 'text-[11px]', 'text-slate-400')}>
          <span>
            <span className="font-medium text-indigo-600">{formatHours(recorded)}</span>
            {' '}rec
          </span>
          {plan > 0 && (
            <span>
              <span className="font-medium text-slate-600">{formatHours(plan)}</span>
              {' '}plan
            </span>
          )}
          {client > 0 && (
            <span>
              <span className="font-medium text-slate-500">{formatHours(client)}</span>
              {' '}client
            </span>
          )}
        </div>
      </div>

      {/* 3-layer bar */}
      <div className={cn('relative w-full rounded-full bg-slate-50 overflow-hidden', barHeight)}>
        {client > 0 && (
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-slate-200"
            style={{ width: `${clientW}%` }}
          />
        )}
        {plan > 0 && (
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${planW}%`, ...STRIPE_STYLE }}
          />
        )}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-indigo-500 transition-all"
          style={{ width: `${Math.min(100, recordedW)}%` }}
        />
      </div>
    </div>
  );
}
