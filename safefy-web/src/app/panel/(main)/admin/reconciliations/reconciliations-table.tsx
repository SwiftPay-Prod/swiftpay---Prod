'use client';

import { use, useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button, Chip, Skeleton, Tooltip, Switch, Label, toast } from '@heroui/react';
import {
	Alert01Icon,
	ViewIcon,
	Building01Icon,
	CheckmarkCircle02Icon,
	Audit01Icon,
	RepeatIcon,
	Notification03Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { SelectFilter } from '@/components/ui/select-filter';
import type { AdminMinimalReconciliation, AdminListReconciliationsRequest } from '@/types/admin/reconciliation';
import type { ApiResponse, Paginated } from '@/types/common';
import type { BankReconciliationStatus, PaymentEnvironment } from '@/types/enums';
import {
	bankReconciliationStatusParse,
	paymentEnvironmentParse,
	mapParseColorToChipColor,
	parseToFilterOptions,
} from '@/parse';
import { formatRelativeTime } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import { adminGetReconciliation, adminListReconciliations, adminStartAllReconciliations } from '@/app/actions/admin/reconciliation';
import { ReconciliationDetailsModal } from '../merchants/[id]/tabs/modals/reconciliation-details-modal';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { AdminMerchantLink } from '@/components/admin/admin-merchant-link';
import { Routes } from '@/router/routes';

type ReconciliationsPromise = Promise<ApiResponse<Paginated<AdminMinimalReconciliation>>>;
type ReconciliationDetailsPromise = ReturnType<typeof adminGetReconciliation>;

interface ReconciliationsTableProps {
	fetchPromise: ReconciliationsPromise;
	filters: AdminListReconciliationsRequest;
}

function getColumns(
	onViewDetails: (id: string) => void,
	onGoToMerchant: (merchantId: string) => void,
): DataTableColumn<AdminMinimalReconciliation>[] {
	return [
		{
			key: 'merchant',
			header: 'Organização',
			render: (item) => (
				<div className="flex flex-col gap-0.5">
					<AdminMerchantLink merchantId={item.merchantId} name={item.merchantName} />
					<span className="text-xs text-muted font-mono">{item.merchantId.slice(0, 8)}…</span>
				</div>
			),
		},
		{
			key: 'environment',
			header: 'Ambiente',
			render: (item) => {
				const parse = paymentEnvironmentParse[item.environment];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(parse.color)} size="sm">
						{parse.label}
					</Chip>
				);
			},
		},
		{
			key: 'status',
			header: 'Status',
			render: (item) => {
				const parse = bankReconciliationStatusParse[item.status];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(parse.color)} size="sm">
						{parse.icon}
						{parse.label}
					</Chip>
				);
			},
		},
		{
			key: 'discrepancies',
			header: 'Divergências',
			align: 'center',
			render: (item) => {
				if (!item.hasDiscrepancies) {
					return (
						<div className="flex items-center justify-center gap-1 text-success text-sm">
							<Icon icon={CheckmarkCircle02Icon} className="icon-sm" />
							<span>–</span>
						</div>
					);
				}
				return (
					<div className="flex items-center justify-center gap-1 text-warning text-sm">
						<Icon icon={Alert01Icon} className="icon-sm" />
						<span className="font-medium">{item.totalDiscrepancies}</span>
					</div>
				);
			},
		},
		{
			key: 'difference',
			header: 'Diferença',
			align: 'right',
			render: (item) => {
				const isZero = item.balanceDifference === 0;
				return (
					<span className={`font-mono text-sm font-medium ${isZero ? 'text-success' : 'text-danger'}`}>
						{isZero ? '–' : formatCurrency(Math.abs(item.balanceDifference))}
					</span>
				);
			},
		},
		{
			key: 'requestedBy',
			header: 'Solicitado por',
			render: (item) => (
				<span className="text-sm text-muted">{item.requestedByUserName ?? '–'}</span>
			),
		},
		{
			key: 'createdAt',
			header: 'Data',
			render: (item) => (
				<span className="text-sm text-muted">{formatRelativeTime(item.createdAt)}</span>
			),
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			render: (item) => (
				<div className="flex items-center justify-center gap-1">
					<Tooltip>
						<Button isIconOnly variant="tertiary" size="sm" onPress={() => onViewDetails(item.id)}>
							<Icon icon={ViewIcon} className="icon-sm" />
						</Button>
						<Tooltip.Content>Ver detalhes</Tooltip.Content>
					</Tooltip>
					<Tooltip>
						<Button isIconOnly variant="tertiary" size="sm" onPress={() => onGoToMerchant(item.merchantId)}>
							<Icon icon={Building01Icon} className="icon-sm" />
						</Button>
						<Tooltip.Content>Ir para organização</Tooltip.Content>
					</Tooltip>
				</div>
			),
		},
	];
}

