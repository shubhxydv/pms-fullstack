import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

// Tracks whether the device currently has a working internet connection.
export function useNetworkStatus(): boolean {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(Boolean(state.isConnected && state.isInternetReachable !== false));
    });
    return unsubscribe;
  }, []);

  return isConnected;
}
