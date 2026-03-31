import type { Phase } from '@/modules/planning/types';

type AutoMapResult = {
  readonly phaseId: string;
  readonly phaseName: string;
};

/**
 * Find a matching M1 phase for a planning row name.
 * Match is exact (case-insensitive, trimmed).
 * No fuzzy guessing — same name = linked, different name = no match.
 */
export function findMatchingPhase(
  rowName: string,
  phases: readonly Phase[]
): AutoMapResult | null {
  const normalized = rowName.toLowerCase().trim();
  if (!normalized) return null;

  for (const phase of phases) {
    if (phase.name.toLowerCase().trim() === normalized) {
      return { phaseId: phase.id, phaseName: phase.name };
    }
  }

  return null;
}
