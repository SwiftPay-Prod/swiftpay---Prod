import { redirect } from 'next/navigation';
import { getSelectedMerchant, getSelectedEnvironment } from '@/auth/session';
import { PaymentEnvironment } from '@/types/enums';
import { CheckoutsTable } from './checkouts-table';
import { Routes } from '@/router/routes';


export default async function CheckoutsPage() {
	const [merchant, environment] = await Promise.all([
		getSelectedMerchant().catch(() => null),
		getSelectedEnvironment().catch(() => PaymentEnvironment.Production),
	]);
	if (!merchant) {
		redirect(Routes.panel.merchant.new);
	}

	return (
		<CheckoutsTable
			merchantId={merchant.id}
			initialFilters={{
				environment: environment ?? PaymentEnvironment.Production,
				page: 1,
				pageSize: 10,
			}}
		/>
	);
}

