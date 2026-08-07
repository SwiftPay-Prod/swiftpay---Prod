import { redirect } from 'next/navigation';
import { Routes } from '@/router/routes';
import { getSelectedMerchant } from '@/auth/session';
import { CreditCardPayments } from './credit-card-payments';


export default async function CreditCardPaymentsPage() {
	const merchant = await getSelectedMerchant().catch(() => null);
	if (!merchant) {
		redirect(Routes.panel.merchant.new);
	}

	return <CreditCardPayments merchantId={merchant.id} />;
}
