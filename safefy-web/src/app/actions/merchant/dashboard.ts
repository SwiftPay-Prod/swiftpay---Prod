"use server";

import client from "@/clients/client";
import type { ReadMerchantDashboardData, DashboardPeriod } from "@/types/merchant/dashboard";
import type { ApiResponse } from "@/types/common";

export interface DashboardFilters {
  period?: DashboardPeriod;
  startDate?: string;
  endDate?: string;
}

export async function getMerchantDashboard(
  merchantId: string,
  filters?: DashboardFilters
): Promise<ApiResponse<ReadMerchantDashboardData>> {
  const response = await client.get<ApiResponse<ReadMerchantDashboardData>>(
    `/v1/merchant/${merchantId}/dashboard`,
    { params: filters }
  );
  return response?.data;
}
