'use client';

import { useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import type { DataTableColumn } from '@/components/ui/data-table';
import type { UserReferralCommissionPaymentHistory } from '@/types/user/referrals';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/datetime';
import { Button, Link, Tooltip } from '@heroui/react';
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
			render: (item) => <span className="font-medium">{formatCurrency(item.amount)}</span>,
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
					<Link href={item.receiptFile.url} target="_blank" rel="noopener noreferrer" className="text-sm">
						Ver comprovante
					</Link>
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
						<Button isIconOnly variant="tertiary" onPress={() => onViewDetails(item)}>
							<Icon icon={ViewIcon} className="icon-sm" />
							<Tooltip.Content>Ver detalhes</Tooltip.Content>
						</Button>
					</Tooltip>
				</div>
			),
		},
	];
}

function renderMobileReferralPaymentCard(item: UserReferralCommissionPaymentHistory, _index: number, openActions?: () => void) {
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
						<Link href={item.receiptFile.url} target="_blank" rel="noopener noreferrer" className="text-xs">
							Ver comprovante
						</Link>
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
