import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import {
	adminGetMerchant,
	adminGetMerchantSettings,
	adminGetMerchantAcquirerHistory,
	adminGetMerchantSettingsHistory,
	adminGetMerchantBalances,
} from '@/app/actions/admin/merchants';
import { adminGetWayneProtocolSettings } from '@/app/actions/admin/wayne-protocol';
import { adminGetPlatformSettings } from '@/app/actions/admin/platform-settings';
import { adminListReconciliations } from '@/app/actions/admin/reconciliation';
import { getSessionData } from '@/auth/session';
import { MerchantDetails } from './merchant-details';
import { MerchantDetailsSkeleton } from './merchant-details-skeleton';
import { PaymentEnvironment, UserRole } from '@/types/enums';

interface PageProps {
	params: Promise<{ id: string }>;
}

async function MerchantDetailsContent({ id }: { id: string }) {
	const session = await getSessionData();

	const [merchantResponse, platformSettingsResponse] = await Promise.all([
		adminGetMerchant(id),
		adminGetPlatformSettings(),
	]);

	if (merchantResponse.error || !merchantResponse?.data) {
		notFound();
	}

	if (platformSettingsResponse.error || !platformSettingsResponse?.data) {
		notFound();
	}

	const settingsPromise = adminGetMerchantSettings(id);
	const reconciliationsPromise = adminListReconciliations({ merchantId: id, page: 1, pageSize: 10 });
	const acquirerHistoryPromise = adminGetMerchantAcquirerHistory(id, { page: 1, pageSize: 10 });
	const settingsHistoryPromise = adminGetMerchantSettingsHistory(id, { page: 1, pageSize: 10 });
	const balancesPromise = adminGetMerchantBalances(id);
	const wayneSettingsPromise = adminGetWayneProtocolSettings(PaymentEnvironment.Production);

	return (
		<MerchantDetails
			merchant={merchantResponse.data}
			currentUserRole={session?.role ?? UserRole.Admin}
			currentUserId={session?.userId ?? ''}
			platformSettings={platformSettingsResponse.data}
			settingsPromise={settingsPromise}
			reconciliationsPromise={reconciliationsPromise}
			acquirerHistoryPromise={acquirerHistoryPromise}
			settingsHistoryPromise={settingsHistoryPromise}
			balancesPromise={balancesPromise}
			wayneSettingsPromise={wayneSettingsPromise}
		/>
	);
}

export default async function MerchantDetailsPage({ params }: PageProps) {
	const { id } = await params;

	return (
		<Suspense fallback={<MerchantDetailsSkeleton />}>
			<MerchantDetailsContent id={id} />
		</Suspense>
	);
}
