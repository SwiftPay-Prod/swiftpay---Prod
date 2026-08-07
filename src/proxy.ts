import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Routes } from '@/router/routes';
import {
	canAccessRoute,
	isOpenRoute,
	isPrivateRoute,
	isPublicRoute,
	isUserOnboardingRoute,
	isVerifyEmailRoute,
} from '@/router/route-guard';
import { BaseCookie } from './constants/base';
import type { RouteContext } from '@/types/router';
import { getSelectedMerchant, getSessionData } from './auth/session';
import { listMerchants } from './app/actions/merchant/crud';
import type { MinimalMerchant } from './types/merchant/crud';
import { isMerchantDraftOrComplement } from './utils/merchant-utils';

const BOLETO_SUBDOMAIN = 'boleto';
const UUID_REGEX = /^\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isBoletoSubdomain(hostname: string): boolean {
	return hostname.startsWith(`${BOLETO_SUBDOMAIN}.`);
}

function continueRequest(pathname: string, selectedMerchant?: MinimalMerchant) {
	const response = NextResponse.next();
	response.headers.set('x-pathname', pathname);

	if (selectedMerchant) {
		response.cookies.set(BaseCookie.selectedMerchant, JSON.stringify(selectedMerchant), {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24,
			path: '/',
		});
	}

	return response;
}

function redirectTo(request: NextRequest, pathname: string) {
	return NextResponse.redirect(new URL(pathname, request.url));
}

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const hostname = request.headers.get('host')?.split(':')[0] ?? '';
	const accessToken = request.cookies.get(BaseCookie.accessToken)?.value;

	if (isBoletoSubdomain(hostname) && UUID_REGEX.test(pathname)) {
		return continueRequest(pathname);
	}

	if (isOpenRoute(pathname)) {
		return continueRequest(pathname);
	}

	if (isPublicRoute(pathname)) {
		if (accessToken && pathname === Routes.home) {
			return redirectTo(request, Routes.panel.dashboard);
		}
		return continueRequest(pathname);
	}

	if (!isPrivateRoute(pathname)) {
		return continueRequest(pathname);
	}

	if (!accessToken) {
		return redirectTo(request, Routes.home);
	}

	const session = await getSessionData().catch(() => null);
	if (!session) {
		const response = redirectTo(request, Routes.home);
		response.cookies.delete(BaseCookie.accessToken);
		response.cookies.delete(BaseCookie.accessTokenExpiresAt);
		response.cookies.delete(BaseCookie.selectedMerchant);
		return response;
	}

	if (!session.emailVerified) {
		if (isVerifyEmailRoute(pathname)) {
			return continueRequest(pathname);
		}
		return redirectTo(request, Routes.panel.verifyEmail);
	}

	if (!session.userOnboardingCompleted) {
		if (isUserOnboardingRoute(pathname)) {
			return continueRequest(pathname);
		}
		return redirectTo(request, Routes.panel.onboarding);
	}

	if (isVerifyEmailRoute(pathname) || isUserOnboardingRoute(pathname)) {
		return redirectTo(request, Routes.panel.dashboard);
	}

	let selectedMerchant = await getSelectedMerchant().catch(() => null);
	if (session.selectedMerchantId && selectedMerchant?.id !== session.selectedMerchantId) {
		selectedMerchant = null;
	}

	let selectedMerchantToPersist: MinimalMerchant | undefined;
	if (!selectedMerchant && pathname.startsWith('/panel/merchant')) {
		const merchantsResponse = await listMerchants(1, 50).catch(() => null);
		const merchants = merchantsResponse?.data?.items ?? [];
		selectedMerchant =
			merchants.find((merchant) => merchant.id === session.selectedMerchantId) ??
			merchants[0] ??
			null;
		selectedMerchantToPersist = selectedMerchant ?? undefined;
	}

	const context: RouteContext = {
		isAuthenticated: true,
		emailVerified: session.emailVerified,
		userRole: session.role,
		hasMerchant: selectedMerchant !== null,
		merchantStatus: selectedMerchant?.status,
		merchantKycStatus: selectedMerchant?.kycStatus,
	};
	const access = canAccessRoute(pathname, context);

	if (
		!access.allowed &&
		selectedMerchant &&
		isMerchantDraftOrComplement(selectedMerchant.status, selectedMerchant.kycStatus)
	) {
		return redirectTo(request, Routes.panel.merchant.new);
	}
	if (!access.allowed) {
		return redirectTo(request, access.redirectTo ?? Routes.panel.dashboard);
	}

	return continueRequest(pathname, selectedMerchantToPersist);
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
