import { redirect } from 'next/navigation';
import { getSessionData } from '@/auth/session';
import { Routes } from '@/router/routes';
import { getUserOnboarding } from '@/app/actions/user';
import { OnboardingContent } from './components/onboarding-content';

export default async function UserOnboardingPage() {
	const [session, onboardingResponse] = await Promise.all([
		getSessionData(),
		getUserOnboarding(),
	]);

	if (!session) {
		redirect(Routes.home);
	}

	if (!session.emailVerified) {
		redirect(Routes.panel.verifyEmail);
	}

	if (session.userOnboardingCompleted || onboardingResponse?.data?.completed) {
		redirect(Routes.panel.merchant.dashboard);
	}

	return (
		<OnboardingContent
			userName={session.name}
			initialData={onboardingResponse?.data ?? null}
		/>
	);
}
