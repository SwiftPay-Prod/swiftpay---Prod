import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { adminGetUser, adminGetUserReferrals } from '@/app/actions/admin/users';
import { adminGetPlatformSettings } from '@/app/actions/admin/platform-settings';
import { getSessionData } from '@/auth/session';
import { UserDetails } from './user-details';
import { UserDetailsSkeleton } from './user-details-skeleton';
import { UserRole } from '@/types/enums';

interface PageProps {
	params: Promise<{ id: string }>;
	searchParams: Promise<Record<string, string | undefined>>;
}

async function UserDetailsContent({ userId, initialTab }: { userId: string; initialTab: 'general' | 'settings' | 'features' | 'referrals' }) {
	const [session, userResponse, platformSettingsResponse, userReferralsResponse] = await Promise.all([
		getSessionData(),
		adminGetUser(userId),
		adminGetPlatformSettings(),
		adminGetUserReferrals(userId),
	]);

	if (userResponse.error || !userResponse?.data) {
		notFound();
	}

	if (platformSettingsResponse.error || !platformSettingsResponse?.data) {
		notFound();
	}

	return (
		<UserDetails
			user={userResponse.data}
			platformSettings={platformSettingsResponse.data}
			userReferralsData={userReferralsResponse?.data ?? null}
			initialTab={initialTab}
			currentUserRole={session?.role ?? UserRole.Admin}
			currentUserId={session?.userId ?? ''}
		/>
	);
}

export default async function UserDetailsPage({ params, searchParams }: PageProps) {
	const [{ id }, query] = await Promise.all([params, searchParams]);
	const initialTab = query.tab === 'settings' || query.tab === 'features' || query.tab === 'referrals' ? query.tab : 'general';

	return (
		<Suspense fallback={<UserDetailsSkeleton />}>
			<UserDetailsContent userId={id} initialTab={initialTab} />
		</Suspense>
	);
}
