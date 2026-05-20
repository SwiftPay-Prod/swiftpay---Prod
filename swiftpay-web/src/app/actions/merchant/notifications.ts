"use server";

import client from "@/clients/client";
import type {
  ReadListNotificationsRequest,
  NotificationData,
  ReadNotificationCountData,
  MarkNotificationReadResponse,
  MarkAllNotificationsReadResponse,
  DeleteNotificationResponse,
} from "@/types/merchant/notifications";
import type { ApiResponse, Paginated } from "@/types/common";

export async function listMerchantNotifications(
  merchantId: string,
  params?: Omit<ReadListNotificationsRequest, "merchantId">
): Promise<ApiResponse<Paginated<NotificationData>>> {
  const { environment: _environment, ...rest } = params ?? {};
  const response = await client.get<ApiResponse<Paginated<NotificationData>>>(
    `/v1/merchant/${merchantId}/notifications`,
    { params: rest }
  );
  return response?.data;
}

export async function getMerchantNotificationCount(
  merchantId: string
): Promise<ApiResponse<ReadNotificationCountData>> {
  const response = await client.get<ApiResponse<ReadNotificationCountData>>(
    `/v1/merchant/${merchantId}/notifications/count`
  );
  return response?.data;
}

export async function markNotificationRead(
  merchantId: string,
  notificationId: string
): Promise<MarkNotificationReadResponse> {
  const response = await client.patch<MarkNotificationReadResponse>(
    `/v1/merchant/${merchantId}/notifications/${notificationId}/read`,
    {}
  );
  return response?.data;
}

export async function markAllNotificationsRead(
  merchantId: string
): Promise<MarkAllNotificationsReadResponse> {
  const response = await client.patch<MarkAllNotificationsReadResponse>(
    `/v1/merchant/${merchantId}/notifications/read-all`,
    {}
  );
  return response?.data;
}

export async function deleteNotification(
  merchantId: string,
  notificationId: string
): Promise<DeleteNotificationResponse> {
  const response = await client.delete<DeleteNotificationResponse>(
    `/v1/merchant/${merchantId}/notifications/${notificationId}`
  );
  return response?.data;
}
