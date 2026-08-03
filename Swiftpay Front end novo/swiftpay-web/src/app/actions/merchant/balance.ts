"use server";

import client from "@/clients/client";
import type { ReadBalanceData } from "@/types/merchant/balance";
import type { ApiResponse } from "@/types/common";

export async function getMerchantBalance(
  merchantId: string
): Promise<ApiResponse<ReadBalanceData>> {
  const response = await client.get<ApiResponse<ReadBalanceData>>(
    `/v1/merchant/${merchantId}/balance`
  );
  return response?.data;
}
