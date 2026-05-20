'use server';

import client from '@/clients/client';
import { AxiosError } from 'axios';
import { cookies } from 'next/headers';
import type {
	SignInRequest,
	SignInData,
	SignUpRequest,
	SignUpData,
	ForgotPasswordRequest,
	ResetPasswordRequest,
	ConfirmEmailRequest,
	SendEmailConfirmationRequest,
	UserInfo,
	VerifyDeviceRequest,
	VerifyDeviceData,
	ListDevicesData,
	ResendDeviceCodeRequest,
	ResendDeviceCodeData,
	ReferralOwnerData,
} from '@/types/auth';
import { UserStatus } from '@/types/enums';
import type { ApiResponse } from '@/types/common';
import {
	shouldShowStatusModal,
	getStatusModalData,
	clearStatusModal,
	shouldShowDeviceRevokedModal,
	getDeviceRevokedModalData,
	clearDeviceRevokedModal,
} from '@/auth/session';
import { BaseCookie } from '@/constants/base';

export async function signIn(req: SignInRequest): Promise<ApiResponse<SignInData>> {
	try {
		const response = await client.post<ApiResponse<SignInData>>('/v1/auth/signin', req);
		return response?.data;
	} catch (err) {
		const error = err as AxiosError<ApiResponse<SignInData>>;
		if (error.response?.data) {
			return error.response?.data;
		}
		return {
			data: null,
			message: null,
			error: { message: 'Erro ao fazer login' },
		};
	}
}

export async function verifyDevice(req: VerifyDeviceRequest): Promise<ApiResponse<VerifyDeviceData>> {
	try {
		const response = await client.post<ApiResponse<VerifyDeviceData>>('/v1/auth/verify-device', req);
		return response?.data;
	} catch (err) {
		const error = err as AxiosError<ApiResponse<VerifyDeviceData>>;
		if (error.response?.data) {
			return error.response?.data;
		}
		return {
			data: null,
			message: null,
			error: { message: 'Erro ao verificar dispositivo' },
		};
	}
}

export async function resendDeviceCode(req: ResendDeviceCodeRequest): Promise<ApiResponse<ResendDeviceCodeData>> {
	try {
		const response = await client.post<ApiResponse<ResendDeviceCodeData>>('/v1/auth/resend-device-code', req);
		return response?.data;
	} catch (err) {
		const error = err as AxiosError<ApiResponse<ResendDeviceCodeData>>;
		if (error.response?.data) {
			return error.response?.data;
		}
		return {
			data: null,
			message: null,
			error: { message: 'Erro ao reenviar código' },
		};
	}
}

export async function signOut(): Promise<void> {
	try {
		await client.post('/v1/auth/signout', {});
	} catch (err) {
		console.error('Erro ao fazer logout', err);
	}
}

export async function signUp(req: SignUpRequest): Promise<ApiResponse<SignUpData>> {
	try {
		const response = await client.post<ApiResponse<SignUpData>>('/v1/auth/signup', req);
		return response?.data;
	} catch (err) {
		const error = err as AxiosError<ApiResponse<SignUpData>>;
		if (error.response?.data) {
			return error.response?.data;
		}
		return {
			data: null,
			message: null,
			error: { message: 'Erro ao criar conta' },
		};
	}
}

export async function forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<null>> {
	try {
		const response = await client.post<ApiResponse<null>>('/v1/auth/forgot-password', data);
		return response?.data;
	} catch (err) {
		const error = err as AxiosError<ApiResponse<null>>;
		if (error.response?.data) {
			return error.response?.data;
		}
		return {
			data: null,
			message: null,
			error: { message: 'Erro ao solicitar recuperação de senha' },
		};
	}
}

export async function resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<null>> {
	try {
		const response = await client.post<ApiResponse<null>>('/v1/auth/reset-password', data);
		return response?.data;
	} catch (err) {
		const error = err as AxiosError<ApiResponse<null>>;
		if (error.response?.data) {
			return error.response?.data;
		}
		return {
			data: null,
			message: null,
			error: { message: 'Erro ao redefinir senha' },
		};
	}
}

export async function confirmEmail(data: ConfirmEmailRequest): Promise<ApiResponse<UserInfo>> {
	try {
		const response = await client.post<ApiResponse<UserInfo>>('/v1/auth/confirm-email', data);
		return response?.data;
	} catch (err) {
		const error = err as AxiosError<ApiResponse<UserInfo>>;
		if (error.response?.data) {
			return error.response?.data;
		}
		return {
			data: null,
			message: null,
			error: { message: 'Erro ao confirmar email' },
		};
	}
}

