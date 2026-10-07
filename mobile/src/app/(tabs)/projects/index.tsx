import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Alert, FlatList, Pressable, RefreshControl, Text, TextInput, View, StyleSheet } from 'react-native';
import * as projectsApi from '../../../features/projects/api';
import { Button } from '../../../components/Button';
import { Spinner } from '../../../components/Spinner';
import { ErrorRetry } from '../../../components/ErrorRetry';
import { EmptyState } from '../../../components/EmptyState';
import { Badge } from '../../../components/Badge';
import { ProgressBar } from '../../../components/ProgressBar';
import { ChipSelect } from '../../../components/ChipSelect';
import { useToast } from '../../../components/ToastProvider';
import { getApiErrorMessage } from '../../../lib/api/isApiError';
import type { ProjectDto } from '../../../features/projects/types';
import { useRefetchOnFocus } from '../../../hooks/use-refetch-on-focus';

export default function ProjectsScreen() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setQ(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['projects', { q, status, page, pageSize }],
    queryFn: () =>
      projectsApi.listProjects({
        q: q || undefined,
        status: status || undefined,
        sort: 'createdAt',
        order: 'desc',
        page,
        pageSize,
      }),
  });
  useRefetchOnFocus(refetch);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Project deleted', 'success');
    },
    onError: (err) => showToast(getApiErrorMessage(err, 'Could not delete project'), 'error'),
  });

  function confirmDelete(project: ProjectDto) {
    Alert.alert('Delete project', `Delete "${project.name}"? This will also delete all of its tasks.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(project.id) },
    ]);
  }

  return (
    <View style={styles.flex}>
      <View style={styles.toolbar}>
        <TextInput
          placeholder="Search projects…"
          placeholderTextColor="#94A3B8"
          value={searchInput}
          onChangeText={setSearchInput}
          style={styles.search}
        />
        <ChipSelect
          label=""
          value={status}
          onChange={setStatus}
          options={[
            { value: '', label: 'All' },
            { value: 'NOT_STARTED', label: 'Not started' },
            { value: 'IN_PROGRESS', label: 'In progress' },
            { value: 'COMPLETED', label: 'Completed' },
          ]}
        />
        <Button title="New project" onPress={() => router.push('/project-form')} />
      </View>

      {isLoading && <Spinner />}
      {isError && (
        <View style={styles.center}>
          <ErrorRetry message={getApiErrorMessage(error, 'Could not load projects.')} onRetry={() => refetch()} />
        </View>
      )}
      {!isLoading && !isError && data && data.data.length === 0 && (
        <View style={styles.center}>
          <EmptyState message="No projects yet. Create your first one." />
        </View>
      )}

      {!isLoading && !isError && data && data.data.length > 0 && (
        <FlatList
          data={data.data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(tabs)/projects/${item.id}`)}
              onLongPress={() => confirmDelete(item)}
              style={styles.card}
            >
              <Text style={styles.cardTitle}>{item.name}</Text>
              <View style={styles.cardMeta}>
                <Badge label={item.status} />
                <Text style={styles.cardDates}>
                  {item.startDate} → {item.endDate}
                </Text>
              </View>
              <ProgressBar completed={item.completedCount} total={item.taskCount} />
              <View style={styles.cardActions}>
                <Button title="Edit" variant="secondary" onPress={() => router.push(`/project-form?id=${item.id}`)} />
                <Button title="Delete" variant="danger" onPress={() => confirmDelete(item)} />
              </View>
            </Pressable>
          )}
          ListFooterComponent={
            data.meta.totalPages > 1 ? (
              <View style={styles.pagination}>
                <Button title="Previous" variant="secondary" disabled={page <= 1} onPress={() => setPage((p) => p - 1)} />
                <Text style={styles.pageText}>
                  Page {data.meta.page} of {data.meta.totalPages}
                </Text>
                <Button
                  title="Next"
                  variant="secondary"
                  disabled={page >= data.meta.totalPages}
                  onPress={() => setPage((p) => p + 1)}
                />
              </View>
            ) : null
          }
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
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardDates: { fontSize: 12, color: '#64748B' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  pageText: { fontSize: 13, color: '#64748B' },
});
