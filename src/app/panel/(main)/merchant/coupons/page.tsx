import { redirect } from 'next/navigation';
import { getSelectedMerchant, getSelectedEnvironment } from '@/auth/session';
import { PaymentEnvironment } from '@/types/enums';
import { CouponsTable } from './coupons-table';
import { Routes } from '@/router/routes';


export default async function CouponsPage() {
	const [merchant, environment] = await Promise.all([
		getSelectedMerchant().catch(() => null),
		getSelectedEnvironment().catch(() => PaymentEnvironment.Production),
	]);
	if (!merchant) {
		redirect(Routes.panel.merchant.new);
	}

	return (
		<CouponsTable
			merchantId={merchant.id}
			initialFilters={{
				environment: environment ?? PaymentEnvironment.Production,
				page: 1,
				pageSize: 10,
			}}
		/>
	);
}

