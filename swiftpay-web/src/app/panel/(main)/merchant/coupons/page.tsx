import { redirect } from 'next/navigation';
import { getSelectedMerchant, getSelectedEnvironment } from '@/auth/session';
import { CouponsTable } from './coupons-table';
import { Routes } from '@/router/routes';

export default async function CouponsPage() {
	const [merchant, environment] = await Promise.all([getSelectedMerchant(), getSelectedEnvironment()]);

	if (!merchant) {
		redirect(Routes.panel.merchant.new);
	}

	return (
		<CouponsTable
			merchantId={merchant.id}
			initialFilters={{
				environment,
				page: 1,
				pageSize: 10,
			}}
		/>
	);
}

