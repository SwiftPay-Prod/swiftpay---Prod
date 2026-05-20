import { Suspense } from 'react';
import type { BankReconciliationStatus, PaymentEnvironment } from '@/types/enums';
import type { AdminListReconciliationsRequest } from '@/types/admin/reconciliation';
import { adminListReconciliations } from '@/app/actions/admin/reconciliation';
import { ReconciliationsTable, ReconciliationsTableSkeleton } from './reconciliations-table';

interface PageProps {
	searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdminReconciliationsPage({ searchParams }: PageProps) {
	const params = await searchParams;

	const filters: AdminListReconciliationsRequest = {
		status: params.status as BankReconciliationStatus | undefined,
		environment: params.environment as PaymentEnvironment | undefined,
		onlyWithProblems: params.onlyWithProblems === 'true',
		page: Number(params.page) || 1,
		pageSize: Number(params.pageSize) || 20,
	};

	const dataPromise = adminListReconciliations(filters);
	const suspenseKey = JSON.stringify(filters);

	return (
		<Suspense key={suspenseKey} fallback={<ReconciliationsTableSkeleton pageSize={filters.pageSize ?? 20} />}>
			<ReconciliationsTable fetchPromise={dataPromise} filters={filters} />
		</Suspense>
	);
}
