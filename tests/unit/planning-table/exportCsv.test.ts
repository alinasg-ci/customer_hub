import { describe, it, expect } from 'vitest';
import { planningTableToCsv } from '@/modules/planning-table/utils/exportCsv';
import type { PlanningRow } from '@/modules/planning-table/types';

function makeRow(overrides: Partial<PlanningRow> & { id: string; level: 1 | 2 | 3; name: string }): PlanningRow {
  return {
    planning_table_id: 'table-1',
    parent_row_id: null,
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

describe('planningTableToCsv', () => {
  it('should generate correct header', () => {
    const csv = planningTableToCsv([]);
    expect(csv).toBe('Level,Phase,Sub-phase,Detail,Content,Start date,End date,Color');
  });

  it('should export a Level 1 row correctly', () => {
    const rows = [
      makeRow({
        id: 'p1',
        level: 1,
        name: 'Research',
        content: 'Market analysis',
        start_date: '2026-04-01',
        end_date: '2026-04-15',
        color: '#4A90D9',
      }),
    ];

    const csv = planningTableToCsv(rows);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe('1,Research,,,Market analysis,2026-04-01,2026-04-15,#4A90D9');
  });

  it('should export 3 levels with correct column placement', () => {
    const rows = [
      makeRow({ id: 'p1', level: 1, name: 'Research', display_order: 0 }),
      makeRow({ id: 's1', level: 2, name: 'Competitive scan', parent_row_id: 'p1', display_order: 0 }),
      makeRow({ id: 'd1', level: 3, name: 'Interview users', parent_row_id: 's1', display_order: 0 }),
    ];

    const csv = planningTableToCsv(rows);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(4);
    expect(lines[1]).toContain('1,Research');
    expect(lines[2]).toContain('2,Research,Competitive scan');
    expect(lines[3]).toContain('3,Research,Competitive scan,Interview users');
  });

  it('should escape fields with commas', () => {
    const rows = [
      makeRow({ id: 'p1', level: 1, name: 'Research, Analysis' }),
    ];

    const csv = planningTableToCsv(rows);
    expect(csv).toContain('"Research, Analysis"');
  });

  it('should escape fields with quotes', () => {
    const rows = [
      makeRow({ id: 'p1', level: 1, name: 'Phase "Alpha"' }),
    ];

    const csv = planningTableToCsv(rows);
    expect(csv).toContain('"Phase ""Alpha"""');
  });

  it('should escape fields with newlines', () => {
    const rows = [
      makeRow({ id: 'p1', level: 1, name: 'Research', content: 'Line 1\nLine 2' }),
    ];

    const csv = planningTableToCsv(rows);
    expect(csv).toContain('"Line 1\nLine 2"');
  });

  it('should handle Hebrew characters', () => {
    const rows = [
      makeRow({ id: 'p1', level: 1, name: 'מחקר' }),
    ];

    const csv = planningTableToCsv(rows);
    expect(csv).toContain('מחקר');
  });

  it('should handle empty content as empty field', () => {
    const rows = [
      makeRow({ id: 'p1', level: 1, name: 'Test', content: null }),
    ];

    const csv = planningTableToCsv(rows);
    const lines = csv.split('\n');
    // Content field should be empty (between two commas)
    expect(lines[1]).toContain('Test,,,,');
  });
});
