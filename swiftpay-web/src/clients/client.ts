'use server';

import { BaseCookie } from '@/constants/base';
import { updateAccessToken, clearAuthCookies, getSelectedEnvironment } from '@/auth/session';
import axios, { AxiosError } from 'axios';
import { cookies, headers } from 'next/headers';

const SESSION_ERROR_CODES = [
	'device_revoked',
	'device_mismatch',
	'session_expired',
	'invalid_token',
	'user_inactive',
];

const API_ERROR_MESSAGES: Record<string, string> = {
	nominal_disabled:
		'A nominal ativa desta organização está desabilitada. Altere para outra nominal nas configurações da organização.',
};

const isServer = typeof window === 'undefined';
const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;
const internalApiUrl = process.env.INTERNAL_API_URL;

const client = axios.create({
	baseURL: isServer && internalApiUrl ? internalApiUrl : publicApiUrl,
	timeout: 10000,
	headers: {
		Accept: 'application/json',
	},
});

const isRequestTimingEnabled = process.env.SAFEFY_API_LOG_REQUEST_TIMING === 'true';

function getRequestUrl(baseURL?: string, url?: string): string {
	if (!url) return baseURL ?? '';
	if (url.startsWith('http://') || url.startsWith('https://')) return url;
	return `${baseURL ?? ''}${url}`;
}

function logRequestTiming(
	config: { baseURL?: string; url?: string; method?: string },
	status: number | string,
	startAt: number,
	startIso: string
) {
	const endAt = Date.now();
	const endIso = new Date(endAt).toISOString();
	const durationMs = endAt - startAt;
	const method = (config.method || 'get').toUpperCase();
	const requestUrl = getRequestUrl(config.baseURL, config.url);

	console.log(
		`[api] ${method} ${requestUrl} status=${status} start=${startIso} end=${endIso} durationMs=${durationMs}`
	);
}

function normalizeApiErrorData<T>(data: T): T {
	if (!data || typeof data !== 'object') {
		return data;
	}

	const payload = data as {
		error?: { code?: string | null; message?: string | null } | null;
	};
	const errorCode = payload.error?.code;

	if (!errorCode) {
		return data;
	}

	const mappedMessage = API_ERROR_MESSAGES[errorCode];
	if (!mappedMessage) {
		return data;
	}

	return {
		...(data as object),
		error: {
			...(payload.error ?? {}),
			message: mappedMessage,
		},
	} as T;
}

client.interceptors.request.use(async (config) => {
	if (isRequestTimingEnabled) {
		const startAt = Date.now();
		(config as { metadata?: { startAt: number; startIso: string } }).metadata = {
			startAt,
			startIso: new Date(startAt).toISOString(),
		};
	}

	const cookieStore = await cookies();
	const accessToken = cookieStore.get(BaseCookie.accessToken)?.value;

	if (accessToken) {
		config.headers['Authorization'] = `Bearer ${accessToken}`;
	}

	const headersList = await headers();
	const clientIp =
		headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || headersList.get('cf-connecting-ip');
	const clientUserAgent = headersList.get('user-agent');

	if (clientIp) {
		config.headers['X-Client-IP'] = clientIp;
	}
	if (clientUserAgent) {
		config.headers['X-Client-User-Agent'] = clientUserAgent;
	}

	const environment = await getSelectedEnvironment();
	config.headers['X-Api-Environment'] = environment;

	const isFormData = config.data instanceof FormData;
	if (!isFormData && config.method && ['post', 'patch', 'put'].includes(config.method.toLowerCase())) {
		config.headers['Content-Type'] = 'application/json';
	}

	return config;
});

client.interceptors.response.use(
	async (response) => {
		response.data = normalizeApiErrorData(response.data);

		const metadata = (response.config as { metadata?: { startAt: number; startIso: string } }).metadata;
		if (isRequestTimingEnabled && metadata?.startAt) {
			logRequestTiming(response.config, response.status, metadata.startAt, metadata.startIso);
		}

		const newToken = response.headers['x-new-token'];
		const newTokenExpiresAt = response.headers['x-new-token-expires-at'];

		if (newToken && newTokenExpiresAt) {
			await updateAccessToken(newToken, newTokenExpiresAt);
		}

		if (response.status === 429) {
			return {
				...response,
				data: {
					data: null,
					message: null,
					error: {
						message:
							'Você está fazendo muitas requisições em um curto período de tempo. Se continuar, seu dispositivo poderá ser bloqueado permanentemente. Por favor, aguarde alguns instantes antes de continuar.',
					},
				},
			};
		}

		return response;
	},
	async (error: AxiosError) => {
		const metadata = (error.config as { metadata?: { startAt: number; startIso: string } } | undefined)?.metadata;
		if (isRequestTimingEnabled && metadata?.startAt) {
			const status = error.response?.status ?? 'ERR';
			logRequestTiming(error.config ?? {}, status, metadata.startAt, metadata.startIso);
		}

		if (error.response?.status === 429) {
			return Promise.resolve({
				...error.response,
				data: {
					data: null,
					message: null,
					error: {
						message:
							'Você está fazendo muitas requisições em um curto período de tempo. Se continuar, sua conta poderá ser bloqueada permanentemente. Por favor, aguarde alguns instantes antes de continuar.',
					},
				},
			});
		}

		if (error.response?.status === 401) {
			const responseData = error.response.data as { error?: { code?: string; message?: string } } | undefined;
			const errorCode = responseData?.error?.code;

			if (errorCode && SESSION_ERROR_CODES.includes(errorCode)) {
				await clearAuthCookies();

				return Promise.resolve({
					...error.response,
					data: {
						data: null,
						message: null,
						error: {
							code: errorCode,
							message: responseData?.error?.message || 'Sessão expirada. Por favor, faça login novamente.',
						},
					},
				});
			}
		}

		if (error.response) {
			error.response.data = normalizeApiErrorData(error.response.data);
		}

		return Promise.resolve(
			error.response ?? {
				status: 0,
				data: {
					data: null,
					message: null,
					error: { message: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.' },
				},
			}
		);
	}
);

export default client;

