import type { PaginationParams } from "../common";
import { NotificationPriority, NotificationScope, NotificationStatusType, NotificationType, PaymentEnvironment } from "../enums";

export interface UnifiedNotificationData {
  id: string;
  scope: NotificationScope;
  isMerchant: boolean;
  environment: PaymentEnvironment | null;
  type: NotificationType;
  statusType: NotificationStatusType | null;
  priority: NotificationPriority;
  title: string;
  message: string | null;
  actionUrl: string | null;
  actionLabel: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface ReadListAllNotificationsRequest extends PaginationParams {
  merchantId: string;
  environment?: PaymentEnvironment;
  scope?: NotificationScope | null;
  isRead?: boolean | null;
  type?: NotificationType | null;
  statusType?: NotificationStatusType | null;
  priority?: NotificationPriority | null;
  search?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface UserNotificationData {
  id: string;
  scope: NotificationScope;
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
}

export interface ReadListUserNotificationsRequest extends PaginationParams {
  isRead?: boolean | null;
  type?: NotificationType | null;
  statusType?: NotificationStatusType | null;
  priority?: NotificationPriority | null;
  search?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface ReadUserNotificationCountData {
  unreadCount: number;
  totalCount: number;
}

export interface NotificationTemplatesData {
  allowedPlaceholders: string[];
  items: NotificationTemplateData[];
}

export interface NotificationTemplateData {
  type: NotificationType;
  statusType: NotificationStatusType;
  label: string;
  defaultTitle: string;
  defaultBody: string;
  titleTemplate: string | null;
  bodyTemplate: string | null;
  updatedAt: string | null;
  isCustom: boolean;
}

export interface UpsertNotificationTemplateRequest {
  type: NotificationType;
  statusType: NotificationStatusType;
  titleTemplate?: string | null;
  bodyTemplate?: string | null;
}
