"use server";

import type { ApiResponse } from "@/types/common";

export async function startPaymentLink(
  token: string,
  method: string
): Promise<ApiResponse<unknown> | null> {
  const baseUrl = process.env.INTERNAL_SWIFTPAY_API_PAYMENT_URL || process.env.NEXT_PUBLIC_SWIFTPAY_API_PAYMENT_URL || "http://swiftpayapipayment:5166";
  try {
    const res = await fetch(`${baseUrl}/v1/payment-links/${token}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method }),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as ApiResponse<unknown> | null;
    if (!res.ok) return (data as ApiResponse<unknown>) ?? { data: null, message: null, error: { message: `HTTP ${res.status}` } };
    return data ?? null;
  } catch (e) {
    return { data: null, message: null, error: { message: e instanceof Error ? e.message : "Erro ao iniciar pagamento" } };
  }
}
