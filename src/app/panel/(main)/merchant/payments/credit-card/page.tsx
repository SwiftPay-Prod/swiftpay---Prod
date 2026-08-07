import { getSelectedMerchant } from '@/auth/session';
import { CreditCardPayments } from './credit-card-payments';

const PREVIEW_MERCHANT_ID = 'preview-merchant-id';

export default async function CreditCardPaymentsPage() {
	const merchant = await getSelectedMerchant().catch(() => null);
	const merchantId = merchant?.id ?? PREVIEW_MERCHANT_ID;

	return <CreditCardPayments merchantId={merchantId} />;
}
