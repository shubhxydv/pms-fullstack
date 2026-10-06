import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, View, StyleSheet } from 'react-native';
import { fetchDashboard } from '../../features/dashboard/api';
import { StatCard } from '../../components/StatCard';
import { Spinner } from '../../components/Spinner';
import { ErrorRetry } from '../../components/ErrorRetry';
import { EmptyState } from '../../components/EmptyState';
import { Badge } from '../../components/Badge';
import { getApiErrorMessage } from '../../lib/api/isApiError';

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) return <Spinner />;
  if (isError) {
    return (
      <View style={styles.center}>
        <ErrorRetry message={getApiErrorMessage(error, 'Could not load the dashboard.')} onRetry={() => refetch()} />
      </View>
    );
  }
  if (!data) return null;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.statsGrid}>
        <StatCard label="Total projects" value={data.totalProjects} />
        <StatCard label="Total tasks" value={data.totalTasks} />
        <StatCard label="Completed" value={data.completedTasks} />
        <StatCard label="Pending" value={data.pendingTasks} />
        <StatCard label="Projects in progress" value={data.projectsInProgress} />
        <StatCard label="Overdue" value={data.overdueTasks} tone="danger" />
      </View>

      <Text style={styles.sectionTitle}>Due soon</Text>
      {data.dueSoon.length === 0 ? (
        <EmptyState message="No upcoming tasks due." />
      ) : (
        <View style={styles.list}>
          {data.dueSoon.map((task) => (
            <Pressable
              key={task.id}
              onPress={() => router.push(`/(tabs)/projects/${task.projectId}`)}
              style={styles.row}
            >
              <Text style={styles.rowTitle} numberOfLines={1}>
                {task.name}
              </Text>
              <View style={styles.rowMeta}>
                <Badge label={task.priority} />
                <Text style={styles.rowDate}>{task.dueDate}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 20 },
  center: { flex: 1, justifyContent: 'center', padding: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  list: { gap: 8 },
  row: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  rowTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#0F172A' },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowDate: { fontSize: 12, color: '#64748B' },
});
