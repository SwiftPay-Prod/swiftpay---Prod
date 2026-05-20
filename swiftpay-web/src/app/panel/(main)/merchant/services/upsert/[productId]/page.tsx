import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSelectedMerchant, getSelectedEnvironment } from '@/auth/session';
import { getMerchantProduct } from '@/app/actions/merchant/products';
import { ServiceForm } from './components/service-form';
import { ServiceFormSkeleton } from './components/service-form-skeleton';
import { Routes } from '@/router/routes';

interface PageProps {
	params: Promise<{ productId: string }>;
}

export default async function ServiceUpsertPage({ params }: PageProps) {
	const [{ productId }, merchant, environment] = await Promise.all([
		params,
		getSelectedMerchant(),
		getSelectedEnvironment(),
	]);

	if (!merchant) {
		redirect(Routes.panel.merchant.new);
	}

	const isNew = productId === 'new';
	const productPromise = isNew ? undefined : getMerchantProduct(merchant.id, productId);

	return (
		<Suspense fallback={<ServiceFormSkeleton />}>
			<ServiceForm
				merchantId={merchant.id}
				environment={environment}
				productPromise={productPromise}
			/>
		</Suspense>
	);
}
