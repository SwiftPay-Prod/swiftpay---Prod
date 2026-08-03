import type { ApiResponse } from "../common";

export interface AdminCreateNotificationRequest {
  merchantId: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
}

export interface AdminNotificationData {
  id: string;
  merchantId: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  actionUrl: string | null;
  actionLabel: string | null;
  isRead: boolean;
  createdAt: string;
}

export type AdminCreateNotificationResponse = ApiResponse<AdminNotificationData>;

