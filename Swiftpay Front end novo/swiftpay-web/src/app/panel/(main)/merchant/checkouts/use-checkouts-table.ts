'use client';

import { useState, useEffect, useCallback, createElement } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { CheckmarkCircle02Icon, CancelCircleIcon, Copy01Icon } from '@hugeicons/core-free-icons';
import {
	listMerchantCheckouts,
	deleteMerchantCheckout,
	getMerchantCheckout,
} from '@/app/actions/merchant/checkouts';
import { Routes } from '@/router/routes';
import type { CheckoutData, MinimalCheckout } from '@/types/merchant/checkouts';
import type { ApiResponse, Paginated } from '@/types/common';
import type { CheckoutStatus, CheckoutTemplateType, PaymentEnvironment } from '@/types/enums';

export interface CheckoutsTableFilters {
	environment: PaymentEnvironment;
	status?: CheckoutStatus | null;
	templateType?: CheckoutTemplateType | null;
	search?: string | null;
	page: number;
	pageSize: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

interface UseCheckoutsTableProps {
	merchantId: string;
	initialFilters: CheckoutsTableFilters;
}

interface DeleteModalState {
	isOpen: boolean;
	checkoutId: string | null;
	checkoutName: string;
	isDeleting: boolean;
}

type CheckoutPromise = Promise<ApiResponse<CheckoutData>>;

interface DetailsModalState {
	isOpen: boolean;
	checkoutPromise: CheckoutPromise | null;
}

const emptyPaginated: Paginated<MinimalCheckout> = {
	items: [],
	totalItems: 0,
	page: 1,
	pageSize: 10,
	totalPages: 0,
};

const initialDeleteModal: DeleteModalState = {
	isOpen: false,
	checkoutId: null,
	checkoutName: '',
	isDeleting: false,
};

const initialDetailsModal: DetailsModalState = {
	isOpen: false,
	checkoutPromise: null,
};

export function useCheckoutsTable({ merchantId, initialFilters }: UseCheckoutsTableProps) {
	const router = useRouter();

	const [filters, setFilters] = useState<CheckoutsTableFilters>(initialFilters);
	const [checkouts, setCheckouts] = useState<Paginated<MinimalCheckout>>(emptyPaginated);
	const [fetchedFiltersKey, setFetchedFiltersKey] = useState<string>('');
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	const [deleteModal, setDeleteModal] = useState<DeleteModalState>(initialDeleteModal);
	const [detailsModal, setDetailsModal] = useState<DetailsModalState>(initialDetailsModal);

	const currentFiltersKey = JSON.stringify({ ...filters, refreshTrigger });
	const isLoading = fetchedFiltersKey !== currentFiltersKey;

	useEffect(() => {
		const key = currentFiltersKey;

		listMerchantCheckouts(merchantId, {
			environment: filters.environment,
			status: filters.status ?? undefined,
			templateType: filters.templateType ?? undefined,
			search: filters.search ?? undefined,
			page: filters.page,
			pageSize: filters.pageSize,
			sortBy: filters.sortBy,
			sortOrder: filters.sortOrder,
		}).then((response) => {
			if (response?.data) {
				setCheckouts(response.data);
			}
			setFetchedFiltersKey(key);
		});
	}, [merchantId, currentFiltersKey, filters]);

	const updateFilters = useCallback((updates: Partial<CheckoutsTableFilters>) => {
		setFilters((prev) => ({
			...prev,
			...updates,
			page: 'page' in updates ? (updates.page ?? 1) : 1,
		}));
	}, []);

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

	const hasFilters =
		filters.status !== undefined ||
		filters.templateType !== undefined ||
		(filters.search !== undefined && filters.search !== null && filters.search !== '');

	const goToNew = useCallback(() => {
		router.push(Routes.panel.merchant.checkoutsUpsert('new'));
	}, [router]);

	const goToEdit = useCallback(
		(checkoutId: string) => {
			router.push(Routes.panel.merchant.checkoutsUpsert(checkoutId));
		},
		[router]
	);

	const goToView = useCallback(
		(checkoutId: string) => {
			setDetailsModal({
				isOpen: true,
				checkoutPromise: getMerchantCheckout(merchantId, checkoutId),
			});
		},
		[merchantId]
	);

	const closeDetailsModal = useCallback(() => {
		setDetailsModal(initialDetailsModal);
	}, []);

	const copyLink = useCallback((url: string) => {
		void navigator.clipboard.writeText(url).catch(() => undefined);
		toast('Link copiado', {
			description: 'O link foi copiado para a área de transferência.',
			variant: 'success',
			indicator: createElement(Icon, { icon: Copy01Icon, className: 'icon-sm' }),
		});
	}, []);

	const shareLink = useCallback(
		(name: string, url: string) => {
			if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
				void navigator
					.share({
						title: name,
						text: `Confira este checkout: ${name}`,
						url,
					})
					.catch(() => undefined);
				return;
			}

			copyLink(url);
		},
		[copyLink]
	);

	const openLink = useCallback((url: string) => {
		if (!url) return;
		window.open(url, '_blank', 'noopener,noreferrer');
	}, []);

	const openDeleteModal = useCallback((checkoutId: string, checkoutName: string) => {
		setDeleteModal({
			isOpen: true,
			checkoutId,
			checkoutName,
			isDeleting: false,
		});
	}, []);

	const closeDeleteModal = useCallback(() => {
		setDeleteModal(initialDeleteModal);
	}, []);

	const confirmDelete = useCallback(async () => {
		if (!deleteModal.checkoutId) return;

		setDeleteModal((prev) => ({ ...prev, isDeleting: true }));

		const res = await deleteMerchantCheckout(merchantId, deleteModal.checkoutId);

		if (res?.error) {
			toast('Erro ao excluir checkout', {
				description: res.error.message ?? 'Tente novamente.',
				variant: 'danger',
				indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
			});
			setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
		} else {
			toast('Checkout excluído', {
				description: res?.message ?? 'O checkout foi excluído com sucesso.',
				variant: 'success',
				indicator: createElement(Icon, { icon: CheckmarkCircle02Icon, className: 'icon-sm' }),
			});
			closeDeleteModal();
			refresh();
		}
	}, [merchantId, deleteModal.checkoutId, closeDeleteModal, refresh]);

	return {
		data: {
			checkouts,
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
				checkoutPromise: detailsModal.checkoutPromise,
				close: closeDetailsModal,
			},
			delete: {
				isOpen: deleteModal.isOpen,
				checkoutName: deleteModal.checkoutName,
				isDeleting: deleteModal.isDeleting,
				open: openDeleteModal,
				close: closeDeleteModal,
				confirm: confirmDelete,
			},
		},
		actions: {
			goToNew,
			goToEdit,
			goToView,
			copyLink,
			shareLink,
			openLink,
		},
	};
}

