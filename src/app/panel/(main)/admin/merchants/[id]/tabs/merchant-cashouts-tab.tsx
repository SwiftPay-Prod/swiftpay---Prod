'use client';

import { CashoutsTable } from '@/app/panel/(main)/merchant/cashouts/cashouts-table';

interface MerchantCashoutsTabProps {
	merchantId: string;
	readOnly?: boolean;
}

export function MerchantCashoutsTab({ merchantId, readOnly = false }: MerchantCashoutsTabProps) {
	return (
		<CashoutsTable merchantId={merchantId} readOnly={readOnly} />
	);
}
