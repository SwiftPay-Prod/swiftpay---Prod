'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMerchant } from '@/contexts/merchant-context';
import { getMerchantDashboard, type DashboardFilters } from '@/app/actions/merchant/dashboard';
import { getMerchantFees } from '@/app/actions/merchant/settings';
import type { ReadMerchantDashboardData, DashboardPeriod } from '@/types/merchant/dashboard';
import {
	DASHBOARD_CUSTOM_END_STORAGE_KEY,
	DASHBOARD_CUSTOM_START_STORAGE_KEY,
	DASHBOARD_PERIOD_OPTIONS,
	DASHBOARD_PERIOD_STORAGE_KEY,
} from './merchant-dashboard.constants';

export const PERIOD_OPTIONS: { key: DashboardPeriod; label: string }[] = [
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

function getStoredPeriod(): DashboardPeriod {
	if (typeof window === 'undefined') {
		return 'this_week';
	}

	const stored = localStorage.getItem(DASHBOARD_PERIOD_STORAGE_KEY);
	if (stored && DASHBOARD_PERIOD_OPTIONS.some((opt) => opt.key === stored)) {
		return stored as DashboardPeriod;
	}
	return 'this_week';
}

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

function getStoredCustomRange(): { startDate: string; endDate: string } {
	if (typeof window === 'undefined') {
		return getDefaultCustomRange();
	}

	const defaultRange = getDefaultCustomRange();
	const startDate = localStorage.getItem(DASHBOARD_CUSTOM_START_STORAGE_KEY) ?? defaultRange.startDate;
	const endDate = localStorage.getItem(DASHBOARD_CUSTOM_END_STORAGE_KEY) ?? defaultRange.endDate;

	return { startDate, endDate };
}

interface UseMerchantDashboardProps {
	merchantId: string;
}

interface MerchantReserveConfig {
	pixReservePercentage: number;
	boletoReservePercentage: number;
	creditCardReservePercentage: number;
}

export function useMerchantDashboard({ merchantId }: UseMerchantDashboardProps) {
	const { dashboardRefreshKey, triggerDashboardRefresh } = useMerchant();

	const [data, setData] = useState<ReadMerchantDashboardData | null>(null);
	const [reserveConfig, setReserveConfig] = useState<MerchantReserveConfig | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [fetchedKey, setFetchedKey] = useState<{ key: number; merchantId: string; filters: DashboardFilters } | null>(
		null
	);
	const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>(getStoredPeriod);
	const [customRange, setCustomRange] = useState<{ startDate: string; endDate: string }>(getStoredCustomRange);

	const currentFilters: DashboardFilters = useMemo(
		() =>
			selectedPeriod === 'custom'
				? {
						startDate: customRange.startDate,
						endDate: customRange.endDate,
					}
				: {
						period: selectedPeriod,
					},
		[selectedPeriod, customRange]
	);

	const filtersKey = JSON.stringify(currentFilters);
	const isLoading = data === null && error === null;
	const hasReserveEnabled =
		(reserveConfig?.pixReservePercentage ?? 0) > 0 ||
		(reserveConfig?.boletoReservePercentage ?? 0) > 0 ||
		(reserveConfig?.creditCardReservePercentage ?? 0) > 0;
	const isRefreshing =
		data !== null &&
		fetchedKey !== null &&
		(fetchedKey.key !== dashboardRefreshKey ||
			fetchedKey.merchantId !== merchantId ||
			JSON.stringify(fetchedKey.filters) !== filtersKey);

	useEffect(() => {
		let cancelled = false;
		setReserveConfig(null);

		getMerchantFees(merchantId).then((response) => {
			if (cancelled || !response?.data) {
				return;
			}

			setReserveConfig({
				pixReservePercentage: response.data.pixReservePercentage,
				boletoReservePercentage: response.data.boletoReservePercentage,
				creditCardReservePercentage: response.data.creditCardReservePercentage,
			});
		});

		return () => {
			cancelled = true;
		};
	}, [merchantId]);

	useEffect(() => {
		const shouldRefetch =
			!fetchedKey ||
			fetchedKey.key !== dashboardRefreshKey ||
			fetchedKey.merchantId !== merchantId ||
			JSON.stringify(fetchedKey.filters) !== filtersKey;

		if (!shouldRefetch) return;

		let cancelled = false;

		getMerchantDashboard(merchantId, currentFilters)
			.then((response) => {
				const resData = response?.data ?? (response && 'kpis' in (response as any) ? (response as any) : null);
				if (resData) {
					setData(resData);
					setError(null);
				} else if (response?.error) {
					setError(response.error.message || 'Erro ao carregar dashboard');
				} else {
					setError(null);
				}
				setFetchedKey({ key: dashboardRefreshKey, merchantId, filters: currentFilters });
			})
			.catch((err) => {
				setError(err?.message || 'Erro de conexão com o servidor');
				setFetchedKey({ key: dashboardRefreshKey, merchantId, filters: currentFilters });
			});

		return () => {
			cancelled = true;
		};
	}, [dashboardRefreshKey, merchantId, fetchedKey, filtersKey, currentFilters]);

	function handlePeriodChange(period: DashboardPeriod) {
		setSelectedPeriod(period);
		localStorage.setItem(DASHBOARD_PERIOD_STORAGE_KEY, period);
	}

	function handleCustomRangeChange(startDate: string, endDate: string) {
		setCustomRange({ startDate, endDate });
		localStorage.setItem(DASHBOARD_CUSTOM_START_STORAGE_KEY, startDate);
		localStorage.setItem(DASHBOARD_CUSTOM_END_STORAGE_KEY, endDate);
	}

	function handleRefresh() {
		triggerDashboardRefresh();
	}

	return {
		data: {
			dashboard: data,
			reserveConfig,
			hasReserveEnabled,
			isLoading,
			isRefreshing,
			error,
		},
		period: {
			selected: selectedPeriod,
			options: DASHBOARD_PERIOD_OPTIONS,
			change: handlePeriodChange,
			customRange,
			setCustomRange: handleCustomRangeChange,
		},
		actions: {
			refresh: handleRefresh,
		},
	};
}
