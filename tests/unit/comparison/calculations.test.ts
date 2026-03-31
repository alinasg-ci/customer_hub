import { describe, it, expect } from 'vitest';
import { buildComparisonRows, buildComparisonSummary, autoGeneratePhaseLinks } from '@/modules/comparison/utils/calculations';
import type { Phase } from '@/modules/planning/types';
import type { PhaseLink } from '@/modules/comparison/types';

function makePhase(overrides: Partial<Phase> & { id: string; name: string }): Phase {
  return {
    project_id: 'proj-1',
    sub_project_id: null,
    display_order: 0,
    quoted_hours: 0,
    internal_planned_hours: 0,
    created_at: '2026-01-01T00:00:00Z',
    user_id: 'user-1',
    ...overrides,
  };
}

function makeLink(overrides: Partial<PhaseLink> & { id: string; canonical_name: string }): PhaseLink {
  return {
    project_id: 'proj-1',
    budget_phase_id: null,
    plan_phase_id: null,
    user_id: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('buildComparisonRows', () => {
  it('should build rows from fully linked phases', () => {
    const phases = [
      makePhase({ id: 'p1', name: 'Research', quoted_hours: 15, internal_planned_hours: 18 }),
    ];
    const links = [
      makeLink({ id: 'l1', canonical_name: 'Research', budget_phase_id: 'p1', plan_phase_id: 'p1' }),
    ];
    const actual = new Map([['p1', 12]]);

    const rows = buildComparisonRows(links, phases, actual);
    expect(rows).toHaveLength(1);
    expect(rows[0].budgetHours).toBe(15);
    expect(rows[0].planHours).toBe(18);
    expect(rows[0].actualHours).toBe(12);
    expect(rows[0].remaining).toBe(6);
    expect(rows[0].status).toBe('on_track');
  });

  it('should handle over-budget scenario', () => {
    const phases = [
      makePhase({ id: 'p1', name: 'Strategy', quoted_hours: 10, internal_planned_hours: 12 }),
    ];
    const links = [
      makeLink({ id: 'l1', canonical_name: 'Strategy', budget_phase_id: 'p1', plan_phase_id: 'p1' }),
    ];
    const actual = new Map([['p1', 14]]);

    const rows = buildComparisonRows(links, phases, actual);
    expect(rows[0].remaining).toBeCloseTo(-2);
    expect(rows[0].status).toBe('over');
  });

  it('should handle warning zone (80-100%)', () => {
    const phases = [
      makePhase({ id: 'p1', name: 'Work', quoted_hours: 10, internal_planned_hours: 10 }),
    ];
    const links = [
      makeLink({ id: 'l1', canonical_name: 'Work', budget_phase_id: 'p1', plan_phase_id: 'p1' }),
    ];
    const actual = new Map([['p1', 8.5]]);

    const rows = buildComparisonRows(links, phases, actual);
    expect(rows[0].status).toBe('warning');
  });

  it('should show dash values for unlinked budget/plan', () => {
    const phases = [
      makePhase({ id: 'p1', name: 'Buffer', internal_planned_hours: 5 }),
    ];
    const links = [
      makeLink({ id: 'l1', canonical_name: 'Buffer', budget_phase_id: null, plan_phase_id: 'p1' }),
    ];
    const actual = new Map([['p1', 3]]);

    const rows = buildComparisonRows(links, phases, actual);
    expect(rows[0].budgetHours).toBe(0);
    expect(rows[0].planHours).toBe(5);
    expect(rows[0].actualHours).toBe(3);
  });

  it('should handle empty phase links', () => {
    const rows = buildComparisonRows([], [], new Map());
    expect(rows).toEqual([]);
  });

  it('should handle zero plan hours without division by zero', () => {
    const phases = [
      makePhase({ id: 'p1', name: 'Test', quoted_hours: 5, internal_planned_hours: 0 }),
    ];
    const links = [
      makeLink({ id: 'l1', canonical_name: 'Test', budget_phase_id: 'p1', plan_phase_id: 'p1' }),
    ];

    const rows = buildComparisonRows(links, phases, new Map());
    expect(rows[0].status).toBe('on_track');
  });

  it('should sum actual hours from both budget and plan phases when different', () => {
    const phases = [
      makePhase({ id: 'budget-p', name: 'Market Research', quoted_hours: 15 }),
      makePhase({ id: 'plan-p', name: 'Research & Analysis', internal_planned_hours: 18 }),
    ];
    const links = [
      makeLink({ id: 'l1', canonical_name: 'Research', budget_phase_id: 'budget-p', plan_phase_id: 'plan-p' }),
    ];
    const actual = new Map([['budget-p', 5], ['plan-p', 7]]);

    const rows = buildComparisonRows(links, phases, actual);
    expect(rows[0].actualHours).toBe(12);
  });
});

describe('buildComparisonSummary', () => {
  it('should sum all rows', () => {
    const rows = buildComparisonRows(
      [
        makeLink({ id: 'l1', canonical_name: 'A', budget_phase_id: 'p1', plan_phase_id: 'p1' }),
        makeLink({ id: 'l2', canonical_name: 'B', budget_phase_id: 'p2', plan_phase_id: 'p2' }),
      ],
      [
        makePhase({ id: 'p1', name: 'A', quoted_hours: 10, internal_planned_hours: 12 }),
        makePhase({ id: 'p2', name: 'B', quoted_hours: 20, internal_planned_hours: 25 }),
      ],
      new Map([['p1', 8], ['p2', 15]])
    );

    const summary = buildComparisonSummary(rows);
    expect(summary.totalBudget).toBe(30);
    expect(summary.totalPlan).toBe(37);
    expect(summary.totalActual).toBe(23);
    expect(summary.percentConsumed).toBeCloseTo(62.16, 1);
    expect(summary.status).toBe('on_track');
  });
});

describe('autoGeneratePhaseLinks', () => {
  it('should match phases by name (case-insensitive)', () => {
    const phases = [
      makePhase({ id: 'p1', name: 'Research', quoted_hours: 10, internal_planned_hours: 12 }),
      makePhase({ id: 'p2', name: 'Strategy', quoted_hours: 8, internal_planned_hours: 10 }),
    ];

    const links = autoGeneratePhaseLinks(phases, 'proj-1');
    expect(links).toHaveLength(2);
    expect(links[0]).toEqual({
      canonical_name: 'Research',
      budget_phase_id: 'p1',
      plan_phase_id: 'p1',
    });
  });

  it('should create unlinked entries for mismatched names', () => {
    const phases = [
      makePhase({ id: 'p1', name: 'Market Research', quoted_hours: 10 }),
      makePhase({ id: 'p2', name: 'Research & Analysis', internal_planned_hours: 12 }),
    ];

    const links = autoGeneratePhaseLinks(phases, 'proj-1');
    expect(links).toHaveLength(2);
    // Plan phase unmatched
    expect(links.find((l) => l.canonical_name === 'Research & Analysis')).toBeDefined();
    // Budget phase unmatched
    expect(links.find((l) => l.canonical_name === 'Market Research')).toBeDefined();
  });

  it('should return empty for phases with zero hours', () => {
    const phases = [
      makePhase({ id: 'p1', name: 'Empty', quoted_hours: 0, internal_planned_hours: 0 }),
    ];

    const links = autoGeneratePhaseLinks(phases, 'proj-1');
    expect(links).toHaveLength(0);
  });
});
