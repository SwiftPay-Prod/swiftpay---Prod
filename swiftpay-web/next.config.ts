import type { NextConfig } from 'next';

const deployBuildId =
	process.env.NEXT_BUILD_ID ??
	process.env.DO_GIT_COMMIT_SHA ??
	process.env.SOURCE_COMMIT ??
	process.env.SOURCE_VERSION ??
	process.env.GITHUB_SHA;

const nextConfig: NextConfig = {
	experimental: {
		serverActions: {
			bodySizeLimit: '10mb',
		},
	},
	reactCompiler: true,
	images: {
		remotePatterns: [
			{
				hostname: 'bucket-staging-13ce.up.railway.app',
				pathname: '/safefy-dev/**',
			},
			{
				protocol: 'https',
				hostname: 'safefy-staging.nyc3.cdn.digitaloceanspaces.com',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'safefy-staging.nyc3.digitaloceanspaces.com',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'nyc3.digitaloceanspaces.com',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'safefy-prod.nyc3.cdn.digitaloceanspaces.com',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'safefy-prod.nyc3.digitaloceanspaces.com',
				pathname: '/**',
			},
			{
				hostname: '*.up.railway.app',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'storage.safefypay.com.br',
				pathname: '/**',
			},
		],
	},
	output: 'standalone',
	generateBuildId: async () =>
		deployBuildId?.trim() || `local-${Date.now().toString(36)}`,
};

export default nextConfig;
