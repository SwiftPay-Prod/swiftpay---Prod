import { redirect } from 'next/navigation';
import { getSelectedMerchant, getSelectedEnvironment } from '@/auth/session';
import { OrdersTable } from './orders-table';
import { Routes } from '@/router/routes';

export default async function OrdersPage() {
	const [merchant, environment] = await Promise.all([getSelectedMerchant(), getSelectedEnvironment()]);

	if (!merchant) {
		redirect(Routes.panel.merchant.new);
	}

	return (
		<OrdersTable
			merchantId={merchant.id}
			initialFilters={{
				environment,
				page: 1,
				pageSize: 10,
			}}
		/>
	);
}

