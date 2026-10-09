// Fetches the dashboard summary (stats + due-soon tasks) shown on the home tab.
import { apiClient } from '../../lib/api/client';
import type { DashboardSummary } from './types';

// Loads dashboard summary data
export async function fetchDashboard(): Promise<DashboardSummary> {
  const res = await apiClient.get<{ data: DashboardSummary }>('/dashboard');
  return res.data.data;
}
