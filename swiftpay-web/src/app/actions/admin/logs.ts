'use server';

import client from '@/clients/client';
import type { AdminReadListLogsRequest, AdminLogEntry } from '@/types/admin/logs';
import type { ApiResponse, Paginated } from '@/types/common';

export async function adminListLogs(
  params?: AdminReadListLogsRequest
): Promise<ApiResponse<Paginated<AdminLogEntry>>> {
  const response = await client.get<ApiResponse<Paginated<AdminLogEntry>>>('/v1/admin/logs', {
    params,
  });
  return response?.data;
}
