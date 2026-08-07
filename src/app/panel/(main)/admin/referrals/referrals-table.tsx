'use client';

import { Wallet01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import type { ApiResponse } from '@/types/common';
import type { AdminMinimalReferralCommissionWithdrawalRequest } from '@/types/admin/referrals';
import type { WithdrawalFilters } from './page';
import { ReferralWithdrawalRequestsTable } from './referral-withdrawal-requests-table';

type WithdrawalRequestsPromise = Promise<ApiResponse<{
	items: AdminMinimalReferralCommissionWithdrawalRequest[];
	totalItems: number;
	page: number;
	pageSize: number;
	totalPages: number;
}>>;

interface ReferralsTableProps {
	withdrawalFetchPromise: WithdrawalRequestsPromise;
	withdrawalFilters: WithdrawalFilters;
	initialWithdrawalUserName?: string | null;
}

export function ReferralsTable({
	withdrawalFetchPromise,
	withdrawalFilters,
	initialWithdrawalUserName,
}: ReferralsTableProps) {

	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={Wallet01Icon} size={24} />}
				title="Saque das indicações"
				description="Gerencie as solicitações de saque de comissão dos indicadores."
			/>

			<ReferralWithdrawalRequestsTable
				fetchPromise={withdrawalFetchPromise}
				filters={withdrawalFilters}
				initialUserName={initialWithdrawalUserName}
			/>
		</div>
	);
}
