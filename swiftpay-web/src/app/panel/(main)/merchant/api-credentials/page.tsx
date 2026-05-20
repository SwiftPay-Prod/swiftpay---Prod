import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSelectedMerchant } from '@/auth/session';
import { listApiCredentials } from '@/app/actions/merchant/api-credentials';
import { ApiCredentialsTable } from './api-credentials-table';
import { ApiCredentialsTableSkeleton } from './api-credentials-table-skeleton';
import { Routes } from '@/router/routes';
import { MerchantApiCredentialEnvironment, MerchantApiCredentialStatus } from '@/types/enums';
import type { ApiCredentialsFilters } from '@/types/merchant/api-credentials';

export type Filters = ApiCredentialsFilters;

interface PageProps {
	searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ApiCredentialsPage({ searchParams }: PageProps) {
	const params = await searchParams;
	const merchant = await getSelectedMerchant();

	if (!merchant) {
		redirect(Routes.panel.merchant.new);
	}

	const filters: Filters = {
		name: params.name,
		environment: params.environment as MerchantApiCredentialEnvironment | 'all' | undefined,
		status: (params.status as MerchantApiCredentialStatus | 'all') ?? MerchantApiCredentialStatus.Active,
		sortBy: (params.sortBy as 'createdAt' | 'name') ?? 'createdAt',
		sortOrder: (params.sortOrder as 'asc' | 'desc') ?? 'desc',
		page: params.page ? parseInt(params.page, 10) : 1,
		pageSize: params.pageSize ? parseInt(params.pageSize, 10) : 10,
	};

	const credentialsPromise = listApiCredentials(merchant.id, filters);

	const suspenseKey = JSON.stringify(filters);

	return (
		<Suspense key={suspenseKey} fallback={<ApiCredentialsTableSkeleton pageSize={filters.pageSize} />}>
			<ApiCredentialsTable
				fetchPromise={credentialsPromise}
				merchantId={merchant.id}
				filters={filters}
			/>
		</Suspense>
	);
}
