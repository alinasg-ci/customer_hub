/**
 * Phase keyword matching — lightweight, user-trained keyword classifier.
 * Case-insensitive. Matches if any keyword appears in the entry description.
 */

import type { PhaseKeyword } from './api/keywords';

export type MatchResult = {
  readonly phaseId: string;
  readonly matchedKeyword: string;
} | null;

export function matchEntryToPhase(
  description: string,
  keywords: readonly PhaseKeyword[]
): MatchResult {
  if (!description) return null;

  const descLower = description.toLowerCase();

  for (const kw of keywords) {
    if (descLower.includes(kw.keyword.toLowerCase())) {
      return { phaseId: kw.phase_id, matchedKeyword: kw.keyword };
    }
  }

  return null;
}

/**
 * Run keyword matching on all unassigned entries for a project.
 * Returns a list of entries that were matched and should be updated.
 */
export function matchAllUnassigned(
  entries: readonly { id: string; description: string | null; phase_assignment_type: string }[],
  keywords: readonly PhaseKeyword[]
): readonly { entryId: string; phaseId: string; matchedKeyword: string }[] {
  const results: { entryId: string; phaseId: string; matchedKeyword: string }[] = [];

  for (const entry of entries) {
    if (entry.phase_assignment_type !== 'unassigned') continue;
    if (!entry.description) continue;

    const match = matchEntryToPhase(entry.description, keywords);
    if (match) {
      results.push({
        entryId: entry.id,
        phaseId: match.phaseId,
        matchedKeyword: match.matchedKeyword,
      });
    }
  }

  return results;
}
