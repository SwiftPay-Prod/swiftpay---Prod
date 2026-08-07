import { adminListLogs } from '@/app/actions/admin/logs';
import { LogsTable } from './logs-table';
import type { AdminLogType, AdminReadListLogsRequest } from '@/types/admin/logs';
import type { ApiResponse, Paginated } from '@/types/common';
import type { AdminLogEntry } from '@/types/admin/logs';

export type Filters = AdminReadListLogsRequest;

interface PageProps {
	searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdminLogsPage({ searchParams }: PageProps) {
	const params = await searchParams;
	const typeParam = params.type;
	const type: AdminLogType =
		typeParam === 'Security' || typeParam === 'Email' || typeParam === 'Profiler' || typeParam === 'AcquirerWebhook'
			? typeParam
			: 'Api';
	const statusCode = params.statusCode ? parseInt(params.statusCode, 10) : NaN;

	const filters: Filters = {
		page: params.page ? parseInt(params.page, 10) : 1,
		pageSize: params.pageSize ? parseInt(params.pageSize, 10) : 10,
		type,
		merchantId: params.merchantId || undefined,
		acquirerType: params.acquirerType || undefined,
		statusCode: Number.isNaN(statusCode) ? undefined : statusCode,
		search: params.search || undefined,
		action: params.action || undefined,
		sortBy: params.sortBy || 'createdAt',
		sortOrder: params.sortOrder === 'asc' ? 'asc' : 'desc',
	};

	const logsPromise: Promise<ApiResponse<Paginated<AdminLogEntry>>> =
		filters.type === 'Profiler'
			? Promise.resolve({
					data: {
						items: [],
						totalItems: 0,
						page: filters.page ?? 1,
						pageSize: filters.pageSize ?? 10,
						totalPages: 0,
					},
					message: null,
					error: null,
				})
			: adminListLogs(filters);

	return (
		<LogsTable fetchPromise={logsPromise} filters={filters} />
	);
}
