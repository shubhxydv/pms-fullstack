import { useState } from 'react';
import { Alert, Switch, Text, View, StyleSheet } from 'react-native';
import { useAuth } from '../../features/auth/AuthContext';
import { Button } from '../../components/Button';
import { useToast } from '../../components/ToastProvider';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      showToast('Could not log out. Please try again.', 'error');
    } finally {
      setIsLoggingOut(false);
    }
  }

  function confirmLogout() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: handleLogout },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.role}>{user?.role}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Due-tomorrow notifications</Text>
            <Text style={styles.rowHint}>Get notified about tasks due tomorrow</Text>
          </View>
          <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
        </View>
      </View>

      <Button title="Log out" variant="danger" onPress={confirmLogout} isLoading={isLoggingOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16, gap: 20 },
  section: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, gap: 6 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  email: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  role: { fontSize: 13, color: '#64748B' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowText: { flex: 1, gap: 2, marginRight: 12 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  rowHint: { fontSize: 13, color: '#64748B' },
});