export function ReconciliationsTableSkeleton({ pageSize = 20 }: { pageSize?: number }) {
	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={Audit01Icon} className="icon-md text-accent-foreground" />}
				title="Reconciliações"
				description="Visão consolidada de todas as reconciliações de organizações"
			/>
			<div className="flex items-center gap-2">
				<Skeleton className="h-9 w-40 rounded-lg" />
				<Skeleton className="h-9 w-36 rounded-lg" />
				<Skeleton className="h-9 w-44 rounded-lg" />
			</div>
			<div className="flex flex-col gap-2">
				{Array.from({ length: pageSize > 10 ? 10 : pageSize }).map((_, i) => (
					<Skeleton key={i} className="h-14 w-full rounded-lg" />
				))}
			</div>
		</div>
	);
}

export function ReconciliationsTable({ fetchPromise, filters }: ReconciliationsTableProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

	const [currentPromise, setCurrentPromise] = useState<ReconciliationsPromise>(fetchPromise);
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [detailsPromise, setDetailsPromise] = useState<ReconciliationDetailsPromise | null>(null);

	const [isReconcileAllOpen, setIsReconcileAllOpen] = useState(false);
	const [reconcileAllSilentMode, setReconcileAllSilentMode] = useState(false);
	const [isReconcileAllPending, startReconcileAllTransition] = useTransition();

	function handleConfirmReconcileAll() {
		startReconcileAllTransition(async () => {
			const result = await adminStartAllReconciliations({ silentMode: reconcileAllSilentMode });
			setIsReconcileAllOpen(false);
			setReconcileAllSilentMode(false);
			if (result?.error) {
				toast.danger(result.error.message || 'Erro ao iniciar reconciliação.');
				return;
			}
			toast.success(result?.message ?? 'Reconciliações iniciadas em segundo plano. Você será notificado ao concluir.');
		});
	}

	const response = use(currentPromise);
	const items = response?.data ?? { items: [], totalItems: 0, page: 1, pageSize: 20, totalPages: 0 };

	const statusOptions = parseToFilterOptions(bankReconciliationStatusParse, 'Todos os status');
	const environmentOptions = parseToFilterOptions(paymentEnvironmentParse, 'Todos os ambientes');

	function navigate(newParams: Record<string, string | number | boolean | undefined | null>) {
		startTransition(() => {
			const params = new URLSearchParams(searchParams.toString());

			Object.entries(newParams).forEach(([key, value]) => {
				if (value === undefined || value === null || value === '' || value === false) {
					params.delete(key);
				} else {
					params.set(key, String(value));
				}
			});

			if (!('page' in newParams)) params.delete('page');

			router.push(`${pathname}?${params.toString()}`, { scroll: false });

			setCurrentPromise(
				adminListReconciliations({
					status: (params.get('status') as BankReconciliationStatus) || undefined,
					environment: (params.get('environment') as PaymentEnvironment) || undefined,
					onlyWithProblems: params.get('onlyWithProblems') === 'true',
					page: Number(params.get('page')) || 1,
					pageSize: filters.pageSize ?? 20,
				}),
			);
		});
	}

	function handleViewDetails(id: string) {
		setDetailsPromise(adminGetReconciliation(id));
		setDetailsOpen(true);
	}

	function handleGoToMerchant(merchantId: string) {
		router.push(Routes.panel.admin.merchantDetails(merchantId));
	}

	function handleRefresh() {
		startTransition(() => {
			setCurrentPromise(
				adminListReconciliations({
					status: filters.status,
					environment: filters.environment,
					onlyWithProblems: filters.onlyWithProblems,
					page: filters.page,
					pageSize: filters.pageSize ?? 20,
				}),
			);
		});
	}

	const columns = getColumns(handleViewDetails, handleGoToMerchant);

	const onlyWithProblems = searchParams.get('onlyWithProblems') === 'true';

	return (
		<>
			<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={Audit01Icon} className="icon-md text-accent-foreground" />}
				title="Reconciliações"
				description="Visão consolidada de todas as reconciliações de organizações"
				actions={
					<Button variant="secondary" onPress={() => setIsReconcileAllOpen(true)}>
						<Icon icon={RepeatIcon} className="icon-sm" />
						Reconciliar Todas
					</Button>
				}
			/>
			<DataTable
				columns={columns}
				data={items.items}
				keyExtractor={(item) => item.id}
				isLoading={isPending}
				filters={{
					children: () => (
						<>
							<SelectFilter
								label="Status"
								options={statusOptions}
								value={filters.status ?? 'all'}
								onChange={(key) => navigate({ status: key === 'all' ? null : key })}
							/>
							<SelectFilter
								label="Ambiente"
								options={environmentOptions}
								value={filters.environment ?? 'all'}
								onChange={(key) => navigate({ environment: key === 'all' ? null : key })}
							/>
							<SelectFilter
								label="Divergências"
								options={[
									{ value: 'all', label: 'Todas' },
									{ value: 'true', label: 'Com divergências' },
									{ value: 'false', label: 'Sem divergências' },
								]}
							value={searchParams.get('onlyWithProblems') ?? 'all'}
								onChange={(key) => navigate({ onlyWithProblems: key === 'all' ? null : key, page: 1 })}
							/>
						</>
					),
					hasFilters: !!filters.status || !!filters.environment || !!searchParams.get('onlyWithProblems'),
					onClear: () => navigate({ status: null, environment: null, onlyWithProblems: null, page: 1 }),
					onRefresh: handleRefresh,
					isRefreshing: isPending,
				}}
				pagination={{
					page: items.page,
					pageSize: items.pageSize,
					totalItems: items.totalItems,
					totalPages: items.totalPages,
					onPageChange: (page) => navigate({ page }),
					sortBy: filters.sortBy,
					sortOrder: filters.sortOrder,
					onSortChange: (sortBy, sortOrder) => navigate({ sortBy, sortOrder, page: 1 }),
					isNavigating: isPending,
				}}
				emptyMessage={
					onlyWithProblems
						? 'Nenhuma reconciliação com problemas encontrada'
						: 'Nenhuma reconciliação encontrada'
				}
			/>

			</div>
			<ReconciliationDetailsModal
				isOpen={detailsOpen}
				onOpenChange={setDetailsOpen}
				reconciliationPromise={detailsPromise}
				onCorrectionsApplied={handleRefresh}
			/>

			<ConfirmationModal
				isOpen={isReconcileAllOpen}
				onOpenChange={(isOpen) => !isOpen && setIsReconcileAllOpen(false)}
				title="Reconciliar todas as organizações"
				status="accent"
				icon={<Icon icon={RepeatIcon} className="icon-md" />}
				confirmLabel="Iniciar"
				cancelLabel="Cancelar"
				isPending={isReconcileAllPending}
				onConfirm={handleConfirmReconcileAll}
			>
				<div className="flex flex-col gap-4">
					<p className="text-sm text-muted">
						Inicia a reconciliação para todas as organizações ativas que processaram na plataforma.
						Organizações com reconciliação já em andamento serão ignoradas automaticamente.
					</p>
					<Switch isSelected={reconcileAllSilentMode} onChange={setReconcileAllSilentMode}>
						<div className="flex w-full items-center gap-3 rounded-lg border border-default p-3">
							<Icon icon={Notification03Icon} className="icon-md text-muted shrink-0" />
							<div className="flex grow flex-col gap-1">
								<Label className="text-sm font-medium cursor-pointer">
									Modo silencioso
								</Label>
								<p className="text-xs text-muted">
									Não envia notificações e não aparece no histórico das organizações
								</p>
							</div>
							<Switch.Control>
								<Switch.Thumb />
							</Switch.Control>
						</div>
					</Switch>
				</div>
			</ConfirmationModal>
		</>
	);
}
