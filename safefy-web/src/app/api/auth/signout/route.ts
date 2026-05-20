import { NextResponse } from 'next/server';
import { getAccessToken } from '@/auth/session';
import { signOut } from '@/app/actions/auth';
import { BaseCookie } from '@/constants/base';

async function clearSessionAndRedirect() {
	const accessToken = await getAccessToken();

	if (accessToken) {
		await signOut();
	}

	const response = NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
	
	// Delete auth cookies directly on the response
	response.cookies.delete(BaseCookie.accessToken);
	response.cookies.delete(BaseCookie.accessTokenExpiresAt);
	response.cookies.delete(BaseCookie.selectedMerchant);
	
	response.headers.set('Clear-Site-Data', '"storage"');
	
	return response;
}

export async function GET() {
	return clearSessionAndRedirect();
}

export async function POST() {
	return clearSessionAndRedirect();
}

