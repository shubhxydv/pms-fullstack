import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      // How long a cached query is kept (and persisted) before being dropped entirely —
      // long enough that reopening the app offline after a day still shows the last-known data.
      gcTime: ONE_DAY_MS,
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'pms-query-cache',
});

/** Cached data older than this is dropped at startup instead of silently shown as current. */
export const PERSISTED_CACHE_MAX_AGE_MS = ONE_DAY_MS;
