'use server';

import { cache } from 'react';
import client from '@/clients/client';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '@/types/common';
import type { SessionData, UpdateSessionRequest, UpdateSessionData } from '@/types/session';

async function fetchSession(): Promise<ApiResponse<SessionData>> {
	try {
		const response = await client.get<ApiResponse<SessionData>>('/v1/session');
		return response?.data;
	} catch (err) {
		const error = err as AxiosError<ApiResponse<SessionData>>;
		if (error.response?.data) {
			return error.response?.data;
		}
		return {
			data: null,
			message: null,
			error: { message: 'Erro ao buscar sessão' },
		};
	}
}

export const getSession = cache(fetchSession);

export async function refreshSession(): Promise<ApiResponse<SessionData>> {
	return fetchSession();
}

export async function updateSession(data: UpdateSessionRequest): Promise<ApiResponse<UpdateSessionData>> {
	try {
		const response = await client.patch<ApiResponse<UpdateSessionData>>('/v1/session', data);
		return response?.data;
	} catch (err) {
		const error = err as AxiosError<ApiResponse<UpdateSessionData>>;
		if (error.response?.data) {
			return error.response?.data;
		}
		return {
			data: null,
			message: null,
			error: { message: 'Erro ao atualizar sessão' },
		};
	}
}
