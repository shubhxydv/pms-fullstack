import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View, StyleSheet } from 'react-native';
import { registerSchema, type RegisterInput } from '@pms/shared';
import { useAuth } from '../../features/auth/AuthContext';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { getApiErrorMessage } from '../../lib/api/isApiError';

// Registration screen: name/email/password form that creates a new account.
// Handles form submit and sign-up
export default function RegisterScreen() {
  const { register: registerUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(input: RegisterInput) {
    setFormError(null);
    try {
      await registerUser(input);
      router.replace('/(tabs)');
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Something went wrong'));
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create an account</Text>

        <Controller
          control={control}
          name="fullName"
          render={({ field }) => (
            <TextField
              label="Full name"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              autoComplete="name"
              error={errors.fullName?.message}
            />
          )}
        />
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
              autoComplete="new-password"
              error={errors.password?.message}
            />
          )}
        />

        {formError && (
          <Text accessibilityRole="alert" style={styles.formError}>
            {formError}
          </Text>
        )}

        <Button title="Create account" onPress={handleSubmit(onSubmit)} isLoading={isSubmitting} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" style={styles.link}>
            Sign in
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
