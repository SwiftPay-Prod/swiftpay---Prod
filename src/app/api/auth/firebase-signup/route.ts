import { NextRequest, NextResponse } from 'next/server';
import client from '@/clients/client';
import { BaseCookie } from '@/constants/base';
import type { AuthData } from '@/types/auth';

interface FirebaseSignUpData {
	requiresEmailVerification: boolean;
	auth: AuthData | null;
}

interface FirebaseAuthResponse {
	data: FirebaseSignUpData | null;
	message: string | null;
	error: { message: string; code?: string } | null;
}

function errorStatus(status: number): number {
	return status >= 400 && status <= 599 ? status : 502;
}

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as {
			idToken?: string;
			name?: string;
			whatsApp?: string;
			deviceId?: string;
			refCode?: string;
		};

		if (!body.idToken) {
			return NextResponse.json(
				{ error: { message: 'Token do Firebase é obrigatório.' } },
				{ status: 400 }
			);
		}

		const backendResponse = await client.post<FirebaseAuthResponse>('/v1/auth/firebase-signup', {
			idToken: body.idToken,
			name: body.name,
			whatsApp: body.whatsApp,
			deviceId: body.deviceId || undefined,
			refCode: body.refCode || undefined,
		});
		const payload = backendResponse.data;

		if (payload.error) {
			return NextResponse.json(
				{ error: payload.error },
				{ status: errorStatus(backendResponse.status) }
			);
		}

		if (payload.data?.requiresEmailVerification) {
			return NextResponse.json({
				data: { requiresEmailVerification: true },
			});
		}

		const auth = payload.data?.auth;
		if (!auth?.user || !auth.tokens) {
			return NextResponse.json(
				{ error: { message: 'Resposta inválida do backend.' } },
				{ status: 502 }
			);
		}

		const expiresAt = new Date(auth.tokens.accessTokenExpiresAt);
		const isProduction = process.env.NODE_ENV === 'production';
		const response = NextResponse.json({
			data: {
				user: auth.user,
				requiresEmailVerification: false,
			},
		});

		response.cookies.set(BaseCookie.accessToken, auth.tokens.accessToken, {
			httpOnly: true,
			secure: isProduction,
			sameSite: 'lax',
			expires: expiresAt,
			path: '/',
		});
		response.cookies.set(BaseCookie.accessTokenExpiresAt, auth.tokens.accessTokenExpiresAt, {
			httpOnly: false,
			secure: isProduction,
			sameSite: 'lax',
			expires: expiresAt,
			path: '/',
		});

		if (body.deviceId) {
			response.cookies.set(BaseCookie.deviceId, body.deviceId, {
				httpOnly: true,
				secure: isProduction,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 365,
				path: '/',
			});
		}

		return response;
	} catch {
		return NextResponse.json(
			{ error: { message: 'Erro interno do servidor.' } },
			{ status: 500 }
		);
	}
}
