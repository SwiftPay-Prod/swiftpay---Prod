import { getSessionData } from '@/auth/session';
import { TransactionsTable } from './transactions-table';
import { UserRole } from '@/types/enums';

export default async function AdminTransactionsPage() {
	const session = await getSessionData();
	const canReprocess = session?.role === UserRole.God;

	return <TransactionsTable canReprocess={canReprocess} />;
}

