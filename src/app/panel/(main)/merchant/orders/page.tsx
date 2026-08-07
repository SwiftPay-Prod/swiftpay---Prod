import { getSelectedMerchant, getSelectedEnvironment } from '@/auth/session';
import { PaymentEnvironment } from '@/types/enums';
import { OrdersTable } from './orders-table';

const PREVIEW_MERCHANT_ID = 'preview-merchant-id';

export default async function OrdersPage() {
	const [merchant, environment] = await Promise.all([
		getSelectedMerchant().catch(() => null),
		getSelectedEnvironment().catch(() => PaymentEnvironment.Production),
	]);

	return (
		<OrdersTable
			merchantId={merchant?.id ?? PREVIEW_MERCHANT_ID}
			initialFilters={{
				environment: environment ?? PaymentEnvironment.Production,
				page: 1,
				pageSize: 10,
			}}
		/>
	);
}

