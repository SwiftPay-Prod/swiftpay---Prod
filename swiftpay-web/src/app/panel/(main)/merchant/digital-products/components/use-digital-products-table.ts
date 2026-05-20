'use client';

import { useState, useCallback, useEffect, createElement } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { CheckmarkCircle02Icon, CancelCircleIcon } from '@hugeicons/core-free-icons';
import {
	deleteMerchantProduct,
	getMerchantProduct,
	listMerchantProducts,
	listMerchantCategories,
	updateMerchantProductStatus,
} from '@/app/actions/merchant/products';
import { Routes } from '@/router/routes';
import type { MinimalProductData, MinimalCategoryData, ProductData } from '@/types/merchant/products';
import type { ApiResponse, Paginated } from '@/types/common';
import type { ProductStatus, PaymentEnvironment, ProductType } from '@/types/enums';
import { PaymentEnvironment as PaymentEnv } from '@/types/enums';

export interface DigitalProductsTableFilters {
	environment?: PaymentEnvironment;
	status?: ProductStatus | null;
	categoryId?: string | null;
	search?: string | null;
	page?: number;
	pageSize?: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

interface UseDigitalProductsTableProps {
	merchantId: string;
	initialFilters: DigitalProductsTableFilters;
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

type ProductPromise = Promise<ApiResponse<ProductData>>;

interface DetailsModalState {
	isOpen: boolean;
	productPromise: ProductPromise | null;
}

const initialDeleteModal: DeleteModalState = {
	isOpen: false,
	productId: null,
	productName: '',
	isDeleting: false,
};

const initialCategoriesModal: CategoriesModalState = {
	isOpen: false,
};

const initialDetailsModal: DetailsModalState = {
	isOpen: false,
	productPromise: null,
};

const defaultPaginated: Paginated<MinimalProductData> = {
	items: [],
	totalItems: 0,
	page: 1,
	pageSize: 10,
	totalPages: 0,
};

export function useDigitalProductsTable({
	merchantId,
	initialFilters,
}: UseDigitalProductsTableProps) {
	const router = useRouter();

	const [filters, setFilters] = useState<DigitalProductsTableFilters>(initialFilters);
	const [products, setProducts] = useState<Paginated<MinimalProductData>>(defaultPaginated);
	const [categories, setCategories] = useState<MinimalCategoryData[]>([]);
	const [deleteModal, setDeleteModal] = useState<DeleteModalState>(initialDeleteModal);
	const [categoriesModal, setCategoriesModal] = useState<CategoriesModalState>(initialCategoriesModal);
	const [detailsModal, setDetailsModal] = useState<DetailsModalState>(initialDetailsModal);
	const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

	const [refreshTrigger, setRefreshTrigger] = useState(0);
	const [fetchedFiltersKey, setFetchedFiltersKey] = useState<string | null>(null);

	const currentFiltersKey = JSON.stringify(filters) + refreshTrigger;
	const isLoading = fetchedFiltersKey !== currentFiltersKey;

	const categoryOptions = categories.map((cat) => ({ value: cat.id, label: cat.name }));

	const hasFilters =
		filters.status !== undefined ||
		filters.categoryId !== undefined ||
		filters.search !== undefined;

	useEffect(() => {
		let cancelled = false;
		const key = currentFiltersKey;

		const productFilters = {
			...filters,
			type: 'Digital' as ProductType,
		};

		Promise.all([
			listMerchantProducts(merchantId, productFilters),
			listMerchantCategories(merchantId, { environment: filters.environment, pageSize: 100 }),
		]).then(([productsRes, categoriesRes]) => {
			if (!cancelled) {
				setProducts(productsRes?.data ?? defaultPaginated);
				setCategories(categoriesRes?.data?.items ?? []);
				setFetchedFiltersKey(key);
			}
		});

		return () => {
			cancelled = true;
		};
	}, [merchantId, filters, currentFiltersKey]);

	const updateFilters = useCallback(
		(newParams: Partial<DigitalProductsTableFilters>) => {
			setFilters((prev) => {
				const updated = { ...prev, ...newParams };
				if (!('page' in newParams)) {
					updated.page = 1;
				}
				return updated;
			});
		},
		[],
	);

	const clearFilters = useCallback(() => {
		setFilters((prev) => ({
			environment: prev.environment,
			page: 1,
			pageSize: prev.pageSize,
		}));
	}, []);

	const refresh = useCallback(() => {
		setRefreshTrigger((prev) => prev + 1);
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
		router.push(Routes.panel.merchant.digitalProductsUpsert('new'));
	}, [router]);

	const goToEdit = useCallback(
		(productId: string) => {
			router.push(Routes.panel.merchant.digitalProductsUpsert(productId));
		},
		[router],
	);

	const goToView = useCallback(
		(productId: string) => {
			setDetailsModal({
				isOpen: true,
				productPromise: getMerchantProduct(merchantId, productId),
			});
		},
		[merchantId],
	);

	const closeDetails = useCallback(() => {
		setDetailsModal(initialDetailsModal);
	}, []);

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

	const goToEmailTemplates = useCallback(() => {
		router.push(Routes.panel.merchant.emailTemplates);
	}, [router]);

	return {
		data: {
			products,
			categories,
			categoryOptions,
			isLoading,
		},
		filters: {
			values: filters,
			hasFilters,
			update: updateFilters,
			clear: clearFilters,
			refresh,
		},
		modals: {
			details: {
				isOpen: detailsModal.isOpen,
				productPromise: detailsModal.productPromise,
				close: closeDetails,
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
			goToView,
			goToEmailTemplates,
			changeStatus,
		},
		context: {
			merchantId,
			environment: filters.environment ?? PaymentEnv.Sandbox,
			statusUpdatingId,
		},
	};
}

