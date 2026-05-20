import { redirect } from 'next/navigation';
import { getSelectedMerchant } from '@/auth/session';
import { TransactionsTable } from './transactions-table';
import { Routes } from '@/router/routes';

export default async function TransactionsPage() {
	const merchant = await getSelectedMerchant();

	if (!merchant) {
		redirect(Routes.panel.merchant.new);
	}

	return <TransactionsTable merchantId={merchant.id} />;
}

