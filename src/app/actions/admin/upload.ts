"use server";

import client from "@/clients/client";
import type { FileData } from "@/types/merchant/crud";
import type { ApiResponse } from "@/types/common";
import type { UploadFolder } from "@/types/enums";

export async function uploadAdminFile(
  file: File,
  folder: UploadFolder,
  isPublic: boolean = true
): Promise<ApiResponse<FileData>> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  formData.append("isPublic", isPublic ? "true" : "false");

  const response = await client.post<ApiResponse<FileData>>(
    `/v1/admin/upload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response?.data;
}
