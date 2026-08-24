'use server';

import { cookies } from 'next/headers';
import type { AuthTokens } from '@/types/auth';
import type { MinimalMerchant } from '@/types/merchant/crud';
import type { SessionData } from '@/types/session';
import { UserStatus, PaymentEnvironment } from '@/types/enums';
import { BaseCookie } from '@/constants/base';
import { getSession } from '@/app/actions/session';
import { readCookie, readParsedCookie } from '@/lib/server-cookies';

export async function setAuthCookies(tokens: AuthTokens): Promise<void> {
	const cookieStore = await cookies();
	const expiresAt = new Date(tokens.accessTokenExpiresAt);

	cookieStore.set(BaseCookie.accessToken, tokens.accessToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		expires: expiresAt,
		path: '/',
	});

	cookieStore.set(BaseCookie.accessTokenExpiresAt, tokens.accessTokenExpiresAt, {
		httpOnly: false,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		expires: expiresAt,
		path: '/',
	});
}

export async function updateAccessToken(accessToken: string, expiresAt: string): Promise<void> {
	const cookieStore = await cookies();
	const expiry = new Date(expiresAt);

	cookieStore.set(BaseCookie.accessToken, accessToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		expires: expiry,
		path: '/',
	});

	cookieStore.set(BaseCookie.accessTokenExpiresAt, expiresAt, {
		httpOnly: false,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		expires: expiry,
		path: '/',
	});
}

export async function getAccessToken(): Promise<string | null> {
	return readCookie(BaseCookie.accessToken);
}

export async function getSessionData(): Promise<SessionData | null> {
	const response = await getSession();
	return response?.data ?? null;
}

export async function isAuthenticated(): Promise<boolean> {
	return (await getAccessToken()) !== null;
}

export async function clearAuthCookies(): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.delete(BaseCookie.accessToken);
	cookieStore.delete(BaseCookie.accessTokenExpiresAt);
	
	const shouldShowModal = await shouldShowStatusModal();
	if (!shouldShowModal) {
		cookieStore.delete(BaseCookie.user);
	}
	
	cookieStore.delete(BaseCookie.selectedMerchant);
}

export async function setSelectedMerchant(merchant: MinimalMerchant): Promise<void> {
	const cookieStore = await cookies();

	cookieStore.set(BaseCookie.selectedMerchant, JSON.stringify(merchant), {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 60 * 24,
		path: '/',
	});
}

	export async function getSelectedMerchant(): Promise<MinimalMerchant | null> {
	return readParsedCookie<MinimalMerchant>(BaseCookie.selectedMerchant);
}

export async function clearSelectedMerchant(): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.delete(BaseCookie.selectedMerchant);
}

export async function setStatusModal(): Promise<void> {
	const cookieStore = await cookies();
	
	cookieStore.set(BaseCookie.statusModal, 'true', {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 60 * 24,
		path: '/',
	});
}

export async function shouldShowStatusModal(): Promise<boolean> {
	const cookieStore = await cookies();
	return cookieStore.get(BaseCookie.statusModal)?.value === 'true';
}

export async function getStatusModalData(): Promise<{ status: UserStatus; reason?: string | null } | null> {
	const cookieStore = await cookies();
	const userCookie = cookieStore.get(BaseCookie.user)?.value;
	
	if (!userCookie) return null;
	
	try {
		const user = JSON.parse(userCookie);
		if (user.status === UserStatus.Active) return null;
		
		const reason = user.status === UserStatus.Suspended 
			? user.suspendedReason 
			: user.inactiveReason;
		
		return { status: user.status, reason };
	} catch {
		return null;
	}
}

export async function clearStatusModal(): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.delete(BaseCookie.statusModal);
	cookieStore.delete(BaseCookie.user);
}

export async function setDeviceIdCookie(deviceId: string): Promise<void> {
	const cookieStore = await cookies();

	cookieStore.set(BaseCookie.deviceId, deviceId, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 365,
		path: '/',
	});
}

export async function getDeviceIdCookie(): Promise<string | null> {
	const cookieStore = await cookies();
	return cookieStore.get(BaseCookie.deviceId)?.value ?? null;
}

export async function setDeviceRevokedModal(deviceName: string, reason: string): Promise<void> {
	const cookieStore = await cookies();
	
	const data = JSON.stringify({ deviceName, reason });
	
	cookieStore.set(BaseCookie.deviceRevokedModal, data, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 60 * 24,
		path: '/',
	});
}

export async function shouldShowDeviceRevokedModal(): Promise<boolean> {
	const cookieStore = await cookies();
	return !!cookieStore.get(BaseCookie.deviceRevokedModal)?.value;
}

export async function getDeviceRevokedModalData(): Promise<{ deviceName: string; reason: string } | null> {
	const cookieStore = await cookies();
	const data = cookieStore.get(BaseCookie.deviceRevokedModal)?.value;
	if (!data) return null;
	
	try {
		return JSON.parse(data) as { deviceName: string; reason: string };
	} catch {
		return null;
	}
}

export async function clearDeviceRevokedModal(): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.delete(BaseCookie.deviceRevokedModal);
}

export async function getSelectedEnvironment(): Promise<PaymentEnvironment> {
	// Sandbox desativado na plataforma — o header X-Api-Environment é sempre Produção.
	return PaymentEnvironment.Production;
}

export async function setUserForStatusModal(user: { status: UserStatus; suspendedReason?: string | null; inactiveReason?: string | null }): Promise<void> {
	const cookieStore = await cookies();
	
	cookieStore.set(BaseCookie.user, JSON.stringify(user), {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 60 * 24,
		path: '/',
	});
}

export async function setSidebarExpanded(expanded: boolean): Promise<void> {
	const cookieStore = await cookies();

	cookieStore.set(BaseCookie.sidebarExpanded, String(expanded), {
		httpOnly: false,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 365,
		path: '/',
	});
}

export async function getSidebarExpanded(): Promise<boolean> {
	const cookieStore = await cookies();
	const value = cookieStore.get(BaseCookie.sidebarExpanded)?.value;
	return value === 'false' ? false : true;
}

