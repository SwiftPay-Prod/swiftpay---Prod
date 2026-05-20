import { redirect } from 'next/navigation';
import { getSelectedMerchant, getSelectedEnvironment } from '@/auth/session';
import { ServicesTable } from './components/services-table';
import { Routes } from '@/router/routes';

export default async function ServicesPage() {
	const [merchant, environment] = await Promise.all([getSelectedMerchant(), getSelectedEnvironment()]);

	if (!merchant) {
		redirect(Routes.panel.merchant.new);
	}

	return (
		<ServicesTable
			merchantId={merchant.id}
			initialFilters={{
				environment,
				page: 1,
				pageSize: 10,
			}}
		/>
	);
}

