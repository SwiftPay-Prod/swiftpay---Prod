import { redirect } from 'next/navigation';
import { getSelectedMerchant, getSelectedEnvironment } from '@/auth/session';
import { CheckoutsTable } from './checkouts-table';
import { Routes } from '@/router/routes';

export default async function CheckoutsPage() {
	const [merchant, environment] = await Promise.all([getSelectedMerchant(), getSelectedEnvironment()]);

	if (!merchant) {
		redirect(Routes.panel.merchant.new);
	}

	return (
		<CheckoutsTable
			merchantId={merchant.id}
			initialFilters={{
				environment,
				page: 1,
				pageSize: 10,
			}}
		/>
	);
}

