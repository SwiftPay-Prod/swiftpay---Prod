import { redirect } from 'next/navigation';
import { Routes } from '@/router/routes';
export default async function CashoutAccountsPage() {
	redirect(Routes.panel.merchant.cashouts);
}
