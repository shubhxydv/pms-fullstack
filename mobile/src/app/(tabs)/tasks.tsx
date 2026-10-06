import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, Text, TextInput, View, StyleSheet } from 'react-native';
import * as tasksApi from '../../features/tasks/api';
import { Spinner } from '../../components/Spinner';
import { ErrorRetry } from '../../components/ErrorRetry';
import { EmptyState } from '../../components/EmptyState';
import { Badge } from '../../components/Badge';
import { ChipSelect } from '../../components/ChipSelect';
import { useToast } from '../../components/ToastProvider';
import { getApiErrorMessage } from '../../lib/api/isApiError';
import type { TaskDto } from '../../features/tasks/types';

export default function AllTasksScreen() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setQ(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['tasks', 'all', { q, statusFilter, priorityFilter }],
    queryFn: () =>
      tasksApi.listTasks({
        q: q || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        page: 1,
        pageSize: 50,
        sort: 'dueDate',
        order: 'asc',
      }),
  });

  const quickUpdateMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskDto['status'] }) =>
      tasksApi.updateTask(taskId, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    onError: (err) => showToast(getApiErrorMessage(err, 'Could not update task'), 'error'),
  });

  return (
    <View style={styles.flex}>
      <View style={styles.toolbar}>
        <TextInput
          placeholder="Search all tasks…"
          placeholderTextColor="#94A3B8"
          value={searchInput}
          onChangeText={setSearchInput}
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
      </View>

      {isLoading && <Spinner />}
      {isError && (
        <View style={styles.center}>
          <ErrorRetry message={getApiErrorMessage(error, 'Could not load tasks.')} onRetry={() => refetch()} />
        </View>
      )}
      {!isLoading && !isError && data && data.data.length === 0 && (
        <View style={styles.center}>
          <EmptyState message="No tasks match your filters." />
        </View>
      )}

      {!isLoading && !isError && data && data.data.length > 0 && (
        <FlatList
          data={data.data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
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
                <Pressable
                  style={styles.taskInfo}
                  onPress={() => router.push(`/(tabs)/projects/${item.projectId}`)}
                >
                  <Text style={[styles.taskName, completed && styles.taskNameDone]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.taskDue}>Due {item.dueDate}</Text>
                </Pressable>
                <Badge label={item.priority} />
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
});
