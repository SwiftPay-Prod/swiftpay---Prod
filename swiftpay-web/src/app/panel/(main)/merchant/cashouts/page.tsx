import { redirect } from 'next/navigation';
import { getSelectedMerchant } from '@/auth/session';
import { Routes } from '@/router/routes';
import { CashoutsAndAccountsTabs } from './cashouts-and-accounts-tabs';
import { listCashoutAccounts } from '@/app/actions/merchant/cashout-accounts';
import { getMerchantAutomaticCashoutLogs } from '@/app/actions/merchant/automatic-cashouts';
import { PayoutAccountStatus } from '@/types/enums';
import type { AutomaticCashoutStatus } from '@/types/enums';

interface CashoutsPageProps {
	searchParams: Promise<Record<string, string | undefined>>;
}

export default async function CashoutsPage({ searchParams }: CashoutsPageProps) {
	const params = await searchParams;
	const merchant = await getSelectedMerchant();

	if (!merchant) {
		redirect(Routes.panel.merchant.new);
	}

	const initialTab = params.tab === 'automatic' ? 'automatic' : params.tab === 'accounts' ? 'accounts' : 'cashouts';

	const accountsFilters = {
		statuses: [PayoutAccountStatus.Active, PayoutAccountStatus.Pending],
	};

	const accountsPromise = initialTab === 'accounts'
		? listCashoutAccounts(merchant.id, accountsFilters)
		: null;

	const automaticFilters = {
		page: params.autoPage ? parseInt(params.autoPage, 10) : 1,
		pageSize: params.autoPageSize ? parseInt(params.autoPageSize, 10) : 10,
		status: (params.autoStatus as AutomaticCashoutStatus) || undefined,
		sortBy: params.autoSortBy || undefined,
		sortOrder: (params.autoSortOrder as 'asc' | 'desc') || undefined,
	};

	const automaticCashoutPromise = initialTab === 'automatic'
		? getMerchantAutomaticCashoutLogs(merchant.id, automaticFilters)
		: null;

	return (
		<CashoutsAndAccountsTabs
			merchantId={merchant.id}
			initialTab={initialTab}
			accountsPromise={accountsPromise}
			accountsFilters={accountsFilters}
			automaticCashoutPromise={automaticCashoutPromise}
			automaticCashoutFilters={automaticFilters}
		/>
	);
}
