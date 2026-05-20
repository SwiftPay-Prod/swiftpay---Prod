import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	experimental: {
		serverActions: {
			bodySizeLimit: '10mb',
		},
	},
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'www.facebook.com',
				pathname: '/tr',
			},
			{
				protocol: 'https',
				hostname: 'safefy-staging.nyc3.cdn.digitaloceanspaces.com',
				pathname: '/**',
			},
			{
				hostname: 'bucket-staging-13ce.up.railway.app',
				pathname: '/safefy-dev/**',
			},
			{
				protocol: 'https',
				hostname: 'storage.safefypay.com.br',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'api.woovi.com',
				pathname: '/**',
			},
		],
	},
	output: 'standalone',
	generateBuildId: async () => 'swiftpay-web-checkout-stable-build',
	async rewrites() {
		const paymentApiUrl = process.env.INTERNAL_SAFEFY_API_PAYMENT_URL || process.env.NEXT_PUBLIC_SAFEFY_API_PAYMENT_URL;

		if (!paymentApiUrl) {
			return [];
		}

		return [
			{
				source: '/api/payment/:path*',
				destination: `${paymentApiUrl}/:path*`,
			},
		];
	},
};

export default nextConfig;

