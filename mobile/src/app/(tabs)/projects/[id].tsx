import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import * as projectsApi from '../../../features/projects/api';
import * as tasksApi from '../../../features/tasks/api';
import { Button } from '../../../components/Button';
import { Spinner } from '../../../components/Spinner';
import { ErrorRetry } from '../../../components/ErrorRetry';
import { EmptyState } from '../../../components/EmptyState';
import { Badge } from '../../../components/Badge';
import { ChipSelect } from '../../../components/ChipSelect';
import { useToast } from '../../../components/ToastProvider';
import { getApiErrorMessage } from '../../../lib/api/isApiError';
import type { TaskDto } from '../../../features/tasks/types';
import { useRefetchOnFocus } from '../../../hooks/use-refetch-on-focus';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const projectQuery = useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectsApi.getProject(id),
    enabled: Boolean(id),
  });

  const tasksQuery = useQuery({
    queryKey: ['tasks', id, { search, statusFilter, priorityFilter }],
    queryFn: () =>
      tasksApi.listTasks({
        projectId: id,
        q: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        page: 1,
        pageSize: 50,
        sort: 'dueDate',
        order: 'asc',
      }),
    enabled: Boolean(id),
  });
  useRefetchOnFocus(projectQuery.refetch);
  useRefetchOnFocus(tasksQuery.refetch);

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['tasks', id] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  }

  const quickUpdateMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskDto['status'] }) =>
      tasksApi.updateTask(taskId, { status }),
    onSuccess: invalidateAll,
    onError: (err) => showToast(getApiErrorMessage(err, 'Could not update task'), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => tasksApi.deleteTask(taskId),
    onSuccess: () => {
      invalidateAll();
      showToast('Task deleted', 'success');
    },
    onError: (err) => showToast(getApiErrorMessage(err, 'Could not delete task'), 'error'),
  });

  function confirmDelete(task: TaskDto) {
    Alert.alert('Delete task', `Delete "${task.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(task.id) },
    ]);
  }

  if (projectQuery.isLoading) return <Spinner />;
  if (projectQuery.isError) {
    return (
      <View style={styles.center}>
        <ErrorRetry
          message={getApiErrorMessage(projectQuery.error, 'Could not load this project.')}
          onRetry={() => projectQuery.refetch()}
        />
      </View>
    );
  }
  const project = projectQuery.data;
  if (!project) return null;

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>{project.name}</Text>
        {project.description ? <Text style={styles.description}>{project.description}</Text> : null}
        <View style={styles.headerMeta}>
          <Badge label={project.status} />
          <Text style={styles.dates}>
            {project.startDate} → {project.endDate}
          </Text>
        </View>
      </View>

      <View style={styles.toolbar}>
        <TextInput
          placeholder="Search tasks…"
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
          style={styles.search}
        />
        <ChipSelect
          label=""
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'IN_PROGRESS', label: 'In progress' },
            { value: 'COMPLETED', label: 'Completed' },
          ]}
        />
        <ChipSelect
          label=""
          value={priorityFilter}
          onChange={setPriorityFilter}
          options={[
            { value: '', label: 'All priorities' },
            { value: 'LOW', label: 'Low' },
            { value: 'MEDIUM', label: 'Medium' },
            { value: 'HIGH', label: 'High' },
          ]}
        />
        <Button title="New task" onPress={() => router.push(`/task-form?projectId=${id}`)} />
      </View>

      {tasksQuery.isLoading && <Spinner />}
      {tasksQuery.isError && (
        <View style={styles.center}>
          <ErrorRetry
            message={getApiErrorMessage(tasksQuery.error, 'Could not load tasks.')}
            onRetry={() => tasksQuery.refetch()}
          />
        </View>
      )}
      {!tasksQuery.isLoading && !tasksQuery.isError && tasksQuery.data?.data.length === 0 && (
        <View style={styles.center}>
          <EmptyState message="No tasks match your filters." />
        </View>
      )}

      {!tasksQuery.isLoading && !tasksQuery.isError && tasksQuery.data && tasksQuery.data.data.length > 0 && (
        <FlatList
          data={tasksQuery.data.data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={tasksQuery.isRefetching} onRefresh={tasksQuery.refetch} />}
          renderItem={({ item }) => {
            const completed = item.status === 'COMPLETED';
            return (
              <View style={styles.taskRow}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: completed }}
                  onPress={() =>
                    quickUpdateMutation.mutate({ taskId: item.id, status: completed ? 'PENDING' : 'COMPLETED' })
                  }
                  style={[styles.checkbox, completed && styles.checkboxChecked]}
                >
                  {completed && <Text style={styles.checkmark}>✓</Text>}
                </Pressable>
                <Pressable style={styles.taskInfo} onPress={() => router.push(`/task-form?projectId=${id}&id=${item.id}`)}>
                  <Text style={[styles.taskName, completed && styles.taskNameDone]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.taskDue}>Due {item.dueDate}</Text>
                </Pressable>
                <Badge label={item.priority} />
                <Pressable onPress={() => confirmDelete(item)} style={styles.deleteButton}>
                  <Text style={styles.deleteText}>✕</Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', padding: 16 },
  header: { padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 6 },
  title: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  description: { fontSize: 14, color: '#64748B' },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dates: { fontSize: 12, color: '#64748B' },
  toolbar: { padding: 16, gap: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  search: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    minHeight: 44,
  },
  list: { padding: 16, gap: 10 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#10B981', borderColor: '#10B981' },
  checkmark: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  taskInfo: { flex: 1, gap: 2 },
  taskName: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  taskNameDone: { color: '#94A3B8', textDecorationLine: 'line-through' },
  taskDue: { fontSize: 12, color: '#64748B' },
  deleteButton: { padding: 6 },
  deleteText: { color: '#DC2626', fontSize: 16, fontWeight: '700' },
});
