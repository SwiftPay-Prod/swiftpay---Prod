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
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
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
					<span className="font-mono text-xs text-white/70">{parse.label}</span>
				);
			},
		},
		{
			key: 'status',
			header: 'Status',
			render: (item) => (
				<RevolutStatusBadge status={item.status} />
			),
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
		<div className="flex flex-col gap-6 text-white">
			<div className="flex items-center gap-3 border-b border-white/10 pb-5">
				<Skeleton className="h-8 w-8 rounded-lg bg-white/10" />
				<div className="flex flex-col gap-1">
					<Skeleton className="h-6 w-48 rounded bg-white/10" />
					<Skeleton className="h-4 w-64 rounded bg-white/5" />
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Skeleton className="h-9 w-40 rounded-xl bg-white/5" />
				<Skeleton className="h-9 w-36 rounded-xl bg-white/5" />
				<Skeleton className="h-9 w-44 rounded-xl bg-white/5" />
			</div>
			<div className="flex flex-col gap-3 rounded-[24px] border border-white/12 bg-[#16181a] p-5">
				{Array.from({ length: pageSize > 10 ? 10 : pageSize }).map((_, i) => (
					<Skeleton key={i} className="h-14 w-full rounded-xl bg-white/5" />
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
	const itemsList = items.items;
	const problemCount = itemsList.filter((r) => r.hasDiscrepancies).length;
	const healthyCount = itemsList.filter((r) => !r.hasDiscrepancies).length;

	return (
		<>
			<div className="flex flex-col gap-6 text-white">
				{/* Executive Header */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
					<div>
						<div className="flex items-center gap-2">
							<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
								<Icon icon={Audit01Icon} className="icon-sm text-[#4f55f1]" />
							</div>
							<h1 className="text-xl font-bold tracking-tight text-white">Conciliações Bancárias</h1>
						</div>
						<p className="text-xs text-white/50 mt-1">
							Auditoria de consistência e batimento automatizado entre ledger e adquirentes PIX
						</p>
					</div>

					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => setIsReconcileAllOpen(true)}
							className="button-outline-dark cursor-pointer text-xs"
						>
							<Icon icon={RepeatIcon} className="icon-xs" />
							<span>Reconciliar Todas</span>
						</button>
					</div>
				</div>

				{/* 3-Tile High Contrast KPI Grid */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
						<div className="flex items-center justify-between">
							<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
								Total de Reconciliações
							</span>
							<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
								<Icon icon={Audit01Icon} className="icon-xs" />
							</div>
						</div>
						<div>
							<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
								{items.totalItems}
							</span>
							<p className="text-xs text-white/40 font-mono mt-0.5">Auditorias executadas</p>
						</div>
					</div>

					<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
						<div className="flex items-center justify-between">
							<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
								Com Divergências
							</span>
							<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ec7e00]/15 text-[#ec7e00] border border-[#ec7e00]/30">
								<Icon icon={Alert01Icon} className="icon-xs text-[#ec7e00]" />
							</div>
						</div>
						<div>
							<span className="text-2xl font-extrabold font-mono text-[#ec7e00] tracking-tight tabular-nums block">
								{problemCount}
							</span>
							<p className="text-xs text-[#ec7e00]/80 font-mono mt-0.5">Exigem ajuste ou verificação</p>
						</div>
					</div>

					<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
						<div className="flex items-center justify-between">
							<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
								Sem Divergências
							</span>
							<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00a87e]/15 text-[#00a87e] border border-[#00a87e]/30">
								<Icon icon={CheckmarkCircle02Icon} className="icon-xs text-[#00a87e]" />
							</div>
						</div>
						<div>
							<span className="text-2xl font-extrabold font-mono text-[#00a87e] tracking-tight tabular-nums block">
								{healthyCount}
							</span>
							<p className="text-xs text-[#00a87e]/80 font-mono mt-0.5">Saldos 100% conciliados</p>
						</div>
					</div>
				</div>

				{/* Main Data Table */}
				<div className="rounded-[24px] border border-white/12 bg-[#16181a] p-5 sm:p-6 overflow-hidden">
					<DataTable
						className="rounded-[24px] border border-white/12 bg-[#16181a]"
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
