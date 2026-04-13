/**
 * Notification trigger logic — pure functions.
 * Determines which notifications should fire based on consumption thresholds.
 * No duplicates: only fires if no existing notification for the same entity + threshold.
 */

import type { NotificationType } from '@/shared/types';
import type { Notification, ThresholdCheck, CreateNotificationInput } from './types';

type ThresholdConfig = {
  readonly percent: number;
  readonly warningType: NotificationType;
  readonly exceededType: NotificationType;
};

const PROJECT_THRESHOLDS: ThresholdConfig = {
  percent: 80,
  warningType: 'over_budget_warning',
  exceededType: 'over_budget_exceeded',
};

const BANK_THRESHOLDS: ThresholdConfig = {
  percent: 80,
  warningType: 'bank_depleting',
  exceededType: 'bank_depleted',
};

/**
 * Check a single entity against thresholds and return notifications to create.
 * Returns empty array if thresholds not crossed or notifications already exist.
 */
export function checkThresholds(
  check: ThresholdCheck,
  existingNotifications: readonly Notification[],
  clientId: string
): readonly CreateNotificationInput[] {
  const results: CreateNotificationInput[] = [];
  const isBank = check.entityType === 'hour_bank';
  const config = isBank ? BANK_THRESHOLDS : PROJECT_THRESHOLDS;

  const link = `/client/${clientId}/project/${check.projectId}`;

  // Check 80% threshold
  if (check.consumptionPercent >= 80) {
    const alreadyNotified = hasExistingNotification(
      existingNotifications,
      check.entityId,
      check.entityType,
      80
    );

    if (!alreadyNotified) {
      results.push({
        type: config.warningType,
        project_id: check.projectId,
        ...(check.entityType === 'phase' ? { phase_id: check.entityId } : {}),
        ...(check.entityType === 'sub_project' ? { sub_project_id: check.entityId } : {}),
        message: buildMessage(check.label, 80, check.consumptionPercent),
        threshold_percent: 80,
        link,
      });
    }
  }

  // Check 100% threshold
  if (check.consumptionPercent >= 100) {
    const alreadyNotified = hasExistingNotification(
      existingNotifications,
      check.entityId,
      check.entityType,
      100
    );

    if (!alreadyNotified) {
      results.push({
        type: config.exceededType,
        project_id: check.projectId,
        ...(check.entityType === 'phase' ? { phase_id: check.entityId } : {}),
        ...(check.entityType === 'sub_project' ? { sub_project_id: check.entityId } : {}),
        message: buildMessage(check.label, 100, check.consumptionPercent),
        threshold_percent: 100,
        link,
      });
    }
  }

  return results;
}

function hasExistingNotification(
  notifications: readonly Notification[],
  entityId: string,
  entityType: string,
  threshold: number
): boolean {
  return notifications.some((n) => {
    if (n.threshold_percent !== threshold) return false;

    if (entityType === 'project' || entityType === 'hour_bank') {
      return n.project_id === entityId && n.phase_id === null && n.sub_project_id === null;
    }
    if (entityType === 'phase') {
      return n.phase_id === entityId;
    }
    if (entityType === 'sub_project') {
      return n.sub_project_id === entityId;
    }

    return false;
  });
}

// ─── Deadline proximity checks ──────────────────────────────────────────────

export type DeadlineCheck = {
  readonly projectId: string;
  readonly projectName: string;
  readonly deadline: string;
  readonly completionPercent: number;
  readonly clientId: string;
};

/**
 * Check deadline proximity and return notifications to create.
 * - Overdue → always fire
 * - Within 7 days + <70% complete → fire warning
 * - Within 3 days at any completion → fire warning
 */
export function checkDeadline(
  check: DeadlineCheck,
  existingNotifications: readonly Notification[]
): readonly CreateNotificationInput[] {
  const results: CreateNotificationInput[] = [];
  const link = `/client/${check.clientId}/project/${check.projectId}`;
  const daysUntil = Math.ceil(
    (new Date(check.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  // Overdue
  if (daysUntil < 0) {
    const alreadyNotified = existingNotifications.some(
      (n) => n.project_id === check.projectId && n.type === 'deadline_overdue'
    );
    if (!alreadyNotified) {
      results.push({
        type: 'deadline_overdue',
        project_id: check.projectId,
        message: `${check.projectName} is past its deadline (${formatDeadline(check.deadline)}).`,
        threshold_percent: 100,
        link,
      });
    }
    return results;
  }

  // Approaching: within 7 days and <70% done, OR within 3 days at any %
  const shouldWarn =
    (daysUntil <= 7 && check.completionPercent < 70) ||
    daysUntil <= 3;

  if (shouldWarn) {
    const alreadyNotified = existingNotifications.some(
      (n) => n.project_id === check.projectId && n.type === 'deadline_approaching'
    );
    if (!alreadyNotified) {
      results.push({
        type: 'deadline_approaching',
        project_id: check.projectId,
        message: `${check.projectName} deadline is in ${daysUntil} day${daysUntil === 1 ? '' : 's'} (${formatDeadline(check.deadline)}) — ${check.completionPercent.toFixed(0)}% complete.`,
        threshold_percent: 80,
        link,
      });
    }
  }

  return results;
}

function formatDeadline(date: string): string {
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
}

function buildMessage(label: string, threshold: number, actual: number): string {
  if (threshold === 80) {
    return `${label} has reached ${actual.toFixed(0)}% of budget (warning at 80%).`;
  }
  return `${label} has exceeded budget at ${actual.toFixed(0)}%.`;
}
