import axios from 'axios';
import { applyAxiosMiddleware } from '@/clients/axios-middleware';

const client = axios.create({
	baseURL: process.env.INTERNAL_SWIFTPAY_API_PAYMENT_URL,
	timeout: 15000,
	headers: {
		Accept: 'application/json',
	},
});

applyAxiosMiddleware(client);

export default client;
