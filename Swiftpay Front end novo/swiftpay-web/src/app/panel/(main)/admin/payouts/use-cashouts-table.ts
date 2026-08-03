'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminMinimalCashout, AdminCashoutDetails } from '@/types/admin/cashouts';
import type { AdminMinimalMerchant } from '@/types/admin/merchants';
import type { AdminAcquirerData } from '@/types/admin/acquirers';
import type { ApiResponse, Paginated } from '@/types/common';
import { MerchantKycStatus, PayoutStatus } from '@/types/enums';
import { adminGetCashout, adminListCashouts } from '@/app/actions/admin/cashouts';
import { adminListMerchants } from '@/app/actions/admin/merchants';
import { adminListAcquirers } from '@/app/actions/admin/acquirers';
import { useEnvironment } from '@/contexts/environment-context';
import { useDebounce } from '@/hooks/use-debounce';
import { Routes } from '@/router/routes';

type CashoutPromise = Promise<ApiResponse<AdminCashoutDetails>>;

interface FiltersState {
	search: string;
	status: PayoutStatus | 'all';
	sortBy: string;
	sortOrder: 'asc' | 'desc';
	pageSize: string;
	page: number;
	merchantId: string | null;
	merchantSearch: string;
	acquirerId: string | null;
	acquirerSearch: string;
}

interface DetailsModalState {
	isOpen: boolean;
	cashoutPromise: CashoutPromise | null;
}

interface EvaluateModalState {
	isOpen: boolean;
	cashout: AdminMinimalCashout | null;
}

interface MerchantSearchState {
	options: AdminMinimalMerchant[];
	isLoading: boolean;
	selected: AdminMinimalMerchant | null;
}

interface AcquirerSearchState {
	options: AdminAcquirerData[];
	isLoading: boolean;
	selected: AdminAcquirerData | null;
}

const initialFilters: FiltersState = {
	search: '',
	status: 'all',
	sortBy: 'requestedAt',
	sortOrder: 'desc',
	pageSize: '10',
	page: 1,
	merchantId: null,
	merchantSearch: '',
	acquirerId: null,
	acquirerSearch: '',
};

const initialDetailsModal: DetailsModalState = {
	isOpen: false,
	cashoutPromise: null,
};

const initialEvaluateModal: EvaluateModalState = {
	isOpen: false,
	cashout: null,
};

const initialMerchantSearch: MerchantSearchState = {
	options: [],
	isLoading: false,
	selected: null,
};

const initialAcquirerSearch: AcquirerSearchState = {
	options: [],
	isLoading: false,
	selected: null,
};

