'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { MinimalMerchant, MerchantData } from '@/types/merchant/crud';
import { listMerchants, selectMerchant, getMerchant } from '@/app/actions/merchant/crud';
import { getMerchantBalance } from '@/app/actions/merchant/balance';
import { getAchievements } from '@/app/actions/merchant/achievements';
import type { ReadBalanceData } from '@/types/merchant/balance';
import type { MerchantLevelData } from '@/types/merchant/achievements';
import { BaseCookie } from '@/constants/base';
import { Routes } from '@/router/routes';

interface MerchantContextValue {
	selectedMerchant: MinimalMerchant | null;
	merchants: MinimalMerchant[];
	hasMerchants: boolean;
	availableBalance: number | null;
	balance: ReadBalanceData | null;
	isLoadingBalance: boolean;
	levelInfo: MerchantLevelData | null;
	dashboardRefreshKey: number;
	setSelectedMerchant: (merchant: MinimalMerchant | null) => Promise<void>;
	setSelectedMerchantLocally: (merchant: MinimalMerchant | null) => void;
	setMerchants: (merchants: MinimalMerchant[]) => Promise<void>;
	refreshMerchantList: (defaultMerchantIdSelect?: string | null) => Promise<void>;
	refreshBalance: () => Promise<void>;
	refreshLevelInfo: () => Promise<void>;
	updateBalance: (balance: ReadBalanceData) => void;
	updateMerchantInList: (merchantId: string) => Promise<MerchantData | null>;
	triggerDashboardRefresh: () => void;
}

const MerchantContext = createContext<MerchantContextValue | null>(null);

function getInitialSelectedMerchant(
	initialMerchants: MinimalMerchant[],
	initialSelectedMerchant: MinimalMerchant | null
): MinimalMerchant | null {
	if (initialSelectedMerchant) {
		const found = initialMerchants.find((m) => m.id === initialSelectedMerchant.id);
		if (found) return found;
	}
	return null;
}

