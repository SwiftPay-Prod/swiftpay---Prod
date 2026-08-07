import type { PaginationParams } from '../common';
import type { ProviderCategory } from '../enums';

export type AdminLogType = 'Api' | 'Security' | 'Email' | 'AcquirerWebhook' | 'Profiler';

export interface AdminReadListLogsRequest extends PaginationParams {
  type?: AdminLogType;
  merchantId?: string | null;
  acquirerType?: string | null;
  acquirerCode?: string | null;
  statusCode?: number | null;
  search?: string | null;
  action?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AdminLogEntry {
  id: string;
  logType: AdminLogType;
  action: string | null;
  status: string | null;
  statusCode: number | null;
  merchantId: string | null;
  merchantName: string | null;
  merchantDocument: string | null;
  credentialId: string | null;
  userId: string | null;
  userEmail: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  location: string | null;
  serviceName: string | null;
  acquirerId: string | null;
  acquirerType: string | null;
  acquirerProviderCategory?: ProviderCategory | null;
  acquirerCode: string | null;
  acquirerDisplayName: string | null;
  acquirerLogoUrl: string | null;
  httpMethod: string | null;
  endpoint: string | null;
  queryString: string | null;
  requestHeaders: string | null;
  correlationId: string | null;
  contentType: string | null;
  contentLength: number | null;
  errorCode: string | null;
  details: string | null;
  requestBody: string | null;
  responseBody: string | null;
  resourceId: string | null;
  resourceType: string | null;
  responseTimeMs: number | null;
  emailTo: string | null;
  emailSubject: string | null;
  emailTemplate: string | null;
  emailStatus: string | null;
  emailParameters: string | null;
  emailErrorMessage: string | null;
  emailSendTimeMs: number | null;
  createdAt: string;
}
