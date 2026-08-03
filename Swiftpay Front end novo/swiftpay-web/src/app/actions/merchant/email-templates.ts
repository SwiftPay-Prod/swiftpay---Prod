"use server";

import client from "@/clients/client";
import type {
  ReadListEmailTemplatesRequest,
  MinimalEmailTemplateData,
  EmailTemplateData,
  UpdateEmailTemplateRequest,
  SendTestEmailRequest,
} from "@/types/merchant/email-templates";
import type { ApiResponse } from "@/types/common";
import type { MerchantEmailTemplateType } from "@/types/enums";
import type { Paginated } from "@/types/common";

export async function listMerchantEmailTemplates(
  merchantId: string,
  params?: Omit<ReadListEmailTemplatesRequest, "merchantId">
): Promise<ApiResponse<Paginated<MinimalEmailTemplateData>>> {
  const { environment: _environment, ...rest } = params ?? {};
  const response = await client.get<ApiResponse<Paginated<MinimalEmailTemplateData>>>(
    `/v1/merchant/${merchantId}/email-templates`,
    { params: rest }
  );
  return response?.data;
}

export async function getMerchantEmailTemplate(
  merchantId: string,
  type: MerchantEmailTemplateType
): Promise<ApiResponse<EmailTemplateData | null>> {
  const response = await client.get<ApiResponse<EmailTemplateData>>(
    `/v1/merchant/${merchantId}/email-templates/${type}`
  );

  if (response?.status === 404) {
    return { data: null, message: null, error: null };
  }

  return response?.data;
}

export async function upsertMerchantEmailTemplate(
  merchantId: string,
  type: MerchantEmailTemplateType,
  data: UpdateEmailTemplateRequest
): Promise<ApiResponse<EmailTemplateData>> {
  const response = await client.patch<ApiResponse<EmailTemplateData>>(
    `/v1/merchant/${merchantId}/email-templates/${type}`,
    data
  );
  return response?.data;
}

export async function sendTestEmail(
  merchantId: string,
  type: MerchantEmailTemplateType,
  data: SendTestEmailRequest
): Promise<ApiResponse<void>> {
  const response = await client.post<ApiResponse<void>>(
    `/v1/merchant/${merchantId}/email-templates/${type}/send-test`,
    data
  );
  return response?.data;
}
