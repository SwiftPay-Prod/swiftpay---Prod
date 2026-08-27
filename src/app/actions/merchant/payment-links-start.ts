"use server";

import client from "@/clients/client";
import type { ApiResponse } from "@/types/common";

export async function startPaymentLink(
  token: string,
  method: string
): Promise<ApiResponse<unknown> | null> {
  const response = await client.post<ApiResponse<unknown>>(
    `/v1/payment-links/${token}/start`,
    { method }
  );

  return response?.data ?? null;
}
