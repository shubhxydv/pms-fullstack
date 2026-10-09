import { useState } from 'react';
import { Platform, Pressable, Text, View, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

interface DateFieldProps {
  label: string;
  value: string;
  error?: string;
  onChange: (isoDate: string) => void;
}

function toDateString(date: Date): string {
  // Use local calendar fields, not toISOString() — that converts to UTC first, which
  // rolls the date back (or forward) a day for any timezone offset from UTC.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toDate(value: string): Date {
  return value ? new Date(`${value}T00:00:00`) : new Date();
}

export function DateField({ label, value, error, onChange }: DateFieldProps) {
  const [showPicker, setShowPicker] = useState(false);

  function handleChange(_event: unknown, selectedDate?: Date) {
    setShowPicker(false);
    if (selectedDate) {
      onChange(toDateString(selectedDate));
    }
  }

  function openPicker() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: toDate(value),
        mode: 'date',
        onChange: handleChange,
      });
    } else {
      setShowPicker(true);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || 'not set'}`}
        onPress={openPicker}
        style={[styles.input, error && styles.inputError]}
      >
        <Text style={value ? styles.valueText : styles.placeholderText}>{value || 'Select a date'}</Text>
      </Pressable>
      {error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
      {Platform.OS === 'ios' && showPicker && (
        <DateTimePicker value={toDate(value)} mode="date" display="inline" onChange={handleChange} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500', color: '#334155' },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  inputError: { borderColor: '#F87171' },
  valueText: { fontSize: 15, color: '#0F172A' },
  placeholderText: { fontSize: 15, color: '#94A3B8' },
  error: { fontSize: 13, color: '#DC2626' },
});
