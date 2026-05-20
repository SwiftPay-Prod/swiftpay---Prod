'use client';

import { useState, useCallback, useEffect, createElement } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { CheckmarkCircle02Icon, CancelCircleIcon } from '@hugeicons/core-free-icons';
import { listMerchantOrders, getMerchantOrder, updateOrderFulfillment } from '@/app/actions/merchant/orders';
import { orderFulfillmentStatusParse } from '@/parse';
import { Routes } from '@/router/routes';
import type { MinimalOrder, OrderDetails } from '@/types/merchant/orders';
import type { Paginated, ApiResponse } from '@/types/common';
import type { OrderStatus, OrderFulfillmentStatus, PaymentEnvironment } from '@/types/enums';
import { PaymentEnvironment as PaymentEnv } from '@/types/enums';

export interface OrdersTableFilters {
	environment?: PaymentEnvironment;
	status?: OrderStatus | null;
	fulfillmentStatus?: OrderFulfillmentStatus | null;
	search?: string | null;
	page?: number;
	pageSize?: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

interface UseOrdersTableProps {
	merchantId: string;
	initialFilters: OrdersTableFilters;
}

interface DetailsModalState {
	isOpen: boolean;
	orderPromise: Promise<ApiResponse<OrderDetails>> | null;
}

const initialDetailsModal: DetailsModalState = {
	isOpen: false,
	orderPromise: null,
};

const defaultPaginated: Paginated<MinimalOrder> = {
	items: [],
	totalItems: 0,
	page: 1,
	pageSize: 10,
	totalPages: 0,
};

export function useOrdersTable({ merchantId, initialFilters }: UseOrdersTableProps) {
	const router = useRouter();

	const [filters, setFilters] = useState<OrdersTableFilters>(initialFilters);
	const [orders, setOrders] = useState<Paginated<MinimalOrder>>(defaultPaginated);
	const [detailsModal, setDetailsModal] = useState<DetailsModalState>(initialDetailsModal);

	const [refreshTrigger, setRefreshTrigger] = useState(0);
	const [fetchedFiltersKey, setFetchedFiltersKey] = useState<string | null>(null);
	const [isUpdating, setIsUpdating] = useState(false);

	const currentFiltersKey = JSON.stringify(filters) + refreshTrigger;
	const isLoading = fetchedFiltersKey !== currentFiltersKey || isUpdating;

	const hasFilters =
		filters.status !== undefined ||
		filters.fulfillmentStatus !== undefined ||
		(filters.search?.trim() ?? '') !== '';

	useEffect(() => {
		let cancelled = false;
		const key = currentFiltersKey;

		listMerchantOrders(merchantId, filters).then((res) => {
			if (!cancelled) {
				setOrders(res?.data ?? defaultPaginated);
				setFetchedFiltersKey(key);
			}
		});

		return () => {
			cancelled = true;
		};
	}, [merchantId, filters, currentFiltersKey]);

	const updateFilters = useCallback(
		(newParams: Partial<OrdersTableFilters>) => {
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
	const openDetailsModal = useCallback((orderId: string) => {
		setDetailsModal({
			isOpen: true,
			orderPromise: getMerchantOrder(merchantId, orderId),
		});
	}, [merchantId]);

	const closeDetailsModal = useCallback(() => {
		setDetailsModal(initialDetailsModal);
	}, []);

	// Fulfillment Action
	const changeFulfillment = useCallback(
		async (orderId: string, status: OrderFulfillmentStatus) => {
			setIsUpdating(true);
			const response = await updateOrderFulfillment(merchantId, orderId, status);
			setIsUpdating(false);

			if (response?.error) {
				toast('Erro ao atualizar', {
					description: response.error.message ?? 'Erro ao atualizar status',
					variant: 'danger',
					indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
				});
				return;
			}

			const statusLabel = orderFulfillmentStatusParse[status].label;
			toast('Status atualizado', {
				description: `Status de entrega alterado para "${statusLabel}"`,
				variant: 'success',
				indicator: createElement(Icon, { icon: CheckmarkCircle02Icon, className: 'icon-sm' }),
			});
			refresh();
		},
		[merchantId, refresh],
	);

	// Navigation Actions
	const goToNew = useCallback(() => {
		router.push(Routes.panel.merchant.ordersUpsert());
	}, [router]);

	return {
		data: {
			orders,
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
				orderPromise: detailsModal.orderPromise,
				open: openDetailsModal,
				close: closeDetailsModal,
			},
		},
		actions: {
			goToNew,
			changeFulfillment,
		},
		context: {
			merchantId,
			environment: filters.environment ?? PaymentEnv.Sandbox,
		},
	};
}

