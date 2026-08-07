import { redirect } from 'next/navigation';
import { getSelectedMerchant, getSelectedEnvironment } from '@/auth/session';
import { PaymentEnvironment } from '@/types/enums';
import { CheckoutsTable } from './checkouts-table';
import { Routes } from '@/router/routes';

const PREVIEW_MERCHANT_ID = 'preview-merchant-id';

export default async function CheckoutsPage() {
	const [merchant, environment] = await Promise.all([
		getSelectedMerchant().catch(() => null),
		getSelectedEnvironment().catch(() => PaymentEnvironment.Production),
	]);
	const merchantId = merchant?.id ?? PREVIEW_MERCHANT_ID;

	return (
		<CheckoutsTable
			merchantId={merchantId}
			initialFilters={{
				environment: environment ?? PaymentEnvironment.Production,
				page: 1,
				pageSize: 10,
			}}
		/>
	);
}

