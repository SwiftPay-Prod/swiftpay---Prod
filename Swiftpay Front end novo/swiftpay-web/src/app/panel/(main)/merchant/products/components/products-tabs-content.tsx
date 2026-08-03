'use client';

import { useMemo, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Tabs } from '@heroui/react';
import { FileCloudIcon, PackageIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { InternalTabs, type InternalTabItem } from '@/components/ui/internal-tabs';
import { ProductsTable } from './products-table';
import type { MinimalCategoryData, MinimalProductData } from '@/types/merchant/products';
import type { ApiResponse, Paginated } from '@/types/common';
import type { ProductsTableFilters } from './use-products-table';

type ProductTabType = 'physical' | 'digital';

interface ProductsTabsContentProps {
	merchantId: string;
	initialTab: ProductTabType;
	filters: ProductsTableFilters;
	productsPromise: Promise<ApiResponse<Paginated<MinimalProductData>>>;
	categoriesPromise: Promise<ApiResponse<Paginated<MinimalCategoryData>>>;
}

const PRODUCT_TABS: InternalTabItem[] = [
	{ id: 'digital', label: 'Produtos Digitais', icon: <Icon icon={FileCloudIcon} className="icon-sm" /> },
	{ id: 'physical', label: 'Produtos Físicos', icon: <Icon icon={PackageIcon} className="icon-sm" /> },
];

function parseTab(value: string | null | undefined): ProductTabType {
	return value === 'physical' ? 'physical' : 'digital';
}

export function ProductsTabsContent({
	merchantId,
	initialTab,
	filters,
	productsPromise,
	categoriesPromise,
}: ProductsTabsContentProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [, startTransition] = useTransition();

	const selectedTab = useMemo(() => parseTab(searchParams.get('type') ?? initialTab), [searchParams, initialTab]);

	function handleTabChange(key: string) {
		const nextTab = parseTab(key);
		startTransition(() => {
			const params = new URLSearchParams(searchParams.toString());
			params.set('type', nextTab);
			router.push(`${pathname}?${params.toString()}`, { scroll: false });
		});
	}

	return (
		<div className="flex flex-col gap-4">
			<InternalTabs
				ariaLabel="Tipo de produto"
				items={PRODUCT_TABS}
				selectedKey={selectedTab}
				onSelectionChange={handleTabChange}
			>
				<Tabs.Panel id="digital">
					{selectedTab === 'digital' && (
						<ProductsTable
							productsPromise={productsPromise}
							categoriesPromise={categoriesPromise}
							merchantId={merchantId}
							filters={filters}
							productType="Digital"
						/>
					)}
				</Tabs.Panel>
				<Tabs.Panel id="physical">
					{selectedTab === 'physical' && (
						<ProductsTable
							productsPromise={productsPromise}
							categoriesPromise={categoriesPromise}
							merchantId={merchantId}
							filters={filters}
							productType="Physical"
						/>
					)}
				</Tabs.Panel>
			</InternalTabs>
		</div>
	);
}
