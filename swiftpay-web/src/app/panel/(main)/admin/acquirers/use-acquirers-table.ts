'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { adminListAcquirers } from '@/app/actions/admin/acquirers';
import { Routes } from '@/router/routes';
import type { AdminAcquirerData } from '@/types/admin/acquirers';
import type { Paginated } from '@/types/common';
import type { ProviderCategory } from '@/types/enums';

export interface AcquirersTableFilters {
	search?: string | null;
	isActive?: boolean | null;
	providerCategory?: ProviderCategory | null;
	page: number;
	pageSize: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

interface UseAcquirersTableProps {
	initialFilters: AcquirersTableFilters;
}

const emptyPaginated: Paginated<AdminAcquirerData> = {
	items: [],
	totalItems: 0,
	page: 1,
	pageSize: 10,
	totalPages: 0,
};

export function useAcquirersTable({ initialFilters }: UseAcquirersTableProps) {
	const router = useRouter();

	const [filters, setFilters] = useState<AcquirersTableFilters>(initialFilters);
	const [acquirers, setAcquirers] = useState<Paginated<AdminAcquirerData>>(emptyPaginated);
	const [fetchedFiltersKey, setFetchedFiltersKey] = useState<string>('');
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	const currentFiltersKey = JSON.stringify({ ...filters, refreshTrigger });
	const isLoading = fetchedFiltersKey !== currentFiltersKey;

	useEffect(() => {
		const key = currentFiltersKey;

		adminListAcquirers({
			search: filters.search ?? undefined,
			isActive: filters.isActive ?? undefined,
			providerCategory: filters.providerCategory ?? undefined,
			page: filters.page,
			pageSize: filters.pageSize,
			sortBy: filters.sortBy,
			sortOrder: filters.sortOrder,
		}).then((response) => {
			if (response?.data) {
				setAcquirers(response.data);
			}
			setFetchedFiltersKey(key);
		});
	}, [currentFiltersKey, filters]);

	const updateFilters = useCallback((updates: Partial<AcquirersTableFilters>) => {
		setFilters((prev) => ({
			...prev,
			...updates,
			page: 'page' in updates ? (updates.page ?? 1) : 1,
		}));
	}, []);

	const clearFilters = useCallback(() => {
		setFilters((prev) => ({
			page: 1,
			pageSize: prev.pageSize,
		}));
	}, []);

	const refresh = useCallback(() => {
		setRefreshTrigger((prev) => prev + 1);
	}, []);

	const hasFilters = !!(
		(filters.search !== undefined && filters.search !== null && filters.search !== '') ||
		filters.isActive === false ||
		(filters.providerCategory !== undefined && filters.providerCategory !== null)
	);

	const goToDetails = useCallback(
		(acquirerId: string) => {
			router.push(Routes.panel.admin.acquirerDetails(acquirerId));
		},
		[router]
	);

	return {
		data: {
			acquirers,
			isLoading,
		},
		filters: {
			values: filters,
			hasFilters,
			update: updateFilters,
			clear: clearFilters,
			refresh,
		},
		actions: {
			goToDetails,
		},
	};
}

