import { redirect } from 'next/navigation';
import { Routes } from '@/router/routes';
import { getSelectedMerchant } from '@/auth/session';
import { CreditCardPayments } from './credit-card-payments';


export default async function CreditCardPaymentsPage() {
	redirect(Routes.panel.merchant.transactions);
}
