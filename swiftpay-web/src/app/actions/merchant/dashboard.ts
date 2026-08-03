"use server";

import client from "@/clients/client";
import type { ReadMerchantDashboardData, DashboardPeriod } from "@/types/merchant/dashboard";
import type { ApiResponse } from "@/types/common";
import type { AxiosError } from "axios";

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
  } catch (error) {
    const err = error as AxiosError<ApiResponse<ReadMerchantDashboardData>>;
    if (err.response?.data) return err.response.data;
    return { data: null, message: null, error: { message: "Erro ao buscar dashboard do merchant" } };
  }
}
