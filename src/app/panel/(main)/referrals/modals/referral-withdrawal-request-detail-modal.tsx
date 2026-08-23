'use client';

import { Chip, Modal } from '@heroui/react';
import { Wallet01Icon, Key01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import type { UserReferralCommissionWithdrawalRequest } from '@/types/user/referrals';
import { ReferralCommissionWithdrawalRequestStatus, type PixKeyType } from '@/types/enums';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/datetime';
import { mapParseColorToChipColor, pixKeyTypeParse } from '@/parse';

interface ReferralWithdrawalRequestDetailModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	request: UserReferralCommissionWithdrawalRequest | null;
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

export function ReferralWithdrawalRequestDetailModal({
	isOpen,
	onOpenChange,
	request,
	payoutPixKeyType,
	payoutPixKey,
}: ReferralWithdrawalRequestDetailModalProps) {
	const statusMeta = request ? getStatusMeta(request.status) : null;

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-lg">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={Wallet01Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Detalhes da solicitação</Modal.Heading>
						<p className="text-sm text-muted">Informações da solicitação de saque de comissão.</p>
					</Modal.Header>

					{request && statusMeta && (
						<Modal.Body className="flex flex-col gap-4">
							<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
								<div className="rounded-xl border border-border bg-surface p-3">
									<span className="text-xs text-muted">Identificador</span>
									<p className="text-xs font-mono text-foreground break-all">{request.id}</p>
								</div>
								<div className="rounded-xl border border-border bg-surface p-3">
									<span className="text-xs text-muted">Solicitado em</span>
									<p className="text-sm font-medium text-foreground">{formatDate(request.requestedAt)}</p>
								</div>
								<div className="rounded-xl border border-border bg-surface p-3">
									<span className="text-xs text-muted">Status</span>
									<div className="mt-1">
										<Chip variant="soft" color={statusMeta.color} size="sm">
											{statusMeta.label}
										</Chip>
									</div>
								</div>
							</div>

							<div className="rounded-xl border border-border bg-surface p-3 flex flex-col gap-2">
								<span className="text-sm font-medium text-foreground">Resumo do saque</span>
								<div className="flex justify-between text-sm">
									<span className="text-muted">Valor solicitado</span>
									<span className="font-medium text-foreground">{formatCurrency(request.amount)}</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-muted">Taxa fixa aplicada</span>
									<span className="font-medium text-danger">- {formatCurrency(request.feeAmount)}</span>
								</div>
								<div className="flex justify-between text-sm border-t border-border pt-2 mt-1">
									<span className="text-muted">Valor líquido a receber</span>
									<span className="font-semibold text-success">+ {formatCurrency(request.netAmount)}</span>
								</div>
							</div>

							<div className="rounded-xl border border-border bg-surface p-3 flex flex-col gap-2">
								<div className="flex items-center gap-2">
									<Icon icon={Key01Icon} className="icon-sm text-accent" />
									<span className="text-sm font-medium text-foreground">Conta de recebimento</span>
								</div>
								<div className="flex items-center gap-2 flex-wrap">
									{payoutPixKeyType && (
										<Chip
											variant="soft"
											size="sm"
											color={mapParseColorToChipColor(pixKeyTypeParse[payoutPixKeyType].color)}
											className="shrink-0"
										>
											{pixKeyTypeParse[payoutPixKeyType].label}
										</Chip>
									)}
									<p className="text-sm text-foreground break-all">{payoutPixKey || 'Não informada'}</p>
								</div>
							</div>

							{request.notes && (
								<div className="rounded-xl border border-border bg-surface p-3 flex flex-col gap-2">
									<span className="text-sm font-medium text-foreground">Observações</span>
									<p className="text-sm text-muted">{request.notes}</p>
								</div>
							)}

							{request.reviewReason && (
								<div className="rounded-xl border border-warning-soft bg-warning-soft p-3 flex flex-col gap-2">
									<span className="text-sm font-medium text-warning">Motivo da análise</span>
									<p className="text-sm text-warning">{request.reviewReason}</p>
								</div>
							)}
						</Modal.Body>
					)}
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
