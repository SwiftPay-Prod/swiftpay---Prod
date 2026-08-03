"use server";

import client from "@/clients/client";
import type { FileData } from "@/types/files";
import type { ApiResponse, BaseResponse } from "@/types/common";

export async function getFile(fileId: string): Promise<ApiResponse<FileData>> {
  const response = await client.get<ApiResponse<FileData>>(`/v1/files/${fileId}`);
  return response?.data;
}

export async function deleteFile(fileId: string): Promise<BaseResponse> {
  const response = await client.delete<BaseResponse>(`/v1/files/${fileId}`);
  return response?.data;
}
