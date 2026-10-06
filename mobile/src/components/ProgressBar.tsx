import { Text, View, StyleSheet } from 'react-native';

export function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <View style={styles.row}>
      <View accessibilityRole="progressbar" style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.text}>
        {completed}/{total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { width: 80, height: 6, borderRadius: 999, backgroundColor: '#E2E8F0', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#10B981' },
  text: { fontSize: 12, color: '#64748B' },
});
