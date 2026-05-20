'use client';

import { CustomersTable } from '@/app/panel/(main)/merchant/customers/customers-table';

interface MerchantCustomersTabProps {
	merchantId: string;
	readOnly?: boolean;
}

export function MerchantCustomersTab({ merchantId, readOnly = false }: MerchantCustomersTabProps) {
	return (
		<CustomersTable
			merchantId={merchantId}
			readOnly={readOnly}
		/>
	);
}
