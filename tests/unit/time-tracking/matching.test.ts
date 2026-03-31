import { describe, it, expect } from 'vitest';
import { matchEntryToPhase, matchAllUnassigned } from '@/modules/time-tracking/matching';
import type { PhaseKeyword } from '@/modules/time-tracking/api/keywords';

const makeKeyword = (phaseId: string, keyword: string): PhaseKeyword => ({
  id: `kw-${keyword}`,
  phase_id: phaseId,
  keyword,
  source: 'user_entered',
  created_at: '2026-01-01T00:00:00Z',
  user_id: 'user-1',
});

describe('matchEntryToPhase', () => {
  const keywords = [
    makeKeyword('phase-research', 'competitive analysis'),
    makeKeyword('phase-research', 'market scan'),
    makeKeyword('phase-strategy', 'strategy'),
    makeKeyword('phase-content', 'content writing'),
  ];

  it('should match exact keyword in description', () => {
    const result = matchEntryToPhase('Competitive analysis for Honda', keywords);
    expect(result).not.toBeNull();
    expect(result!.phaseId).toBe('phase-research');
    expect(result!.matchedKeyword).toBe('competitive analysis');
  });

  it('should match case-insensitively', () => {
    const result = matchEntryToPhase('MARKET SCAN draft', keywords);
    expect(result).not.toBeNull();
    expect(result!.phaseId).toBe('phase-research');
  });

  it('should return null for no match', () => {
    const result = matchEntryToPhase('Team meeting about project timeline', keywords);
    expect(result).toBeNull();
  });

  it('should return null for empty description', () => {
    const result = matchEntryToPhase('', keywords);
    expect(result).toBeNull();
  });

  it('should match partial keyword within longer description', () => {
    const result = matchEntryToPhase('Working on content writing and review', keywords);
    expect(result).not.toBeNull();
    expect(result!.phaseId).toBe('phase-content');
  });

  it('should match first keyword found when multiple could match', () => {
    const result = matchEntryToPhase('Strategy competitive analysis', keywords);
    expect(result).not.toBeNull();
    // Should match 'competitive analysis' first (it appears in the keywords list first)
    expect(result!.phaseId).toBe('phase-research');
  });
});

describe('matchAllUnassigned', () => {
  const keywords = [
    makeKeyword('phase-research', 'research'),
    makeKeyword('phase-design', 'design'),
  ];

  it('should only match unassigned entries', () => {
    const entries = [
      { id: '1', description: 'Research task', phase_assignment_type: 'unassigned' },
      { id: '2', description: 'Design work', phase_assignment_type: 'manual' },
      { id: '3', description: 'Research review', phase_assignment_type: 'unassigned' },
    ];

    const results = matchAllUnassigned(entries, keywords);
    expect(results).toHaveLength(2);
    expect(results[0].entryId).toBe('1');
    expect(results[1].entryId).toBe('3');
  });

  it('should skip entries with null description', () => {
    const entries = [
      { id: '1', description: null, phase_assignment_type: 'unassigned' },
    ];

    const results = matchAllUnassigned(entries, keywords);
    expect(results).toHaveLength(0);
  });

  it('should return empty for no matches', () => {
    const entries = [
      { id: '1', description: 'Meeting notes', phase_assignment_type: 'unassigned' },
    ];

    const results = matchAllUnassigned(entries, keywords);
    expect(results).toHaveLength(0);
  });
});
