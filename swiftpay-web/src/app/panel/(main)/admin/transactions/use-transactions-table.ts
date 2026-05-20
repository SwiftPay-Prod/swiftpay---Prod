'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminMinimalMerchant } from '@/types/admin/merchants';
import type { AdminMinimalTransaction, AdminTransactionDetails } from '@/types/admin/transactions';
import type { AdminAcquirerData } from '@/types/admin/acquirers';
import type { ApiResponse, Paginated } from '@/types/common';
import { MerchantKycStatus, type PaymentMethod, type PaymentStatus } from '@/types/enums';
import { useEnvironment } from '@/contexts/environment-context';
import { useDebounce } from '@/hooks/use-debounce';
import { adminGetTransaction, adminListTransactions } from '@/app/actions/admin/transactions';
import { adminListMerchants } from '@/app/actions/admin/merchants';
import { adminListAcquirers } from '@/app/actions/admin/acquirers';
import { Routes } from '@/router/routes';
import { formatDocument } from '@/utils/input-masks';

type TransactionPromise = Promise<ApiResponse<AdminTransactionDetails>>;

interface FiltersState {
	search: string;
	status: PaymentStatus | 'all';
	method: PaymentMethod | 'all';
	pageSize: string;
	page: number;
	merchantId: string | null;
	acquirerId: string | null;
}

interface MerchantComboboxState {
	search: string;
	options: AdminMinimalMerchant[];
	isLoading: boolean;
	selected: AdminMinimalMerchant | null;
}

interface AcquirerComboboxState {
	search: string;
	options: AdminAcquirerData[];
	isLoading: boolean;
	selected: AdminAcquirerData | null;
}

interface ModalState {
	isOpen: boolean;
	transactionPromise: TransactionPromise | null;
}

const initialFilters: FiltersState = {
	search: '',
	status: 'all',
	method: 'all',
	pageSize: '10',
	page: 1,
	merchantId: null,
	acquirerId: null,
};

const initialMerchantCombobox: MerchantComboboxState = {
	search: '',
	options: [],
	isLoading: false,
	selected: null,
};

const initialAcquirerCombobox: AcquirerComboboxState = {
	search: '',
	options: [],
	isLoading: false,
	selected: null,
};

const initialModal: ModalState = {
	isOpen: false,
	transactionPromise: null,
};

function getAcquirerDisplayName(acquirer: { displayName?: string | null; name: string }): string {
	return acquirer.displayName?.trim() || acquirer.name;
}

