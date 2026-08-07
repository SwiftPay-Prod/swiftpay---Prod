import { getSessionData } from '@/auth/session';
import { MerchantsTable } from './merchants-table';
import type { ReadListMerchantsRequest } from '@/types/admin/merchants';

export type Filters = ReadListMerchantsRequest;

export default async function AdminMerchantsPage() {
	const session = await getSessionData();

	const initialFilters: Filters = {
		search: null,
		status: null,
		kycStatus: null,
		userId: null,
		sortBy: 'createdAt',
		sortOrder: 'desc',
		page: 1,
		pageSize: 10,
	};

	return (
		<MerchantsTable
			initialFilters={initialFilters}
			currentUserRole={session?.role}
		/>
	);
}