export function useCashoutsTable() {
	const router = useRouter();
	const { environment } = useEnvironment();

	const [data, setData] = useState<Paginated<AdminMinimalCashout> | null>(null);
	const [fetchedParams, setFetchedParams] = useState<string | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [filters, setFilters] = useState<FiltersState>(initialFilters);
	const [detailsModal, setDetailsModal] = useState<DetailsModalState>(initialDetailsModal);
	const [evaluateModal, setEvaluateModal] = useState<EvaluateModalState>(initialEvaluateModal);
	const [merchantSearch, setMerchantSearch] = useState<MerchantSearchState>(initialMerchantSearch);
	const [acquirerSearch, setAcquirerSearch] = useState<AcquirerSearchState>(initialAcquirerSearch);

	const debouncedSearch = useDebounce(filters.search);
	const debouncedMerchantSearch = useDebounce(filters.merchantSearch);
	const debouncedAcquirerSearch = useDebounce(filters.acquirerSearch);

	const currentParams = JSON.stringify({
		environment,
		search: debouncedSearch,
		status: filters.status,
		sortBy: filters.sortBy,
		sortOrder: filters.sortOrder,
		page: filters.page,
		pageSize: filters.pageSize,
		refreshKey,
		merchantId: filters.merchantId,
		acquirerId: filters.acquirerId,
	});

	const isLoading = fetchedParams !== currentParams;
	const pageSizeValue = Number(filters.pageSize) || 10;
	const isMerchantSearchActive = filters.merchantSearch.trim().length > 0;
	const isAcquirerSearchActive = filters.acquirerSearch.trim().length > 0;
	const merchantOptionsToShow = isMerchantSearchActive ? merchantSearch.options : [];
	const acquirerOptionsToShow = isAcquirerSearchActive ? acquirerSearch.options : [];

	const items = data ?? {
		items: [],
		totalItems: 0,
		page: filters.page,
		pageSize: pageSizeValue,
		totalPages: 0,
	};

	const hasFilters = !!(
		filters.search.trim() !== '' ||
		filters.status !== 'all' ||
		filters.pageSize !== '10' ||
		filters.merchantId ||
		filters.acquirerId
	);

	// Data fetching effect
	useEffect(() => {
		if (fetchedParams === currentParams) return;

		let cancelled = false;
		const requestStatus = filters.status === 'all' ? undefined : filters.status;
		const requestSearch = debouncedSearch.trim() === '' ? undefined : debouncedSearch.trim();

		adminListCashouts({
			page: filters.page,
			pageSize: pageSizeValue,
			sortBy: filters.sortBy,
			sortOrder: filters.sortOrder,
			status: requestStatus,
			search: requestSearch,
			merchantId: filters.merchantId,
			acquirerId: filters.acquirerId,
			environment,
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
	}, [
		environment,
		debouncedSearch,
		filters.status,
		filters.sortBy,
		filters.sortOrder,
		filters.page,
		pageSizeValue,
		currentParams,
		fetchedParams,
		refreshKey,
		isRefreshing,
		filters.merchantId,
		filters.acquirerId,
	]);

	// Merchant search effect
	useEffect(() => {
		const trimmedSearch = debouncedMerchantSearch.trim();
		if (trimmedSearch.length < 1) {
			return;
		}

		let cancelled = false;

		Promise.resolve().then(() => {
			if (!cancelled) {
				setMerchantSearch((prev) => ({ ...prev, isLoading: true }));
			}
		});

		adminListMerchants({
			search: trimmedSearch,
			page: 1,
			pageSize: 10,
			kycStatus: MerchantKycStatus.Approved,
		}).then((response) => {
			if (!cancelled) {
				setMerchantSearch((prev) => ({
					...prev,
					options: response?.data?.items ?? [],
					isLoading: false,
				}));
			}
		});

		return () => {
			cancelled = true;
		};
	}, [debouncedMerchantSearch]);

	// Acquirer search effect
	useEffect(() => {
		const trimmedSearch = debouncedAcquirerSearch.trim();
		if (trimmedSearch.length < 1) {
			return;
		}

		let cancelled = false;

		Promise.resolve().then(() => {
			if (!cancelled) {
				setAcquirerSearch((prev) => ({ ...prev, isLoading: true }));
			}
		});

		adminListAcquirers({
			search: trimmedSearch,
			page: 1,
			pageSize: 10,
			isActive: true,
		}).then((response) => {
			if (!cancelled) {
				setAcquirerSearch((prev) => ({
					...prev,
					options: response?.data?.items ?? [],
					isLoading: false,
				}));
			}
		});

		return () => {
			cancelled = true;
		};
	}, [debouncedAcquirerSearch]);

	// Filter handlers
	const updateFilter = useCallback(<K extends keyof FiltersState>(key: K, value: FiltersState[K]) => {
		setFilters((prev) => ({
			...prev,
			[key]: value,
			page: key === 'page' ? (value as number) : 1,
		}));
	}, []);

	const handleSearchChange = useCallback(
		(value: string) => {
			updateFilter('search', value);
		},
		[updateFilter]
	);

	const handleStatusChange = useCallback(
		(key: string) => {
			const newStatus = (key || 'all') as PayoutStatus | 'all';
			updateFilter('status', newStatus);
		},
		[updateFilter]
	);

	const handlePageSizeChange = useCallback(
		(key: string) => {
			const newPageSize = key || '10';
			updateFilter('pageSize', newPageSize);
		},
		[updateFilter]
	);

	const handleMerchantSearchChange = useCallback((value: string) => {
		setFilters((prev) => ({ ...prev, merchantSearch: value }));
		if (value.trim().length < 1) {
			setMerchantSearch((prev) => ({
				...prev,
				options: [],
				isLoading: false,
			}));
		}
	}, []);

	const handleMerchantChange = useCallback(
		(key: string | null) => {
			const nextMerchant = merchantSearch.options.find((m) => m.id === key) ?? null;
			setFilters((prev) => ({
				...prev,
				merchantId: key,
				merchantSearch: key ? prev.merchantSearch : '',
				page: 1,
			}));
			setMerchantSearch((prev) => ({ ...prev, selected: nextMerchant }));
		},
		[merchantSearch.options]
	);

	const handleAcquirerSearchChange = useCallback((value: string) => {
		setFilters((prev) => ({ ...prev, acquirerSearch: value }));
		if (value.trim().length < 1) {
			setAcquirerSearch((prev) => ({
				...prev,
				options: [],
				isLoading: false,
			}));
		}
	}, []);

	const handleAcquirerChange = useCallback(
		(key: string | null) => {
			const nextAcquirer = acquirerSearch.options.find((a) => a.id === key) ?? null;
			setFilters((prev) => ({
				...prev,
				acquirerId: key,
				acquirerSearch: key ? prev.acquirerSearch : '',
				page: 1,
			}));
			setAcquirerSearch((prev) => ({ ...prev, selected: nextAcquirer }));
		},
		[acquirerSearch.options]
	);

	const handlePageChange = useCallback((nextPage: number) => {
		setFilters((prev) => ({ ...prev, page: nextPage }));
	}, []);

	const handleClearFilters = useCallback(() => {
		setFilters(initialFilters);
		setMerchantSearch(initialMerchantSearch);
		setAcquirerSearch(initialAcquirerSearch);
	}, []);

	const handleRefresh = useCallback(() => {
		setIsRefreshing(true);
		setRefreshKey((v) => v + 1);
	}, []);

	// Details modal handlers
	const openDetails = useCallback((cashoutId: string) => {
		setDetailsModal({
			isOpen: true,
			cashoutPromise: adminGetCashout(cashoutId),
		});
	}, []);

	const closeDetails = useCallback(() => {
		setDetailsModal(initialDetailsModal);
	}, []);

	// Evaluate modal handlers
	const openEvaluate = useCallback((cashout: AdminMinimalCashout) => {
		setEvaluateModal({
			isOpen: true,
			cashout,
		});
	}, []);

	const closeEvaluate = useCallback(() => {
		setEvaluateModal(initialEvaluateModal);
	}, []);

	const handleEvaluated = useCallback(() => {
		closeEvaluate();
		handleRefresh();
	}, [closeEvaluate, handleRefresh]);

	// Navigation
	const viewMerchant = useCallback(
		(merchantId: string) => {
			router.push(Routes.panel.admin.merchantDetails(merchantId));
		},
		[router]
	);

	return {
		data: {
			items,
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
		merchantFilter: {
			options: merchantOptionsToShow,
			isLoading: isMerchantSearchActive && merchantSearch.isLoading,
			selected: merchantSearch.selected,
			isMerchantSearchActive,
			handleSearchChange: handleMerchantSearchChange,
			handleChange: handleMerchantChange,
		},
		acquirerFilter: {
			options: acquirerOptionsToShow,
			isLoading: isAcquirerSearchActive && acquirerSearch.isLoading,
			selected: acquirerSearch.selected,
			isAcquirerSearchActive,
			handleSearchChange: handleAcquirerSearchChange,
			handleChange: handleAcquirerChange,
		},
		modals: {
			details: {
				isOpen: detailsModal.isOpen,
				cashoutPromise: detailsModal.cashoutPromise,
				close: closeDetails,
			},
			evaluate: {
				isOpen: evaluateModal.isOpen,
				cashout: evaluateModal.cashout,
				close: closeEvaluate,
				onEvaluated: handleEvaluated,
			},
		},
		actions: {
			openDetails,
			openEvaluate,
			viewMerchant,
		},
	};
}
