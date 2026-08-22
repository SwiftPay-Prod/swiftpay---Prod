'use client';

import { useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import type { DataTableColumn } from '@/components/ui/data-table';
import type { UserReferralCommissionPaymentHistory } from '@/types/user/referrals';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/datetime';
import { Tooltip } from '@heroui/react';
import { ViewIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { ReferralPaymentDetailModal } from '../modals/referral-payment-detail-modal';

interface ReferralPaymentHistoryDataTableProps {
	items: UserReferralCommissionPaymentHistory[];
}

function getColumns(
	onViewDetails: (item: UserReferralCommissionPaymentHistory) => void
): DataTableColumn<UserReferralCommissionPaymentHistory>[] {
	return [
		{
			key: 'paidAt',
			header: 'Pago em',
			render: (item) => <span className="text-sm text-muted">{formatDate(item.paidAt)}</span>,
		},
		{
			key: 'amount',
			header: 'Valor Pago',
			render: (item) => (
				<span className="font-mono tabular-nums text-white">{formatCurrency(item.amount)}</span>
			),
		},
		{
			key: 'notes',
			header: 'Observações',
			render: (item) => <span className="text-sm text-muted">{item.notes || '—'}</span>,
		},
		{
			key: 'receiptFile',
			header: 'Comprovante',
			render: (item) => {
				if (!item.receiptFile?.url) {
					return <span className="text-sm text-muted">—</span>;
				}

				return (
					<a
						href={item.receiptFile.url}
						target="_blank"
						rel="noopener noreferrer"
						className="text-sm underline underline-offset-4 text-white/80 hover:text-white"
					>
						Ver comprovante
					</a>
				);
			},
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			render: (item) => (
				<div className="flex items-center justify-center">
					<Tooltip>
						<button
							type="button"
							onClick={() => onViewDetails(item)}
							className="button-outline-dark inline-flex items-center justify-center rounded-full border border-white/8 bg-white/5 p-2 text-white transition-colors hover:bg-white/10"
						>
							<Icon icon={ViewIcon} className="icon-xs" />
							<span className="sr-only">Ver detalhes</span>
						</button>
						<Tooltip.Content className="bg-[#16181a] border border-white/12 rounded-xl text-white shadow-xl">
							Ver detalhes
						</Tooltip.Content>
					</Tooltip>
				</div>
			),
		},
	];
}

function renderMobileReferralPaymentCard(item: UserReferralCommissionPaymentHistory, _index: number, openActions?: () => void) {
	return (
		<div
			className={`rounded-[20px] border border-white/12 bg-[#16181a] p-4 overflow-hidden${openActions ? ' cursor-pointer' : ''}`}
			onClick={openActions}
			role={openActions ? 'button' : undefined}
			tabIndex={openActions ? 0 : undefined}
			onKeyDown={openActions ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openActions(); } } : undefined}
		>
			<div className="flex items-start justify-between gap-2 mb-2">
				<span className="font-mono tabular-nums text-white">{formatCurrency(item.amount)}</span>
				<span className="text-xs text-muted">{formatDate(item.paidAt)}</span>
			</div>
			<div className="flex flex-col gap-1">
				{item.notes && (
					<div className="flex justify-between text-xs">
						<span className="text-muted">Observações</span>
						<span className="truncate max-w-40">{item.notes}</span>
					</div>
				)}
				{item.receiptFile?.url && (
					<div className="flex justify-between text-xs">
						<span className="text-muted">Comprovante</span>
						<a
							href={item.receiptFile.url}
							target="_blank"
							rel="noopener noreferrer"
							className="truncate underline underline-offset-4 text-white/80 hover:text-white"
						>
							Ver comprovante
						</a>
					</div>
				)}
			</div>
		</div>
	);
}

export function ReferralPaymentHistoryDataTable({ items }: ReferralPaymentHistoryDataTableProps) {
	const [selectedPayment, setSelectedPayment] = useState<UserReferralCommissionPaymentHistory | null>(null);
	const columns = getColumns((item) => setSelectedPayment(item));

	return (
		<>
			<DataTable
				columns={columns}
				data={items}
				keyExtractor={(item) => item.id}
				emptyMessage="Nenhum pagamento de comissão registrado até o momento"
				minWidth="min-w-180"
				renderMobileCard={renderMobileReferralPaymentCard}
			/>

			<ReferralPaymentDetailModal
				isOpen={!!selectedPayment}
				onOpenChange={() => setSelectedPayment(null)}
				payment={selectedPayment}
			/>
		</>
	);
}
