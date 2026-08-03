import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getSelectedMerchant } from '@/auth/session';
import { getAchievements } from '@/app/actions/merchant/achievements';
import { getUser } from '@/app/actions/user';
import { Routes } from '@/router/routes';
import { AchievementsPage } from '../../achievements/achievements-page';
import { AchievementsPageSkeleton } from '../../achievements/achievements-page-skeleton';

export default async function Page() {
	const merchant = await getSelectedMerchant();

	if (!merchant) {
		redirect(Routes.panel.merchant.new);
	}

	const achievementsPromise = getAchievements(merchant.id);
	const userResponse = await getUser();

	return (
		<Suspense fallback={<AchievementsPageSkeleton />}>
			<AchievementsPage
				fetchPromise={achievementsPromise}
				merchantId={merchant.id}
				userName={userResponse?.data?.name ?? null}
				userProfileImageUrl={userResponse?.data?.profileImageUrl ?? null}
			/>
		</Suspense>
	);
}
