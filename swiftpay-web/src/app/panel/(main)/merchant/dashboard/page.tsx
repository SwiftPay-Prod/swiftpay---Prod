import { redirect } from 'next/navigation';
import { getSelectedMerchant } from '@/auth/session';
import { MerchantDashboard } from './merchant-dashboard';
import { Routes } from '@/router/routes';

export default async function DashboardPage() {
	const merchant = await getSelectedMerchant();

	if (!merchant) {
		redirect(Routes.panel.merchant.new);
	}

	return <MerchantDashboard merchantId={merchant.id} />;
}

