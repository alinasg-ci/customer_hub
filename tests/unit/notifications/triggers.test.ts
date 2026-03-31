import { describe, it, expect } from 'vitest';
import { checkThresholds } from '@/modules/notifications/triggers';
import type { Notification, ThresholdCheck } from '@/modules/notifications/types';

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'n-1',
    type: 'over_budget_warning',
    project_id: 'proj-1',
    phase_id: null,
    sub_project_id: null,
    message: 'test',
    threshold_percent: 80,
    link: '/client/c-1/project/proj-1',
    is_read: false,
    created_at: '2026-01-01T00:00:00Z',
    user_id: 'user-1',
    ...overrides,
  };
}

describe('checkThresholds', () => {
  const clientId = 'client-1';

  it('should create warning notification at 80% consumption', () => {
    const check: ThresholdCheck = {
      entityId: 'proj-1',
      entityType: 'project',
      projectId: 'proj-1',
      consumptionPercent: 83,
      label: 'Honda Analysis',
    };

    const results = checkThresholds(check, [], clientId);
    expect(results).toHaveLength(1);
    expect(results[0].threshold_percent).toBe(80);
    expect(results[0].type).toBe('over_budget_warning');
    expect(results[0].message).toContain('83%');
  });

  it('should create both warning and exceeded at 100%+', () => {
    const check: ThresholdCheck = {
      entityId: 'proj-1',
      entityType: 'project',
      projectId: 'proj-1',
      consumptionPercent: 105,
      label: 'Honda Analysis',
    };

    const results = checkThresholds(check, [], clientId);
    expect(results).toHaveLength(2);
    expect(results[0].threshold_percent).toBe(80);
    expect(results[1].threshold_percent).toBe(100);
  });

  it('should NOT create duplicate at 80% when notification already exists', () => {
    const check: ThresholdCheck = {
      entityId: 'proj-1',
      entityType: 'project',
      projectId: 'proj-1',
      consumptionPercent: 85,
      label: 'Honda Analysis',
    };

    const existing = [
      makeNotification({ project_id: 'proj-1', threshold_percent: 80 }),
    ];

    const results = checkThresholds(check, existing, clientId);
    expect(results).toHaveLength(0); // Already notified at 80%
  });

  it('should create 100% notification even when 80% already exists', () => {
    const check: ThresholdCheck = {
      entityId: 'proj-1',
      entityType: 'project',
      projectId: 'proj-1',
      consumptionPercent: 105,
      label: 'Honda Analysis',
    };

    const existing = [
      makeNotification({ project_id: 'proj-1', threshold_percent: 80 }),
    ];

    const results = checkThresholds(check, existing, clientId);
    expect(results).toHaveLength(1);
    expect(results[0].threshold_percent).toBe(100);
  });

  it('should NOT create any when both thresholds already notified', () => {
    const check: ThresholdCheck = {
      entityId: 'proj-1',
      entityType: 'project',
      projectId: 'proj-1',
      consumptionPercent: 110,
      label: 'Honda Analysis',
    };

    const existing = [
      makeNotification({ project_id: 'proj-1', threshold_percent: 80 }),
      makeNotification({ id: 'n-2', project_id: 'proj-1', threshold_percent: 100, type: 'over_budget_exceeded' }),
    ];

    const results = checkThresholds(check, existing, clientId);
    expect(results).toHaveLength(0);
  });

  it('should create nothing below 80%', () => {
    const check: ThresholdCheck = {
      entityId: 'proj-1',
      entityType: 'project',
      projectId: 'proj-1',
      consumptionPercent: 75,
      label: 'Honda Analysis',
    };

    const results = checkThresholds(check, [], clientId);
    expect(results).toHaveLength(0);
  });

  it('should handle phase-level threshold', () => {
    const check: ThresholdCheck = {
      entityId: 'phase-1',
      entityType: 'phase',
      projectId: 'proj-1',
      consumptionPercent: 90,
      label: 'Research Phase',
    };

    const results = checkThresholds(check, [], clientId);
    expect(results).toHaveLength(1);
    expect(results[0].phase_id).toBe('phase-1');
  });

  it('should not duplicate phase notification when existing for same phase', () => {
    const check: ThresholdCheck = {
      entityId: 'phase-1',
      entityType: 'phase',
      projectId: 'proj-1',
      consumptionPercent: 90,
      label: 'Research Phase',
    };

    const existing = [
      makeNotification({ phase_id: 'phase-1', threshold_percent: 80 }),
    ];

    const results = checkThresholds(check, existing, clientId);
    expect(results).toHaveLength(0);
  });

  it('should handle hour bank thresholds with bank types', () => {
    const check: ThresholdCheck = {
      entityId: 'proj-bank',
      entityType: 'hour_bank',
      projectId: 'proj-bank',
      consumptionPercent: 82,
      label: 'Alma Hour Bank',
    };

    const results = checkThresholds(check, [], clientId);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('bank_depleting');
  });

  it('should handle sub-project threshold', () => {
    const check: ThresholdCheck = {
      entityId: 'sub-1',
      entityType: 'sub_project',
      projectId: 'proj-bank',
      consumptionPercent: 100,
      label: 'Strategy sub-project',
    };

    const results = checkThresholds(check, [], clientId);
    expect(results).toHaveLength(2);
    expect(results[0].sub_project_id).toBe('sub-1');
  });

  it('should handle exactly 80% consumption', () => {
    const check: ThresholdCheck = {
      entityId: 'proj-1',
      entityType: 'project',
      projectId: 'proj-1',
      consumptionPercent: 80,
      label: 'Test Project',
    };

    const results = checkThresholds(check, [], clientId);
    expect(results).toHaveLength(1);
    expect(results[0].threshold_percent).toBe(80);
  });

  it('should include link to project view', () => {
    const check: ThresholdCheck = {
      entityId: 'proj-1',
      entityType: 'project',
      projectId: 'proj-1',
      consumptionPercent: 85,
      label: 'Test',
    };

    const results = checkThresholds(check, [], 'client-abc');
    expect(results[0].link).toBe('/client/client-abc/project/proj-1');
  });
});
