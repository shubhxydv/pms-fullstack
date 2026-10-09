import { useRef } from 'react';
import { useFocusEffect } from 'expo-router';

// Re-runs a query's refetch whenever its screen comes back into focus.
/**
 * Refetches whenever this screen regains focus (e.g. switching back to this tab),
 * which React Query does not do on its own in React Native — there's no "window
 * focus" event like on web. Skips the very first focus (right after mount) since
 * the query's own initial fetch already covers that.
 */
export function useRefetchOnFocus(refetch: () => void): void {
  const isFirstFocus = useRef(true);

  useFocusEffect(() => {
    if (isFirstFocus.current) {
      isFirstFocus.current = false;
      return;
    }
    refetch();
  });
}
