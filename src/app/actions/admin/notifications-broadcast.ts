"use server";

import client from "@/clients/client";
import type { ApiResponse } from "@/types/common";

export interface BroadcastNotificationRequest {
  audience: "all" | "merchant" | "user";
  merchantId?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  title: string;
  message: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
  type?: string | null;
  priority?: string | null;
}

export interface BroadcastNotificationData {
  accepted: boolean;
  total: number;
}

export async function adminBroadcastNotification(
  data: BroadcastNotificationRequest
): Promise<ApiResponse<BroadcastNotificationData>> {
  const response = await client.post<ApiResponse<BroadcastNotificationData>>(
    "/v1/admin/notifications/broadcast",
    data
  );
  return response?.data;
}