export function useTransactionsTable() {
	const router = useRouter();
	const { environment } = useEnvironment();

	const [filters, setFilters] = useState<FiltersState>(initialFilters);
	const [merchantCombobox, setMerchantCombobox] = useState<MerchantComboboxState>(initialMerchantCombobox);
	const [acquirerCombobox, setAcquirerCombobox] = useState<AcquirerComboboxState>(initialAcquirerCombobox);
	const [modal, setModal] = useState<ModalState>(initialModal);

	const [data, setData] = useState<Paginated<AdminMinimalTransaction> | null>(null);
	const [fetchedParams, setFetchedParams] = useState<string | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);
	const [isRefreshing, setIsRefreshing] = useState(false);

	const debouncedSearch = useDebounce(filters.search);
	const debouncedMerchantSearch = useDebounce(merchantCombobox.search);
	const debouncedAcquirerSearch = useDebounce(acquirerCombobox.search);

	const currentParams = JSON.stringify({
		environment,
		search: debouncedSearch,
		status: filters.status,
		method: filters.method,
		page: filters.page,
		pageSize: filters.pageSize,
		refreshKey,
		merchantId: filters.merchantId,
		acquirerId: filters.acquirerId,
	});

	const isLoading = fetchedParams !== currentParams;
	const pageSizeValue = Number(filters.pageSize) || 10;
	const isMerchantSearchActive = merchantCombobox.search.trim().length > 0;
	const isAcquirerSearchActive = acquirerCombobox.search.trim().length > 0;

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
		filters.method !== 'all' ||
		filters.pageSize !== '10' ||
		filters.merchantId ||
		filters.acquirerId
	);

	useEffect(() => {
		if (fetchedParams === currentParams) return;

		let cancelled = false;
		const requestStatus = filters.status === 'all' ? undefined : filters.status;
		const requestMethod = filters.method === 'all' ? undefined : filters.method;
		const requestSearch = debouncedSearch.trim() === '' ? undefined : debouncedSearch.trim();

		adminListTransactions({
			page: filters.page,
			pageSize: pageSizeValue,
			status: requestStatus,
			method: requestMethod,
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
	}, [currentParams, fetchedParams, isRefreshing, debouncedSearch, filters, pageSizeValue, environment]);

	useEffect(() => {
		const trimmedSearch = debouncedMerchantSearch.trim();
		if (trimmedSearch.length < 1) return;

		let cancelled = false;
		Promise.resolve().then(() => {
			if (!cancelled) {
				setMerchantCombobox((prev) => ({ ...prev, isLoading: true }));
			}
		});

		adminListMerchants({
			search: trimmedSearch,
			page: 1,
			pageSize: 10,
			kycStatus: MerchantKycStatus.Approved,
		}).then((response) => {
			if (!cancelled) {
				setMerchantCombobox((prev) => ({
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

	useEffect(() => {
		const trimmedSearch = debouncedAcquirerSearch.trim();
		if (trimmedSearch.length < 1) return;

		let cancelled = false;
		Promise.resolve().then(() => {
			if (!cancelled) {
				setAcquirerCombobox((prev) => ({ ...prev, isLoading: true }));
			}
		});

		adminListAcquirers({
			search: trimmedSearch,
			page: 1,
			pageSize: 10,
			isActive: true,
		}).then((response) => {
			if (!cancelled) {
				setAcquirerCombobox((prev) => ({
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

	const updateFilter = useCallback(<K extends keyof FiltersState>(key: K, value: FiltersState[K]) => {
		setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? (value as number) : 1 }));
	}, []);

	const clearFilters = useCallback(() => {
		setFilters(initialFilters);
		setMerchantCombobox(initialMerchantCombobox);
		setAcquirerCombobox(initialAcquirerCombobox);
	}, []);

	const handleRefresh = useCallback(() => {
		setIsRefreshing(true);
		setRefreshKey((value) => value + 1);
	}, []);

	const openDetails = useCallback((transactionId: string) => {
		setModal({
			isOpen: true,
			transactionPromise: adminGetTransaction(transactionId),
		});
	}, []);

	const closeModal = useCallback(() => {
		setModal(initialModal);
	}, []);

	const viewMerchant = useCallback(
		(merchantId: string) => {
			router.push(Routes.panel.admin.merchantDetails(merchantId));
		},
		[router]
	);

	const handleMerchantSearchChange = useCallback((value: string) => {
		setMerchantCombobox((prev) => {
			if (value.trim().length < 1) {
				return { ...prev, search: value, options: [], isLoading: false };
			}
			return { ...prev, search: value };
		});
	}, []);

	const handleMerchantChange = useCallback(
		(key: string | null) => {
			const nextMerchant = merchantCombobox.options.find((merchant) => merchant.id === key) ?? null;
			setFilters((prev) => ({ ...prev, merchantId: key, page: 1 }));
			setMerchantCombobox((prev) => ({
				...prev,
				selected: nextMerchant,
				search: key ? prev.search : '',
			}));
		},
		[merchantCombobox.options]
	);

	const merchantComboboxOptions = useMemo(() => {
		const optionsToShow = isMerchantSearchActive ? merchantCombobox.options : [];
		return optionsToShow.map((merchant) => ({
			key: merchant.id,
			label: merchant.name ?? 'Sem nome',
			description: merchant.document ? formatDocument(merchant.document) : null,
		}));
	}, [isMerchantSearchActive, merchantCombobox.options]);

	const handleAcquirerSearchChange = useCallback((value: string) => {
		setAcquirerCombobox((prev) => {
			if (value.trim().length < 1) {
				return { ...prev, search: value, options: [], isLoading: false };
			}
			return { ...prev, search: value };
		});
	}, []);

	const handleAcquirerChange = useCallback(
		(key: string | null) => {
			const nextAcquirer = acquirerCombobox.options.find((a) => a.id === key) ?? null;
			setFilters((prev) => ({ ...prev, acquirerId: key, page: 1 }));
			setAcquirerCombobox((prev) => ({
				...prev,
				selected: nextAcquirer,
				search: key ? prev.search : '',
			}));
		},
		[acquirerCombobox.options]
	);

	const acquirerComboboxOptions = useMemo(() => {
		const optionsToShow = isAcquirerSearchActive ? acquirerCombobox.options : [];
		return optionsToShow.map((acquirer) => ({
			key: acquirer.id,
			label: getAcquirerDisplayName(acquirer),
			description: acquirer.nominal ?? acquirer.name,
			logoUrl: acquirer.logoUrl,
		}));
	}, [isAcquirerSearchActive, acquirerCombobox.options]);

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
			clear: clearFilters,
			merchant: {
				search: merchantCombobox.search,
				options: merchantComboboxOptions,
				isLoading: isMerchantSearchActive && merchantCombobox.isLoading,
				selectedName: merchantCombobox.selected?.name,
				onSearchChange: handleMerchantSearchChange,
				onChange: handleMerchantChange,
			},
			acquirer: {
				search: acquirerCombobox.search,
				options: acquirerComboboxOptions,
				rawOptions: acquirerCombobox.options,
				isLoading: isAcquirerSearchActive && acquirerCombobox.isLoading,
				selectedDisplayName: acquirerCombobox.selected ? getAcquirerDisplayName(acquirerCombobox.selected) : undefined,
				onSearchChange: handleAcquirerSearchChange,
				onChange: handleAcquirerChange,
			},
		},
		modal: {
			isOpen: modal.isOpen,
			transactionPromise: modal.transactionPromise,
			close: closeModal,
		},
		actions: {
			refresh: handleRefresh,
			openDetails,
			viewMerchant,
		},
	};
}

