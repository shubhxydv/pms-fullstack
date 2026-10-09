import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, Text, StyleSheet } from 'react-native';
import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from '@pms/shared';
import * as projectsApi from '../features/projects/api';
import { TextField } from '../components/TextField';
import { ChipSelect } from '../components/ChipSelect';
import { DateField } from '../components/DateField';
import { Button } from '../components/Button';
import { Spinner } from '../components/Spinner';
import { useToast } from '../components/ToastProvider';
import { getApiErrorMessage } from '../lib/api/isApiError';

// Modal screen for creating or editing a project, shared between both flows.
// Loads existing data and submits changes
export default function ProjectFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const projectQuery = useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectsApi.getProject(id!),
    enabled: isEdit,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(isEdit ? updateProjectSchema : createProjectSchema) as never,
    defaultValues: { status: 'NOT_STARTED' },
  });

  useEffect(() => {
    if (projectQuery.data) {
      reset({
        name: projectQuery.data.name,
        description: projectQuery.data.description ?? '',
        status: projectQuery.data.status,
        startDate: projectQuery.data.startDate,
        endDate: projectQuery.data.endDate,
      });
    }
  }, [projectQuery.data, reset]);

  const createMutation = useMutation({
    mutationFn: (input: CreateProjectInput) => projectsApi.createProject(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Project created', 'success');
      router.back();
    },
    onError: (err) => setSubmitError(getApiErrorMessage(err, 'Could not create project')),
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateProjectInput) => projectsApi.updateProject(id!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Project updated', 'success');
      router.back();
    },
    onError: (err) => setSubmitError(getApiErrorMessage(err, 'Could not update project')),
  });

  // Routes submit to create or update
  function onSubmit(input: CreateProjectInput) {
    setSubmitError(null);
    if (isEdit) {
      updateMutation.mutate(input);
    } else {
      createMutation.mutate(input);
    }
  }

  if (isEdit && projectQuery.isLoading) return <Spinner />;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <TextField label="Name" value={field.value} onChangeText={field.onChange} error={errors.name?.message} />
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <TextField
              label="Description"
              value={field.value}
              onChangeText={field.onChange}
              multiline
              error={errors.description?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <ChipSelect
              label="Status"
              value={field.value ?? 'NOT_STARTED'}
              onChange={field.onChange}
              options={[
                { value: 'NOT_STARTED', label: 'Not started' },
                { value: 'IN_PROGRESS', label: 'In progress' },
                { value: 'COMPLETED', label: 'Completed' },
              ]}
            />
          )}
        />
        <Controller
          control={control}
          name="startDate"
          render={({ field }) => (
            <DateField label="Start date" value={field.value ?? ''} onChange={field.onChange} error={errors.startDate?.message} />
          )}
        />
        <Controller
          control={control}
          name="endDate"
          render={({ field }) => (
            <DateField label="End date" value={field.value ?? ''} onChange={field.onChange} error={errors.endDate?.message} />
          )}
        />

        {submitError && (
          <Text accessibilityRole="alert" style={styles.error}>
            {submitError}
          </Text>
        )}

        <Button
          title={isEdit ? 'Save changes' : 'Create project'}
          onPress={handleSubmit(onSubmit)}
          isLoading={isSubmitting || createMutation.isPending || updateMutation.isPending}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { padding: 20, gap: 16 },
  error: { color: '#DC2626', fontSize: 14 },
});
