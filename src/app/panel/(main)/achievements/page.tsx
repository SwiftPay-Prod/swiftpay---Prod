import { Suspense } from 'react';
import { getUserAchievements } from '@/app/actions/user/achievements';
import { getMyProfile } from '@/app/actions/user';
import { AchievementsPage } from './achievements-page';
import { AchievementsPageSkeleton } from './achievements-page-skeleton';

export default async function Page() {
	const achievementsPromise = getUserAchievements();
	const profileResponse = await getMyProfile();

	return (
		<Suspense fallback={<AchievementsPageSkeleton />}>
			<AchievementsPage
				fetchPromise={achievementsPromise}
				userName={profileResponse?.data?.name ?? null}
				userProfileImageUrl={profileResponse?.data?.profileImageUrl ?? null}
			/>
		</Suspense>
	);
}
