'use client';

import { useCallback, useEffect, useState, createElement } from 'react';
import { toast } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { CheckmarkCircle02Icon, CancelCircleIcon } from '@hugeicons/core-free-icons';
import {
	listMerchantPayments,
	getMerchantPayment,
	resendWebhook,
} from '@/app/actions/merchant/payments';
import { getMerchantFees } from '@/app/actions/merchant/settings';
import { useEnvironment } from '@/contexts/environment-context';
import { useDebounce } from '@/hooks/use-debounce';
import { PaymentStatus } from '@/types/enums';
import type { MinimalPayment, PaymentDetails } from '@/types/merchant/payments';
import type { Paginated, ApiResponse } from '@/types/common';
import type { FeesPromise } from './modals/create-transaction-modal';

type PaymentsData = Paginated<MinimalPayment>;
type PaymentPromise = Promise<ApiResponse<PaymentDetails>>;

interface FiltersState {
	search: string;
	status: PaymentStatus | 'all';
	pageSize: string;
	page: number;
	sortBy: string;
	sortOrder: 'asc' | 'desc';
}

interface DetailsModalState {
	isOpen: boolean;
	paymentPromise: PaymentPromise | null;
}

interface CreateModalState {
	isOpen: boolean;
	feesPromise: FeesPromise | null;
}

interface ActionState {
	resendingWebhookId: string | null;
}

const initialFilters: FiltersState = {
	search: '',
	status: 'all',
	pageSize: '10',
	page: 1,
	sortBy: 'createdAt',
	sortOrder: 'desc',
};

const initialDetailsModal: DetailsModalState = {
	isOpen: false,
	paymentPromise: null,
};

const initialCreateModal: CreateModalState = {
	isOpen: false,
	feesPromise: null,
};

const initialActionState: ActionState = {
	resendingWebhookId: null,
};

interface UseTransactionsTableOptions {
	merchantId: string;
	readOnly?: boolean;
}

