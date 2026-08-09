import type { AppNotification } from '@/constants/notifications';
import type { UserRole } from '@/constants/workflow';

export type NotificationReadOverrides = Record<string, boolean>;

export const NOTIFICATION_STATE_EVENT = 'udomsasn:notification-state-change';

export function notificationStorageKey(role: UserRole): string {
  return `udomsasn:notification-read-state:${role.toLowerCase()}`;
}

export function parseNotificationOverrides(raw: string | null): NotificationReadOverrides {
  try {
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, boolean] => {
        const [id, value] = entry;
        return id.length > 0 && typeof value === 'boolean';
      }),
    );
  } catch {
    return {};
  }
}

export function notificationStateSnapshot(role: UserRole): string {
  if (typeof window === 'undefined') return '{}';
  return window.localStorage.getItem(notificationStorageKey(role)) ?? '{}';
}

export function subscribeNotificationState(role: UserRole, listener: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const handleLocalChange = (event: Event) => {
    const changedRole = (event as CustomEvent<{ role?: UserRole }>).detail?.role;
    if (!changedRole || changedRole === role) listener();
  };
  const handleStorage = (event: StorageEvent) => {
    if (event.key === notificationStorageKey(role)) listener();
  };

  window.addEventListener(NOTIFICATION_STATE_EVENT, handleLocalChange);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(NOTIFICATION_STATE_EVENT, handleLocalChange);
    window.removeEventListener('storage', handleStorage);
  };
}

export function writeNotificationOverrides(
  role: UserRole,
  overrides: NotificationReadOverrides,
): void {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(notificationStorageKey(role), JSON.stringify(overrides));
  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_STATE_EVENT, {
      detail: { role },
    }),
  );
}

export function isNotificationRead(
  notification: AppNotification,
  overrides: NotificationReadOverrides,
): boolean {
  return overrides[notification.id] ?? notification.initiallyRead;
}

export function unreadNotificationCount(
  notifications: readonly AppNotification[],
  overrides: NotificationReadOverrides,
): number {
  return notifications.filter((notification) => !isNotificationRead(notification, overrides)).length;
}
