import { redirect } from 'next/navigation';
import { getSelectedMerchant, getSelectedEnvironment } from '@/auth/session';
import { BalanceHistoryTable } from './balance-history-table';
import { Routes } from '@/router/routes';

export default async function BalanceHistoryPage() {
	const [merchant, environment] = await Promise.all([getSelectedMerchant(), getSelectedEnvironment()]);

	if (!merchant) {
		redirect(Routes.panel.merchant.new);
	}

	return (
		<BalanceHistoryTable
			merchantId={merchant.id}
			initialFilters={{
				environment,
				page: 1,
				pageSize: 10,
			}}
		/>
	);
}

