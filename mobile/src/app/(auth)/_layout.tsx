// Stack navigator wrapping the login and register screens.
import { Stack } from 'expo-router';

// Hides the header for both auth screens
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
