'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Chip, Tooltip } from '@heroui/react';
import { DataTable } from '@/components/ui/data-table';
import type { DataTableColumn } from '@/components/ui/data-table';
import type { UserReferralCommissionWithdrawalRequest } from '@/types/user/referrals';
import { ReferralCommissionWithdrawalRequestStatus, type PixKeyType } from '@/types/enums';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/datetime';
import { ViewIcon, CancelCircleIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
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
			render: (item) => <span className="font-medium">{formatCurrency(item.amount)}</span>,
		},
		{
			key: 'status',
			header: 'Status',
			render: (item) => {
				const meta = getStatusMeta(item.status);
				return (
					<Chip variant="soft" color={meta.color} size="sm">
						{meta.label}
					</Chip>
				);
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
							<Button isIconOnly variant="tertiary" onPress={() => onViewDetails(item)}>
								<Icon icon={ViewIcon} className="icon-sm" />
								<Tooltip.Content>Ver detalhes</Tooltip.Content>
							</Button>
						</Tooltip>
						{item.status === ReferralCommissionWithdrawalRequestStatus.Requested && (
							<Tooltip>
								<Button
									isIconOnly
									variant="tertiary"
									className="text-danger"
									isPending={cancellingRequestId === item.id}
									onPress={() => onCancelRequest(item)}
								>
									<Icon icon={CancelCircleIcon} className="icon-sm" />
									<Tooltip.Content>Cancelar solicitação</Tooltip.Content>
								</Button>
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
			className={`rounded-xl border border-divider bg-surface p-3 overflow-hidden${openActions ? ' cursor-pointer' : ''}`}
			onClick={openActions}
			role={openActions ? 'button' : undefined}
			tabIndex={openActions ? 0 : undefined}
			onKeyDown={openActions ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openActions(); } } : undefined}
		>
			<div className="flex items-start justify-between gap-2 mb-2">
				<span className="font-medium">{formatCurrency(item.amount)}</span>
				<Chip variant="soft" color={meta.color} size="sm">
					{meta.label}
				</Chip>
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
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
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
