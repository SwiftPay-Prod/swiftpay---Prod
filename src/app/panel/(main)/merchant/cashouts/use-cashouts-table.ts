'use client';

import { useCallback, useEffect, useState, createElement } from 'react';
import { useEnvironment } from '@/contexts/environment-context';
import { useDebounce } from '@/hooks/use-debounce';
import { listCashouts, getCashout, simulateCashout } from '@/app/actions/merchant/cashouts';
import { listCashoutAccounts } from '@/app/actions/merchant/cashout-accounts';
import { getMerchantBalance } from '@/app/actions/merchant/balance';
import { toast } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { CheckmarkCircle02Icon, CancelCircleIcon } from '@hugeicons/core-free-icons';
import { simulateCashoutActionParse } from '@/parse';
import { PayoutAccountStatus, PayoutStatus, SimulateCashoutAction } from '@/types/enums';
import type { CashoutListItem, CashoutDetailData } from '@/types/merchant/cashouts';
import type { ListCashoutAccountsData } from '@/types/merchant/cashout-accounts';
import type { ReadBalanceData } from '@/types/merchant/balance';
import type { ApiResponse, Paginated } from '@/types/common';

type CashoutPromise = Promise<ApiResponse<CashoutDetailData>>;
type DependenciesPromise = Promise<[ApiResponse<ListCashoutAccountsData>, ApiResponse<ReadBalanceData>]>;
type CashoutsData = Paginated<CashoutListItem>;

interface FiltersState {
	search: string;
	status: PayoutStatus | 'all';
	payoutAccountId: string | null;
	payoutAccountSearch: string;
	pageSize: string;
	page: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

interface PayoutAccountsState {
	items: ListCashoutAccountsData['items'];
	isLoading: boolean;
}

interface DetailsModalState {
	isOpen: boolean;
	cashoutPromise: CashoutPromise | null;
}

interface CreateModalState {
	isOpen: boolean;
	dependenciesPromise: DependenciesPromise | null;
}

interface CancelModalState {
	isOpen: boolean;
	cashout: CashoutListItem | null;
}

interface ActionState {
	simulatingCashoutId: string | null;
	isRefreshing: boolean;
}

const initialFilters: FiltersState = {
	search: '',
	status: 'all',
	payoutAccountId: null,
	payoutAccountSearch: '',
	pageSize: '10',
	page: 1,
	sortBy: undefined,
	sortOrder: undefined,
};

const initialPayoutAccounts: PayoutAccountsState = {
	items: [],
	isLoading: false,
};

const initialDetailsModal: DetailsModalState = {
	isOpen: false,
	cashoutPromise: null,
};

const initialCreateModal: CreateModalState = {
	isOpen: false,
	dependenciesPromise: null,
};

const initialCancelModal: CancelModalState = {
	isOpen: false,
	cashout: null,
};

const initialAction: ActionState = {
	simulatingCashoutId: null,
	isRefreshing: false,
};

interface UseCashoutsTableProps {
	merchantId: string;
	readOnly?: boolean;
}

export function useCashoutsTable({ merchantId, readOnly = false }: UseCashoutsTableProps) {
	const { environment, isSandboxVisible } = useEnvironment();

	const [filters, setFilters] = useState<FiltersState>(initialFilters);
	const [payoutAccountsState, setPayoutAccountsState] = useState<PayoutAccountsState>(initialPayoutAccounts);
	const [detailsModal, setDetailsModal] = useState<DetailsModalState>(initialDetailsModal);
	const [createModal, setCreateModal] = useState<CreateModalState>(initialCreateModal);
	const [cancelModal, setCancelModal] = useState<CancelModalState>(initialCancelModal);
	const [actionState, setActionState] = useState<ActionState>(initialAction);

	const [data, setData] = useState<CashoutsData | null>(null);
	const [fetchedParams, setFetchedParams] = useState<string | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);

	const debouncedSearch = useDebounce(filters.search);

	const pageSizeValue = Number(filters.pageSize) || 10;
	const currentParams = JSON.stringify({
		merchantId,
		environment,
		status: filters.status,
		page: filters.page,
		pageSize: filters.pageSize,
		refreshKey,
		search: debouncedSearch,
		payoutAccountId: filters.payoutAccountId,
		sortBy: filters.sortBy,
		sortOrder: filters.sortOrder,
	});

	const isLoading = fetchedParams !== currentParams;
	const items = data ?? { items: [], totalItems: 0, page: filters.page, pageSize: pageSizeValue, totalPages: 0 };

	const payoutAccountSearchLower = filters.payoutAccountSearch.trim().toLowerCase();
	const payoutAccountsFiltered = payoutAccountsState.items.filter((account) => {
		if (!payoutAccountSearchLower) return true;
		return (
			account.pixKey.toLowerCase().includes(payoutAccountSearchLower) ||
			(account.holderName?.toLowerCase().includes(payoutAccountSearchLower) ?? false) ||
			(account.bankName?.toLowerCase().includes(payoutAccountSearchLower) ?? false)
		);
	});
	const selectedPayoutAccount = payoutAccountsState.items.find((account) => account.id === filters.payoutAccountId) ?? null;

	const hasFilters =
		filters.status !== 'all' ||
		filters.pageSize !== '10' ||
		filters.search.trim() !== '' ||
		filters.payoutAccountId !== null;

