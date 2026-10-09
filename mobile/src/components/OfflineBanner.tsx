// Red banner shown app-wide whenever the device has no network connection.
import { Text, View, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../hooks/use-network-status';

// Shows a banner when offline
export function OfflineBanner() {
  const isConnected = useNetworkStatus();
  if (isConnected) return null;

  return (
    <View accessibilityRole="alert" style={styles.container}>
      <Text style={styles.text}>No internet connection. Check your network and try again.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#B91C1C', paddingVertical: 8, paddingHorizontal: 16 },
  text: { color: '#FFFFFF', fontSize: 13, fontWeight: '500', textAlign: 'center' },
});
