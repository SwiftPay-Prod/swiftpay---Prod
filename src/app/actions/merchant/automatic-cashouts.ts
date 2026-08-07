"use server";

import client from "@/clients/client";
import type {
  MerchantAutomaticCashoutLogData,
  MerchantReadListAutomaticCashoutLogsRequest,
} from "@/types/automatic-cashout";
import type { ApiResponse, Paginated } from "@/types/common";

export async function getMerchantAutomaticCashoutLogs(
  merchantId: string,
  params?: Omit<MerchantReadListAutomaticCashoutLogsRequest, "merchantId">
): Promise<ApiResponse<Paginated<MerchantAutomaticCashoutLogData>>> {
  if (merchantId.startsWith('preview-merchant') || merchantId === 'preview-merchant-id') {
    return {
      data: {
        items: [],
        totalItems: 0,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      },
      message: null,
      error: null,
    };
  }

  const response = await client.get<
    ApiResponse<Paginated<MerchantAutomaticCashoutLogData>>
  >(`/v1/merchant/${merchantId}/automatic-cashouts/logs`, { params });
  return response?.data;
}
