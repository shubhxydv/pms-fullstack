import { Text, StyleSheet } from 'react-native';

const palettes: Record<string, { bg: string; fg: string }> = {
  LOW: { bg: '#F1F5F9', fg: '#334155' },
  MEDIUM: { bg: '#FEF3C7', fg: '#92400E' },
  HIGH: { bg: '#FEE2E2', fg: '#B91C1C' },
  NOT_STARTED: { bg: '#F1F5F9', fg: '#334155' },
  PENDING: { bg: '#F1F5F9', fg: '#334155' },
  IN_PROGRESS: { bg: '#DBEAFE', fg: '#1D4ED8' },
  COMPLETED: { bg: '#D1FAE5', fg: '#047857' },
};

export function Badge({ label }: { label: string }) {
  const palette = palettes[label] ?? palettes.PENDING;
  return (
    <Text style={[styles.badge, { backgroundColor: palette.bg, color: palette.fg }]}>
      {label.replace('_', ' ')}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    fontSize: 11,
    fontWeight: '700',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
});
