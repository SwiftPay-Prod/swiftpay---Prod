'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '@/contexts/admin-context';
import { adminGetDashboard } from '@/app/actions/admin/dashboard';
import type { AdminDashboardData, AdminDashboardFilters, AdminDashboardPeriod } from '@/types/admin/dashboard';

const ADMIN_DASHBOARD_PERIOD_STORAGE_KEY = 'safefy_admin_dashboard_period';
const ADMIN_DASHBOARD_CUSTOM_START_STORAGE_KEY = 'safefy_admin_dashboard_custom_start';
const ADMIN_DASHBOARD_CUSTOM_END_STORAGE_KEY = 'safefy_admin_dashboard_custom_end';

export const ADMIN_PERIOD_OPTIONS: { key: AdminDashboardPeriod; label: string }[] = [
	{ key: 'today', label: 'Hoje' },
	{ key: 'yesterday', label: 'Ontem' },
	{ key: '7d', label: 'Últimos 7 dias' },
	{ key: '14d', label: 'Últimos 14 dias' },
	{ key: '30d', label: 'Últimos 30 dias' },
	{ key: '90d', label: 'Últimos 90 dias' },
	{ key: 'this_week', label: 'Esta semana' },
	{ key: 'this_month', label: 'Este mês' },
	{ key: 'all', label: 'Todo o período' },
	{ key: 'custom', label: 'Período personalizado' },
];

const DEFAULT_GROWTH: AdminDashboardData['growth'] = {
	volumeGrowth: null,
	totalFeesGrowth: null,
	totalAcquirerFeesGrowth: null,
	netRevenueGrowth: null,
	netMarginGrowth: null,
	transactionsGrowth: null,
	approvalRateGrowth: null,
	failedRateGrowth: null,
	payoutAmountGrowth: null,
	payoutsGrowth: null,
	usersGrowth: null,
	merchantsGrowth: null,
	activeUsersGrowth: null,
	activeMerchantsGrowth: null,
	pendingKycGrowth: null,
	newUsersGrowth: null,
	newMerchantsGrowth: null,
	registrationsGrowth: null,
	growthComparisonLabel: null,
};

function formatIsoDate(date: Date): string {
	const year = date.getFullYear();
	const month = `${date.getMonth() + 1}`.padStart(2, '0');
	const day = `${date.getDate()}`.padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function getDefaultCustomRange(): { startDate: string; endDate: string } {
	const endDate = new Date();
	const startDate = new Date();
	startDate.setDate(endDate.getDate() - 6);

	return {
		startDate: formatIsoDate(startDate),
		endDate: formatIsoDate(endDate),
	};
}

function getStoredPeriod(): AdminDashboardPeriod {
	if (typeof window === 'undefined') {
		return 'this_week';
	}

	const stored = localStorage.getItem(ADMIN_DASHBOARD_PERIOD_STORAGE_KEY);
	if (stored && ADMIN_PERIOD_OPTIONS.some((opt) => opt.key === stored)) {
		return stored as AdminDashboardPeriod;
	}

	return 'this_week';
}

function getStoredCustomRange(): { startDate: string; endDate: string } {
	if (typeof window === 'undefined') {
		return getDefaultCustomRange();
	}

	const defaultRange = getDefaultCustomRange();
	const startDate = localStorage.getItem(ADMIN_DASHBOARD_CUSTOM_START_STORAGE_KEY) ?? defaultRange.startDate;
	const endDate = localStorage.getItem(ADMIN_DASHBOARD_CUSTOM_END_STORAGE_KEY) ?? defaultRange.endDate;

	return { startDate, endDate };
}

function getPeriodLabel(period: AdminDashboardPeriod): string {
	return ADMIN_PERIOD_OPTIONS.find((option) => option.key === period)?.label ?? 'Período';
}

export function useAdminDashboard() {
	const { dashboardRefreshKey, triggerDashboardRefresh } = useAdmin();
	const [data, setData] = useState<AdminDashboardData | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [fetchedKey, setFetchedKey] = useState<{ key: number; filters: AdminDashboardFilters } | null>(null);
	const [activeSection, setActiveSection] = useState<string>('overview');
	const [selectedPeriod, setSelectedPeriod] = useState<AdminDashboardPeriod>(getStoredPeriod);
	const [customRange, setCustomRange] = useState<{ startDate: string; endDate: string }>(getStoredCustomRange);

	const currentFilters: AdminDashboardFilters =
		selectedPeriod === 'custom'
			? {
					period: 'custom',
					startDate: customRange.startDate,
					endDate: customRange.endDate,
			  }
			: {
					period: selectedPeriod,
			  };

	const filtersKey = JSON.stringify(currentFilters);

	const isLoading = data === null && error === null;
	const isRefreshing =
		data !== null &&
		fetchedKey !== null &&
		(fetchedKey.key !== dashboardRefreshKey || JSON.stringify(fetchedKey.filters) !== filtersKey);

	useEffect(() => {
		const shouldRefetch =
			!fetchedKey ||
			fetchedKey.key !== dashboardRefreshKey ||
			JSON.stringify(fetchedKey.filters) !== filtersKey;

		if (!shouldRefetch) return;

		let cancelled = false;

		adminGetDashboard(currentFilters).then((response) => {
			if (cancelled) return;

			if (response?.error) {
				setError(response.error.message);
			} else if (response?.data) {
				const fallbackPeriod = currentFilters.period ?? 'this_week';
				const fallbackPeriodInfo = {
					period: fallbackPeriod,
					startDate: currentFilters.startDate ?? customRange.startDate,
					endDate: currentFilters.endDate ?? customRange.endDate,
					label: getPeriodLabel(fallbackPeriod),
				};

				setData({
					...response.data,
					periodInfo: response.data.periodInfo ?? fallbackPeriodInfo,
					growth: response.data.growth ?? DEFAULT_GROWTH,
				});
				setError(null);
			}
			setFetchedKey({ key: dashboardRefreshKey, filters: currentFilters });
		});

		return () => {
			cancelled = true;
		};
	}, [dashboardRefreshKey, fetchedKey, filtersKey, selectedPeriod, customRange.startDate, customRange.endDate]);

	function handleRefresh() {
		triggerDashboardRefresh();
	}

	function handlePeriodChange(period: AdminDashboardPeriod) {
		setSelectedPeriod(period);
		localStorage.setItem(ADMIN_DASHBOARD_PERIOD_STORAGE_KEY, period);
	}

	function handleCustomRangeChange(startDate: string, endDate: string) {
		setCustomRange({ startDate, endDate });
		localStorage.setItem(ADMIN_DASHBOARD_CUSTOM_START_STORAGE_KEY, startDate);
		localStorage.setItem(ADMIN_DASHBOARD_CUSTOM_END_STORAGE_KEY, endDate);
	}

	return {
		data,
		error,
		isLoading,
		activeSection,
		setActiveSection,
		isRefreshing,
		handleRefresh,
		period: {
			selected: selectedPeriod,
			options: ADMIN_PERIOD_OPTIONS,
			change: handlePeriodChange,
			customRange,
			setCustomRange: handleCustomRangeChange,
		},
	};
}

