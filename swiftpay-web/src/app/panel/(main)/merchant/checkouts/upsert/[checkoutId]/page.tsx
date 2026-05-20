import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSelectedMerchant, getSelectedEnvironment } from '@/auth/session';
import { getMerchantCheckout, listCheckoutTemplates } from '@/app/actions/merchant/checkouts';
import { CheckoutUpsertContent } from './components/checkout-upsert-content';
import { CheckoutUpsertFormSkeleton } from './checkout-upsert-form-skeleton';
import { Routes } from '@/router/routes';

interface PageProps {
	params: Promise<{
		checkoutId: string;
	}>;
}

export default async function CheckoutUpsertPage({ params }: PageProps) {
	const { checkoutId } = await params;

	const merchant = await getSelectedMerchant();
	const environment = await getSelectedEnvironment();

	if (!merchant) {
		redirect(Routes.panel.merchant.new);
	}

	const isNew = checkoutId === 'new';

	const checkoutPromise = isNew ? null : getMerchantCheckout(merchant.id, checkoutId);
	const templatesPromise = listCheckoutTemplates(merchant.id);

	return (
		<Suspense fallback={<CheckoutUpsertFormSkeleton />}>
			<CheckoutUpsertContent
				merchantId={merchant.id}
				environment={environment}
				isNew={isNew}
				checkoutPromise={checkoutPromise}
				templatesPromise={templatesPromise}
			/>
		</Suspense>
	);
}
