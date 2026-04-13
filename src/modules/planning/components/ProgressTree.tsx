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
  backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(7,138,82,0.25) 3px, rgba(7,138,82,0.25) 6px)',
  backgroundColor: 'rgba(7,138,82,0.15)',
};

const STRIPE_LEGEND_STYLE = {
  backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(7,138,82,0.4) 2px, rgba(7,138,82,0.4) 4px)',
  backgroundColor: 'rgba(7,138,82,0.15)',
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

  // Build hours maps from billable entries only (non-billable excluded from progress)
  const { hoursByPhase, hoursByTask, billableTotal } = useMemo(() => {
    const byPhase = new Map<string, number>();
    const byTask = new Map<string, number>();
    let total = 0;
    for (const e of entries) {
      if (!e.billable) continue;
      total += e.durationHours;
      if (e.phaseId) {
        byPhase.set(e.phaseId, (byPhase.get(e.phaseId) ?? 0) + e.durationHours);
      }
      if (e.taskId) {
        byTask.set(e.taskId, (byTask.get(e.taskId) ?? 0) + e.durationHours);
      }
    }
    return { hoursByPhase: byPhase, hoursByTask: byTask, billableTotal: total };
  }, [entries]);

  // Build planned hours from tasks (not from phase fields — users set hours on tasks)
  const { plannedByPhase, totalTaskPlanned } = useMemo(() => {
    const byPhase = new Map<string, number>();
    let total = 0;
    for (const phase of phases) {
      const tasks = tasksByPhase.get(phase.id) ?? [];
      const phaseTaskPlanned = tasks.reduce((s, t) => s + t.planned_hours, 0);
      byPhase.set(phase.id, phaseTaskPlanned);
      total += phaseTaskPlanned;
    }
    return { plannedByPhase: byPhase, totalTaskPlanned: total };
  }, [phases, tasksByPhase]);

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
      <div className="mb-3 flex gap-5 text-[11px] text-charcoal-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 rounded-sm bg-oat-200" style={{ height: 10 }} />
          Client
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 rounded-sm" style={{ height: 7, ...STRIPE_LEGEND_STYLE }} />
          My plan
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 rounded-sm bg-matcha-500" style={{ height: 4 }} />
          Recorded
        </span>
      </div>

      {/* Project total row */}
      <ProgressRow
        label="Project Total"
        recorded={billableTotal}
        plan={totalTaskPlanned > 0 ? totalTaskPlanned : totalInternalHours}
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
        const phasePlanned = plannedByPhase.get(phase.id) ?? 0;
        const hasTasks = tasks.length > 0;
        const isExpanded = expandedPhases.has(phase.id);

        return (
          <div key={phase.id}>
            <ProgressRow
              label={phase.name}
              recorded={phaseRecorded}
              plan={phasePlanned > 0 ? phasePlanned : phase.internal_planned_hours}
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
  const capacity = Math.max(plan, client);
  const isOverBudget = capacity > 0 && recorded > capacity;

  // Scale so everything fits within 100% width.
  // When over budget, scale based on recorded (the largest value).
  const maxVal = Math.max(recorded, capacity, 0.01);
  const scale = 100 / maxVal;

  let inBudgetW: number;
  let overBudgetW: number;
  let planW: number;
  let clientW: number;

  if (capacity > 0 || recorded > 0) {
    planW = plan * scale;
    clientW = client * scale;
    if (isOverBudget) {
      // In-budget portion = capacity width, over-budget = the rest
      inBudgetW = capacity * scale;
      overBudgetW = (recorded - capacity) * scale;
    } else {
      inBudgetW = recorded * scale;
      overBudgetW = 0;
    }
  } else {
    inBudgetW = 0;
    overBudgetW = 0;
    planW = 0;
    clientW = 0;
  }

  const indent = depth === 0 ? '' : depth === 1 ? 'pl-6' : 'pl-12';
  const totalHeight = depth === 0 ? 20 : depth === 1 ? 16 : 12;

  return (
    <div className={cn('py-2', indent, depth > 0 && 'border-t border-oat-100')}>
      {/* Header line */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {expandable ? (
            <button onClick={onToggle} className="rounded p-0.5 text-oat-500 hover:text-charcoal-500">
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
            'text-sm text-charcoal-700',
            bold && 'font-semibold',
            depth === 2 && 'text-xs text-charcoal-500'
          )}>
            {label}
          </span>
        </div>

        <div className={cn('flex gap-3', depth === 2 ? 'text-[10px]' : 'text-[11px]', 'text-oat-500')}>
          <span>
            <span className={cn('font-medium', isOverBudget ? 'text-pomegranate-600' : 'text-matcha-600')}>{formatHours(recorded)}</span>
            {' '}rec
          </span>
          {plan > 0 && (
            <span>
              <span className="font-medium text-charcoal-500">{formatHours(plan)}</span>
              {' '}plan
            </span>
          )}
          {client > 0 && (
            <span>
              <span className="font-medium text-charcoal-500">{formatHours(client)}</span>
              {' '}client
            </span>
          )}
        </div>
      </div>

      {/* 3-layer bar — stacked by height: client 100%, plan 60%, recorded 30% */}
      <div className="relative w-full overflow-hidden" style={{ height: totalHeight }}>
        {/* Client — full height, gray */}
        {client > 0 && (
          <div
            className="absolute left-0 rounded-md bg-oat-200"
            style={{ width: `${clientW}%`, height: '100%', top: 0 }}
          />
        )}
        {/* Plan — 60% height, striped, vertically centered */}
        {plan > 0 && (
          <div
            className="absolute left-0 rounded-md"
            style={{
              width: `${planW}%`,
              height: '60%',
              top: '20%',
              ...STRIPE_STYLE,
            }}
          />
        )}
        {/* Recorded — 30% height, solid indigo (in-budget portion) */}
        {inBudgetW > 0 && (
          <div
            className="absolute left-0 rounded-sm bg-matcha-500 transition-all"
            style={{
              width: `${isOverBudget ? 100 : inBudgetW}%`,
              height: '30%',
              top: '35%',
            }}
          />
        )}
        {/* Over-budget — red portion after the indigo */}
        {overBudgetW > 0 && (
          <div
            className="absolute rounded-sm bg-pomegranate-400 transition-all"
            style={{
              left: `${inBudgetW}%`,
              width: `${overBudgetW}%`,
              height: '30%',
              top: '35%',
            }}
          />
        )}
      </div>
    </div>
  );
}
