'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { adminListTemplates, adminGetTemplate } from '@/app/actions/admin/templates';
import { Routes } from '@/router/routes';
import type { AdminMinimalTemplate, AdminTemplateData } from '@/types/admin/templates';
import type { Paginated, ApiResponse } from '@/types/common';
import type { CheckoutTemplateType } from '@/types/enums';

export interface TemplatesTableFilters {
	search?: string | null;
	type?: CheckoutTemplateType | null;
	isActive?: boolean | null;
	isFree?: boolean | null;
	page: number;
	pageSize: number;
}

interface UseTemplatesTableProps {
	initialFilters: TemplatesTableFilters;
}

type TemplatePromise = Promise<ApiResponse<AdminTemplateData>>;

interface DetailsModalState {
	isOpen: boolean;
	templatePromise: TemplatePromise | null;
}

const emptyPaginated: Paginated<AdminMinimalTemplate> = {
	items: [],
	totalItems: 0,
	page: 1,
	pageSize: 10,
	totalPages: 0,
};

const initialDetailsModal: DetailsModalState = {
	isOpen: false,
	templatePromise: null,
};

export function useTemplatesTable({ initialFilters }: UseTemplatesTableProps) {
	const router = useRouter();

	const [filters, setFilters] = useState<TemplatesTableFilters>(initialFilters);
	const [templates, setTemplates] = useState<Paginated<AdminMinimalTemplate>>(emptyPaginated);
	const [fetchedFiltersKey, setFetchedFiltersKey] = useState<string>('');
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	const [detailsModal, setDetailsModal] = useState<DetailsModalState>(initialDetailsModal);

	const currentFiltersKey = JSON.stringify({ ...filters, refreshTrigger });
	const isLoading = fetchedFiltersKey !== currentFiltersKey;

	useEffect(() => {
		const key = currentFiltersKey;

		adminListTemplates({
			search: filters.search ?? undefined,
			type: filters.type ?? undefined,
			isActive: filters.isActive ?? undefined,
			isFree: filters.isFree ?? undefined,
			page: filters.page,
			pageSize: filters.pageSize,
		}).then((response) => {
			if (response?.data) {
				setTemplates(response.data);
			}
			setFetchedFiltersKey(key);
		});
	}, [currentFiltersKey, filters]);

	const updateFilters = useCallback((updates: Partial<TemplatesTableFilters>) => {
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
		filters.isActive !== undefined ||
		filters.isFree !== undefined ||
		filters.type !== undefined
	);

	const goToNew = useCallback(() => {
		router.push(Routes.panel.admin.templatesUpsert());
	}, [router]);

	const goToEdit = useCallback(
		(templateId: string) => {
			router.push(Routes.panel.admin.templatesUpsert(templateId));
		},
		[router]
	);

	const openDetailsModal = useCallback((templateId: string) => {
		setDetailsModal({
			isOpen: true,
			templatePromise: adminGetTemplate(templateId),
		});
	}, []);

	const closeDetailsModal = useCallback(() => {
		setDetailsModal(initialDetailsModal);
	}, []);

	return {
		data: {
			templates,
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
				templatePromise: detailsModal.templatePromise,
				open: openDetailsModal,
				close: closeDetailsModal,
			},
		},
		actions: {
			goToNew,
			goToEdit,
		},
	};
}

