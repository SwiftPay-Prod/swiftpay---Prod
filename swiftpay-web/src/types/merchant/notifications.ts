import type { PaginationParams } from "../common";
import { NotificationPriority, NotificationScope, NotificationStatusType, NotificationType, PaymentEnvironment } from "../enums";

export interface NotificationData {
  id: string;
  scope: NotificationScope;
  environment: PaymentEnvironment;
  type: NotificationType;
  statusType: NotificationStatusType | null;
  priority: NotificationPriority;
  title: string;
  message: string;
  actionUrl: string | null;
  actionLabel: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  requiresMerchantRefresh?: boolean;
}

export interface ReadListNotificationsRequest extends PaginationParams {
  merchantId: string;
  isRead?: boolean | null;
  environment?: PaymentEnvironment;
  type?: NotificationType | null;
  statusType?: NotificationStatusType | null;
  priority?: NotificationPriority | null;
  search?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface ReadNotificationCountRequest {
  merchantId: string;
  environment?: PaymentEnvironment;
}

export interface ReadNotificationCountData {
  unreadCount: number;
  totalCount: number;
}

export interface MarkNotificationReadRequest {
  merchantId: string;
  notificationId: string;
}

export interface MarkNotificationReadResponse {
  message: string | null;
  error: { message: string | null } | null;
}

export interface MarkAllNotificationsReadRequest {
  merchantId: string;
}

export interface MarkAllNotificationsReadResponse {
  message: string | null;
  error: { message: string | null } | null;
}

export interface DeleteNotificationRequest {
  merchantId: string;
  notificationId: string;
}

export interface DeleteNotificationResponse {
  message: string | null;
  error: { message: string | null } | null;
}

