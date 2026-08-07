import { getSelectedMerchant } from '@/auth/session';
import { MerchantDashboard } from './merchant-dashboard';

const PREVIEW_MERCHANT_ID = 'preview-merchant-id';

export default async function DashboardPage() {
	const merchant = await getSelectedMerchant().catch(() => null);

	// Modo auditoria: usa merchant mock quando não há sessão real
	const merchantId = merchant?.id ?? PREVIEW_MERCHANT_ID;

	return <MerchantDashboard merchantId={merchantId} />;
}

