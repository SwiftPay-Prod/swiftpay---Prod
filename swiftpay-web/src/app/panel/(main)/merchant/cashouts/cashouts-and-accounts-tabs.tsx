'use client';

import { Suspense, useMemo, useTransition, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Tabs } from '@heroui/react';
import { Wallet03Icon, BankIcon, MoneyReceiveSquareIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { InternalTabs, type InternalTabItem } from '@/components/ui/internal-tabs';
import { CashoutsTable } from './cashouts-table';
import { CashoutAccountsTable } from '@/app/panel/(main)/merchant/cashout-accounts/cashout-accounts-table';
import { CashoutAccountsTableSkeleton } from '@/app/panel/(main)/merchant/cashout-accounts/cashout-accounts-table-skeleton';
import { MerchantAutomaticCashoutLogsTable } from './automatic-cashout-logs-table';
import { MerchantAutomaticCashoutLogsSkeleton } from './automatic-cashout-logs-skeleton';
import { listCashoutAccounts } from '@/app/actions/merchant/cashout-accounts';
import { getMerchantAutomaticCashoutLogs } from '@/app/actions/merchant/automatic-cashouts';
import type { ApiResponse, Paginated } from '@/types/common';
import type { CashoutAccountsFilters, ListCashoutAccountsData } from '@/types/merchant/cashout-accounts';
import type { MerchantAutomaticCashoutLogData } from '@/types/automatic-cashout';
import type { AutomaticCashoutStatus } from '@/types/enums';

type AccountsPromise = Promise<ApiResponse<ListCashoutAccountsData>>;
type AutomaticCashoutPromise = Promise<ApiResponse<Paginated<MerchantAutomaticCashoutLogData>>>;
type CashoutsTabType = 'cashouts' | 'accounts' | 'automatic';

export interface AutomaticCashoutFilters {
	page: number;
	pageSize: number;
	status?: AutomaticCashoutStatus | null;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

interface CashoutsAndAccountsTabsProps {
	merchantId: string;
	initialTab: CashoutsTabType;
	accountsPromise: AccountsPromise | null;
	accountsFilters: CashoutAccountsFilters;
	automaticCashoutPromise: AutomaticCashoutPromise | null;
	automaticCashoutFilters: AutomaticCashoutFilters;
	readOnly?: boolean;
	useStateNavigation?: boolean;
}

function parseTab(value: string | null | undefined): CashoutsTabType {
	if (value === 'accounts') return 'accounts';
	if (value === 'automatic') return 'automatic';
	return 'cashouts';
}

export function CashoutsAndAccountsTabs({
	merchantId,
	initialTab,
	accountsPromise,
	accountsFilters,
	automaticCashoutPromise,
	automaticCashoutFilters,
	readOnly = false,
	useStateNavigation = false,
}: CashoutsAndAccountsTabsProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [, startTransition] = useTransition();
	const [selectedTabState, setSelectedTabState] = useState<CashoutsTabType>(initialTab);
	const [lazyAccountsPromise, setLazyAccountsPromise] = useState<AccountsPromise | null>(null);
	const [lazyAutomaticPromise, setLazyAutomaticPromise] = useState<AutomaticCashoutPromise | null>(null);

	const urlTab = useMemo(() => parseTab(searchParams.get('tab') ?? initialTab), [searchParams, initialTab]);
	const selectedTab = useStateNavigation ? selectedTabState : urlTab;

	const effectiveAccountsPromise = accountsPromise ?? lazyAccountsPromise;
	const effectiveAutoCashoutPromise = automaticCashoutPromise ?? lazyAutomaticPromise;

	function handleTabChange(key: string) {
		const nextTab = parseTab(key);
		if (useStateNavigation) {
			if (nextTab === 'accounts' && !lazyAccountsPromise) {
				setLazyAccountsPromise(listCashoutAccounts(merchantId, accountsFilters));
			}
			if (nextTab === 'automatic' && !lazyAutomaticPromise) {
				setLazyAutomaticPromise(getMerchantAutomaticCashoutLogs(merchantId, automaticCashoutFilters));
			}
			setSelectedTabState(nextTab);
		} else {
			startTransition(() => {
				const params = new URLSearchParams();
				params.set('tab', nextTab);
				router.push(`${pathname}?${params.toString()}`, { scroll: false });
			});
		}
	}

	const tabItems: InternalTabItem[] = [
		{ id: 'cashouts', label: 'Saques', icon: <Icon icon={Wallet03Icon} className="icon-sm" /> },
		{ id: 'accounts', label: 'Contas de Saque', icon: <Icon icon={BankIcon} className="icon-sm" /> },
		{ id: 'automatic', label: 'Saques Automáticos', icon: <Icon icon={MoneyReceiveSquareIcon} className="icon-sm" /> },
	];

	return (
		<InternalTabs
			ariaLabel="Abas de saques da organização"
			items={tabItems}
			selectedKey={selectedTab}
			onSelectionChange={handleTabChange}
		>
			<Tabs.Panel id="cashouts" className="p-0">
				<CashoutsTable merchantId={merchantId} readOnly={readOnly} />
			</Tabs.Panel>
			<Tabs.Panel id="accounts" className="p-0">
			{selectedTab === 'accounts' && effectiveAccountsPromise && (
				<Suspense fallback={<CashoutAccountsTableSkeleton />}>
					<CashoutAccountsTable
						fetchPromise={effectiveAccountsPromise}
							merchantId={merchantId}
							filters={accountsFilters}
							readOnly={readOnly}
						/>
					</Suspense>
				)}
			</Tabs.Panel>
			<Tabs.Panel id="automatic" className="p-0">
			{selectedTab === 'automatic' && effectiveAutoCashoutPromise && (
				<Suspense fallback={<MerchantAutomaticCashoutLogsSkeleton />}>
					<MerchantAutomaticCashoutLogsTable
						fetchPromise={effectiveAutoCashoutPromise}
							merchantId={merchantId}
							filters={automaticCashoutFilters}
						/>
					</Suspense>
				)}
			</Tabs.Panel>
		</InternalTabs>
	);
}
