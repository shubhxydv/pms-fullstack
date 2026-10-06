import { apiClient } from '../../lib/api/client';
import type { DashboardSummary } from './types';

export async function fetchDashboard(): Promise<DashboardSummary> {
  const res = await apiClient.get<{ data: DashboardSummary }>('/dashboard');
  return res.data.data;
}
