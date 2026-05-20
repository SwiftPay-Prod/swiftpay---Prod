import { redirect } from 'next/navigation';
import { getSelectedEnvironment, getSelectedMerchant } from '@/auth/session';
import { listMerchantCategories, listMerchantProducts } from '@/app/actions/merchant/products';
import { Routes } from '@/router/routes';
import { ProductsTabsContent } from './components/products-tabs-content';
import type { ProductType } from '@/types/enums';
import type { ProductsTableFilters } from './components/use-products-table';

interface ProductsPageProps {
	searchParams: Promise<{ type?: string }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
	const params = await searchParams;
	const [merchant, environment] = await Promise.all([getSelectedMerchant(), getSelectedEnvironment()]);

	if (!merchant) {
		redirect(Routes.panel.merchant.new);
	}

	const initialTab = params.type === 'physical' ? 'physical' : 'digital';
	const productType: ProductType = initialTab === 'physical' ? ('physical' as ProductType) : ('digital' as ProductType);

	const filters: ProductsTableFilters = {
		environment,
		type: productType,
		page: 1,
		pageSize: 10,
	};

	const productsPromise = listMerchantProducts(merchant.id, {
		environment,
		type: productType,
		page: filters.page,
		pageSize: filters.pageSize,
	});

	const categoriesPromise = listMerchantCategories(merchant.id, {
		environment,
		page: 1,
		pageSize: 100,
	});

	return (
		<ProductsTabsContent
			merchantId={merchant.id}
			initialTab={initialTab}
			filters={filters}
			productsPromise={productsPromise}
			categoriesPromise={categoriesPromise}
		/>
	);
}
