import { getSelectedMerchant } from '@/auth/session';
import { CustomersTable } from './customers-table';

const PREVIEW_MERCHANT_ID = 'preview-merchant-id';

export default async function CustomersPage() {
	const merchant = await getSelectedMerchant().catch(() => null);

	return <CustomersTable merchantId={merchant?.id ?? PREVIEW_MERCHANT_ID} />;
}

