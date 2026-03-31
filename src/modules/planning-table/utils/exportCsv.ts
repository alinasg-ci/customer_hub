import type { PlanningRow, PlanningRowTree } from '../types';
import { buildPlanningTree, flattenTree } from './buildTree';

/**
 * Escape a CSV field: wrap in quotes if it contains commas, quotes, or newlines.
 * Double any existing quotes.
 */
function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Convert planning table rows to CSV format.
 * Format per PRD section 4.4:
 * Level, Phase, Sub-phase, Detail, Content, Start date, End date, Color
 */
export function planningTableToCsv(rows: readonly PlanningRow[]): string {
  const tree = buildPlanningTree(rows);
  const ordered = flattenTree(tree);

  const header = 'Level,Phase,Sub-phase,Detail,Content,Start date,End date,Color';
  const lines = [header];

  // Track the parent phase and sub-phase names for column placement
  let currentPhase = '';
  let currentSubPhase = '';

  for (const row of ordered) {
    const name = escapeCsvField(row.name);
    const content = escapeCsvField(row.content ?? '');
    const startDate = row.start_date ?? '';
    const endDate = row.end_date ?? '';
    const color = row.color ?? '';

    let phase = '';
    let subPhase = '';
    let detail = '';

    if (row.level === 1) {
      phase = name;
      currentPhase = row.name;
      currentSubPhase = '';
    } else if (row.level === 2) {
      phase = escapeCsvField(currentPhase);
      subPhase = name;
      currentSubPhase = row.name;
    } else {
      phase = escapeCsvField(currentPhase);
      subPhase = escapeCsvField(currentSubPhase);
      detail = name;
    }

    lines.push(`${row.level},${phase},${subPhase},${detail},${content},${startDate},${endDate},${color}`);
  }

  return lines.join('\n');
}
