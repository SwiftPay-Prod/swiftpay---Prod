import { getSessionData } from '@/auth/session';
import { PayoutsAndLogsTabs } from './payouts-and-logs-tabs';
import { UserRole } from '@/types/enums';

export default async function AdminPayoutsPage() {
	const session = await getSessionData();
	const canReprocess = session?.role === UserRole.God;

	return (
		<PayoutsAndLogsTabs
			canReprocess={canReprocess}
		/>
	);
}

