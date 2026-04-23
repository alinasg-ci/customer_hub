import type { NotificationType } from '@/shared/types';

export type Notification = {
  readonly id: string;
  readonly type: NotificationType;
  readonly project_id: string | null;
  readonly phase_id: string | null;
  readonly sub_project_id: string | null;
  readonly email_id?: string | null;
  readonly message: string;
  readonly threshold_percent: number | null;
  readonly link: string;
  readonly is_read: boolean;
  readonly created_at: string;
  readonly user_id: string;
};

export type CreateNotificationInput = {
  readonly type: NotificationType;
  readonly project_id: string;
  readonly phase_id?: string;
  readonly sub_project_id?: string;
  readonly message: string;
  readonly threshold_percent: number;
  readonly link: string;
};

export type ThresholdCheck = {
  readonly entityId: string;
  readonly entityType: 'project' | 'phase' | 'sub_project' | 'hour_bank';
  readonly projectId: string;
  readonly consumptionPercent: number;
  readonly label: string;
};
