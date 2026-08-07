import { getSelectedMerchant, getSelectedEnvironment } from '@/auth/session';
import { PaymentEnvironment } from '@/types/enums';
import { BalanceHistoryTable } from './balance-history-table';

const PREVIEW_MERCHANT_ID = 'preview-merchant-id';

export default async function BalanceHistoryPage() {
	const [merchant, environment] = await Promise.all([
		getSelectedMerchant().catch(() => null),
		getSelectedEnvironment().catch(() => PaymentEnvironment.Production),
	]);

	return (
		<BalanceHistoryTable
			merchantId={merchant?.id ?? PREVIEW_MERCHANT_ID}
			initialFilters={{
				environment: environment ?? PaymentEnvironment.Production,
				page: 1,
				pageSize: 10,
			}}
		/>
	);
}

