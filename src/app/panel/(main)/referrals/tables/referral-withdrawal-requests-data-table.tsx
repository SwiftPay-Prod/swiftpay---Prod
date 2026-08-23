'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tooltip } from '@heroui/react';
import { DataTable } from '@/components/ui/data-table';
import type { DataTableColumn } from '@/components/ui/data-table';
import type { UserReferralCommissionWithdrawalRequest } from '@/types/user/referrals';
import { ReferralCommissionWithdrawalRequestStatus, type PixKeyType } from '@/types/enums';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/datetime';
import { ViewIcon, CancelCircleIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
import { ReferralWithdrawalRequestDetailModal } from '../modals/referral-withdrawal-request-detail-modal';
import { cancelMyReferralCommissionWithdrawalRequest } from '@/app/actions/user';
import { toast } from '@heroui/react';

interface ReferralWithdrawalRequestsDataTableProps {
	items: UserReferralCommissionWithdrawalRequest[];
	payoutPixKeyType: PixKeyType | null;
	payoutPixKey: string | null;
}

function getStatusMeta(status: ReferralCommissionWithdrawalRequestStatus) {
	switch (status) {
		case ReferralCommissionWithdrawalRequestStatus.Requested:
			return { label: 'Solicitado', color: 'warning' as const };
		case ReferralCommissionWithdrawalRequestStatus.Reviewed:
			return { label: 'Analisado', color: 'success' as const };
		case ReferralCommissionWithdrawalRequestStatus.Cancelled:
			return { label: 'Cancelado', color: 'danger' as const };
		default:
			return { label: status, color: 'default' as const };
	}
}

function getColumns(
	onViewDetails: (item: UserReferralCommissionWithdrawalRequest) => void,
	onCancelRequest: (item: UserReferralCommissionWithdrawalRequest) => void,
	cancellingRequestId: string | null
): DataTableColumn<UserReferralCommissionWithdrawalRequest>[] {
	return [
		{
			key: 'requestedAt',
			header: 'Solicitado em',
			render: (item) => <span className="text-sm text-muted">{formatDate(item.requestedAt)}</span>,
		},
		{
			key: 'amount',
			header: 'Valor',
			render: (item) => (
				<span className="font-mono tabular-nums text-white">{formatCurrency(item.amount)}</span>
			),
		},
		{
			key: 'status',
			header: 'Status',
			render: (item) => {
				const meta = getStatusMeta(item.status);
				return <RevolutStatusBadge status={item.status} label={meta.label} />;
			},
		},
		{
			key: 'notes',
			header: 'Observações',
			render: (item) => <span className="text-sm text-muted">{item.notes || '—'}</span>,
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			render: (item) => (
				<div className="flex items-center justify-center">
					<div className="flex items-center gap-1">
						<Tooltip>
							<button
								type="button"
								onClick={() => onViewDetails(item)}
								className="button-outline-dark inline-flex items-center justify-center rounded-full border border-white/8 bg-white/5 p-2 text-white transition-colors hover:bg-white/10"
							>
								<Icon icon={ViewIcon} className="icon-xs" />
								<span className="sr-only">Ver detalhes</span>
							</button>
							<Tooltip.Content className="bg-card border border-white/12 rounded-xl text-whitexl">
								Ver detalhes
							</Tooltip.Content>
						</Tooltip>
						{item.status === ReferralCommissionWithdrawalRequestStatus.Requested && (
							<Tooltip>
								<button
									type="button"
									onClick={() => onCancelRequest(item)}
									disabled={cancellingRequestId === item.id}
									className="button-outline-dark inline-flex items-center justify-center rounded-full border border-white/8 bg-white/5 p-2 text-danger transition-colors hover:bg-white/10 disabled:opacity-60"
								>
									<Icon icon={CancelCircleIcon} className="icon-xs" />
									<span className="sr-only">Cancelar solicitação</span>
								</button>
								<Tooltip.Content className="bg-card border border-white/12 rounded-xl text-whitexl">
									Cancelar solicitação
								</Tooltip.Content>
							</Tooltip>
						)}
					</div>
				</div>
			),
		},
	];
}

function renderMobileWithdrawalRequestCard(item: UserReferralCommissionWithdrawalRequest, _index: number, openActions?: () => void) {
	const meta = getStatusMeta(item.status);
	return (
		<div
			className={`rounded-[20px] border border-white/12 bg-card p-4 overflow-hidden${openActions ? ' cursor-pointer' : ''}`}
			onClick={openActions}
			role={openActions ? 'button' : undefined}
			tabIndex={openActions ? 0 : undefined}
			onKeyDown={openActions ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openActions(); } } : undefined}
		>
			<div className="flex items-start justify-between gap-2 mb-2">
				<span className="font-mono tabular-nums text-white">{formatCurrency(item.amount)}</span>
				<RevolutStatusBadge status={item.status} label={meta.label} />
			</div>
			<div className="flex flex-col gap-1">
				<div className="flex justify-between text-xs">
					<span className="text-muted">Solicitado em</span>
					<span>{formatDate(item.requestedAt)}</span>
				</div>
				{item.notes && (
					<div className="flex justify-between text-xs">
						<span className="text-muted">Observações</span>
						<span className="truncate max-w-40">{item.notes}</span>
					</div>
				)}
			</div>
		</div>
	);
}

export function ReferralWithdrawalRequestsDataTable({ items, payoutPixKeyType, payoutPixKey }: ReferralWithdrawalRequestsDataTableProps) {
	const router = useRouter();
	const [selectedRequest, setSelectedRequest] = useState<UserReferralCommissionWithdrawalRequest | null>(null);
	const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(null);

	async function handleCancelRequest(item: UserReferralCommissionWithdrawalRequest) {
		setCancellingRequestId(item.id);
		const response = await cancelMyReferralCommissionWithdrawalRequest(item.id);
		setCancellingRequestId(null);

		if (response.error) {
			toast('Erro ao cancelar solicitação', {
				description: response.error.message,
				variant: 'danger',
				indicator: <Icon icon={CancelCircleIcon} className="icon-xs" />,
			});
			return;
		}

		toast('Solicitação cancelada', {
			description: 'O valor foi devolvido ao saldo disponível para novo saque.',
			variant: 'success',
		});

		router.refresh();
	}

	const columns = getColumns((item) => setSelectedRequest(item), handleCancelRequest, cancellingRequestId);

	return (
		<>
			<DataTable
				columns={columns}
				data={items}
				keyExtractor={(item) => item.id}
				emptyMessage="Nenhuma solicitação de saque registrada até o momento"
				minWidth="min-w-180"
				renderMobileCard={renderMobileWithdrawalRequestCard}
			/>

			<ReferralWithdrawalRequestDetailModal
				isOpen={!!selectedRequest}
				onOpenChange={() => setSelectedRequest(null)}
				request={selectedRequest}
				payoutPixKeyType={payoutPixKeyType}
				payoutPixKey={payoutPixKey}
			/>
		</>
	);
}
