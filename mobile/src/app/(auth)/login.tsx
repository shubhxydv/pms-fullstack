import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View, StyleSheet } from 'react-native';
import { loginSchema, type LoginInput } from '@pms/shared';
import { useAuth } from '../../features/auth/AuthContext';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { getApiErrorMessage } from '../../lib/api/isApiError';

export default function LoginScreen() {
  const { login, sessionExpired, dismissSessionExpired } = useAuth();
  const [formError, setFormError] = useState<string | null>(
    sessionExpired ? 'Your session expired. Please sign in again.' : null,
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(input: LoginInput) {
    setFormError(null);
    dismissSessionExpired();
    try {
      await login(input);
      router.replace('/(tabs)');
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Something went wrong'));
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Sign in</Text>

        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextField
              label="Email"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              error={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <TextField
              label="Password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              secureTextEntry
              autoComplete="current-password"
              error={errors.password?.message}
            />
          )}
        />

        {formError && (
          <Text accessibilityRole="alert" style={styles.formError}>
            {formError}
          </Text>
        )}

        <Button title="Sign in" onPress={handleSubmit(onSubmit)} isLoading={isSubmitting} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don&apos;t have an account? </Text>
          <Link href="/(auth)/register" style={styles.link}>
            Create one
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  formError: { color: '#DC2626', fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  footerText: { color: '#64748B', fontSize: 14 },
  link: { color: '#0F172A', fontWeight: '600', fontSize: 14, textDecorationLine: 'underline' },
});
