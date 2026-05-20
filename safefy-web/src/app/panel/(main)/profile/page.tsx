import { Suspense } from 'react';
import { getMyProfile } from '@/app/actions/user';
import { getUserAchievements } from '@/app/actions/user/achievements';
import { ProfileWrapper } from './profile-wrapper';
import { ProfileSkeleton } from './profile-skeleton';

export default function ProfilePage() {
	const profilePromise = getMyProfile();
	const achievementsPromise = getUserAchievements();

	return (
		<Suspense fallback={<ProfileSkeleton />}>
			<ProfileWrapper profilePromise={profilePromise} achievementsPromise={achievementsPromise} />
		</Suspense>
	);
}
