import { redirect } from 'next/navigation';
import { getSelectedMerchant } from '@/auth/session';
import { CustomersTable } from './customers-table';
import { Routes } from '@/router/routes';

export default async function CustomersPage() {
	const merchant = await getSelectedMerchant();

	if (!merchant) {
		redirect(Routes.panel.merchant.new);
	}

	return <CustomersTable merchantId={merchant.id} />;
}

