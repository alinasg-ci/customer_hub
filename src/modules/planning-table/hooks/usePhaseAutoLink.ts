'use client';

import { useCallback } from 'react';
import { findMatchingPhase } from '../utils/autoMapPhases';
import type { Phase } from '@/modules/planning';

type UsePhaseAutoLinkOptions = {
  readonly phases: readonly Phase[];
  readonly onLink: (rowId: string, phaseId: string) => void;
  readonly onUnlink: (rowId: string) => void;
};

/**
 * Hook to orchestrate auto-linking of Level 1 planning rows to M1 phases.
 */
export function usePhaseAutoLink({ phases, onLink, onUnlink }: UsePhaseAutoLinkOptions) {
  /**
   * Called when a Level 1 row name changes (on blur).
   * Returns the match result so the component can show a prompt if no match.
   */
  const checkAutoLink = useCallback((rowId: string, newName: string) => {
    const match = findMatchingPhase(newName, phases);
    if (match) {
      onLink(rowId, match.phaseId);
      return { matched: true, phaseName: match.phaseName };
    }
    onUnlink(rowId);
    return { matched: false, phaseName: null };
  }, [phases, onLink, onUnlink]);

  return { checkAutoLink };
}
