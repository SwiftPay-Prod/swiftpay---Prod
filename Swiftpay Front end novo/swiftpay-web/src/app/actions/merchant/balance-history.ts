'use server';

import client from '@/clients/client';
import type { ApiResponse, Paginated } from '@/types/common';
import type {
  MinimalBalanceHistory,
  BalanceHistoryDetails,
  ListBalanceHistoryRequest,
} from '@/types/merchant/balance-history';

export async function listBalanceHistory(
  merchantId: string,
  params?: ListBalanceHistoryRequest
): Promise<ApiResponse<Paginated<MinimalBalanceHistory>>> {
  const response = await client.get<ApiResponse<Paginated<MinimalBalanceHistory>>>(
    `/v1/merchant/${merchantId}/balance-history`,
    { params }
  );
  return response?.data;
}

export async function getBalanceHistoryDetails(
  merchantId: string,
  reconciliationId: string
): Promise<ApiResponse<BalanceHistoryDetails>> {
  const response = await client.get<ApiResponse<BalanceHistoryDetails>>(
    `/v1/merchant/${merchantId}/balance-history/${reconciliationId}`
  );
  return response?.data;
}
