import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ENVIRONMENT_COOKIE = 'safefy_checkout_environment';

export default function proxy(request: NextRequest) {
	const response = NextResponse.next();

	const isSandbox = request.nextUrl.pathname.startsWith('/sandbox');
	const environment = isSandbox ? 'Sandbox' : 'Production';

	response.cookies.set(ENVIRONMENT_COOKIE, environment, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		path: '/',
	});

	return response;
}

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico|api/payment|.*\\..*).*)'],
};
