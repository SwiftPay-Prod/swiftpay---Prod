import { redirect } from 'next/navigation';
import { Routes } from '@/router/routes';
import { getSelectedMerchant } from '@/auth/session';
import { CustomersTable } from './customers-table';


export default async function CustomersPage() {
	const merchant = await getSelectedMerchant().catch(() => null);
	if (!merchant) {
		redirect(Routes.panel.merchant.new);
	}

	return <CustomersTable merchantId={merchant.id} />;
}

