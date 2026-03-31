// Public API for notifications module
export { NotificationBadge } from './components/NotificationBadge';
export { NotificationCenter } from './components/NotificationCenter';
export { useNotifications } from './hooks/useNotifications';
export { checkThresholds } from './triggers';
export type { Notification, CreateNotificationInput, ThresholdCheck } from './types';
