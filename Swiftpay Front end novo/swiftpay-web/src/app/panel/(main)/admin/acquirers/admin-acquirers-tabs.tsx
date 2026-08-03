'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { InternalTabs } from '@/components/ui/internal-tabs';

interface AdminAcquirersTabsProps {
	selectedTab: 'list' | 'ranking' | 'access-accounts';
}

const TAB_LIST = 'list';
const TAB_RANKING = 'ranking';
const TAB_ACCESS_ACCOUNTS = 'access-accounts';

export function AdminAcquirersTabs({ selectedTab }: AdminAcquirersTabsProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	function handleSelectionChange(key: string) {
		const params = new URLSearchParams(searchParams.toString());
		if (key === TAB_RANKING) {
			params.set('tab', TAB_RANKING);
		} else if (key === TAB_ACCESS_ACCOUNTS) {
			params.set('tab', TAB_ACCESS_ACCOUNTS);
		} else {
			params.set('tab', TAB_LIST);
		}
		router.push(`${pathname}?${params.toString()}`, { scroll: false });
	}

	return (
		<InternalTabs
			ariaLabel="Visualização de processadoras"
			selectedKey={selectedTab}
			onSelectionChange={handleSelectionChange}
			items={[
				{ id: TAB_LIST, label: 'Lista de processadoras' },
				{ id: TAB_RANKING, label: 'Ranking de processadoras' },
				{ id: TAB_ACCESS_ACCOUNTS, label: 'Contas de acesso' },
			]}
			className="w-full"
		/>
	);
}