	useEffect(() => {
		if (fetchedParams === currentParams) return;

		let cancelled = false;

		const requestStatus = filters.status === 'all' ? undefined : filters.status;
		const requestSearch = debouncedSearch.trim() === '' ? undefined : debouncedSearch.trim();

		listCashouts(merchantId, {
			status: requestStatus,
			search: requestSearch,
			payoutAccountId: filters.payoutAccountId,
			environment,
			page: filters.page,
			pageSize: pageSizeValue,
			sortBy: filters.sortBy,
			sortOrder: filters.sortOrder,
		}).then((response) => {
			if (!cancelled) {
				setData(response?.data ?? null);
				setFetchedParams(currentParams);
				if (actionState.isRefreshing) {
					setActionState((prev) => ({ ...prev, isRefreshing: false }));
				}
			}
		});

		return () => {
			cancelled = true;
		};
	}, [merchantId, environment, filters.status, filters.page, pageSizeValue, currentParams, fetchedParams, refreshKey, actionState.isRefreshing, debouncedSearch, filters.payoutAccountId, filters.sortBy, filters.sortOrder]);

	useEffect(() => {
		let cancelled = false;
		Promise.resolve().then(() => {
			if (!cancelled) {
				setPayoutAccountsState((prev) => ({ ...prev, isLoading: true }));
			}
		});

		listCashoutAccounts(merchantId).then((response) => {
			if (!cancelled) {
				setPayoutAccountsState({
					items: response?.data?.items ?? [],
					isLoading: false,
				});
			}
		});

		return () => {
			cancelled = true;
		};
	}, [merchantId]);

	const updateFilter = useCallback(<K extends keyof FiltersState>(key: K, value: FiltersState[K]) => {
		setFilters((prev) => ({
			...prev,
			[key]: value,
			page: key === 'page' ? (value as number) : 1,
		}));
	}, []);

	const clearFilters = useCallback(() => {
		setFilters(initialFilters);
	}, []);

	const refresh = useCallback(() => {
		setActionState((prev) => ({ ...prev, isRefreshing: true }));
		setRefreshKey((v) => v + 1);
	}, []);

	const openDetailsModal = useCallback(
		(cashoutId: string) => {
			setDetailsModal({
				isOpen: true,
				cashoutPromise: getCashout(merchantId, cashoutId),
			});
		},
		[merchantId]
	);

	const closeDetailsModal = useCallback(() => {
		setDetailsModal(initialDetailsModal);
	}, []);

	const openCreateModal = useCallback(() => {
		setCreateModal({
			isOpen: true,
			dependenciesPromise: Promise.all([
				listCashoutAccounts(merchantId, { statuses: [PayoutAccountStatus.Active] }),
				getMerchantBalance(merchantId),
			]),
		});
	}, [merchantId]);

	const closeCreateModal = useCallback(() => {
		setCreateModal(initialCreateModal);
	}, []);

	const handleCreateSuccess = useCallback(() => {
		closeCreateModal();
		refresh();
	}, [closeCreateModal, refresh]);

	const openCancelModal = useCallback((cashout: CashoutListItem) => {
		setCancelModal({
			isOpen: true,
			cashout,
		});
	}, []);

	const closeCancelModal = useCallback(() => {
		setCancelModal(initialCancelModal);
	}, []);

	const handleCancelSuccess = useCallback(() => {
		closeCancelModal();
		refresh();
	}, [closeCancelModal, refresh]);

	const simulate = useCallback(
		async (cashoutId: string, action: SimulateCashoutAction) => {
			setActionState((prev) => ({ ...prev, simulatingCashoutId: cashoutId }));
			const response = await simulateCashout(merchantId, cashoutId, action);
			setActionState((prev) => ({ ...prev, simulatingCashoutId: null }));

			if (response?.error) {
				toast('Erro ao simular saque', {
					description: response.error.message ?? 'Tente novamente.',
					variant: 'danger',
					indicator: createElement(Icon, { icon: CancelCircleIcon, className: 'icon-sm' }),
				});
			} else {
				toast('Simulação realizada', {
					description: `Saque ${simulateCashoutActionParse[action].label.toLowerCase()} com sucesso.`,
					variant: 'success',
					indicator: createElement(Icon, { icon: CheckmarkCircle02Icon, className: 'icon-sm' }),
				});
				refresh();
			}
		},
		[merchantId, refresh]
	);

	const canCancel = useCallback(
		(cashout: CashoutListItem) => !readOnly && cashout.status === 'Pending',
		[readOnly]
	);

	const canSimulate = useCallback(
		(cashout: CashoutListItem) => !readOnly && isSandboxVisible && (cashout.status === 'Pending' || cashout.status === 'Processing'),
		[readOnly, isSandboxVisible]
	);

	return {
		data: {
			items,
			isLoading,
			isRefreshing: actionState.isRefreshing,
			pageSizeValue,
		},
		filters: {
			values: filters,
			hasFilters,
			updateFilter,
			clear: clearFilters,
		},
		payoutAccounts: {
			items: payoutAccountsFiltered,
			selected: selectedPayoutAccount,
			isLoading: payoutAccountsState.isLoading,
		},
		modals: {
			details: {
				isOpen: detailsModal.isOpen,
				cashoutPromise: detailsModal.cashoutPromise,
				open: openDetailsModal,
				close: closeDetailsModal,
			},
			create: {
				isOpen: createModal.isOpen,
				dependenciesPromise: createModal.dependenciesPromise,
				open: openCreateModal,
				close: closeCreateModal,
				onSuccess: handleCreateSuccess,
			},
			cancel: {
				isOpen: cancelModal.isOpen,
				cashout: cancelModal.cashout,
				open: openCancelModal,
				close: closeCancelModal,
				onSuccess: handleCancelSuccess,
			},
		},
		actions: {
			refresh,
			simulate,
			canCancel,
			canSimulate,
			simulatingCashoutId: actionState.simulatingCashoutId,
		},
		context: {
			merchantId,
			readOnly,
		},
	};
}

