"use server";

import client from "@/clients/client";
import type {
  AdminTemplateData,
  AdminMinimalTemplate,
  AdminReadListTemplatesRequest,
  AdminCreateTemplateRequest,
  AdminUpdateTemplateRequest,
} from "@/types/admin/templates";
import type { ApiResponse, Paginated } from "@/types/common";

export async function adminListTemplates(
  params?: AdminReadListTemplatesRequest
): Promise<ApiResponse<Paginated<AdminMinimalTemplate>>> {
  const response = await client.get<
    ApiResponse<Paginated<AdminMinimalTemplate>>
  >("/v1/admin/templates", { params });
  return response?.data;
}

export async function adminGetTemplate(
  templateId: string
): Promise<ApiResponse<AdminTemplateData>> {
  const response = await client.get<ApiResponse<AdminTemplateData>>(
    `/v1/admin/templates/${templateId}`
  );
  return response?.data;
}

export async function adminCreateTemplate(
  data: AdminCreateTemplateRequest
): Promise<ApiResponse<AdminTemplateData>> {
  const response = await client.post<ApiResponse<AdminTemplateData>>(
    "/v1/admin/templates",
    data
  );
  return response?.data;
}

export async function adminUpdateTemplate(
  templateId: string,
  data: AdminUpdateTemplateRequest
): Promise<ApiResponse<AdminTemplateData>> {
  const response = await client.patch<ApiResponse<AdminTemplateData>>(
    `/v1/admin/templates/${templateId}`,
    data
  );
  return response?.data;
}
