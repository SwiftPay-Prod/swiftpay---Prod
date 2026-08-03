import { NextRequest, NextResponse } from 'next/server';
import { signUp as signUpAction } from '@/app/actions/auth';
import { BaseCookie } from '@/constants/base';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { name, email, whatsApp, password, deviceId, refCode } = body;

		const result = await signUpAction({ name, email, whatsApp, password, deviceId, refCode });

		if (result?.error) {
			return NextResponse.json({ error: result?.error }, { status: 400 });
		}

		if (!result?.data) {
			return NextResponse.json({ error: { message: 'Erro ao criar conta' } }, { status: 400 });
		}

		if (result.data.requiresDeviceVerification) {
			return NextResponse.json({
				data: {
					requiresDeviceVerification: true,
					maskedEmail: result.data.maskedEmail,
				},
			});
		}

		if (!result.data.user || !result.data.tokens) {
			return NextResponse.json({ error: { message: 'Erro ao criar conta' } }, { status: 400 });
		}

		const { tokens, user, currentDevice } = result.data;
		const expiresAt = new Date(tokens.accessTokenExpiresAt);
		const isProduction = process.env.NODE_ENV === 'production';

		const response = NextResponse.json({ 
			data: { 
				user,
				currentDevice,
				requiresDeviceVerification: false,
			} 
		});

		// Set cookies directly on the response
		response.cookies.set(BaseCookie.accessToken, tokens.accessToken, {
			httpOnly: true,
			secure: isProduction,
			sameSite: 'lax',
			expires: expiresAt,
			path: '/',
		});

		response.cookies.set(BaseCookie.accessTokenExpiresAt, tokens.accessTokenExpiresAt, {
			httpOnly: false,
			secure: isProduction,
			sameSite: 'lax',
			expires: expiresAt,
			path: '/',
		});

		if (deviceId) {
			response.cookies.set(BaseCookie.deviceId, deviceId, {
				httpOnly: true,
				secure: isProduction,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 365,
				path: '/',
			});
		}

		return response;
	} catch {
		return NextResponse.json({ error: { message: 'Erro interno do servidor' } }, { status: 500 });
	}
}

