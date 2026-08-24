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
  try {
    const response = await client.get<ApiResponse<ReadMerchantDashboardData>>(
      `/v1/merchant/${merchantId}/dashboard`,
      { params: filters }
    );
    if (!response?.data) {
      return { data: null, message: null, error: { message: "Resposta vazia do backend" } };
    }
    return response.data;
  } catch {
    console.warn(`[getMerchantDashboard] Falha ao conectar ao backend.`);
    return { data: null, message: null, error: { message: "Não foi possível carregar o dashboard no momento." } };
  }
}
