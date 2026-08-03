'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
	AdminPlatformPayoutData,
	AdminPreviewPlatformPayoutData,
	AdminPlatformPayoutAccountData,
} from '@/types/admin/platform-payouts';
import type { AdminPlatformSettingsData } from '@/types/admin/platform-settings';
import type { ApiResponse, Paginated } from '@/types/common';
import type { AutomaticCashoutFrequency, PlatformPayoutStatus } from '@/types/enums';
import {
	adminListPlatformPayouts,
	adminGetPlatformPayout,
	adminPreviewPlatformPayout,
	adminListPlatformPayoutAccounts,
} from '@/app/actions/admin/platform-payouts';
import { adminGetPlatformSettings } from '@/app/actions/admin/platform-settings';
import { useEnvironment } from '@/contexts/environment-context';

type PayoutPromise = Promise<ApiResponse<AdminPlatformPayoutData>>;

interface FiltersState {
	status: PlatformPayoutStatus | 'all';
	pageSize: string;
	page: number;
}

interface DetailsModalState {
	isOpen: boolean;
	payoutId: string | null;
	payoutPromise: PayoutPromise | null;
}

interface NewPayoutModalState {
	isOpen: boolean;
	availabilityPromise: Promise<ApiResponse<AdminPreviewPlatformPayoutData>> | null;
	accountsPromise: Promise<ApiResponse<Paginated<AdminPlatformPayoutAccountData>>> | null;
}

interface AutomaticConfigModalState {
	isOpen: boolean;
	settingsPromise: Promise<ApiResponse<AdminPlatformSettingsData>> | null;
	accountsPromise: Promise<ApiResponse<Paginated<AdminPlatformPayoutAccountData>>> | null;
}

const initialFilters: FiltersState = {
	status: 'all',
	pageSize: '10',
	page: 1,
};

const initialDetailsModal: DetailsModalState = {
	isOpen: false,
	payoutId: null,
	payoutPromise: null,
};

const initialNewPayoutModal: NewPayoutModalState = {
	isOpen: false,
	availabilityPromise: null,
	accountsPromise: null,
};

const initialAutomaticConfigModal: AutomaticConfigModalState = {
	isOpen: false,
	settingsPromise: null,
	accountsPromise: null,
};

