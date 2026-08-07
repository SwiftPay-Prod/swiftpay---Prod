import { redirect } from 'next/navigation';
import { Routes } from '@/router/routes';
import { getSelectedMerchant } from '@/auth/session';
import { MerchantDashboard } from './merchant-dashboard';


export default async function DashboardPage() {
	const merchant = await getSelectedMerchant().catch(() => null);

	if (!merchant) {
		redirect(Routes.panel.merchant.new);
	}

	return <MerchantDashboard merchantId={merchant.id} />;
}

