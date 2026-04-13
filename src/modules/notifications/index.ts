// Public API for notifications module
export { NotificationBadge } from './components/NotificationBadge';
export { NotificationCenter } from './components/NotificationCenter';
export { useNotifications } from './hooks/useNotifications';
export { checkThresholds, checkDeadline } from './triggers';
export type { Notification, CreateNotificationInput, ThresholdCheck } from './types';
export type { DeadlineCheck } from './triggers';
