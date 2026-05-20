'use client';

import { useState, useCallback, useEffect, createElement } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { CheckmarkCircle02Icon, CancelCircleIcon } from '@hugeicons/core-free-icons';
import { listMerchantCoupons, getMerchantCoupon, deleteMerchantCoupon } from '@/app/actions/merchant/coupons';
import { Routes } from '@/router/routes';
import type { MinimalCoupon, CouponData } from '@/types/merchant/coupons';
import type { Paginated, ApiResponse } from '@/types/common';
import type { CouponStatus, CouponDiscountType, PaymentEnvironment } from '@/types/enums';
import { PaymentEnvironment as PaymentEnv } from '@/types/enums';

export interface CouponsTableFilters {
	environment?: PaymentEnvironment;
	status?: CouponStatus | null;
	discountType?: CouponDiscountType | null;
	search?: string | null;
	page?: number;
	pageSize?: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

interface UseCouponsTableProps {
	merchantId: string;
	initialFilters: CouponsTableFilters;
}

type CouponDetailsPromise = Promise<ApiResponse<CouponData>>;

interface DetailsModalState {
	isOpen: boolean;
	couponPromise: CouponDetailsPromise | null;
}

interface DeleteModalState {
	isOpen: boolean;
	couponId: string | null;
	couponCode: string;
	isDeleting: boolean;
}

const initialDetailsModal: DetailsModalState = {
	isOpen: false,
	couponPromise: null,
};

const initialDeleteModal: DeleteModalState = {
	isOpen: false,
	couponId: null,
	couponCode: '',
	isDeleting: false,
};

const defaultPaginated: Paginated<MinimalCoupon> = {
	items: [],
	totalItems: 0,
	page: 1,
	pageSize: 10,
	totalPages: 0,
};

export function useCouponsTable({ merchantId, initialFilters }: UseCouponsTableProps) {
	const router = useRouter();

	const [filters, setFilters] = useState<CouponsTableFilters>(initialFilters);
	const [coupons, setCoupons] = useState<Paginated<MinimalCoupon>>(defaultPaginated);
	const [detailsModal, setDetailsModal] = useState<DetailsModalState>(initialDetailsModal);
	const [deleteModal, setDeleteModal] = useState<DeleteModalState>(initialDeleteModal);

	const [refreshTrigger, setRefreshTrigger] = useState(0);
	const [fetchedFiltersKey, setFetchedFiltersKey] = useState<string | null>(null);

	const currentFiltersKey = JSON.stringify(filters) + refreshTrigger;
	const isLoading = fetchedFiltersKey !== currentFiltersKey;

	const hasFilters =
		filters.status !== undefined ||
		filters.discountType !== undefined ||
		filters.search !== undefined;

	useEffect(() => {
		let cancelled = false;
		const key = currentFiltersKey;

		listMerchantCoupons(merchantId, filters).then((res) => {
			if (!cancelled) {
				setCoupons(res?.data ?? defaultPaginated);
				setFetchedFiltersKey(key);
			}
		});

		return () => {
			cancelled = true;
		};
	}, [merchantId, filters, currentFiltersKey]);

	const updateFilters = useCallback(
		(newParams: Partial<CouponsTableFilters>) => {
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

	// Details Modal
	const openDetailsModal = useCallback(
		(couponId: string) => {
			setDetailsModal({
				isOpen: true,
				couponPromise: getMerchantCoupon(merchantId, couponId),
			});
		},
		[merchantId],
	);

	const closeDetailsModal = useCallback(() => {
		setDetailsModal(initialDetailsModal);
	}, []);

	// Delete Modal
	const openDeleteModal = useCallback((couponId: string, couponCode: string) => {
		setDeleteModal({
			isOpen: true,
			couponId,
			couponCode,
			isDeleting: false,
		});
	}, []);

	const closeDeleteModal = useCallback(() => {
		setDeleteModal(initialDeleteModal);
	}, []);

	const confirmDelete = useCallback(async () => {
		if (!deleteModal.couponId) return;

		setDeleteModal((prev) => ({ ...prev, isDeleting: true }));

		const res = await deleteMerchantCoupon(merchantId, deleteModal.couponId);

		if (res?.error) {
			toast('Erro ao excluir cupom', {
				description: res.error.message ?? 'Tente novamente.',
				variant: 'danger',
				indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
			});
			setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
		} else {
			toast('Cupom excluído', {
				description: res?.message ?? 'O cupom foi excluído com sucesso.',
				variant: 'success',
				indicator: createElement(Icon, { icon: CheckmarkCircle02Icon, className: 'icon-sm' }),
			});
			closeDeleteModal();
			refresh();
		}
	}, [merchantId, deleteModal.couponId, closeDeleteModal, refresh]);

	// Navigation Actions
	const goToNew = useCallback(() => {
		router.push(Routes.panel.merchant.couponsUpsert());
	}, [router]);

	const goToEdit = useCallback(
		(couponId: string) => {
			router.push(Routes.panel.merchant.couponsUpsert(couponId));
		},
		[router],
	);

	return {
		data: {
			coupons,
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
				couponPromise: detailsModal.couponPromise,
				open: openDetailsModal,
				close: closeDetailsModal,
			},
			delete: {
				isOpen: deleteModal.isOpen,
				couponCode: deleteModal.couponCode,
				isDeleting: deleteModal.isDeleting,
				open: openDeleteModal,
				close: closeDeleteModal,
				confirm: confirmDelete,
			},
		},
		actions: {
			goToNew,
			goToEdit,
		},
		context: {
			merchantId,
			environment: filters.environment ?? PaymentEnv.Sandbox,
		},
	};
}

