// API call for the dashboard summary stats.
import { apiClient } from '../../lib/api/client';
import type { DashboardSummary } from './types';

// Fetches dashboard summary stats
export async function fetchDashboard(): Promise<DashboardSummary> {
  const res = await apiClient.get<{ data: DashboardSummary }>('/dashboard');
  return res.data.data;
}
