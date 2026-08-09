'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { UserRole } from '@/constants/workflow';
import {
  notificationStateSnapshot,
  parseNotificationOverrides,
  subscribeNotificationState,
  type NotificationReadOverrides,
} from '@/lib/notification-state';

const EMPTY_SNAPSHOT = '{}';

export function useNotificationState(role: UserRole): NotificationReadOverrides {
  const subscribe = useCallback(
    (listener: () => void) => subscribeNotificationState(role, listener),
    [role],
  );
  const getSnapshot = useCallback(() => notificationStateSnapshot(role), [role]);
  const getServerSnapshot = useCallback(() => EMPTY_SNAPSHOT, []);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return useMemo(() => parseNotificationOverrides(snapshot), [snapshot]);
}
