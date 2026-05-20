"use server";

import client from "@/clients/client";
import type { FileData } from "@/types/merchant/crud";
import type { ApiResponse } from "@/types/common";
import type { UploadFolder } from "@/types/enums";

export async function uploadMerchantFile(
  merchantId: string,
  file: File,
  folder: UploadFolder,
  isPublic?: boolean
): Promise<ApiResponse<FileData>> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  formData.append("merchantId", merchantId);
  formData.append("isPublic", isPublic ? "true" : "false");

  const response = await client.post<ApiResponse<FileData>>(
    `/v1/merchant/upload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response?.data;
}
