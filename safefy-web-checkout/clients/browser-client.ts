import axios from 'axios';
import type { AxiosError } from 'axios';

function getEnvironmentFromCookie(): string {
	if (typeof document === 'undefined') return 'Production';
	const match = document.cookie.match(/(?:^|; )safefy_checkout_environment=([^;]*)/);
	return decodeURIComponent(match?.[1] ?? 'Production');
}

const browserClient = axios.create({
	baseURL: '/api/payment',
	timeout: 15000,
	headers: {
		Accept: 'application/json',
	},
});

browserClient.interceptors.request.use((config) => {
	const environment = getEnvironmentFromCookie();
	config.headers['X-Api-Environment'] = environment;

	const isFormData = config.data instanceof FormData;
	if (!isFormData && config.method && ['post', 'patch', 'put'].includes(config.method.toLowerCase())) {
		config.headers['Content-Type'] = 'application/json';
	}

	return config;
});

browserClient.interceptors.response.use(
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

export default browserClient;
