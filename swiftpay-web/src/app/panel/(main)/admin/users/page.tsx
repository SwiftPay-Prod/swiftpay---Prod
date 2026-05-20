import { Suspense } from 'react';
import { getSessionData } from '@/auth/session';
import { adminListUsers } from '@/app/actions/admin/users';
import { UsersTable } from './users-table';
import { UsersTableSkeleton } from './users-table-skeleton';
import type { AdminReadListUsersRequest } from '@/types/admin/users';
import type { UserRole, UserStatus } from '@/types/enums';

export type Filters = AdminReadListUsersRequest;

interface PageProps {
	searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
	const [params, session] = await Promise.all([
		searchParams,
		getSessionData(),
	]);

	const filters: Filters = {
		page: params.page ? parseInt(params.page, 10) : 1,
		pageSize: params.pageSize ? parseInt(params.pageSize, 10) : 10,
		role: (params.role as UserRole) || undefined,
		status: (params.status as UserStatus) || undefined,
		wasReferred: params.wasReferred === 'true' ? true : params.wasReferred === 'false' ? false : undefined,
		search: params.search || undefined,
		sortBy: (params.sortBy as 'createdAt' | 'referredUsersCount' | 'availableCommissionBalance' | 'generatedReferralCommission') ?? 'createdAt',
		sortOrder: (params.sortOrder as 'asc' | 'desc') ?? 'desc',
	};

	const usersPromise = adminListUsers(filters);

	return (
		<Suspense fallback={<UsersTableSkeleton pageSize={filters.pageSize} />}>
			<UsersTable
				fetchPromise={usersPromise}
				filters={filters}
				currentUserRole={session?.role}
				currentUserId={session?.userId}
			/>
		</Suspense>
	);
}

