import { Suspense } from 'react';
import { adminListReferralCommissionWithdrawalRequests } from '@/app/actions/admin/referrals';
import { adminGetUser } from '@/app/actions/admin/users';
import { ReferralsTable } from './referrals-table';
import { ReferralsTableSkeleton } from './referrals-table-skeleton';
import type { AdminReadListReferralCommissionWithdrawalRequestsRequest } from '@/types/admin/referrals';
import type { ReferralCommissionWithdrawalRequestStatus } from '@/types/enums';

export type WithdrawalFilters = AdminReadListReferralCommissionWithdrawalRequestsRequest;

interface PageProps {
	searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdminReferralsPage({ searchParams }: PageProps) {
	const params = await searchParams;

	const withdrawalFilters: WithdrawalFilters = {
		page: params.withdrawalPage ? parseInt(params.withdrawalPage, 10) : 1,
		pageSize: params.withdrawalPageSize ? parseInt(params.withdrawalPageSize, 10) : 10,
		status: (params.withdrawalStatus as ReferralCommissionWithdrawalRequestStatus) || undefined,
		search: params.withdrawalSearch || undefined,
		userId: params.withdrawalUserId || undefined,
	};

	const withdrawalRequestsPromise = adminListReferralCommissionWithdrawalRequests(withdrawalFilters);

	let initialWithdrawalUserName: string | null = null;
	if (withdrawalFilters.userId) {
		const userResponse = await adminGetUser(withdrawalFilters.userId);
		if (userResponse?.data) {
			initialWithdrawalUserName = userResponse.data.name ?? userResponse.data.email;
		}
	}

	return (
		<Suspense fallback={<ReferralsTableSkeleton pageSize={withdrawalFilters.pageSize} />}>
			<ReferralsTable
				withdrawalFetchPromise={withdrawalRequestsPromise}
				withdrawalFilters={withdrawalFilters}
				initialWithdrawalUserName={initialWithdrawalUserName}
			/>
		</Suspense>
	);
}
