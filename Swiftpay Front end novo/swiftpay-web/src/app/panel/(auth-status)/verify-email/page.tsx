import { getAccessToken, getSessionData } from '@/auth/session';
import { redirect } from 'next/navigation';
import { Routes } from '@/router/routes';
import { VerifyEmailContent } from './verify-email-content';
import { getApiUrl } from '@/app/actions/auth';

export default async function VerifyEmailPage() {
	const session = await getSessionData();

	if (!session) {
		redirect(Routes.home);
	}

	if (session.emailVerified) {
		redirect(session.userOnboardingCompleted ? Routes.panel.merchant.dashboard : Routes.panel.onboarding);
	}

	const [accessToken, apiUrl] = await Promise.all([
		getAccessToken(),
		getApiUrl(),
	]);

	const user = {
		id: session.userId,
		name: session.name,
		email: session.email,
		role: session.role,
		status: session.status,
		emailVerified: session.emailVerified,
	};

	return <VerifyEmailContent user={user} accessToken={accessToken} apiUrl={apiUrl} />;
}

