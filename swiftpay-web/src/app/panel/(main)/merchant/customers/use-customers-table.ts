'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCustomer, listMerchantCustomers } from '@/app/actions/merchant/customers';
import { listMerchantPayments } from '@/app/actions/merchant/payments';
import { useEnvironment } from '@/contexts/environment-context';
import { useDebounce } from '@/hooks/use-debounce';
import { Routes } from '@/router/routes';
import type { MinimalCustomer, CustomerData } from '@/types/merchant/customers';
import type { MinimalPayment } from '@/types/merchant/payments';
import type { Paginated, ApiResponse } from '@/types/common';
import { CustomerStatus } from '@/types/enums';

type CustomerPromise = Promise<ApiResponse<CustomerData>>;
type CustomersData = Paginated<MinimalCustomer>;
type PaymentsPromise = Promise<ApiResponse<Paginated<MinimalPayment>>>;

interface FiltersState {
	search: string;
	status: CustomerStatus | 'all';
	pageSize: string;
	page: number;
	sortBy: string;
	sortOrder: 'asc' | 'desc';
}

interface DetailsModalState {
	isOpen: boolean;
	customerPromise: CustomerPromise | null;
	customerId: string | null;
	paymentsPromise: PaymentsPromise | null;
}

interface DeleteModalState {
	isOpen: boolean;
	customer: MinimalCustomer | null;
}

interface UseCustomersTableProps {
	merchantId: string;
	readOnly?: boolean;
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
	customerPromise: null,
	customerId: null,
	paymentsPromise: null,
};

const initialDeleteModal: DeleteModalState = {
	isOpen: false,
	customer: null,
};

export function useCustomersTable({ merchantId, readOnly = false }: UseCustomersTableProps) {
	const router = useRouter();
	const { environment } = useEnvironment();

	// Filters state
	const [filters, setFilters] = useState<FiltersState>(initialFilters);
	const debouncedSearch = useDebounce(filters.search);

	// Data state
	const [data, setData] = useState<CustomersData | null>(null);
	const [fetchedParams, setFetchedParams] = useState<string | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);
	const [isRefreshing, setIsRefreshing] = useState(false);

	// Modals state
	const [detailsModal, setDetailsModal] = useState<DetailsModalState>(initialDetailsModal);
	const [deleteModal, setDeleteModal] = useState<DeleteModalState>(initialDeleteModal);

	// Derived values
	const currentParams = JSON.stringify({
		merchantId,
		environment,
		status: filters.status,
		search: debouncedSearch,
		page: filters.page,
		pageSize: filters.pageSize,
		sortBy: filters.sortBy,
		sortOrder: filters.sortOrder,
		refreshKey,
	});
	const isLoading = fetchedParams !== currentParams;
	const pageSizeValue = Number(filters.pageSize) || 10;
	const customers = data ?? {
		items: [],
		totalItems: 0,
		page: filters.page,
		pageSize: pageSizeValue,
		totalPages: 0,
	};
	const hasFilters = filters.status !== 'all' || filters.pageSize !== '10' || filters.search.trim() !== '';

	// Data fetching
	useEffect(() => {
		if (fetchedParams === currentParams) return;

		let cancelled = false;
		const requestStatus = filters.status === 'all' ? undefined : filters.status;
		const requestSearch = debouncedSearch.trim() === '' ? undefined : debouncedSearch.trim();

		listMerchantCustomers(merchantId, {
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

	// Filter handlers
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
		const newStatus = (key || 'all') as CustomerStatus | 'all';
		updateFilter('status', newStatus);
	}, [updateFilter]);

	const handlePageSizeChange = useCallback((key: string) => {
		const newPageSize = key || '10';
		updateFilter('pageSize', newPageSize);
	}, [updateFilter]);

	const handlePageChange = useCallback((nextPage: number) => {
		updateFilter('page', nextPage);
	}, [updateFilter]);

	const handleClearFilters = useCallback(() => {
		setFilters(initialFilters);
	}, []);

	const handleRefresh = useCallback(() => {
		setIsRefreshing(true);
		setRefreshKey((value) => value + 1);
	}, []);

	// Details modal handlers
	const openDetailsModal = useCallback((customerId: string) => {
		setDetailsModal({
			isOpen: true,
			customerPromise: getCustomer(merchantId, customerId),
			customerId,
			paymentsPromise: listMerchantPayments(merchantId, {
				customerId,
				page: 1,
				pageSize: 10,
			}),
		});
	}, [merchantId]);

	const closeDetailsModal = useCallback(() => {
		setDetailsModal(initialDetailsModal);
	}, []);

	const loadPaymentsPage = useCallback((page: number) => {
		setDetailsModal((prev) => {
			if (!prev.customerId) return prev;
			return {
				...prev,
				paymentsPromise: listMerchantPayments(merchantId, {
					customerId: prev.customerId,
					page,
					pageSize: 10,
				}),
			};
		});
	}, [merchantId]);

	// Delete modal handlers
	const openDeleteModal = useCallback((customer: MinimalCustomer) => {
		setDeleteModal({
			isOpen: true,
			customer,
		});
	}, []);

	const closeDeleteModal = useCallback(() => {
		setDeleteModal(initialDeleteModal);
	}, []);

	const handleDeleteSuccess = useCallback(() => {
		closeDeleteModal();
		handleRefresh();
	}, [closeDeleteModal, handleRefresh]);

	// Navigation handlers
	const handleEditCustomer = useCallback((customerId: string) => {
		router.push(Routes.panel.merchant.customersUpsert(customerId));
	}, [router]);

	const handleCreateCustomer = useCallback(() => {
		router.push(Routes.panel.merchant.customersUpsert());
	}, [router]);

	return {
		data: {
			customers,
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
				customerPromise: detailsModal.customerPromise,
				customerId: detailsModal.customerId,
				paymentsPromise: detailsModal.paymentsPromise,
				open: openDetailsModal,
				close: closeDetailsModal,
				loadPaymentsPage,
			},
			delete: {
				isOpen: deleteModal.isOpen,
				customer: deleteModal.customer,
				open: openDeleteModal,
				close: closeDeleteModal,
				onSuccess: handleDeleteSuccess,
			},
		},
		actions: {
			editCustomer: handleEditCustomer,
			createCustomer: handleCreateCustomer,
		},
		context: {
			merchantId,
			readOnly,
		},
	};
}

