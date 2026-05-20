'use client';

import { TransactionsTable } from '@/app/panel/(main)/merchant/transactions/transactions-table';

interface MerchantTransactionsTabProps {
	merchantId: string;
	readOnly?: boolean;
}

export function MerchantTransactionsTab({ merchantId, readOnly = false }: MerchantTransactionsTabProps) {
	return (
		<TransactionsTable
			merchantId={merchantId}
			readOnly={readOnly}
		/>
	);
}