export function useTransactionsTable({ merchantId, readOnly = false }: UseTransactionsTableOptions) {
	const { environment } = useEnvironment();

	const [data, setData] = useState<PaymentsData | null>(null);
	const [fetchedParams, setFetchedParams] = useState<string | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [filters, setFilters] = useState<FiltersState>(initialFilters);
	const [detailsModal, setDetailsModal] = useState<DetailsModalState>(initialDetailsModal);
	const [createModal, setCreateModal] = useState<CreateModalState>(initialCreateModal);
	const [actionState, setActionState] = useState<ActionState>(initialActionState);

	const debouncedSearch = useDebounce(filters.search);

	const currentParams = JSON.stringify({
		merchantId,
		environment,
		status: filters.status,
		page: filters.page,
		pageSize: filters.pageSize,
		sortBy: filters.sortBy,
		sortOrder: filters.sortOrder,
		refreshKey,
		search: debouncedSearch,
	});

	const isLoading = fetchedParams !== currentParams;
	const pageSizeValue = Number(filters.pageSize) || 10;

	const payments = data ?? {
		items: [],
		totalItems: 0,
		page: filters.page,
		pageSize: pageSizeValue,
		totalPages: 0,
	};

	const hasFilters =
		filters.status !== 'all' ||
		filters.pageSize !== '10' ||
		filters.search.trim() !== '';

	useEffect(() => {
		if (fetchedParams === currentParams) return;

		let cancelled = false;

		const requestStatus = filters.status === 'all' ? undefined : filters.status;
		const requestSearch = debouncedSearch.trim() === '' ? undefined : debouncedSearch.trim();

		listMerchantPayments(merchantId, {
			status: requestStatus,
			search: requestSearch,
			environment,
			page: filters.page,
			pageSize: pageSizeValue,
			sortBy: filters.sortBy,
			sortOrder: filters.sortOrder,
		}).then((response) => {
			if (!cancelled) {
				setData(response?.data ?? null);
				setFetchedParams(currentParams);
				if (isRefreshing) {
					setIsRefreshing(false);
				}
			}
		});

		return () => {
			cancelled = true;
		};
	}, [merchantId, environment, filters.status, filters.page, filters.sortBy, filters.sortOrder, pageSizeValue, currentParams, fetchedParams, refreshKey, isRefreshing, debouncedSearch]);

	const updateFilter = useCallback(<K extends keyof FiltersState>(key: K, value: FiltersState[K]) => {
		setFilters((prev) => ({
			...prev,
			[key]: value,
			page: key === 'page' ? (value as number) : 1,
		}));
	}, []);

	const handleSearchChange = useCallback((value: string) => {
		updateFilter('search', value);
	}, [updateFilter]);

	const handleStatusChange = useCallback((key: string) => {
		const nextStatus = (key || 'all') as PaymentStatus | 'all';
		updateFilter('status', nextStatus);
	}, [updateFilter]);

	const handlePageSizeChange = useCallback((key: string) => {
		const nextPageSize = key || '10';
		updateFilter('pageSize', nextPageSize);
	}, [updateFilter]);

	const handlePageChange = useCallback((nextPage: number) => {
		setFilters((prev) => ({ ...prev, page: nextPage }));
	}, []);

	const handleClearFilters = useCallback(() => {
		setFilters(initialFilters);
	}, []);

	const handleRefresh = useCallback(() => {
		setIsRefreshing(true);
		setRefreshKey((v) => v + 1);
	}, []);

	const openDetails = useCallback((paymentId: string) => {
		setDetailsModal({
			isOpen: true,
			paymentPromise: getMerchantPayment(merchantId, paymentId),
		});
	}, [merchantId]);

	const closeDetails = useCallback((open: boolean) => {
		setDetailsModal(open ? detailsModal : initialDetailsModal);
	}, [detailsModal]);

	const openCreate = useCallback(() => {
		setCreateModal({
			isOpen: true,
			feesPromise: getMerchantFees(merchantId),
		});
	}, [merchantId]);

	const closeCreate = useCallback((open: boolean) => {
		setCreateModal(open ? createModal : initialCreateModal);
	}, [createModal]);

	const handleCreateSuccess = useCallback(() => {
		setCreateModal(initialCreateModal);
		handleRefresh();
	}, [handleRefresh]);

	const handleResendWebhook = useCallback(async (payment: MinimalPayment) => {
		setActionState((prev) => ({ ...prev, resendingWebhookId: payment.id }));
		const res = await resendWebhook(merchantId, payment.id);
		setActionState((prev) => ({ ...prev, resendingWebhookId: null }));

		if (res?.error) {
			toast('Erro ao reenviar', {
				description: res.error.message ?? 'Erro ao reenviar webhook',
				variant: 'danger',
				indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
			});
		} else {
			toast('Webhook enfileirado', {
				description: res?.message ?? 'Webhook enfileirado para reenvio com sucesso',
				variant: 'success',
				indicator: createElement(Icon, { icon: CheckmarkCircle02Icon, className: 'icon-sm' }),
			});
			handleRefresh();
		}
	}, [merchantId, handleRefresh]);

	const canResendWebhook = useCallback((payment: MinimalPayment) => {
		return !readOnly && payment.status === PaymentStatus.Completed && payment.hasCallbackUrl;
	}, [readOnly]);

	return {
		data: {
			payments,
			isLoading,
			isRefreshing,
			pageSizeValue,
		},
		filters: {
			values: filters,
			hasFilters,
			updateFilter,
			handleSearchChange,
			handleStatusChange,
			handlePageSizeChange,
			handlePageChange,
			handleClearFilters,
			handleRefresh,
		},
		modals: {
			details: {
				isOpen: detailsModal.isOpen,
				paymentPromise: detailsModal.paymentPromise,
				close: closeDetails,
			},
			create: {
				isOpen: createModal.isOpen,
				feesPromise: createModal.feesPromise,
				open: openCreate,
				close: closeCreate,
				onSuccess: handleCreateSuccess,
			},
		},
		actions: {
			openDetails,
			handleResendWebhook,
			resendingWebhookId: actionState.resendingWebhookId,
			canResendWebhook,
		},
		context: {
			merchantId,
			readOnly,
		},
	};
}