export async function sendEmailConfirmation(
	data: SendEmailConfirmationRequest
): Promise<ApiResponse<null>> {
	try {
		const response = await client.post<ApiResponse<null>>('/v1/auth/send-email-confirmation', data);
		return response?.data;
	} catch (err) {
		const error = err as AxiosError<ApiResponse<null>>;
		if (error.response?.data) {
			return error.response?.data;
		}
		return {
			data: null,
			message: null,
			error: { message: 'Erro ao enviar confirmação de email' },
		};
	}
}

export async function listTrustedDevices(): Promise<ApiResponse<ListDevicesData>> {
	try {
		const response = await client.get<ApiResponse<ListDevicesData>>('/v1/users/devices');
		return response?.data;
	} catch (err) {
		const error = err as AxiosError<ApiResponse<ListDevicesData>>;
		if (error.response?.data) {
			return error.response?.data;
		}
		return {
			data: null,
			message: null,
			error: { message: 'Erro ao listar dispositivos' },
		};
	}
}

export async function revokeDevice(deviceId: string): Promise<ApiResponse<null>> {
	try {
		const response = await client.delete<ApiResponse<null>>(`/v1/users/devices/${deviceId}`);
		return response?.data;
	} catch (err) {
		const error = err as AxiosError<ApiResponse<null>>;
		if (error.response?.data) {
			return error.response?.data;
		}
		return {
			data: null,
			message: null,
			error: { message: 'Erro ao revogar dispositivo' },
		};
	}
}

export async function revokeAllDevices(keepCurrent: boolean = false): Promise<ApiResponse<{ revokedCount: number }>> {
	try {
		const response = await client.delete<ApiResponse<{ revokedCount: number }>>('/v1/users/devices', {
			data: { keepCurrent },
		});
		return response?.data;
	} catch (err) {
		const error = err as AxiosError<ApiResponse<{ revokedCount: number }>>;
		if (error.response?.data) {
			return error.response?.data;
		}
		return {
			data: null,
			message: null,
			error: { message: 'Erro ao revogar dispositivos' },
		};
	}
}

export async function getApiUrl(): Promise<string> {
	return process.env.NEXT_PUBLIC_API_URL || process.env.INTERNAL_API_URL || 'http://localhost:5000';
}

export async function shouldShowStatusModalAction(): Promise<boolean> {
	return await shouldShowStatusModal();
}

export async function getStatusModalDataAction(): Promise<{ status: UserStatus; reason?: string | null } | null> {
	return await getStatusModalData();
}

export async function clearStatusModalAction(): Promise<void> {
	await clearStatusModal();
}

export async function shouldShowDeviceRevokedModalAction(): Promise<boolean> {
	return await shouldShowDeviceRevokedModal();
}

export async function getDeviceRevokedModalDataAction(): Promise<{ deviceName: string; reason: string } | null> {
	return await getDeviceRevokedModalData();
}

export async function clearDeviceRevokedModalAction(): Promise<void> {
	await clearDeviceRevokedModal();
}

export async function getAccessTokenExpiresAt(): Promise<string | null> {
	const cookieStore = await cookies();
	return cookieStore.get(BaseCookie.accessTokenExpiresAt)?.value ?? null;
}

export async function ensureValidToken(): Promise<{ valid: boolean; accessToken: string | null }> {
	const cookieStore = await cookies();
	const accessToken = cookieStore.get(BaseCookie.accessToken)?.value ?? null;

	if (!accessToken) {
		return { valid: false, accessToken: null };
	}

	return { valid: true, accessToken };
}

export async function getReferralOwner(refCode: string): Promise<ApiResponse<ReferralOwnerData>> {
	try {
		const response = await client.get<ApiResponse<ReferralOwnerData>>(`/v1/auth/referrals/${encodeURIComponent(refCode)}`);
		return response?.data;
	} catch (err) {
		const error = err as AxiosError<ApiResponse<ReferralOwnerData>>;
		if (error.response?.data) {
			return error.response?.data;
		}
		return {
			data: null,
			message: null,
			error: { message: 'Código de indicação inválido' },
		};
	}
}