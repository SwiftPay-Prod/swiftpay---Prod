'use server';

import client from '@/clients/client';
import type { ApiResponse } from '@/types/common';

export async function deleteMerchantFile(fileId: string): Promise<ApiResponse<null>> {
	try {
		const response = await client.delete(`/v1/files/${fileId}`);
		return response?.data;
	} catch (error: unknown) {
		const axiosError = error as { response?: { data?: ApiResponse<null> } };
		if (axiosError.response?.data) {
			return axiosError.response?.data;
		}
		return {
			error: {
				message: 'Erro ao deletar arquivo. Tente novamente.',
			},
		} as ApiResponse<null>;
	}
}
