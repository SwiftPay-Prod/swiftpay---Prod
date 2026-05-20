'use client';

import { useState, useEffect, useCallback } from 'react';
import { listBalanceHistory, getBalanceHistoryDetails } from '@/app/actions/merchant/balance-history';
import type { MinimalBalanceHistory, BalanceHistoryDetails } from '@/types/merchant/balance-history';
import type { Paginated, ApiResponse } from '@/types/common';
import type { PaymentEnvironment } from '@/types/enums';

export interface BalanceHistoryTableFilters {
	environment: PaymentEnvironment;
	page: number;
	pageSize: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

interface UseBalanceHistoryTableProps {
	merchantId: string;
	initialFilters: BalanceHistoryTableFilters;
}

type DetailsPromise = Promise<ApiResponse<BalanceHistoryDetails>>;

interface DetailsModalState {
	isOpen: boolean;
	detailsPromise: DetailsPromise | null;
}

const emptyPaginated: Paginated<MinimalBalanceHistory> = {
	items: [],
	totalItems: 0,
	page: 1,
	pageSize: 10,
	totalPages: 0,
};

const initialDetailsModal: DetailsModalState = {
	isOpen: false,
	detailsPromise: null,
};

export function useBalanceHistoryTable({ merchantId, initialFilters }: UseBalanceHistoryTableProps) {
	const [filters, setFilters] = useState<BalanceHistoryTableFilters>(initialFilters);
	const [balanceHistory, setBalanceHistory] = useState<Paginated<MinimalBalanceHistory>>(emptyPaginated);
	const [fetchedFiltersKey, setFetchedFiltersKey] = useState<string>('');
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	const [detailsModal, setDetailsModal] = useState<DetailsModalState>(initialDetailsModal);

	const currentFiltersKey = JSON.stringify({ ...filters, refreshTrigger });
	const isLoading = fetchedFiltersKey !== currentFiltersKey;

	useEffect(() => {
		const key = currentFiltersKey;

		listBalanceHistory(merchantId, {
			environment: filters.environment,
			page: filters.page,
			pageSize: filters.pageSize,
			sortBy: filters.sortBy,
			sortOrder: filters.sortOrder,
		}).then((response) => {
			if (response?.data) {
				setBalanceHistory(response.data);
			}
			setFetchedFiltersKey(key);
		});
	}, [merchantId, currentFiltersKey, filters]);

	const updateFilters = useCallback((updates: Partial<BalanceHistoryTableFilters>) => {
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
			pageSize: 10,
			sortBy: prev.sortBy,
			sortOrder: prev.sortOrder,
		}));
	}, []);

	const refresh = useCallback(() => {
		setRefreshTrigger((prev) => prev + 1);
	}, []);

	const hasFilters = filters.pageSize !== 10;

	const openDetailsModal = useCallback(
		(reconciliationId: string) => {
			setDetailsModal({
				isOpen: true,
				detailsPromise: getBalanceHistoryDetails(merchantId, reconciliationId),
			});
		},
		[merchantId]
	);

	const closeDetailsModal = useCallback(() => {
		setDetailsModal(initialDetailsModal);
	}, []);

	return {
		data: {
			balanceHistory,
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
				detailsPromise: detailsModal.detailsPromise,
				open: openDetailsModal,
				close: closeDetailsModal,
			},
		},
	};
}

