'use client';

import { useState } from 'react';
import { Button, Modal, Skeleton, Tooltip } from '@heroui/react';
import { Analytics01Icon } from '@hugeicons/core-free-icons';
import { getMyReferredUserMovements } from '@/app/actions/user';
import { DataTable } from '@/components/ui/data-table';
import type { DataTableColumn } from '@/components/ui/data-table';
import { EmailLink } from '@/components/ui/data-links';
import type { ApiResponse } from '@/types/common';
import { userStatusParse } from '@/parse';
import { ReferralCommissionMovementSourceType } from '@/types/enums';
import type { UserReferralReferredUser, UserReferralReferredUserMovementsData } from '@/types/user/referrals';
import { basisPointsToPercentage, formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/datetime';
import { Icon } from '@/components/ui/icon';
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';

interface ReferredUsersDataTableProps {
	items: UserReferralReferredUser[];
	referralDurationMonths: number;
	onFetchMovements?: (
		referredUserId: string,
		page: number,
		pageSize: number,
		sortBy?: string,
		sortOrder?: 'asc' | 'desc'
	) => Promise<ApiResponse<UserReferralReferredUserMovementsData>>;
}

function addMonths(date: Date, months: number): Date {
	const copy = new Date(date);
	copy.setMonth(copy.getMonth() + months);
	return copy;
}

function getExpirationDate(referredAt: string | null, referralDurationMonths: number): Date | null {
	if (!referredAt || referralDurationMonths < 1) {
		return null;
	}

	const startDate = new Date(referredAt);
	if (Number.isNaN(startDate.getTime())) {
		return null;
	}

	return addMonths(startDate, referralDurationMonths);
}

function getMovementTypeLabel(type: ReferralCommissionMovementSourceType): string {
	if (type === ReferralCommissionMovementSourceType.Payment) {
		return 'Pagamento';
	}

	return 'Saque';
}

function getMovementColumns(): DataTableColumn<UserReferralReferredUserMovementsData['movements'][number]>[] {
	return [
		{
			key: 'occurredAt',
			header: 'Data',
			render: (item) => <span className="text-sm text-muted">{formatDate(item.occurredAt)}</span>,
		},
		{
			key: 'sourceType',
			header: 'Origem',
			render: (item) => (
				<RevolutStatusBadge
					status={item.sourceType === ReferralCommissionMovementSourceType.Payment ? 'completed' : 'pending'}
					label={getMovementTypeLabel(item.sourceType)}
				/>
			),
		},
		{
			key: 'percentage',
			header: 'Comissão',
			render: (item) => (
				<span className="text-sm text-muted">{basisPointsToPercentage(item.referralCommissionPercentage)}%</span>
			),
		},
		{
			key: 'commissionAmount',
			header: 'Valor gerado',
			render: (item) => (
				<span className="font-mono tabular-nums text-white">{formatCurrency(item.commissionAmount)}</span>
			),
		},
	];
}

function renderMobileReferredUserMovementCard(item: UserReferralReferredUserMovementsData['movements'][number]) {
	return (
		<div className="rounded-[20px] border border-white/12 bg-card p-4 overflow-hidden">
			<div className="flex items-start justify-between gap-2 mb-2">
				<span className="font-mono tabular-nums text-white">{formatCurrency(item.commissionAmount)}</span>
				<RevolutStatusBadge
					status={item.sourceType === ReferralCommissionMovementSourceType.Payment ? 'completed' : 'pending'}
					label={getMovementTypeLabel(item.sourceType)}
				/>
			</div>
			<div className="flex flex-col gap-1">
				<div className="flex justify-between text-xs">
					<span className="text-muted">Comissão</span>
					<span>{basisPointsToPercentage(item.referralCommissionPercentage)}%</span>
				</div>
				<div className="flex justify-between text-xs">
					<span className="text-muted">Data</span>
					<span>{formatDate(item.occurredAt)}</span>
				</div>
			</div>
		</div>
	);
}

function ReferredUserMovementsContent({
	data,
	onPageChange,
	onSortChange,
	sortBy,
	sortOrder,
	isNavigating,
}: {
	data: UserReferralReferredUserMovementsData;
	onPageChange: (page: number) => void;
	onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
	sortBy: string;
	sortOrder: 'asc' | 'desc';
	isNavigating: boolean;
}) {
	const movementColumns = getMovementColumns();

	return (
		<div className="flex flex-col gap-4 w-full">
			<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
				<div className="rounded-[20px] border border-white/12 bg-card p-5">
					<span className="text-xs text-muted">Indicado</span>
					<p className="text-sm font-medium text-foreground">{data.referredUserName || 'Sem nome'}</p>
					<EmailLink email={data.referredUserEmail} className="text-xs" />
				</div>
				<div className="rounded-[20px] border border-white/12 bg-card p-5">
					<span className="text-xs text-muted">Comissão total gerada</span>
					<p className="text-sm font-semibold text-success">{formatCurrency(data.totalCommissionAmount)}</p>
				</div>
			</div>

			<DataTable
				columns={movementColumns}
				data={data.movements}
				keyExtractor={(item) => item.id}
				emptyMessage="Nenhuma movimentação encontrada para este indicado."
				minWidth="min-w-180"
				renderMobileCard={renderMobileReferredUserMovementCard}
				isLoading={isNavigating}
				pagination={{
					page: data.page,
					pageSize: data.pageSize,
					totalItems: data.totalItems,
					totalPages: data.totalPages,
					onPageChange,
					sortBy,
					sortOrder,
					onSortChange,
					isNavigating,
				}}
			/>
		</div>
	);
}

function getColumns(
	referralDurationMonths: number,
	onOpenMovements: (referredUserId: string) => void
): DataTableColumn<UserReferralReferredUser>[] {
	return [
		{
			key: 'user',
			header: 'Usuário indicado',
			render: (item) => (
				<div className="flex flex-col">
					<span className="font-medium text-foreground">{item.name || 'Sem nome'}</span>
					<EmailLink email={item.email} className="text-sm" />
				</div>
			),
		},
		{
			key: 'status',
			header: 'Status',
			render: (item) => {
				const statusParsed = userStatusParse[item.status];
				return (
					<RevolutStatusBadge status={item.status} label={statusParsed.label} />
				);
			},
		},
		{
			key: 'commissionTotal',
			header: 'Comissão total',
			render: (item) => (
				<span className="font-mono tabular-nums text-white">{formatCurrency(item.estimatedCommissionTotal ?? 0)}</span>
			),
		},
		{
			key: 'expiresAt',
			header: 'Expira em',
			render: (item) => {
				const expirationDate = getExpirationDate(item.referredAt, referralDurationMonths);
				return <span className="text-sm text-muted">{expirationDate ? formatDate(expirationDate.toISOString()) : '-'}</span>;
			},
		},
		{
			key: 'referredAt',
			header: 'Data do cadastro',
			render: (item) => <span className="text-sm text-muted">{formatDate(item.referredAt)}</span>,
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			width: '120px',
			render: (item) => (
				<div className="flex items-center justify-center">
					<Tooltip>
						<Button
							isIconOnly
							variant="tertiary"
							className="button-outline-dark"
							onPress={() => onOpenMovements(item.id)}
							aria-label="Ver movimentações de comissão"
						>
							<Icon icon={Analytics01Icon} className="icon-xs" />
							<Tooltip.Content className="bg-card border border-white/12 rounded-xl text-whitexl">
								Ver movimentações de comissão
							</Tooltip.Content>
						</Button>
					</Tooltip>
				</div>
			),
		},
	];
}

export function ReferredUsersDataTable({
	items,
	referralDurationMonths,
	onFetchMovements,
}: ReferredUsersDataTableProps) {
	const [isMovementsOpen, setIsMovementsOpen] = useState(false);
	const [isInitialMovementsLoading, setIsInitialMovementsLoading] = useState(false);
	const [isNavigating, setIsNavigating] = useState(false);
	const [movementsError, setMovementsError] = useState<string | null>(null);
	const [selectedReferredUserId, setSelectedReferredUserId] = useState<string | null>(null);
	const [currentPageSize] = useState(10);
	const [movementsSortBy, setMovementsSortBy] = useState('occurredAt');
	const [movementsSortOrder, setMovementsSortOrder] = useState<'asc' | 'desc'>('desc');
	const [movementsData, setMovementsData] = useState<UserReferralReferredUserMovementsData | null>(null);

	const fetchMovements =
		onFetchMovements ??
		((referredUserId: string, page: number, pageSize: number, sortBy?: string, sortOrder?: 'asc' | 'desc') =>
			getMyReferredUserMovements(referredUserId, page, pageSize, sortBy, sortOrder));

	async function handleOpenMovements(referredUserId: string) {
		setSelectedReferredUserId(referredUserId);
		setMovementsError(null);
		setMovementsData(null);
		setIsInitialMovementsLoading(true);
		setIsMovementsOpen(true);

		const response = await fetchMovements(referredUserId, 1, currentPageSize, movementsSortBy, movementsSortOrder);

		if (response?.error) {
			setMovementsError(response.error.message);
			setMovementsData(null);
			setIsInitialMovementsLoading(false);
			return;
		}

		setMovementsData(response?.data ?? null);
		setIsInitialMovementsLoading(false);
	}

	async function handlePageChange(page: number) {
		if (!selectedReferredUserId) {
			return;
		}

		setMovementsError(null);
		setIsNavigating(true);

		const response = await fetchMovements(
			selectedReferredUserId,
			page,
			currentPageSize,
			movementsSortBy,
			movementsSortOrder
		);

		if (response?.error) {
			setMovementsError(response.error.message);
			setIsNavigating(false);
			return;
		}

		setMovementsData(response?.data ?? null);
		setIsNavigating(false);
	}

	async function handleSortChange(sortBy: string, sortOrder: 'asc' | 'desc') {
		if (!selectedReferredUserId) {
			return;
		}

		setMovementsSortBy(sortBy);
		setMovementsSortOrder(sortOrder);
		setMovementsError(null);
		setIsNavigating(true);

		const response = await fetchMovements(selectedReferredUserId, 1, currentPageSize, sortBy, sortOrder);

		if (response?.error) {
			setMovementsError(response.error.message);
			setIsNavigating(false);
			return;
		}

		setMovementsData(response?.data ?? null);
		setIsNavigating(false);
	}

	function handleMovementsModalChange(isOpen: boolean) {
		setIsMovementsOpen(isOpen);
		if (!isOpen) {
			setSelectedReferredUserId(null);
			setMovementsData(null);
			setMovementsError(null);
			setIsInitialMovementsLoading(false);
			setIsNavigating(false);
			setMovementsSortBy('occurredAt');
			setMovementsSortOrder('desc');
		}
	}

	const columns = getColumns(referralDurationMonths, handleOpenMovements);

	function renderMobileReferredUserCard(item: UserReferralReferredUser, _index: number, openActions?: () => void) {
		const statusParsed = userStatusParse[item.status];
		const expirationDate = getExpirationDate(item.referredAt, referralDurationMonths);
		return (
			<div
				className={`rounded-[20px] border border-white/12 bg-card p-4 overflow-hidden${openActions ? ' cursor-pointer' : ''}`}
				onClick={openActions}
				role={openActions ? 'button' : undefined}
				tabIndex={openActions ? 0 : undefined}
				onKeyDown={openActions ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openActions(); } } : undefined}
			>
				<div className="flex items-start justify-between gap-2 mb-2">
					<div className="flex flex-col min-w-0">
						<span className="font-medium text-foreground truncate">{item.name || 'Sem nome'}</span>
						<EmailLink email={item.email} className="text-xs" />
					</div>
					<RevolutStatusBadge status={item.status} label={statusParsed.label} />
				</div>
				<div className="flex flex-col gap-1">
					<div className="flex justify-between text-xs">
						<span className="text-muted">Comissão total</span>
						<span className="font-mono tabular-nums text-white">{formatCurrency(item.estimatedCommissionTotal ?? 0)}</span>
					</div>
					<div className="flex justify-between text-xs">
						<span className="text-muted">Indicado em</span>
						<span>{formatDate(item.referredAt)}</span>
					</div>
					{expirationDate && (
						<div className="flex justify-between text-xs">
							<span className="text-muted">Expira em</span>
							<span>{formatDate(expirationDate.toISOString())}</span>
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<>
			<DataTable
				columns={columns}
				data={items}
				keyExtractor={(item) => item.id}
				emptyMessage="Nenhum usuário indicado."
				minWidth="min-w-180"
				renderMobileCard={renderMobileReferredUserCard}
			/>

			<Modal.Backdrop isOpen={isMovementsOpen} onOpenChange={handleMovementsModalChange}>
				<Modal.Container size="lg" placement="center" scroll="outside">
					<Modal.Dialog className="max-w-4xl">
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Icon className="bg-accent text-accent-foreground">
								<Icon icon={Analytics01Icon} className="icon-xs" />
							</Modal.Icon>
							<Modal.Heading>Movimentações do indicado</Modal.Heading>
							<p className="text-sm text-muted">Histórico de comissões geradas por este usuário indicado</p>
						</Modal.Header>
						<Modal.Body>
							{isInitialMovementsLoading && (
								<div className="flex flex-col gap-3">
									<Skeleton className="h-14 rounded-lg" />
									<Skeleton className="h-14 rounded-lg" />
									<Skeleton className="h-56 rounded-lg" />
								</div>
							)}
							{!isInitialMovementsLoading && movementsError && (
								<p className="text-sm text-danger">{movementsError}</p>
							)}
							{!isInitialMovementsLoading && !movementsError && movementsData && (
								<ReferredUserMovementsContent
									data={movementsData}
									onPageChange={handlePageChange}
									onSortChange={handleSortChange}
									sortBy={movementsSortBy}
									sortOrder={movementsSortOrder}
									isNavigating={isNavigating}
								/>
							)}
						</Modal.Body>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</>
	);
}
