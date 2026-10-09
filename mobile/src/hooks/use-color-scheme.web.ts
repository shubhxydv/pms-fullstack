import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

// Web override: defaults to light until mounted, then returns the real scheme.
/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
// Returns light scheme before hydration
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
