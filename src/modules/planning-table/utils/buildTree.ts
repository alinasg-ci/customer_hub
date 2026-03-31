import type { PlanningRow, PlanningRowTree } from '../types';

/**
 * Converts a flat array of PlanningRows into a nested tree structure.
 * Level 1 rows are root nodes (parent_row_id = null).
 * Children are sorted by display_order at each level.
 */
export function buildPlanningTree(rows: readonly PlanningRow[]): readonly PlanningRowTree[] {
  const childrenMap = new Map<string | null, PlanningRow[]>();

  for (const row of rows) {
    const parentKey = row.parent_row_id;
    const siblings = childrenMap.get(parentKey);
    if (siblings) {
      siblings.push(row);
    } else {
      childrenMap.set(parentKey, [row]);
    }
  }

  function buildChildren(parentId: string | null): readonly PlanningRowTree[] {
    const children = childrenMap.get(parentId) ?? [];
    return children
      .slice()
      .sort((a, b) => a.display_order - b.display_order)
      .map((row) => ({
        ...row,
        children: buildChildren(row.id),
      }));
  }

  return buildChildren(null);
}

/**
 * Flattens a tree back to a display-ordered array (pre-order traversal).
 * Useful for rendering and export.
 */
export function flattenTree(tree: readonly PlanningRowTree[]): readonly PlanningRow[] {
  const result: PlanningRow[] = [];

  function walk(nodes: readonly PlanningRowTree[]) {
    for (const node of nodes) {
      const { children: _, ...row } = node;
      result.push(row);
      walk(node.children);
    }
  }

  walk(tree);
  return result;
}
