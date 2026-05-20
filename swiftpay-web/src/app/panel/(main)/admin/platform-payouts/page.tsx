import { adminGetAutomaticCashoutLogs } from '@/app/actions/admin/automatic-cashouts';
import type { AutomaticCashoutStatus, PaymentEnvironment } from '@/types/enums';
import { PlatformPayoutsHub } from './platform-payouts-hub';
import type { PlatformAutomaticCashoutFilters } from './platform-automatic-cashout-logs-table';

interface PageProps {
	searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdminPlatformPayoutsPage({ searchParams }: PageProps) {
	const params = await searchParams;
	const tab = params.tab ?? 'payouts';

	const automaticFilters: PlatformAutomaticCashoutFilters = {
		page: Number(params.autoPage) || 1,
		pageSize: Number(params.autoPageSize) || 10,
		status: (params.autoStatus as AutomaticCashoutStatus) || undefined,
		environment: (params.autoEnvironment as PaymentEnvironment) || undefined,
	};

	const automaticCashoutPromise =
		tab === 'automatic'
			? adminGetAutomaticCashoutLogs({
					page: automaticFilters.page,
					pageSize: automaticFilters.pageSize,
					status: automaticFilters.status,
					environment: automaticFilters.environment,
					platformOnly: true,
				})
			: null;

	return (
		<PlatformPayoutsHub
			initialTab={tab as 'payouts' | 'accounts' | 'automatic'}
			automaticCashoutPromise={automaticCashoutPromise}
			automaticCashoutFilters={automaticFilters}
		/>
	);
}

