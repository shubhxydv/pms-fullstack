import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as notificationsApi from '../features/notifications/api';

// Push notification setup: permissions, device token registration, and tap handling.
const ENABLED_KEY = 'pms:notificationsEnabled';

// Remote push notifications were removed from Expo Go in SDK 53+ and throw if touched at all —
// only call the real notifications APIs in a real build (dev client / standalone app).
const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (!IS_EXPO_GO) {
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
  if (IS_EXPO_GO) return null;
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
  if (IS_EXPO_GO) return;
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
  if (IS_EXPO_GO) return () => {};
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
