import { Text, View, StyleSheet } from 'react-native';

export function StatCard({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'danger' }) {
  return (
    <View style={[styles.card, tone === 'danger' && styles.danger]}>
      <Text style={[styles.label, tone === 'danger' && styles.labelDanger]}>{label}</Text>
      <Text style={[styles.value, tone === 'danger' && styles.valueDanger]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
  },
  danger: { borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  label: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  labelDanger: { color: '#B91C1C' },
  value: { fontSize: 24, color: '#0F172A', fontWeight: '700', marginTop: 4 },
  valueDanger: { color: '#B91C1C' },
});
