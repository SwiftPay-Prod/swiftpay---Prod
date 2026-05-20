"use server";

import client from "@/clients/client";
import type {
  AdminWayneProtocolSettingsData,
  AdminUpdateWayneProtocolSettingsRequest,
} from "@/types/admin/wayne-protocol";
import type { PaymentEnvironment } from "@/types/enums";
import type { ApiResponse } from "@/types/common";

export async function adminGetWayneProtocolSettings(
  environment: PaymentEnvironment
): Promise<ApiResponse<AdminWayneProtocolSettingsData>> {
  const response = await client.get<ApiResponse<AdminWayneProtocolSettingsData>>(
    "/v1/admin/internal/wayne-protocol",
    { params: { environment } }
  );
  return response?.data;
}

export async function adminUpdateWayneProtocolSettings(
  data: AdminUpdateWayneProtocolSettingsRequest
): Promise<ApiResponse<AdminWayneProtocolSettingsData>> {
  const response = await client.patch<ApiResponse<AdminWayneProtocolSettingsData>>(
    "/v1/admin/internal/wayne-protocol",
    data
  );
  return response?.data;
}
