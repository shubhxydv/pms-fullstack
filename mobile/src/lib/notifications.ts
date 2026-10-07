import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as notificationsApi from '../features/notifications/api';

const ENABLED_KEY = 'pms:notificationsEnabled';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function getStoredPreference(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ENABLED_KEY);
  return value === 'true';
}

async function getDeviceToken(): Promise<string | null> {
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

export async function disableNotifications(): Promise<void> {
  await AsyncStorage.setItem(ENABLED_KEY, 'false');
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

/** Subscribes to notification taps (including the one that cold-launched the app) and calls `onTap` with its data. */
export function subscribeToNotificationTaps(
  onTap: (data: NotificationTapData) => void,
): () => void {
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
