"use server";

import client from "@/clients/client";
import type {
  AdminAutomaticCashoutLogData,
  AdminReadListAutomaticCashoutLogsRequest,
} from "@/types/automatic-cashout";
import type { ApiResponse, Paginated } from "@/types/common";

export async function adminGetAutomaticCashoutLogs(
  params?: AdminReadListAutomaticCashoutLogsRequest
): Promise<ApiResponse<Paginated<AdminAutomaticCashoutLogData>>> {
  const response = await client.get<
    ApiResponse<Paginated<AdminAutomaticCashoutLogData>>
  >("/v1/admin/automatic-cashouts/logs", { params });
  return response?.data;
}
