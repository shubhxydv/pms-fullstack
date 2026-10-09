import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as notificationsApi from '../features/notifications/api';
import type * as NotificationsModule from 'expo-notifications';

// Push notification setup: permissions, device token registration, and tap handling.
const ENABLED_KEY = 'pms:notificationsEnabled';

// Remote push notifications were removed from Expo Go in SDK 53+ — and merely *importing*
// expo-notifications there throws (one of its own files auto-registers a token listener at
// module-load time). So the package must never be imported at all while running in Expo Go;
// a guard placed after a static `import` is too late, since that import already ran.
const IS_EXPO_GO = isRunningInExpoGo();
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Notifications: typeof NotificationsModule | null = IS_EXPO_GO ? null : require('expo-notifications');

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

// Reads the saved notifications-on/off preference
export async function getStoredPreference(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ENABLED_KEY);
  return value === 'true';
}

// Requests permission and gets the push token
async function getDeviceToken(): Promise<string | null> {
  if (!Notifications) return null;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') {
    return null;
  }
  try {
    const { data } = await Notifications.getDevicePushTokenAsync();
    return data;
  } catch (err) {
    console.error('[notifications] getDevicePushTokenAsync failed', err);
    throw err;
  }
}

/** Requests permission, registers the device's FCM token with the backend, and persists the toggle. */
export async function enableNotifications(): Promise<boolean> {
  const token = await getDeviceToken();
  if (!token) {
    await AsyncStorage.setItem(ENABLED_KEY, 'false');
    return false;
  }
  await notificationsApi.registerToken({
    token,
    platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
  });
  await AsyncStorage.setItem(ENABLED_KEY, 'true');
  return true;
}

// Turns off notifications and unregisters the token
export async function disableNotifications(): Promise<void> {
  await AsyncStorage.setItem(ENABLED_KEY, 'false');
  if (!Notifications) return;
  try {
    const { data } = await Notifications.getDevicePushTokenAsync();
    await notificationsApi.unregisterToken(data);
  } catch {
    // Permission already revoked or token unavailable — nothing to unregister.
  }
}

/** Re-registers the current device token if the user previously opted in (e.g. on app relaunch or re-login). */
export async function reregisterIfEnabled(): Promise<void> {
  const enabled = await getStoredPreference();
  if (!enabled) return;
  try {
    await enableNotifications();
  } catch {
    // Best-effort; the Settings toggle remains the source of truth and can retry.
  }
}

export interface NotificationTapData {
  type?: string;
  taskId?: string;
  projectId?: string;
}

// Listens for taps on push notifications
/** Subscribes to notification taps (including the one that cold-launched the app) and calls `onTap` with its data. */
export function subscribeToNotificationTaps(
  onTap: (data: NotificationTapData) => void,
): () => void {
  if (!Notifications) return () => {};
  Notifications.getLastNotificationResponseAsync()
    .then((response) => {
      if (response) {
        onTap(response.notification.request.content.data as NotificationTapData);
      }
    })
    .catch(() => {});

  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    onTap(response.notification.request.content.data as NotificationTapData);
  });
  return () => subscription.remove();
}
