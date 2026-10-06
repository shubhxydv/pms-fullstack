import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, Text, StyleSheet } from 'react-native';
import { createTaskSchema, updateTaskSchema, type CreateTaskInput, type UpdateTaskInput } from '@pms/shared';
import * as tasksApi from '../features/tasks/api';
import { TextField } from '../components/TextField';
import { ChipSelect } from '../components/ChipSelect';
import { DateField } from '../components/DateField';
import { Button } from '../components/Button';
import { Spinner } from '../components/Spinner';
import { useToast } from '../components/ToastProvider';
import { getApiErrorMessage } from '../lib/api/isApiError';

export default function TaskFormScreen() {
  const { projectId, id } = useLocalSearchParams<{ projectId: string; id?: string }>();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const taskQuery = useQuery({
    queryKey: ['tasks', 'detail', id],
    queryFn: () => tasksApi.getTask(id!),
    enabled: isEdit,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(isEdit ? updateTaskSchema : createTaskSchema) as never,
    defaultValues: { projectId, priority: 'MEDIUM', status: 'PENDING' },
  });

  useEffect(() => {
    if (taskQuery.data) {
      reset({
        name: taskQuery.data.name,
        description: taskQuery.data.description ?? '',
        priority: taskQuery.data.priority,
        status: taskQuery.data.status,
        dueDate: taskQuery.data.dueDate,
      });
    }
  }, [taskQuery.data, reset]);

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }

  const createMutation = useMutation({
    mutationFn: (input: CreateTaskInput) => tasksApi.createTask(input),
    onSuccess: () => {
      invalidateAll();
      showToast('Task created', 'success');
      router.back();
    },
    onError: (err) => setSubmitError(getApiErrorMessage(err, 'Could not create task')),
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateTaskInput) => tasksApi.updateTask(id!, input),
    onSuccess: () => {
      invalidateAll();
      showToast('Task updated', 'success');
      router.back();
    },
    onError: (err) => setSubmitError(getApiErrorMessage(err, 'Could not update task')),
  });

  function onSubmit(input: CreateTaskInput) {
    setSubmitError(null);
    if (isEdit) {
      updateMutation.mutate(input);
    } else {
      createMutation.mutate(input);
    }
  }

  if (isEdit && taskQuery.isLoading) return <Spinner />;

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
          name="priority"
          render={({ field }) => (
            <ChipSelect
              label="Priority"
              value={field.value ?? 'MEDIUM'}
              onChange={field.onChange}
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
              ]}
            />
          )}
        />
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <ChipSelect
              label="Status"
              value={field.value ?? 'PENDING'}
              onChange={field.onChange}
              options={[
                { value: 'PENDING', label: 'Pending' },
                { value: 'IN_PROGRESS', label: 'In progress' },
                { value: 'COMPLETED', label: 'Completed' },
              ]}
            />
          )}
        />
        <Controller
          control={control}
          name="dueDate"
          render={({ field }) => (
            <DateField label="Due date" value={field.value ?? ''} onChange={field.onChange} error={errors.dueDate?.message} />
          )}
        />

        {submitError && (
          <Text accessibilityRole="alert" style={styles.error}>
            {submitError}
          </Text>
        )}

        <Button
          title={isEdit ? 'Save changes' : 'Create task'}
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
