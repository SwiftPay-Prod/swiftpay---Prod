'use client';

import { MerchantDashboard } from '@/app/panel/(main)/merchant/dashboard/merchant-dashboard';

interface MerchantDashboardTabProps {
	merchantId: string;
}

export function MerchantDashboardTab({ merchantId }: MerchantDashboardTabProps) {
	return <MerchantDashboard merchantId={merchantId} />;
}
