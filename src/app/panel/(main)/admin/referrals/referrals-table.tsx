'use client';

import { Wallet01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
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
		<ReferralWithdrawalRequestsTable
			fetchPromise={withdrawalFetchPromise}
			filters={withdrawalFilters}
			initialUserName={initialWithdrawalUserName}
		/>
	);
}
