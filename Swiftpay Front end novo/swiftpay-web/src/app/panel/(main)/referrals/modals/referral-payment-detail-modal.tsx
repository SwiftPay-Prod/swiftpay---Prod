'use client';

import { Chip, Modal } from '@heroui/react';
import { Wallet01Icon, Key01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { DocumentViewer } from '@/components/ui/document-viewer';
import type { UserReferralCommissionPaymentHistory } from '@/types/user/referrals';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/datetime';
import { mapParseColorToChipColor, pixKeyTypeParse } from '@/parse';

interface ReferralPaymentDetailModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	payment: UserReferralCommissionPaymentHistory | null;
}

export function ReferralPaymentDetailModal({ isOpen, onOpenChange, payment }: ReferralPaymentDetailModalProps) {
	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-lg">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={Wallet01Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Detalhes do pagamento</Modal.Heading>
						<p className="text-sm text-muted">Informações do pagamento de comissão recebido.</p>
					</Modal.Header>
					{payment && (
						<Modal.Body className="flex flex-col gap-4">
								<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
									<div className="rounded-xl border border-divider bg-surface p-3">
										<span className="text-xs text-muted">Data do pagamento</span>
										<p className="text-sm font-medium text-foreground">{formatDate(payment.paidAt)}</p>
									</div>
									<div className="rounded-xl border border-divider bg-surface p-3">
										<span className="text-xs text-muted">Identificador</span>
										<p className="text-xs font-mono text-foreground break-all">{payment.id}</p>
									</div>
								</div>

								<div className="rounded-xl border border-divider bg-surface p-3 flex flex-col gap-2">
									<span className="text-sm font-medium text-foreground">Resumo do pagamento</span>
									<div className="flex justify-between text-sm">
										<span className="text-muted">Valor solicitado</span>
										<span className="font-medium text-foreground">{formatCurrency(payment.requestedAmount)}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-muted">Valor pago</span>
										<span className="font-medium text-accent">+ {formatCurrency(payment.amount)}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-muted">Taxa fixa aplicada</span>
										<span className="font-medium text-danger">- {formatCurrency(payment.feeAmount)}</span>
									</div>
									<div className="flex justify-between text-sm border-t border-divider pt-2 mt-1">
										<span className="text-muted">Valor líquido recebido</span>
										<span className="font-semibold text-success">+ {formatCurrency(payment.netAmount)}</span>
									</div>
								</div>

								<div className="rounded-xl border border-divider bg-surface p-3 flex flex-col gap-2">
									<div className="flex items-center gap-2">
										<Icon icon={Key01Icon} className="icon-sm text-accent" />
										<span className="text-sm font-medium text-foreground">Conta de recebimento</span>
									</div>
									<div className="flex items-center gap-2 flex-wrap">
										{payment.pixKeyType && (
											<Chip
												variant="soft"
												size="sm"
												color={mapParseColorToChipColor(pixKeyTypeParse[payment.pixKeyType].color)}
												className="shrink-0"
											>
												{pixKeyTypeParse[payment.pixKeyType].label}
											</Chip>
										)}
										<p className="text-sm text-foreground break-all">{payment.pixKey || 'Não informada'}</p>
									</div>
								</div>

								{payment.notes && (
									<div className="rounded-xl border border-divider bg-surface p-3 flex flex-col gap-2">
										<span className="text-sm font-medium text-foreground">Observações</span>
										<p className="text-sm text-muted">{payment.notes}</p>
									</div>
								)}

							{payment.receiptFile?.url && (
								<DocumentViewer
									file={payment.receiptFile}
									title="Comprovante"
									description="Visualize o comprovante enviado para este pagamento."
								/>
							)}
						</Modal.Body>
					)}
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
