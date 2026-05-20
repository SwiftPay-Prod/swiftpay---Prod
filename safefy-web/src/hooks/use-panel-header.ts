'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useSidebar } from '@/contexts/sidebar-context';
import { useMerchant } from '@/contexts/merchant-context';
import { useEnvironment } from '@/contexts/environment-context';
import { adminGetPlatformBalance, adminGetPlatformRevenue } from '@/app/actions/admin/dashboard';
import { isAdminRole, type UserRole } from '@/types/enums';
import type { AdminPlatformBalanceData, AdminPlatformRevenueData } from '@/types/admin/dashboard';
import type { UserInfo } from '@/types/auth';
import { useBalanceVisibility } from './use-balance-visibility';

interface UsePanelHeaderProps {
  user?: UserInfo;
}

export function usePanelHeader({ user }: UsePanelHeaderProps) {
  const { toggleSidebar } = useSidebar();
  const { balance, selectedMerchant, levelInfo } = useMerchant();
  const { isSandboxVisible, environment } = useEnvironment();
  const { setTheme, theme } = useTheme();

  const isDark = theme === 'dark';
  const isAdmin = user?.role ? isAdminRole(user.role as UserRole) : false;
  const lifetimeVolume = balance?.totals?.lifetimeVolume ?? null;
  const merchantBalance = balance?.balance ?? null;
  const merchantBalanceUpdatedAt = balance?.updatedAt ?? null;

  const { isVisible: isBalanceVisible, toggle: toggleBalanceVisibility } = useBalanceVisibility();

  const [platformRevenue, setPlatformRevenue] = useState<AdminPlatformRevenueData | null>(null);
  const [platformBalance, setPlatformBalance] = useState<AdminPlatformBalanceData | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isAdmin) return;

    startTransition(async () => {
      const [revenueResponse, balanceResponse] = await Promise.all([
        adminGetPlatformRevenue({ maxAcquirers: 4 }),
        adminGetPlatformBalance(),
      ]);
      if (revenueResponse?.data) {
        setPlatformRevenue(revenueResponse.data);
      }
      if (balanceResponse?.data) {
        setPlatformBalance(balanceResponse.data);
      }
    });
  }, [isAdmin, environment]);

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  const acquirers = platformRevenue?.acquirerRevenues ?? [];
  const totalAcquirers = platformRevenue?.totalAcquirers ?? 0;
  const hasMoreAcquirers = totalAcquirers > acquirers.length;

  return {
    sidebar: { toggleSidebar },
    theme: { isDark, toggleTheme },
    balance: {
      isVisible: isBalanceVisible,
      toggleVisibility: toggleBalanceVisibility,
      lifetimeVolume,
      merchantBalance,
      merchantBalanceUpdatedAt,
    },
    admin: {
      isAdmin,
      platformRevenue,
      platformBalance,
      isPending,
      visibleAcquirers: acquirers,
      hasMoreAcquirers,
    },
    merchant: {
      selectedMerchant,
      levelInfo,
    },
    environment: {
      isSandboxVisible,
    },
  };
}