export function usePlatformPayoutsTable() {
	const { environment } = useEnvironment();

	const [data, setData] = useState<Paginated<AdminPlatformPayoutData> | null>(null);
	const [fetchedParams, setFetchedParams] = useState<string | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [filters, setFilters] = useState<FiltersState>(initialFilters);
	const [detailsModal, setDetailsModal] = useState<DetailsModalState>(initialDetailsModal);
	const [newPayoutModal, setNewPayoutModal] = useState<NewPayoutModalState>(initialNewPayoutModal);
	const [automaticConfigModal, setAutomaticConfigModal] = useState<AutomaticConfigModalState>(initialAutomaticConfigModal);
	const [automaticCashoutSettings, setAutomaticCashoutSettings] = useState<AdminPlatformSettingsData | null>(null);
	const [isAutomaticCashoutLoading, setIsAutomaticCashoutLoading] = useState(true);

	const currentParams = JSON.stringify({
		environment,
		status: filters.status,
		page: filters.page,
		pageSize: filters.pageSize,
		refreshKey,
	});

	const isLoading = fetchedParams !== currentParams;
	const pageSizeValue = Number(filters.pageSize) || 10;

	const items = data ?? {
		items: [],
		totalItems: 0,
		page: filters.page,
		pageSize: pageSizeValue,
		totalPages: 0,
	};

	const hasFilters = !!(filters.status !== 'all' || filters.pageSize !== '10');

	const loadAutomaticCashoutSettings = useCallback(async () => {
		setIsAutomaticCashoutLoading(true);
		const response = await adminGetPlatformSettings();
		setAutomaticCashoutSettings(response?.data ?? null);
		setIsAutomaticCashoutLoading(false);
	}, []);

	useEffect(() => {
		let cancelled = false;

		adminGetPlatformSettings().then((response) => {
			if (!cancelled) {
				setAutomaticCashoutSettings(response?.data ?? null);
				setIsAutomaticCashoutLoading(false);
			}
		});

		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		if (fetchedParams === currentParams) return;

		let cancelled = false;
		const requestStatus = filters.status === 'all' ? undefined : filters.status;

		adminListPlatformPayouts({
			page: filters.page,
			pageSize: pageSizeValue,
			status: requestStatus,
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
	}, [environment, filters.status, filters.page, pageSizeValue, currentParams, fetchedParams, refreshKey, isRefreshing]);

	const handleStatusChange = useCallback((key: string) => {
		const newStatus = (key || 'all') as PlatformPayoutStatus | 'all';
		setFilters((prev) => ({ ...prev, status: newStatus, page: 1 }));
	}, []);

	const handlePageSizeChange = useCallback((key: string) => {
		const newPageSize = key || '10';
		setFilters((prev) => ({ ...prev, pageSize: newPageSize, page: 1 }));
	}, []);

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

	const openDetails = useCallback((payoutId: string) => {
		setDetailsModal({
			isOpen: true,
			payoutId,
			payoutPromise: adminGetPlatformPayout(payoutId),
		});
	}, []);

	const closeDetails = useCallback(() => {
		setDetailsModal(initialDetailsModal);
	}, []);

	const handleDetailsReprocessed = useCallback(() => {
		closeDetails();
		handleRefresh();
	}, [closeDetails, handleRefresh]);

	const openNewPayout = useCallback(() => {
		setNewPayoutModal({
			isOpen: true,
			availabilityPromise: adminPreviewPlatformPayout({ includeAllAcquirers: true }),
			accountsPromise: adminListPlatformPayoutAccounts({ page: 1, pageSize: 100 }),
		});
	}, []);

	const closeNewPayout = useCallback(() => {
		setNewPayoutModal(initialNewPayoutModal);
	}, []);

	const handlePayoutCreated = useCallback(() => {
		closeNewPayout();
		handleRefresh();
	}, [closeNewPayout, handleRefresh]);

	const openAutomaticConfig = useCallback(() => {
		setAutomaticConfigModal({
			isOpen: true,
			settingsPromise: adminGetPlatformSettings(),
			accountsPromise: adminListPlatformPayoutAccounts({ page: 1, pageSize: 100 }),
		});
	}, []);

	const closeAutomaticConfig = useCallback(() => {
		setAutomaticConfigModal(initialAutomaticConfigModal);
	}, []);

	const handleAutomaticConfigSaved = useCallback(() => {
		closeAutomaticConfig();
		loadAutomaticCashoutSettings();
	}, [closeAutomaticConfig, loadAutomaticCashoutSettings]);

	return {
		data: {
			items,
			isLoading,
			isRefreshing,
			pageSizeValue,
		},
		automaticCashout: {
			isLoading: isAutomaticCashoutLoading,
			isEnabled: automaticCashoutSettings?.isAutomaticCashoutEnabled ?? false,
			frequency: (automaticCashoutSettings?.automaticCashoutFrequency ?? 'Daily') as AutomaticCashoutFrequency,
			nextAttemptAt: automaticCashoutSettings?.nextAutomaticCashoutAttemptAt ?? null,
		},
		filters: {
			values: filters,
			hasFilters,
			handleStatusChange,
			handlePageSizeChange,
			handlePageChange,
			handleClearFilters,
			handleRefresh,
		},
		modals: {
			details: {
				isOpen: detailsModal.isOpen,
				payoutPromise: detailsModal.payoutPromise,
				close: closeDetails,
				onReprocessed: handleDetailsReprocessed,
			},
			newPayout: {
				isOpen: newPayoutModal.isOpen,
				close: closeNewPayout,
				onCreated: handlePayoutCreated,
				availabilityPromise: newPayoutModal.availabilityPromise,
				accountsPromise: newPayoutModal.accountsPromise,
			},
			automaticConfig: {
				isOpen: automaticConfigModal.isOpen,
				close: closeAutomaticConfig,
				onSaved: handleAutomaticConfigSaved,
				settingsPromise: automaticConfigModal.settingsPromise,
				accountsPromise: automaticConfigModal.accountsPromise,
			},
		},
		actions: {
			openDetails,
			openNewPayout,
			openAutomaticConfig,
		},
	};
}