export function MerchantProvider({
	children,
	initialMerchants = [],
	initialSelectedMerchant = null,
}: {
	children: ReactNode;
	initialMerchants?: MinimalMerchant[];
	initialSelectedMerchant?: MinimalMerchant | null;
}) {
	const pathname = usePathname();
	const [merchants, setMerchantsState] = useState<MinimalMerchant[]>(initialMerchants);
	const [selectedMerchant, setSelectedMerchantState] = useState<MinimalMerchant | null>(() =>
		getInitialSelectedMerchant(initialMerchants, initialSelectedMerchant)
	);
	const [balance, setBalance] = useState<ReadBalanceData | null>(null);
	const [isLoadingBalance, setIsLoadingBalance] = useState(false);
	const [levelInfo, setLevelInfo] = useState<MerchantLevelData | null>(null);
	const [hasInitialized, setHasInitialized] = useState(false);
	const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);
	const availableBalance = balance?.balance.available ?? null;
	const isMerchantCreateRoute = pathname === Routes.panel.merchant.new;

	const triggerDashboardRefresh = useCallback(() => {
		setDashboardRefreshKey((prev) => prev + 1);
	}, []);

	const setSelectedMerchantLocally = useCallback((merchant: MinimalMerchant | null) => {
		setSelectedMerchantState(merchant);

		if (merchant) {
			setMerchantsState((prev) => {
				const exists = prev.some((item) => item.id === merchant.id);
				if (exists) {
					return prev.map((item) => (item.id === merchant.id ? merchant : item));
				}

				return [merchant, ...prev];
			});
		}

		if (typeof document !== 'undefined') {
			if (!merchant) {
				document.cookie = `${BaseCookie.selectedMerchant}=; path=/; max-age=0; samesite=lax`;
			} else {
				document.cookie = `${BaseCookie.selectedMerchant}=${encodeURIComponent(JSON.stringify(merchant))}; path=/; max-age=86400; samesite=lax`;
			}
		}

		if (typeof window !== 'undefined') {
			if (!merchant) {
				window.localStorage.removeItem(BaseCookie.selectedMerchant);
			} else {
				window.localStorage.setItem(BaseCookie.selectedMerchant, JSON.stringify(merchant));
			}
		}
	}, []);

	useEffect(() => {
		if (!hasInitialized && !initialSelectedMerchant && initialMerchants.length > 0 && !isMerchantCreateRoute) {
			const firstMerchant = initialMerchants[0]!;
			setSelectedMerchantLocally(firstMerchant);
			selectMerchant(firstMerchant);
			setHasInitialized(true);
		}
	}, [hasInitialized, initialSelectedMerchant, initialMerchants, isMerchantCreateRoute, setSelectedMerchantLocally]);

	const refreshBalance = useCallback(async () => {
		if (!selectedMerchant) {
			setBalance(null);
			return;
		}

		setIsLoadingBalance(true);
		try {
			const response = await getMerchantBalance(selectedMerchant.id);
			if (response?.data) {
				setBalance(response.data);
				triggerDashboardRefresh();
			}
		} catch {
			setBalance(null);
		} finally {
			setIsLoadingBalance(false);
		}
	}, [selectedMerchant, triggerDashboardRefresh]);

	const updateBalance = useCallback((newBalance: ReadBalanceData) => {
		setBalance(newBalance);
		triggerDashboardRefresh();
	}, [triggerDashboardRefresh]);

	useEffect(() => {
		refreshBalance();
	}, [refreshBalance]);

	const refreshLevelInfo = useCallback(async () => {
		if (!selectedMerchant?.id) {
			setLevelInfo(null);
			return;
		}
		const res = await getAchievements(selectedMerchant.id);
		setLevelInfo(res?.data?.levelInfo ?? null);
	}, [selectedMerchant?.id]);

	useEffect(() => {
		refreshLevelInfo();
	}, [refreshLevelInfo]);

	const setMerchants = useCallback(async (newMerchants: MinimalMerchant[]) => {
		setMerchantsState(newMerchants);

		const currentMerchant = selectedMerchant;
		if (currentMerchant && newMerchants.some((m) => m.id === currentMerchant.id)) {
			return;
		}

		if (newMerchants.length > 0) {
			if (isMerchantCreateRoute) {
				return;
			}

			const firstMerchant = newMerchants[0]!;
			setSelectedMerchantLocally(firstMerchant);
			await selectMerchant(firstMerchant);
		} else {
			setSelectedMerchantLocally(null);
			await selectMerchant(null);
		}
	}, [isMerchantCreateRoute, selectedMerchant, setSelectedMerchantLocally]);

	const setSelectedMerchantFn = useCallback(async (merchant: MinimalMerchant | null) => {
		setSelectedMerchantLocally(merchant);
		await selectMerchant(merchant);
		return Promise.resolve();
	}, [setSelectedMerchantLocally]);

	const refreshMerchantList = useCallback(async (defaultMerchantIdSelect?: string | null) => {
		const res = await listMerchants();
		setMerchantsState(res.data?.items || []);

		if (defaultMerchantIdSelect) {
			const merchantSelected = res.data?.items.find((m) => m.id === defaultMerchantIdSelect) || null;
			if (!merchantSelected) return Promise.resolve();
			setSelectedMerchantLocally(merchantSelected);
			await selectMerchant(merchantSelected);
		}

		return Promise.resolve();
	}, [setSelectedMerchantLocally]);

	const updateMerchantInList = useCallback(async (merchantId: string): Promise<MerchantData | null> => {
		const response = await getMerchant(merchantId);
		if (!response?.data) return null;

		const merchant = response.data;
		const minimalMerchant: MinimalMerchant = {
			id: merchant.id,
			name: merchant.name,
			email: merchant.email,
			document: merchant.kyc?.documentNumber ?? null,
			status: merchant.status,
			kycStatus: merchant.kycStatus,
			onboardingStep: merchant.onboardingStep,
			createdAt: merchant.createdAt,
			onboardingCompletedAt: merchant.onboardingCompletedAt,
			availableBalance: null,
			fees: merchant.fees,
		};

		setMerchantsState((prev) =>
			prev.map((m) => (m.id === merchantId ? minimalMerchant : m))
		);

		if (selectedMerchant?.id === merchantId) {
			setSelectedMerchantLocally(minimalMerchant);
			await selectMerchant(minimalMerchant);
		}

		return merchant;
	}, [selectedMerchant?.id, setSelectedMerchantLocally]);

	const value = useMemo(
		() => ({
			selectedMerchant,
			merchants,
			hasMerchants: merchants.length > 0,
			availableBalance,
			balance,
			isLoadingBalance,
			levelInfo,
			dashboardRefreshKey,
			setSelectedMerchant: setSelectedMerchantFn,
			setSelectedMerchantLocally,
			setMerchants,
			refreshMerchantList,
			refreshBalance,
			refreshLevelInfo,
			updateBalance,
			updateMerchantInList,
			triggerDashboardRefresh,
		}),
		[selectedMerchant, merchants, availableBalance, balance, isLoadingBalance, levelInfo, dashboardRefreshKey, setSelectedMerchantFn, setSelectedMerchantLocally, setMerchants, refreshMerchantList, refreshBalance, refreshLevelInfo, updateBalance, updateMerchantInList, triggerDashboardRefresh]
	);

	return <MerchantContext.Provider value={value}>{children}</MerchantContext.Provider>;
}

export function useMerchant() {
	const context = useContext(MerchantContext);
	if (!context) {
		throw new Error('useMerchant must be used within a MerchantProvider');
	}
	return context;
}

