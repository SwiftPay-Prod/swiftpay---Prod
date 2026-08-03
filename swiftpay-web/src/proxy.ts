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
	const token = request.cookies.get(BaseCookie.accessToken)?.value;

	if (pathname.startsWith('/panel') && !token) {
		const loginUrl = new URL('/', request.url);
		return NextResponse.redirect(loginUrl);
	}

	const response = NextResponse.next();
	response.headers.set('x-pathname', pathname);
	return response;
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

