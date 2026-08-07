import { redirect } from 'next/navigation';
import { getSelectedEnvironment, getSelectedMerchant } from '@/auth/session';
import { listMerchantCategories, listMerchantProducts } from '@/app/actions/merchant/products';
import { Routes } from '@/router/routes';
import { ProductsTabsContent } from './components/products-tabs-content';
import { ProductType, PaymentEnvironment } from '@/types/enums';
import type { ProductsTableFilters } from './components/use-products-table';

interface ProductsPageProps {
	searchParams: Promise<{ type?: string }>;
}

const PREVIEW_MERCHANT_ID = 'preview-merchant-id';

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
	const params = await searchParams;
	const [merchant, environment] = await Promise.all([
		getSelectedMerchant().catch(() => null),
		getSelectedEnvironment().catch(() => PaymentEnvironment.Production),
	]);
	const merchantId = merchant?.id ?? PREVIEW_MERCHANT_ID;

	const initialTab = params.type === 'physical' ? 'physical' : 'digital';
	const productType: ProductType = initialTab === 'physical' ? ('physical' as ProductType) : ('digital' as ProductType);

	const filters: ProductsTableFilters = {
		environment,
		type: productType,
		page: 1,
		pageSize: 10,
	};

	const productsPromise = listMerchantProducts(merchantId, {
		environment,
		type: productType,
		page: filters.page,
		pageSize: filters.pageSize,
	});

	const categoriesPromise = listMerchantCategories(merchantId, {
		environment,
		page: 1,
		pageSize: 100,
	});

	return (
		<ProductsTabsContent
			merchantId={merchantId}
			initialTab={initialTab}
			filters={filters}
			productsPromise={productsPromise}
			categoriesPromise={categoriesPromise}
		/>
	);
}
