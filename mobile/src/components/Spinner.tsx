import { ActivityIndicator, View, StyleSheet } from 'react-native';

export function Spinner() {
  return (
    <View accessibilityRole="progressbar" style={styles.container}>
      <ActivityIndicator size="large" color="#0F172A" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 32, alignItems: 'center', justifyContent: 'center' },
});
