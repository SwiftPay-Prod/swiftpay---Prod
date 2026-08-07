import { redirect } from 'next/navigation';
import { Routes } from '@/router/routes';
import { getSelectedMerchant, getSelectedEnvironment } from '@/auth/session';
import { PaymentEnvironment } from '@/types/enums';
import { OrdersTable } from './orders-table';


export default async function OrdersPage() {
	const [merchant, environment] = await Promise.all([
		getSelectedMerchant().catch(() => null),
		getSelectedEnvironment().catch(() => PaymentEnvironment.Production),
	]);
	if (!merchant) {
		redirect(Routes.panel.merchant.new);
	}

	return (
		<OrdersTable
			merchantId={merchant.id}
			initialFilters={{
				environment: environment ?? PaymentEnvironment.Production,
				page: 1,
				pageSize: 10,
			}}
		/>
	);
}

