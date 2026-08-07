'use client';

import { Tabs } from '@heroui/react';
import { UserGroupIcon, Wallet01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { InternalTabs, type InternalTabItem } from '@/components/ui/internal-tabs';
import { ReferredUsersDataTable } from '../tables/referred-users-data-table';
import { ReferralPaymentHistoryDataTable } from '../tables/referral-payment-history-data-table';
import { ReferralWithdrawalRequestsDataTable } from '../tables/referral-withdrawal-requests-data-table';
import type {
	UserReferralCommissionPaymentHistory,
	UserReferralCommissionWithdrawalRequest,
	UserReferralReferredUser,
	UserReferralReferredUserMovementsData,
} from '@/types/user/referrals';
import type { PixKeyType } from '@/types/enums';
import type { ApiResponse } from '@/types/common';

type ReferredUserMovementsFetcher = (
	referredUserId: string,
	page: number,
	pageSize: number
) => Promise<ApiResponse<UserReferralReferredUserMovementsData>>;

interface ReferralsDataTabsProps {
	referredUsers: UserReferralReferredUser[];
	referralDurationMonths: number;
	paymentHistory: UserReferralCommissionPaymentHistory[];
	withdrawalRequests: UserReferralCommissionWithdrawalRequest[];
	payoutPixKeyType: PixKeyType | null;
	payoutPixKey: string | null;
	onFetchReferredUserMovements?: ReferredUserMovementsFetcher;
}

export function ReferralsDataTabs({
	referredUsers,
	referralDurationMonths,
	paymentHistory,
	withdrawalRequests,
	payoutPixKeyType,
	payoutPixKey,
	onFetchReferredUserMovements,
}: ReferralsDataTabsProps) {
	const tabItems: InternalTabItem[] = [
		{ id: 'referred-users', label: 'Usuários indicados', icon: <Icon icon={UserGroupIcon} className="icon-sm" /> },
		{ id: 'commission-history', label: 'Pagamentos recebidos', icon: <Icon icon={Wallet01Icon} className="icon-sm" /> },
		{ id: 'withdrawal-requests', label: 'Solicitações de saque', icon: <Icon icon={Wallet01Icon} className="icon-sm" /> },
	];

	return (
		<InternalTabs
			ariaLabel="Abas de indicações"
			items={tabItems}
			defaultSelectedKey="referred-users"
		>

			<Tabs.Panel id="referred-users" className="min-w-0 p-0">
				<ReferredUsersDataTable
					items={referredUsers}
					referralDurationMonths={referralDurationMonths}
					onFetchMovements={onFetchReferredUserMovements}
				/>
			</Tabs.Panel>

			<Tabs.Panel id="commission-history" className="min-w-0 p-0">
				<ReferralPaymentHistoryDataTable items={paymentHistory} />
			</Tabs.Panel>

			<Tabs.Panel id="withdrawal-requests" className="min-w-0 p-0">
				<ReferralWithdrawalRequestsDataTable
					items={withdrawalRequests}
					payoutPixKeyType={payoutPixKeyType}
					payoutPixKey={payoutPixKey}
				/>
			</Tabs.Panel>
		</InternalTabs>
	);
}
