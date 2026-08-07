import { redirect } from 'next/navigation';
import { getSessionData } from '@/auth/session';
import { Routes } from '@/router/routes';
import { UserRole } from '@/types/enums';

export default async function DashboardRedirectPage() {
	const session = await getSessionData();

	if (!session) {
		redirect(Routes.home);
	}

	if (session.role === UserRole.Admin || session.role === UserRole.God) {
		redirect(Routes.panel.admin.dashboard);
	}

	redirect(Routes.panel.merchant.dashboard);
}
