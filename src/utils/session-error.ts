import type { ApiResponse } from '@/types/common';

const SESSION_ERROR_CODES = ['device_revoked', 'device_mismatch', 'session_expired', 'invalid_token', 'user_inactive'];

export function isSessionError<T>(response: ApiResponse<T> | undefined | null): boolean {
	if (!response?.error?.code) return false;
	return SESSION_ERROR_CODES.includes(response.error.code);
}

export function handleSessionError<T>(response: ApiResponse<T> | undefined | null): boolean {
	if (isSessionError(response)) {
		if (typeof window !== 'undefined') {
			window.location.href = '/';
		}
		return true;
	}
	return false;
}

