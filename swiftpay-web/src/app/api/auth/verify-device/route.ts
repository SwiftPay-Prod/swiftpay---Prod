import { NextRequest, NextResponse } from 'next/server';
import { verifyDevice as verifyDeviceAction } from '@/app/actions/auth';
import { setUserForStatusModal } from '@/auth/session';
import { UserStatus } from '@/types/enums';
import { BaseCookie } from '@/constants/base';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { verificationId, code, deviceId } = body;

		const result = await verifyDeviceAction({ verificationId, code, deviceId });

		if (result?.error) {
			return NextResponse.json({ error: result?.error }, { status: 401 });
		}

		if (!result?.data) {
			return NextResponse.json({ error: { message: 'Erro ao verificar dispositivo' } }, { status: 401 });
		}

		const { user, tokens, currentDevice } = result.data;
		const expiresAt = new Date(tokens.accessTokenExpiresAt);
		const isProduction = process.env.NODE_ENV === 'production';
		
		if (user.status !== UserStatus.Active) {
			await setUserForStatusModal({
				status: user.status,
				suspendedReason: user.suspendedReason,
				inactiveReason: user.inactiveReason,
			});
		}

		const response = NextResponse.json({
			data: {
				user,
				currentDevice,
			},
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

