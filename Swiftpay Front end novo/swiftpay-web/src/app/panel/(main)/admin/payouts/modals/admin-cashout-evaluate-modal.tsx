'use client';

import { useState, useTransition } from 'react';
import { Modal, Chip, Button, TextArea, Label } from '@heroui/react';
import {
	Building02Icon,
	DollarCircleIcon,
	CheckmarkCircle02Icon,
	CancelCircleIcon,
	Key01Icon,
	Calendar03Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import type { AdminMinimalCashout } from '@/types/admin/cashouts';
import { CashoutEvaluateAction } from '@/types/enums';
import {
	payoutStatusParse,
	pixKeyTypeParse,
	mapParseColorToChipColor,
	cashoutEvaluateActionOptions,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import { AdminMerchantLink } from '@/components/admin/admin-merchant-link';
import { adminEvaluateCashout } from '@/app/actions/admin/cashouts';
import { toast } from '@heroui/react';

interface AdminCashoutEvaluateModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	cashout: AdminMinimalCashout | null;
	onEvaluated?: () => void;
}

function StatCard({ label, value, variant = 'default' }: { label: string; value: React.ReactNode; variant?: 'default' | 'success' }) {
	return (
		<div className="flex flex-col gap-1 p-3 rounded-lg bg-surface-secondary">
			<span className="text-xs text-muted">{label}</span>
			<span className={`text-lg font-semibold ${variant === 'success' ? 'text-success' : 'text-foreground'}`}>
				{value}
			</span>
		</div>
	);
}

export function AdminCashoutEvaluateModal({
	isOpen,
	onOpenChange,
	cashout,
	onEvaluated,
}: AdminCashoutEvaluateModalProps) {
	const [isPending, startTransition] = useTransition();
	const [action, setAction] = useState<CashoutEvaluateAction | null>(null);
	const [notes, setNotes] = useState('');

	const isReject = action === CashoutEvaluateAction.Reject;
	const canSubmit = action !== null && (!isReject || notes.trim().length > 0);

	const handleClose = () => {
		setAction(null);
		setNotes('');
		onOpenChange(false);
	};

	const handleSubmit = () => {
		if (!action || !canSubmit || !cashout) return;

		startTransition(async () => {
			const response = await adminEvaluateCashout(cashout.id, {
				action,
				reason: notes.trim() || undefined,
			});

			if (response?.error) {
				toast('Erro ao avaliar', {
					description: response.error.message ?? 'Erro ao avaliar saque',
					variant: 'danger',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				});
				return;
			}

			const actionLabel = action === CashoutEvaluateAction.Approve ? 'aprovado' : 'rejeitado';
			toast('Saque avaliado', {
				description: `Saque ${actionLabel} com sucesso!`,
				variant: 'success',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			});
			onEvaluated?.();
			handleClose();
		});
	};

	if (!cashout) return null;

	const statusParse = payoutStatusParse[cashout.status];
	const pixKeyType =
		cashout.payoutAccount?.pixKeyType ??
		(cashout.inlinePixKeyType && cashout.inlinePixKeyType in pixKeyTypeParse
			? (cashout.inlinePixKeyType as keyof typeof pixKeyTypeParse)
			: null);
	const pixKeyParse = pixKeyType ? pixKeyTypeParse[pixKeyType] : null;
	const pixKey = cashout.payoutAccount?.pixKey ?? cashout.inlinePixKey ?? '-';
	const holderName = cashout.payoutAccount?.holderName ?? null;

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={handleClose}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-2xl">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Heading>Avaliar Saque</Modal.Heading>
						<p className="text-sm text-muted">Revise as informações e aprove ou rejeite o saque</p>
					</Modal.Header>
					<Modal.Body className="flex flex-col gap-5">
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
							<StatCard label="Total Debitado" value={formatCurrency(cashout.amount)} />
							<StatCard label="Taxa" value={formatCurrency(cashout.feeAmount)} />
							<StatCard label="Valor Recebido" value={formatCurrency(cashout.netAmount)} variant="success" />
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="rounded-lg border border-divider p-4">
								<div className="flex items-center gap-2 mb-3">
									<Icon icon={Building02Icon} className="icon-sm text-accent" />
									<h4 className="font-semibold text-sm text-foreground">Organização</h4>
								</div>
								<div className="flex flex-col gap-2">
									<div>
										<span className="text-xs text-muted block">Nome</span>
										<AdminMerchantLink
											merchantId={cashout.merchant.id}
											name={cashout.merchant.name}
											className="text-sm font-medium text-accent hover:underline"
										/>
									</div>
									<div>
										<span className="text-xs text-muted block">Email</span>
										<span className="text-sm font-medium">{cashout.merchant.email ?? '-'}</span>
									</div>
								</div>
							</div>

							<div className="rounded-lg border border-divider p-4">
								<div className="flex items-center gap-2 mb-3">
									<Icon icon={Key01Icon} className="icon-sm text-accent" />
									<h4 className="font-semibold text-sm text-foreground">Conta de Destino</h4>
								</div>
								<div className="flex flex-col gap-2">
									<div>
										<span className="text-xs text-muted block">Chave PIX</span>
											<span className="text-sm font-medium font-mono">{pixKey}</span>
									</div>
									<div className="flex items-center gap-2">
											{pixKeyParse && (
												<Chip variant="soft" size="sm" className="gap-1">
													{pixKeyParse.icon}
													{pixKeyParse.label}
												</Chip>
											)}
											{holderName && (
												<span className="text-xs text-muted">• {holderName}</span>
											)}
									</div>
								</div>
							</div>
						</div>

						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-lg bg-surface-secondary">
							<div className="flex items-center gap-2">
								<Icon icon={DollarCircleIcon} className="icon-sm text-muted" />
								<span className="text-sm text-muted">Status:</span>
								<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="sm" className="gap-1">
									{statusParse.icon}
									{statusParse.label}
								</Chip>
							</div>
							<div className="flex items-center gap-2 text-sm text-muted">
								<Icon icon={Calendar03Icon} className="icon-sm" />
								<span>Solicitado em {formatDate(cashout.requestedAt)}</span>
							</div>
						</div>

						<div className="rounded-lg border-2 border-accent/30 bg-accent/5 p-4">
							<h4 className="font-semibold text-sm text-foreground mb-4">Selecione uma ação</h4>

							<div className="flex flex-col sm:flex-row gap-3 mb-4">
								{cashoutEvaluateActionOptions.map((option) => {
									const isSelected = action === option.value;
									const isApprove = option.value === CashoutEvaluateAction.Approve;

									let buttonClass = 'flex-1 h-12';
									if (isSelected) {
										buttonClass += isApprove
											? ' bg-success text-success-foreground hover:bg-success/90'
											: ' bg-danger text-danger-foreground hover:bg-danger/90';
									}

									return (
										<Button
											key={option.value}
											variant={isSelected ? 'primary' : 'secondary'}
											onPress={() => setAction(option.value as CashoutEvaluateAction)}
											className={buttonClass}
										>
											{isApprove ? (
												<Icon icon={CheckmarkCircle02Icon} className="icon-md" />
											) : (
												<Icon icon={CancelCircleIcon} className="icon-md" />
											)}
											{option.label}
										</Button>
									);
								})}
							</div>

							{action && (
								<div className="flex flex-col gap-2">
									<Label htmlFor="notes">
										{isReject ? 'Motivo da rejeição *' : 'Observação (opcional)'}
									</Label>
									<TextArea variant="secondary"
										id="notes"
										placeholder={isReject ? 'Informe o motivo da rejeição...' : 'Adicione uma observação...'}
										value={notes}
										onChange={(e) => setNotes(e.target.value)}
										rows={2}
									/>
								</div>
							)}
						</div>
					</Modal.Body>
					<Modal.Footer className="flex justify-end gap-2">
						<Button variant="secondary" onPress={handleClose}>
							Cancelar
						</Button>
						<Button
							variant="primary"
							className={isReject ? 'bg-danger text-danger-foreground hover:bg-danger/90' : 'bg-success text-success-foreground hover:bg-success/90'}
							onPress={handleSubmit}
							isPending={isPending}
							isDisabled={!canSubmit}
						>
							{isReject ? (
								<>
									<Icon icon={CancelCircleIcon} className="icon-sm" />
									Rejeitar Saque
								</>
							) : (
								<>
									<Icon icon={CheckmarkCircle02Icon} className="icon-sm" />
									Aprovar Saque
								</>
							)}
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

