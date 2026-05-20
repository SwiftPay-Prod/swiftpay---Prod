'use client';

import { Suspense, useMemo, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Tabs } from '@heroui/react';
import { BankIcon, Wallet01Icon, MoneyReceiveSquareIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { PlatformPayoutsTable } from './platform-payouts-table';
import { PlatformPayoutAccountsTable } from '../platform-payout-accounts/platform-payout-accounts-table';
import { InternalTabs } from '@/components/ui/internal-tabs';
import { PlatformAutomaticCashoutLogsTable, type PlatformAutomaticCashoutFilters } from './platform-automatic-cashout-logs-table';
import { AdminAutomaticCashoutLogsSkeleton } from '../payouts/automatic-cashout-logs-skeleton';
import type { ApiResponse, Paginated } from '@/types/common';
import type { AdminAutomaticCashoutLogData } from '@/types/automatic-cashout';

type AutomaticCashoutPromise = Promise<ApiResponse<Paginated<AdminAutomaticCashoutLogData>>>;
type TabKey = 'payouts' | 'accounts' | 'automatic';

interface PlatformPayoutsHubProps {
	defaultTab?: TabKey;
	initialTab?: TabKey;
	automaticCashoutPromise?: AutomaticCashoutPromise | null;
	automaticCashoutFilters?: PlatformAutomaticCashoutFilters;
}

function parseTab(value: string | null | undefined): TabKey {
	if (value === 'accounts') return 'accounts';
	if (value === 'automatic') return 'automatic';
	return 'payouts';
}

export function PlatformPayoutsHub({ defaultTab = 'payouts', initialTab, automaticCashoutPromise = null, automaticCashoutFilters }: PlatformPayoutsHubProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [, startTransition] = useTransition();
	const resolvedInitialTab = initialTab ?? defaultTab;
	const resolvedAutomaticCashoutFilters: PlatformAutomaticCashoutFilters = automaticCashoutFilters ?? {
		page: 1,
		pageSize: 10,
	};

	const tab = useMemo(() => parseTab(searchParams.get('tab') ?? resolvedInitialTab), [searchParams, resolvedInitialTab]);

	const tabItems = [
		{ id: 'payouts', label: 'Saques', icon: <Icon icon={Wallet01Icon} className="icon-sm" /> },
		{ id: 'accounts', label: 'Contas de Saque', icon: <Icon icon={BankIcon} className="icon-sm" /> },
		{ id: 'automatic', label: 'Saque Automatizado', icon: <Icon icon={MoneyReceiveSquareIcon} className="icon-sm" /> },
	];

	function handleTabChange(key: string) {
		const nextTab = parseTab(key);
		startTransition(() => {
			const params = new URLSearchParams();
			params.set('tab', nextTab);
			router.push(`${pathname}?${params.toString()}`, { scroll: false });
		});
	}

	return (
		<InternalTabs
			ariaLabel="Abas de saques da plataforma"
			items={tabItems}
			selectedKey={tab}
			onSelectionChange={handleTabChange}
		>
			<Tabs.Panel id="payouts" className="min-w-0 p-0">
				<PlatformPayoutsTable />
			</Tabs.Panel>
			<Tabs.Panel id="accounts" className="min-w-0 p-0">
				<PlatformPayoutAccountsTable />
			</Tabs.Panel>
			<Tabs.Panel id="automatic" className="min-w-0 p-0">
				{tab === 'automatic' && automaticCashoutPromise && (
					<Suspense fallback={<AdminAutomaticCashoutLogsSkeleton />}>
						<PlatformAutomaticCashoutLogsTable
							fetchPromise={automaticCashoutPromise}
							filters={resolvedAutomaticCashoutFilters}
						/>
					</Suspense>
				)}
			</Tabs.Panel>
		</InternalTabs>
	);
}
