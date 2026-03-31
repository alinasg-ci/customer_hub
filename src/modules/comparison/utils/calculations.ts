import type { Phase } from '@/modules/planning/types';
import type { PhaseLink, ComparisonRowData, ComparisonSummary } from '../types';

/**
 * Build comparison rows from phase links, phases, and actual hours.
 * Pure function — no side effects, easily testable.
 */
export function buildComparisonRows(
  phaseLinks: readonly PhaseLink[],
  phases: readonly Phase[],
  actualHoursByPhase: ReadonlyMap<string, number>
): readonly ComparisonRowData[] {
  const phaseMap = new Map(phases.map((p) => [p.id, p]));

  return phaseLinks.map((link) => {
    const budgetPhase = link.budget_phase_id ? phaseMap.get(link.budget_phase_id) : undefined;
    const planPhase = link.plan_phase_id ? phaseMap.get(link.plan_phase_id) : undefined;

    const budgetHours = budgetPhase?.quoted_hours ?? 0;
    const planHours = planPhase?.internal_planned_hours ?? 0;

    // Actual hours flow through the phase that Toggl entries are assigned to.
    // Check both budget and plan phase IDs for actual hours.
    let actualHours = 0;
    if (link.budget_phase_id) {
      actualHours += actualHoursByPhase.get(link.budget_phase_id) ?? 0;
    }
    if (link.plan_phase_id && link.plan_phase_id !== link.budget_phase_id) {
      actualHours += actualHoursByPhase.get(link.plan_phase_id) ?? 0;
    }

    const remaining = planHours - actualHours;
    const consumedPercent = planHours > 0 ? (actualHours / planHours) * 100 : 0;

    let status: 'on_track' | 'warning' | 'over';
    if (consumedPercent > 100) {
      status = 'over';
    } else if (consumedPercent >= 80) {
      status = 'warning';
    } else {
      status = 'on_track';
    }

    return {
      canonicalName: link.canonical_name,
      phaseLinkId: link.id,
      budgetHours,
      planHours,
      actualHours,
      remaining,
      status,
      budgetPhaseName: budgetPhase?.name ?? null,
      planPhaseName: planPhase?.name ?? null,
    };
  });
}

/**
 * Compute overall comparison summary from rows.
 */
export function buildComparisonSummary(rows: readonly ComparisonRowData[]): ComparisonSummary {
  let totalBudget = 0;
  let totalPlan = 0;
  let totalActual = 0;

  for (const row of rows) {
    totalBudget += row.budgetHours;
    totalPlan += row.planHours;
    totalActual += row.actualHours;
  }

  const percentConsumed = totalPlan > 0 ? (totalActual / totalPlan) * 100 : 0;

  let status: 'on_track' | 'warning' | 'over';
  if (percentConsumed > 100) {
    status = 'over';
  } else if (percentConsumed >= 80) {
    status = 'warning';
  } else {
    status = 'on_track';
  }

  return { totalBudget, totalPlan, totalActual, percentConsumed, status };
}

/**
 * Auto-generate phase links for a project by matching budget and plan phase names.
 * Budget phases: those with quoted_hours > 0.
 * Plan phases: those with internal_planned_hours > 0.
 */
export function autoGeneratePhaseLinks(
  phases: readonly Phase[],
  projectId: string
): readonly { canonical_name: string; budget_phase_id: string | null; plan_phase_id: string | null }[] {
  const budgetPhases = phases.filter((p) => p.quoted_hours > 0);
  const planPhases = phases.filter((p) => p.internal_planned_hours > 0);
  const usedBudgetIds = new Set<string>();
  const usedPlanIds = new Set<string>();
  const links: { canonical_name: string; budget_phase_id: string | null; plan_phase_id: string | null }[] = [];

  // First pass: exact name matches (case-insensitive)
  for (const planPhase of planPhases) {
    const normalizedPlan = planPhase.name.toLowerCase().trim();
    const matchingBudget = budgetPhases.find(
      (bp) => bp.name.toLowerCase().trim() === normalizedPlan && !usedBudgetIds.has(bp.id)
    );

    if (matchingBudget) {
      links.push({
        canonical_name: planPhase.name,
        budget_phase_id: matchingBudget.id,
        plan_phase_id: planPhase.id,
      });
      usedBudgetIds.add(matchingBudget.id);
      usedPlanIds.add(planPhase.id);
    }
  }

  // Second pass: unmatched plan phases
  for (const planPhase of planPhases) {
    if (!usedPlanIds.has(planPhase.id)) {
      links.push({
        canonical_name: planPhase.name,
        budget_phase_id: null,
        plan_phase_id: planPhase.id,
      });
    }
  }

  // Third pass: unmatched budget phases
  for (const budgetPhase of budgetPhases) {
    if (!usedBudgetIds.has(budgetPhase.id)) {
      links.push({
        canonical_name: budgetPhase.name,
        budget_phase_id: budgetPhase.id,
        plan_phase_id: null,
      });
    }
  }

  return links;
}
