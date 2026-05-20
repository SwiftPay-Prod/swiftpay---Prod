import type { AxiosError, AxiosInstance } from 'axios';
import { cookies, headers } from 'next/headers';

const ENVIRONMENT_COOKIE = 'safefy_checkout_environment';

export function applyAxiosMiddleware(client: AxiosInstance): void {
	client.interceptors.request.use(async (config) => {
		const cookieStore = await cookies();
		const environment = cookieStore.get(ENVIRONMENT_COOKIE)?.value ?? 'Production';

		const headersList = await headers();
		const clientIp =
			headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || headersList.get('cf-connecting-ip');
		const clientUserAgent = headersList.get('user-agent');

		config.headers['X-Api-Environment'] = environment;
		if (clientIp) {
			config.headers['X-Client-IP'] = clientIp;
		}
		if (clientUserAgent) {
			config.headers['X-Client-User-Agent'] = clientUserAgent;
		}

		const isFormData = config.data instanceof FormData;
		if (!isFormData && config.method && ['post', 'patch', 'put'].includes(config.method.toLowerCase())) {
			config.headers['Content-Type'] = 'application/json';
		}

		return config;
	});

	client.interceptors.response.use(
		(response) => response,
		(error: AxiosError) => {
			return Promise.resolve(
				error.response ?? {
					status: 0,
					data: {
						data: null,
						message: null,
						error: { message: 'Nao foi possivel conectar ao servidor. Tente novamente.' },
					},
				}
			);
		}
	);
}
