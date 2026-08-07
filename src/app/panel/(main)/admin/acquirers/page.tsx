import { getSessionData } from '@/auth/session';
import { UserRole } from '@/types/enums';
import { AcquirersTable } from './acquirers-table';
import { adminGetAcquirerRanking } from '@/app/actions/admin/ranking';
import { AcquirerOperationType } from '@/types/enums';
import { AcquirerRankingList } from './acquirer-ranking/acquirer-ranking-list';
import { AdminAcquirersTabs } from './admin-acquirers-tabs';
import type { AcquirersTableFilters } from './use-acquirers-table';
import { AcquirerAccessAccountsTab } from './access-accounts';
import { adminListAcquirers } from '@/app/actions/admin/acquirers';

interface PageProps {
	searchParams: Promise<Record<string, string | undefined>>;
}

const TAB_LIST = 'list';
const TAB_RANKING = 'ranking';
const TAB_ACCESS_ACCOUNTS = 'access-accounts';

function parseTab(value?: string): 'list' | 'ranking' | 'access-accounts' {
	if (value === TAB_RANKING) return TAB_RANKING;
	if (value === TAB_ACCESS_ACCOUNTS) return TAB_ACCESS_ACCOUNTS;
	return TAB_LIST;
}

function parseOperationTypes(value?: string): AcquirerOperationType[] {
	if (!value) return [AcquirerOperationType.Black, AcquirerOperationType.White];

	const parts = value.split(',').map((item) => item.trim());
	const selected = parts.filter(
		(item): item is AcquirerOperationType =>
			item === AcquirerOperationType.Black || item === AcquirerOperationType.White
	);

	return selected.length > 0 ? selected : [AcquirerOperationType.Black, AcquirerOperationType.White];
}

export default async function AdminAcquirersPage({ searchParams }: PageProps) {
	const session = await getSessionData();
	const params = await searchParams;
	const selectedTab = parseTab(params.tab);
	const operationTypes = parseOperationTypes(params.operationTypes);
	const initialFilters: AcquirersTableFilters = {
		page: 1,
		pageSize: 10,
		isActive: true,
	};

	const rankingPromise = adminGetAcquirerRanking({ operationTypes });

	const isRankingTab = selectedTab === TAB_RANKING;
	const isAccessAccountsTab = selectedTab === TAB_ACCESS_ACCOUNTS;
	const currentUserRole = session?.role ?? UserRole.Admin;

	const initialAccessAccountsAcquirers = isAccessAccountsTab
		? (await adminListAcquirers({ page: 1, pageSize: 100 }))?.data?.items ?? []
		: [];

	return (
		<div className="flex flex-col gap-2">
			<AdminAcquirersTabs selectedTab={selectedTab} />
			{isRankingTab ? (
				<AcquirerRankingList fetchPromise={rankingPromise} selectedOperationTypes={operationTypes} />
			) : isAccessAccountsTab ? (
				<AcquirerAccessAccountsTab
					currentUserRole={currentUserRole}
					initialAcquirers={initialAccessAccountsAcquirers}
				/>
			) : (
				<AcquirersTable initialFilters={initialFilters} currentUserRole={currentUserRole} />
			)}
		</div>
	);
}

