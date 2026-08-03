'use client';

import { use, useState, useCallback, useTransition, createElement } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { toast } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { CheckmarkCircle02Icon, CancelCircleIcon } from '@hugeicons/core-free-icons';
import { getMerchantProduct, deleteMerchantProduct, updateMerchantProductStatus } from '@/app/actions/merchant/products';
import { Routes } from '@/router/routes';
import type { MinimalProductData, ProductData, MinimalCategoryData } from '@/types/merchant/products';
import type { Paginated, ApiResponse } from '@/types/common';
import type { PaymentEnvironment, ProductStatus } from '@/types/enums';

type ProductsPromise = Promise<ApiResponse<Paginated<MinimalProductData>>>;
type CategoriesPromise = Promise<ApiResponse<Paginated<MinimalCategoryData>>>;
type ProductPromise = Promise<ApiResponse<ProductData>>;

export interface ProductsTableFilters {
	environment?: PaymentEnvironment;
	status?: string | null;
	type?: string | null;
	categoryId?: string | null;
	search?: string | null;
	page?: number;
	pageSize?: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

interface UseProductsTableProps {
	productsPromise: ProductsPromise;
	categoriesPromise: CategoriesPromise;
	merchantId: string;
	filters: ProductsTableFilters;
	productType?: 'Physical' | 'Digital' | 'Service';
}

interface DetailsModalState {
	isOpen: boolean;
	productId: string | null;
	productPromise: ProductPromise | null;
}

interface DeleteModalState {
	isOpen: boolean;
	productId: string | null;
	productName: string;
	isDeleting: boolean;
}

interface CategoriesModalState {
	isOpen: boolean;
}

const initialDetailsModal: DetailsModalState = {
	isOpen: false,
	productId: null,
	productPromise: null,
};

const initialDeleteModal: DeleteModalState = {
	isOpen: false,
	productId: null,
	productName: '',
	isDeleting: false,
};

const initialCategoriesModal: CategoriesModalState = {
	isOpen: false,
};

export function useProductsTable({
	productsPromise,
	categoriesPromise,
	merchantId,
	filters,
	productType,
}: UseProductsTableProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

	const [detailsModal, setDetailsModal] = useState<DetailsModalState>(initialDetailsModal);
	const [deleteModal, setDeleteModal] = useState<DeleteModalState>(initialDeleteModal);
	const [categoriesModal, setCategoriesModal] = useState<CategoriesModalState>(initialCategoriesModal);
	const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

	const { data: productsData } = use(productsPromise) ?? { data: null };
	const { data: categoriesData } = use(categoriesPromise) ?? { data: null };

	const products = productsData ?? {
		items: [],
		totalItems: 0,
		page: 1,
		pageSize: 10,
		totalPages: 0,
	};

	const categories = categoriesData?.items ?? [];
	const categoryOptions = categories.map((cat) => ({ value: cat.id, label: cat.name }));

	const hasFilters =
		filters.status !== undefined ||
		(!productType && filters.type !== undefined) ||
		filters.categoryId !== undefined ||
		filters.search !== undefined;

	const navigate = useCallback(
		(newParams: Record<string, string | number | undefined | null>) => {
			startTransition(() => {
				const params = new URLSearchParams(searchParams.toString());

				Object.entries(newParams).forEach(([key, value]) => {
					if (value === undefined || value === null || value === 'all' || (key === 'pageSize' && value === 10)) {
						params.delete(key);
					} else {
						params.set(key, String(value));
					}
				});

				if (!('page' in newParams)) params.delete('page');

				router.push(`${pathname}?${params.toString()}`, { scroll: false });
			});
		},
		[router, pathname, searchParams],
	);

	const refresh = useCallback(() => {
		startTransition(() => router.refresh());
	}, [router]);

	const clearFilters = useCallback(() => {
		startTransition(() => router.push(pathname));
	}, [router, pathname]);

	// Details Modal
	const openDetailsModal = useCallback(
		(productId: string) => {
			setDetailsModal({
				isOpen: true,
				productId,
				productPromise: getMerchantProduct(merchantId, productId),
			});
		},
		[merchantId],
	);

	const closeDetailsModal = useCallback(() => {
		setDetailsModal(initialDetailsModal);
	}, []);

	// Delete Modal
	const openDeleteModal = useCallback((productId: string, productName: string) => {
		setDeleteModal({
			isOpen: true,
			productId,
			productName,
			isDeleting: false,
		});
	}, []);

	const closeDeleteModal = useCallback(() => {
		setDeleteModal(initialDeleteModal);
	}, []);

	const confirmDelete = useCallback(async () => {
		if (!deleteModal.productId) return;

		setDeleteModal((prev) => ({ ...prev, isDeleting: true }));

		const res = await deleteMerchantProduct(merchantId, deleteModal.productId);

		if (res?.error) {
			toast('Erro ao excluir', {
				description: res.error.message ?? 'Erro ao excluir produto',
				variant: 'danger',
				indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
			});
			setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
		} else {
			toast('Produto excluído', {
				description: res?.message ?? 'Produto excluído com sucesso',
				variant: 'success',
				indicator: createElement(Icon, { icon: CheckmarkCircle02Icon, className: 'icon-sm' }),
			});
			closeDeleteModal();
			refresh();
		}
	}, [merchantId, deleteModal.productId, closeDeleteModal, refresh]);

	// Categories Modal
	const openCategoriesModal = useCallback(() => {
		setCategoriesModal({ isOpen: true });
	}, []);

	const closeCategoriesModal = useCallback(() => {
		setCategoriesModal(initialCategoriesModal);
	}, []);

	// Navigation Actions
	const goToNew = useCallback(() => {
		const routes: Record<string, string> = {
			Physical: Routes.panel.merchant.physicalProductsUpsert('new'),
			Digital: Routes.panel.merchant.digitalProductsUpsert('new'),
			Service: Routes.panel.merchant.servicesUpsert('new'),
		};
		if (productType && routes[productType]) {
			router.push(routes[productType]);
		}
	}, [router, productType]);

	const goToEdit = useCallback(
		(productId: string) => {
			const routes: Record<string, (id: string) => string> = {
				Physical: Routes.panel.merchant.physicalProductsUpsert,
				Digital: Routes.panel.merchant.digitalProductsUpsert,
				Service: Routes.panel.merchant.servicesUpsert,
			};
			if (productType && routes[productType]) {
				router.push(routes[productType](productId));
			}
		},
		[router, productType],
	);

	const goToEmailTemplates = useCallback(() => {
		router.push(Routes.panel.merchant.emailTemplates);
	}, [router]);

	const changeStatus = useCallback(async (productId: string, status: ProductStatus) => {
		setStatusUpdatingId(productId);
		const response = await updateMerchantProductStatus(merchantId, productId, status);

		if (response?.error) {
			toast('Erro ao atualizar status', {
				description: response.error.message ?? 'Não foi possível atualizar o status do produto.',
				variant: 'danger',
				indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
			});
			setStatusUpdatingId(null);
			return;
		}

		toast('Status atualizado', {
			description: response?.message ?? 'Status do produto atualizado com sucesso.',
			variant: 'success',
			indicator: createElement(Icon, { icon: CheckmarkCircle02Icon, className: 'icon-sm' }),
		});
		refresh();
		setStatusUpdatingId(null);
	}, [merchantId, refresh]);

	return {
		data: {
			products,
			categories,
			categoryOptions,
			isLoading: isPending,
		},
		filters: {
			values: filters,
			hasFilters,
			navigate,
			clear: clearFilters,
			refresh,
		},
		modals: {
			details: {
				isOpen: detailsModal.isOpen,
				productPromise: detailsModal.productPromise,
				open: openDetailsModal,
				close: closeDetailsModal,
			},
			delete: {
				isOpen: deleteModal.isOpen,
				productName: deleteModal.productName,
				isDeleting: deleteModal.isDeleting,
				open: openDeleteModal,
				close: closeDeleteModal,
				confirm: confirmDelete,
			},
			categories: {
				isOpen: categoriesModal.isOpen,
				open: openCategoriesModal,
				close: closeCategoriesModal,
			},
		},
		actions: {
			goToNew,
			goToEdit,
			goToEmailTemplates,
			changeStatus,
		},
		context: {
			merchantId,
			productType,
			statusUpdatingId,
		},
	};
}

