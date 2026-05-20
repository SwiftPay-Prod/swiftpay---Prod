import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Routes } from '@/router/routes';
import { isPrivateRoute, isPublicRoute, isVerifyEmailRoute, isUserOnboardingRoute, canAccessRoute } from '@/router/route-guard';
import { BaseCookie } from './constants/base';
import type { RouteContext } from '@/types/router';
import { getSelectedMerchant, getSessionData, setSelectedMerchant } from './auth/session';
import { listMerchants } from './app/actions/merchant/crud';
import type { MinimalMerchant } from './types/merchant/crud';
import { getMerchantRedirectRoute, isMerchantDraftOrComplement } from '@/utils/merchant-utils';
import type { MerchantKycStatus, MerchantStatus } from '@/types/enums';

const BOLETO_SUBDOMAIN = 'boleto';
const UUID_REGEX = /^\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isBoletoSubdomain(hostname: string): boolean {
	return hostname.startsWith(`${BOLETO_SUBDOMAIN}.`);
}

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const hostname = request.headers.get('host') ?? '';
	const isServerActionRequest = request.headers.has('next-action');

	if (isBoletoSubdomain(hostname)) {
		if (UUID_REGEX.test(pathname)) {
			const paymentId = pathname.slice(1);
			return NextResponse.rewrite(new URL(`/boleto/${paymentId}`, request.url));
		}

		return NextResponse.rewrite(new URL('/boleto/not-found', request.url));
	}

	const accessToken = request.cookies.get(BaseCookie.accessToken)?.value;
	const isLoggedIn = !!accessToken;

	if (isPrivateRoute(pathname) && !isLoggedIn) {
		return NextResponse.redirect(new URL(Routes.home, request.url));
	}

	const session = await getSessionData();

	if (isPublicRoute(pathname) && isLoggedIn && session) {
		if (session.emailVerified && !session.userOnboardingCompleted) {
			return NextResponse.redirect(new URL(Routes.panel.onboarding, request.url));
		}

		let selectedMerchant = await getSelectedMerchant();

		if (!selectedMerchant) {
			const merchants = await listMerchants(1, 1);
			const firstMerchant = merchants.data?.items[0];
			if (firstMerchant) {
				await setSelectedMerchant(firstMerchant);
				selectedMerchant = firstMerchant;
			}
		}

		if (!selectedMerchant) {
			return NextResponse.redirect(new URL(Routes.panel.merchant.new, request.url));
		}

		const redirectRoute = getMerchantRedirectRoute(
			selectedMerchant.status as MerchantStatus,
			selectedMerchant.kycStatus as MerchantKycStatus
		);
		return NextResponse.redirect(new URL(redirectRoute, request.url));
	}

	if (isLoggedIn && session && isPrivateRoute(pathname)) {
		if (!session.emailVerified && !isVerifyEmailRoute(pathname)) {
			return NextResponse.redirect(new URL(Routes.panel.verifyEmail, request.url));
		}

		if (session.emailVerified && !session.userOnboardingCompleted && !isUserOnboardingRoute(pathname)) {
			return NextResponse.redirect(new URL(Routes.panel.onboarding, request.url));
		}

		if (isUserOnboardingRoute(pathname) && session.userOnboardingCompleted) {
			return NextResponse.redirect(new URL(Routes.panel.merchant.dashboard, request.url));
		}

		let selectedMerchant = await getSelectedMerchant();
		const shouldPreserveEmptySelectedMerchant = pathname === Routes.panel.merchant.new;

		if (!selectedMerchant && !shouldPreserveEmptySelectedMerchant) {
			const merchants = await listMerchants(1, 1);
			const firstMerchant = merchants.data?.items[0];
			if (firstMerchant) {
				await setSelectedMerchant(firstMerchant);
				selectedMerchant = firstMerchant;
			}
		}

		if (isVerifyEmailRoute(pathname) && session.emailVerified) {
			if (!session.userOnboardingCompleted) {
				return NextResponse.redirect(new URL(Routes.panel.onboarding, request.url));
			}

			if (!selectedMerchant) {
				return NextResponse.redirect(new URL(Routes.panel.merchant.new, request.url));
			}
			const redirectRoute = getMerchantRedirectRoute(
				selectedMerchant.status as MerchantStatus,
				selectedMerchant.kycStatus as MerchantKycStatus
			);
			return NextResponse.redirect(new URL(redirectRoute, request.url));
		}

		const context: RouteContext = {
			isAuthenticated: true,
			emailVerified: session.emailVerified,
			userRole: session.role,
			hasMerchant: !!selectedMerchant,
			merchantStatus: selectedMerchant?.status,
			merchantKycStatus: selectedMerchant?.kycStatus,
		};

		if (isServerActionRequest) {
			const response = NextResponse.next();
			response.headers.set('x-pathname', pathname);
			return response;
		}

		if (
			pathname === Routes.panel.merchant.new &&
			selectedMerchant &&
			!isMerchantDraftOrComplement(selectedMerchant.status, selectedMerchant.kycStatus)
		) {
			const redirectRoute = getMerchantRedirectRoute(selectedMerchant.status, selectedMerchant.kycStatus);
			return NextResponse.redirect(new URL(redirectRoute, request.url));
		}

		const validation = canAccessRoute(pathname, context);

		if (!validation.allowed && validation.redirectTo) {
			return NextResponse.redirect(new URL(validation.redirectTo, request.url));
		}
	}

	const response = NextResponse.next();
	response.headers.set('x-pathname', pathname);
	return response;
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

