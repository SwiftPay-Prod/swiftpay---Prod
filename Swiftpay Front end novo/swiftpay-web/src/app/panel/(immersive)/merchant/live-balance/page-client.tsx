'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMerchant } from '@/contexts/merchant-context';
import { getMerchantDashboard, type DashboardFilters } from '@/app/actions/merchant/dashboard';
import { LiveBalanceScreen } from './live-balance-screen';
import { Routes } from '@/router/routes';
import { loadStoredLiveBalanceSettings } from './settings';

function getLiveRevenueFilters(): DashboardFilters {
  const settings = loadStoredLiveBalanceSettings();

  if (settings.revenueFilters.period === 'custom') {
    return {
      startDate: settings.revenueFilters.startDate,
      endDate: settings.revenueFilters.endDate,
    };
  }

  return {
    period: settings.revenueFilters.period,
  };
}

export function MerchantLiveBalancePage() {
  const router = useRouter();
  const { selectedMerchant, dashboardRefreshKey } = useMerchant();
  const [totalSales, setTotalSales] = useState<number | null>(null);
  const [requestKey, setRequestKey] = useState<string | null>(null);
  const [liveRevenueFilters, setLiveRevenueFilters] = useState<DashboardFilters>(() => getLiveRevenueFilters());

  useEffect(() => {
    const merchantId = selectedMerchant?.id;

    if (!merchantId) {
      return;
    }

    const nextRequestKey = JSON.stringify({ merchantId, dashboardRefreshKey, filters: liveRevenueFilters });

    if (requestKey === nextRequestKey) {
      return;
    }

    let cancelled = false;

    getMerchantDashboard(merchantId, liveRevenueFilters).then((response) => {
      if (cancelled) {
        return;
      }

      setTotalSales(response?.data?.kpis.totalNetVolume ?? null);
      setRequestKey(nextRequestKey);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedMerchant?.id, dashboardRefreshKey, liveRevenueFilters, requestKey]);

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(Routes.panel.merchant.dashboard);
  }

  return (
    <LiveBalanceScreen
      onBack={handleBack}
      totalRevenue={totalSales}
      isRevenueReady={totalSales !== null}
      onSettingsChange={(nextSettings) => {
        setLiveRevenueFilters(
          nextSettings.revenueFilters.period === 'custom'
            ? {
                startDate: nextSettings.revenueFilters.startDate,
                endDate: nextSettings.revenueFilters.endDate,
              }
            : { period: nextSettings.revenueFilters.period }
        );
      }}
    />
  );
}