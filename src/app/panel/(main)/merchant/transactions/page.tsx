import { redirect } from 'next/navigation';
import { getSelectedMerchant } from '@/auth/session';
import { TransactionsTable } from './transactions-table';
import { Routes } from '@/router/routes';

const PREVIEW_MERCHANT_ID = 'preview-merchant-id';

export default async function TransactionsPage() {
	const merchant = await getSelectedMerchant().catch(() => null);
	const merchantId = merchant?.id ?? PREVIEW_MERCHANT_ID;

	return <TransactionsTable merchantId={merchantId} />;
}

