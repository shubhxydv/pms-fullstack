import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { focusManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, asyncStoragePersister, PERSISTED_CACHE_MAX_AGE_MS } from '../lib/query-client';
import { AuthProvider, useAuth } from '../features/auth/AuthContext';
import { ToastProvider } from '../components/ToastProvider';
import { OfflineBanner } from '../components/OfflineBanner';
import { reregisterIfEnabled, subscribeToNotificationTaps } from '../lib/notifications';

// Root layout: sets up providers (query cache, auth, toasts) and the top-level
// navigator that switches between the auth stack and the signed-in tabs.
SplashScreen.preventAutoHideAsync().catch(() => {});

// React Query has no "window focus" event on native — AppState is the equivalent,
// so refetchOnWindowFocus-style behavior only works once this is wired up.
AppState.addEventListener('change', (status: AppStateStatus) => {
  focusManager.setFocused(status === 'active');
});

// Switches between auth stack and tabs
function RootNavigator() {
  const { user, isBootstrapping } = useAuth();

  useEffect(() => {
    if (!isBootstrapping) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isBootstrapping]);

  useEffect(() => {
    if (!user) return;
    reregisterIfEnabled();
    return subscribeToNotificationTaps((data) => {
      if (data.projectId) {
        router.push(`/(tabs)/projects/${data.projectId}`);
      }
    });
  }, [user]);

  if (isBootstrapping) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={Boolean(user)}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="project-form" options={{ presentation: 'modal', headerShown: true, title: 'Project' }} />
        <Stack.Screen name="task-form" options={{ presentation: 'modal', headerShown: true, title: 'Task' }} />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

// Wraps the app in all providers
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister, maxAge: PERSISTED_CACHE_MAX_AGE_MS }}
        >
          <AuthProvider>
            <ToastProvider>
              <StatusBar style="auto" />
              <OfflineBanner />
              <RootNavigator />
            </ToastProvider>
          </AuthProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
