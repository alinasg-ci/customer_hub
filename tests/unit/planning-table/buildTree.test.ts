import { describe, it, expect } from 'vitest';
import { buildPlanningTree, flattenTree } from '@/modules/planning-table/utils/buildTree';
import type { PlanningRow } from '@/modules/planning-table/types';

function makeRow(overrides: Partial<PlanningRow> & { id: string; level: 1 | 2 | 3 }): PlanningRow {
  return {
    planning_table_id: 'table-1',
    parent_row_id: null,
    name: `Row ${overrides.id}`,
    content: null,
    start_date: null,
    end_date: null,
    color: null,
    display_order: 0,
    linked_phase_id: null,
    user_id: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('buildPlanningTree', () => {
  it('should return empty array for empty input', () => {
    const tree = buildPlanningTree([]);
    expect(tree).toEqual([]);
  });

  it('should build a flat list of Level 1 rows', () => {
    const rows: PlanningRow[] = [
      makeRow({ id: 'a', level: 1, display_order: 0 }),
      makeRow({ id: 'b', level: 1, display_order: 1 }),
      makeRow({ id: 'c', level: 1, display_order: 2 }),
    ];

    const tree = buildPlanningTree(rows);
    expect(tree).toHaveLength(3);
    expect(tree[0].id).toBe('a');
    expect(tree[1].id).toBe('b');
    expect(tree[2].id).toBe('c');
    expect(tree[0].children).toEqual([]);
  });

  it('should sort by display_order', () => {
    const rows: PlanningRow[] = [
      makeRow({ id: 'c', level: 1, display_order: 2 }),
      makeRow({ id: 'a', level: 1, display_order: 0 }),
      makeRow({ id: 'b', level: 1, display_order: 1 }),
    ];

    const tree = buildPlanningTree(rows);
    expect(tree.map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('should nest Level 2 under Level 1 parents', () => {
    const rows: PlanningRow[] = [
      makeRow({ id: 'phase-1', level: 1, display_order: 0 }),
      makeRow({ id: 'sub-1', level: 2, parent_row_id: 'phase-1', display_order: 0 }),
      makeRow({ id: 'sub-2', level: 2, parent_row_id: 'phase-1', display_order: 1 }),
    ];

    const tree = buildPlanningTree(rows);
    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0].id).toBe('sub-1');
    expect(tree[0].children[1].id).toBe('sub-2');
  });

  it('should handle 3 levels of nesting', () => {
    const rows: PlanningRow[] = [
      makeRow({ id: 'phase', level: 1, display_order: 0 }),
      makeRow({ id: 'sub', level: 2, parent_row_id: 'phase', display_order: 0 }),
      makeRow({ id: 'detail', level: 3, parent_row_id: 'sub', display_order: 0 }),
    ];

    const tree = buildPlanningTree(rows);
    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].children).toHaveLength(1);
    expect(tree[0].children[0].children[0].id).toBe('detail');
    expect(tree[0].children[0].children[0].children).toEqual([]);
  });

  it('should handle multiple Level 1 phases with mixed children', () => {
    const rows: PlanningRow[] = [
      makeRow({ id: 'p1', level: 1, display_order: 0 }),
      makeRow({ id: 'p2', level: 1, display_order: 1 }),
      makeRow({ id: 'p1-s1', level: 2, parent_row_id: 'p1', display_order: 0 }),
      makeRow({ id: 'p2-s1', level: 2, parent_row_id: 'p2', display_order: 0 }),
      makeRow({ id: 'p2-s2', level: 2, parent_row_id: 'p2', display_order: 1 }),
    ];

    const tree = buildPlanningTree(rows);
    expect(tree).toHaveLength(2);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[1].children).toHaveLength(2);
  });

  it('should handle orphaned rows gracefully (missing parent)', () => {
    const rows: PlanningRow[] = [
      makeRow({ id: 'orphan', level: 2, parent_row_id: 'nonexistent', display_order: 0 }),
      makeRow({ id: 'root', level: 1, display_order: 0 }),
    ];

    // Orphan won't appear in tree since its parent doesn't exist
    const tree = buildPlanningTree(rows);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('root');
  });
});

describe('flattenTree', () => {
  it('should flatten a tree back to pre-order array', () => {
    const rows: PlanningRow[] = [
      makeRow({ id: 'p1', level: 1, display_order: 0 }),
      makeRow({ id: 'p1-s1', level: 2, parent_row_id: 'p1', display_order: 0 }),
      makeRow({ id: 'p1-s1-d1', level: 3, parent_row_id: 'p1-s1', display_order: 0 }),
      makeRow({ id: 'p2', level: 1, display_order: 1 }),
    ];

    const tree = buildPlanningTree(rows);
    const flat = flattenTree(tree);

    expect(flat.map((r) => r.id)).toEqual(['p1', 'p1-s1', 'p1-s1-d1', 'p2']);
  });

  it('should return empty array for empty tree', () => {
    expect(flattenTree([])).toEqual([]);
  });
});
