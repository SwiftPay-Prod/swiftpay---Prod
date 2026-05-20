import { Suspense } from 'react';
import { adminGetPlatformBalance } from '@/app/actions/admin/dashboard';
import { getSessionData } from '@/auth/session';
import { PlatformBalances, PlatformBalancesSkeleton } from './platform-balances';

export default async function AdminBalancesPage() {
	const balancePromise = adminGetPlatformBalance();
	const session = await getSessionData();

	return (
		<Suspense fallback={<PlatformBalancesSkeleton />}>
			<PlatformBalances balancePromise={balancePromise} currentUserRole={session?.role} />
		</Suspense>
	);
}
