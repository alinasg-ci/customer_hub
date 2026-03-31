import { describe, it, expect } from 'vitest';
import { findMatchingPhase } from '@/modules/planning-table/utils/autoMapPhases';
import type { Phase } from '@/modules/planning/types';

function makePhase(overrides: Partial<Phase> & { id: string; name: string }): Phase {
  return {
    project_id: 'proj-1',
    sub_project_id: null,
    display_order: 0,
    quoted_hours: 10,
    internal_planned_hours: 12,
    created_at: '2026-01-01T00:00:00Z',
    user_id: 'user-1',
    ...overrides,
  };
}

const phases: Phase[] = [
  makePhase({ id: 'p1', name: 'Research' }),
  makePhase({ id: 'p2', name: 'Strategy' }),
  makePhase({ id: 'p3', name: 'Presentation' }),
];

describe('findMatchingPhase', () => {
  it('should find an exact match (case-insensitive)', () => {
    const result = findMatchingPhase('research', phases);
    expect(result).toEqual({ phaseId: 'p1', phaseName: 'Research' });
  });

  it('should find a match with different casing', () => {
    const result = findMatchingPhase('STRATEGY', phases);
    expect(result).toEqual({ phaseId: 'p2', phaseName: 'Strategy' });
  });

  it('should find a match with leading/trailing whitespace', () => {
    const result = findMatchingPhase('  Presentation  ', phases);
    expect(result).toEqual({ phaseId: 'p3', phaseName: 'Presentation' });
  });

  it('should return null for no match', () => {
    const result = findMatchingPhase('Design', phases);
    expect(result).toBeNull();
  });

  it('should return null for empty name', () => {
    const result = findMatchingPhase('', phases);
    expect(result).toBeNull();
  });

  it('should return null for whitespace-only name', () => {
    const result = findMatchingPhase('   ', phases);
    expect(result).toBeNull();
  });

  it('should not match partial names', () => {
    const result = findMatchingPhase('Research & Analysis', phases);
    expect(result).toBeNull();
  });

  it('should return null when phases array is empty', () => {
    const result = findMatchingPhase('Research', []);
    expect(result).toBeNull();
  });
});
