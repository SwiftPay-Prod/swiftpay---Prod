"use server";

import client from "@/clients/client";
import type {
  AdminPlatformSettingsData,
  AdminUpdatePlatformSettingsRequest,
} from "@/types/admin/platform-settings";
import type { ApiResponse } from "@/types/common";

export async function adminGetPlatformSettings(): Promise<ApiResponse<AdminPlatformSettingsData>> {
  const response = await client.get<ApiResponse<AdminPlatformSettingsData>>(
    "/v1/admin/platform-settings"
  );
  return response?.data;
}

export async function adminUpdatePlatformSettings(
  data: AdminUpdatePlatformSettingsRequest
): Promise<ApiResponse<AdminPlatformSettingsData>> {
  const response = await client.patch<ApiResponse<AdminPlatformSettingsData>>(
    "/v1/admin/platform-settings",
    data
  );
  return response?.data;
}
