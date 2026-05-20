'use client';

import { Suspense, use, useMemo, useState, useTransition } from 'react';
import { Modal, Chip, Skeleton, Button, toast } from '@heroui/react';
import {
	Building02Icon,
	Wallet01Icon,
	InformationCircleIcon,
	DollarCircleIcon,
	CheckListIcon,
	HourglassIcon,
	CheckmarkCircle02Icon,
	ArrowRight01Icon,
	Key01Icon,
	CancelCircleIcon,
	UserIcon,
	UserCheck01Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import type {
	AdminCashoutDetails,
	AdminCashoutLedgerEntry,
	AdminReprocessCashoutTargetStatus,
} from '@/types/admin/cashouts';
import type { ApiResponse } from '@/types/common';
import {
	payoutStatusParse,
	pixKeyTypeParse,
	mapParseColorToChipColor,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import { EmailLink } from '@/components/ui/data-links';
import { DetailRow, CopyableValue, SectionTitle } from '@/components/ui/detail-components';
import { adminReprocessCompletedCashoutDev } from '@/app/actions/admin/cashouts';
import { AdminMerchantLink } from '@/components/admin/admin-merchant-link';
import { AdminReprocessConfirmModal } from '@/components/admin/admin-reprocess-confirm-modal';

type CashoutPromise = Promise<ApiResponse<AdminCashoutDetails>>;

interface AdminCashoutDetailsModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	cashoutPromise: CashoutPromise | null;
	canReprocess: boolean;
	onReprocessed: () => void;
}

interface GroupedTransaction {
	id: string;
	timestamp: string;
	entries: AdminCashoutLedgerEntry[];
	type: 'requested' | 'completed' | 'failed' | 'other';
	title: string;
	description: string;
}

function getTransactionType(entries: AdminCashoutLedgerEntry[]): GroupedTransaction['type'] {
	const descriptions = entries.map((e) => (e.description ?? '').toLowerCase());

	if (descriptions.some((d) => d.includes('solicitado'))) return 'requested';
	if (descriptions.some((d) => d.includes('concluído') || d.includes('realizado'))) return 'completed';
	if (descriptions.some((d) => d.includes('falhou') || d.includes('rejeitado') || d.includes('cancelado'))) return 'failed';
	return 'other';
}

function getTransactionInfo(type: GroupedTransaction['type']): { title: string; description: string } {
	switch (type) {
		case 'requested':
			return {
				title: 'Saque Solicitado',
				description: 'Saque criado e aguardando processamento',
			};
		case 'completed':
			return {
				title: 'Saque Concluído',
				description: 'Transferência realizada com sucesso',
			};
		case 'failed':
			return {
				title: 'Saque Falhou',
				description: 'Transferência não foi realizada',
			};
		default:
			return {
				title: 'Movimentação',
				description: 'Registro no ledger',
			};
	}
}

interface LedgerSectionProps {
	cashout: AdminCashoutDetails;
}

function LedgerSection({ cashout }: LedgerSectionProps) {
	const ledgerEntries = useMemo(() => cashout.ledgerEntries ?? [], [cashout.ledgerEntries]);

	const groupedTransactions = useMemo(() => {
		if (!ledgerEntries.length) return [];

		const groups: Record<string, AdminCashoutLedgerEntry[]> = {};
		for (const entry of ledgerEntries) {
			const groupId = entry.id;
			if (!groups[groupId]) {
				groups[groupId] = [];
			}
			groups[groupId].push(entry);
		}

		return Object.entries(groups)
			.map(([id, entries]): GroupedTransaction => {
				const type = getTransactionType(entries);
				const info = getTransactionInfo(type);
				return {
					id,
					timestamp: entries[0]!.createdAt,
					entries,
					type,
					...info,
				};
			})
			.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
	}, [ledgerEntries]);

	if (ledgerEntries.length === 0) {
		return null;
	}

	return (
		<div className="rounded-lg bg-surface-secondary p-4">
			<SectionTitle icon={<Icon icon={CheckListIcon} className="icon-sm" />} title="Histórico do Ledger" />

			<div className="relative mt-4">
				<div className="absolute left-5 top-0 bottom-0 w-px bg-foreground/10" />

				<div className="flex flex-col gap-4">
					{groupedTransactions.map((tx, index) => {
						const isLast = index === groupedTransactions.length - 1;
						const isRequested = tx.type === 'requested';
						const isCompleted = tx.type === 'completed';
						const isFailed = tx.type === 'failed';

						return (
							<div key={tx.id} className="relative pl-12">
								<div
									className={`absolute left-3 top-0 flex h-5 w-5 items-center justify-center rounded-full ${
										isRequested
											? 'bg-warning text-warning-foreground'
											: isCompleted
											? 'bg-success text-success-foreground'
											: isFailed
											? 'bg-danger text-danger-foreground'
											: 'bg-foreground/20 text-foreground'
									}`}
								>
									{isRequested ? (
										<Icon icon={HourglassIcon} className="icon-xs" />
									) : isCompleted ? (
										<Icon icon={CheckmarkCircle02Icon} className="icon-xs" />
									) : isFailed ? (
										<Icon icon={CancelCircleIcon} className="icon-xs" />
									) : (
										<Icon icon={ArrowRight01Icon} className="icon-xs" />
									)}
								</div>

								<div className="rounded-lg border border-foreground/10 bg-surface overflow-hidden">
									<div className="flex items-center justify-between gap-3 border-b border-foreground/5 bg-foreground/2 px-4 py-2">
										<div className="flex flex-col gap-0.5">
											<span className="text-sm font-medium text-foreground">{tx.title}</span>
										</div>
										<span className="text-xs text-foreground/40">{formatDate(tx.timestamp)}</span>
									</div>

									<div className="divide-y divide-foreground/5">
										{tx.entries.map((entry) => {
											const isCredit = entry.amount > 0;

											return (
												<div key={entry.id} className="flex items-center justify-between gap-3 px-4 py-2">
													<div className="flex items-center gap-3 min-w-0">
														<div className={`h-2 w-2 shrink-0 rounded-full ${isCredit ? 'bg-success' : 'bg-danger'}`} />
														<div className="flex flex-col gap-0.5 min-w-0">
															<span className="text-sm text-foreground truncate">{entry.description ?? entry.transactionType}</span>
															<span className="text-xs text-muted">Saldo após: {formatCurrency(entry.balanceAfter)}</span>
														</div>
													</div>
													<span
														className={`shrink-0 font-mono text-sm font-medium ${
															isCredit ? 'text-success' : 'text-danger'
														}`}
													>
														{isCredit ? '+' : ''}{formatCurrency(entry.amount)}
													</span>
												</div>
											);
										})}
									</div>
								</div>

								{!isLast && (
									<div
										className="absolute left-5 top-5 bottom-0 w-px bg-foreground/10"
										style={{ height: 'calc(100% + 16px)' }}
									/>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

function ContentSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-2 gap-4">
				{Array.from({ length: 8 }).map((_, i) => (
					<Skeleton key={i} className="h-12 rounded-lg" />
				))}
			</div>
		</div>
	);
}

function DetailsContent({ cashout }: { cashout: AdminCashoutDetails }) {
	const statusParse = payoutStatusParse[cashout.status];
	const pixKeyParse = pixKeyTypeParse[cashout.payoutAccount.pixKeyType];
	const hasLedgerEntries = cashout.ledgerEntries && cashout.ledgerEntries.length > 0;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 pb-4 border-b border-divider">
				<div className="flex flex-col gap-1">
					<span className="text-2xl sm:text-3xl font-bold text-foreground">{formatCurrency(cashout.amount)}</span>
					<span className="text-sm text-foreground/70">Total debitado da conta</span>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<div className="flex flex-col gap-1">
						<span className="text-xs text-foreground/60">Status</span>
						<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="md" className="gap-1">
							{statusParse.icon}
							{statusParse.label}
						</Chip>
					</div>
				</div>
			</div>

			<div className="rounded-lg bg-surface-secondary p-4">
				<SectionTitle icon={<Icon icon={DollarCircleIcon} className="icon-sm" />} title="Valores" />
				<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
					<DetailRow label="Total Debitado" value={formatCurrency(cashout.amount)} />
					<DetailRow label="Taxa Plataforma" value={<span className="text-danger">{formatCurrency(cashout.feeAmount)}</span>} />
					<DetailRow label="Taxa Adquirente" value={<span className="text-danger">{formatCurrency(cashout.acquirerFeeAmount)}</span>} />
					<DetailRow
						label={cashout.safefyProfitAmount < 0 ? 'Prejuízo Safefy' : 'Lucro Safefy'}
						value={
							<span
								className={
									cashout.safefyProfitAmount > 0
										? 'text-success'
										: cashout.safefyProfitAmount < 0
										? 'text-danger'
										: 'text-foreground'
								}
							>
								{formatCurrency(cashout.safefyProfitAmount)}
							</span>
						}
					/>
					<DetailRow label="Valor Recebido" value={<span className="text-success">{formatCurrency(cashout.netAmount)}</span>} />
				</div>
			</div>

			<div className="rounded-lg bg-surface-secondary p-4">
				<SectionTitle icon={<Icon icon={InformationCircleIcon} className="icon-sm" />} title="Informações Gerais" />
				<div className="grid grid-cols-2 gap-4">
					<DetailRow label="ID" value={<CopyableValue value={cashout.id} label="ID" />} mono />
					<DetailRow label="Solicitado em" value={formatDate(cashout.requestedAt)} />
					{cashout.processedAt && (
						<DetailRow label="Processado em" value={formatDate(cashout.processedAt)} />
					)}
					{cashout.completedAt && (
						<DetailRow label="Concluído em" value={formatDate(cashout.completedAt)} />
					)}
					{cashout.failureReason && (
						<div className="col-span-2">
							<DetailRow label="Motivo da Falha" value={cashout.failureReason} />
						</div>
					)}
					{cashout.acquirerTransactionId && (
						<DetailRow
							label="ID Adquirente"
							value={<CopyableValue value={cashout.acquirerTransactionId} label="ID Adquirente" />}
							mono
						/>
					)}
				</div>
			</div>

			<div className="rounded-lg bg-surface-secondary p-4">
				<SectionTitle icon={<Icon icon={Building02Icon} className="icon-sm" />} title="Organização" />
				<div className="grid grid-cols-2 gap-4">
					<DetailRow
						label="ID"
						value={<CopyableValue value={cashout.merchant.id} label="ID do Merchant" />}
						mono
					/>
					<DetailRow
						label="Nome"
						value={<AdminMerchantLink merchantId={cashout.merchant.id} name={cashout.merchant.name} />}
					/>
					<DetailRow label="Email" value={<EmailLink email={cashout.merchant.email} />} />
				</div>
			</div>

			{cashout.merchant.user && (
				<div className="rounded-lg bg-surface-secondary p-4">
					<SectionTitle icon={<Icon icon={UserIcon} className="icon-sm" />} title="Usuário Responsável" />
					<div className="grid grid-cols-2 gap-4">
						<DetailRow
							label="ID"
							value={<CopyableValue value={cashout.merchant.user.id} label="ID do Usuário" />}
							mono
						/>
						<DetailRow label="Nome" value={cashout.merchant.user.name ?? '-'} />
						<DetailRow label="Email" value={<EmailLink email={cashout.merchant.user.email} />} />
					</div>
				</div>
			)}

			<div className="rounded-lg bg-surface-secondary p-4">
				<SectionTitle icon={<Icon icon={Key01Icon} className="icon-sm" />} title="Conta de Destino" />
				<div className="grid grid-cols-2 gap-4">
					<DetailRow label="Chave PIX" value={<CopyableValue value={cashout.payoutAccount.pixKey} label="Chave PIX" />} mono />
					<DetailRow
						label="Tipo de Chave"
						value={
							<Chip variant="soft" size="sm" className="gap-1">
								{pixKeyParse.icon}
								{pixKeyParse.label}
							</Chip>
						}
					/>
					<DetailRow label="Titular" value={cashout.payoutAccount.holderName ?? '-'} />
					<DetailRow label="Documento" value={cashout.payoutAccount.holderDocument ?? '-'} />
				</div>
			</div>

			{cashout.acquirer && (
				<div className="rounded-lg bg-surface-secondary p-4">
					<SectionTitle icon={<Icon icon={Wallet01Icon} className="icon-sm" />} title="Adquirente" />
					<div className="grid grid-cols-2 gap-4">
						<DetailRow label="Nome" value={cashout.acquirer.name ?? '-'} />
						
						<DetailRow label="Nominal" value={cashout.acquirer.nominal ?? '-'} />
					</div>
				</div>
			)}

			{cashout.evaluation && (
				<div className="rounded-lg bg-surface-secondary p-4">
					<SectionTitle icon={<Icon icon={UserCheck01Icon} className="icon-sm" />} title="Avaliação" />
					<div className="grid grid-cols-2 gap-4">
						<DetailRow label="Avaliado em" value={formatDate(cashout.evaluation.evaluatedAt)} />
						<DetailRow
							label="Avaliado por"
							value={cashout.evaluation.evaluatedBy.name ?? cashout.evaluation.evaluatedBy.email}
						/>
						<DetailRow label="Email do Avaliador" value={<EmailLink email={cashout.evaluation.evaluatedBy.email} />} />
					</div>
				</div>
			)}

			{hasLedgerEntries && <LedgerSection cashout={cashout} />}
		</div>
	);
}

function ModalContent({
	cashoutPromise,
	canReprocess,
	onReprocessed,
}: {
	cashoutPromise: CashoutPromise;
	canReprocess: boolean;
	onReprocessed: () => void;
}) {
	const response = use(cashoutPromise);
	const cashout = response?.data;
	const [isReprocessModalOpen, setIsReprocessModalOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	if (response?.error) {
		return (
			<div className="flex flex-col items-center justify-center py-12 gap-4">
				<Icon icon={InformationCircleIcon} className="icon-lg text-danger" />
				<p className="text-muted">{response.error.message}</p>
			</div>
		);
	}

	if (!cashout) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<p className="text-muted">Saque não encontrado</p>
			</div>
		);
	}

	const cashoutId = cashout.id;

	async function handleReprocess(targetStatus: AdminReprocessCashoutTargetStatus) {
		startTransition(async () => {
			const result = await adminReprocessCompletedCashoutDev(cashoutId, { targetStatus });

			if (result?.error) {
				toast.danger(result.error.message || 'Falha ao reprocessar saque.');
				return;
			}

			toast.success(result?.message || 'Saque reprocessado com sucesso.');
			setIsReprocessModalOpen(false);
			onReprocessed();
		});
	}

	return (
		<>
			<Modal.Header>
				<Modal.Icon className="bg-accent text-accent-foreground">
					<Icon icon={Wallet01Icon} className="icon-md" />
				</Modal.Icon>
				<Modal.Heading>Detalhes do Saque</Modal.Heading>
				<p className="text-sm text-muted">Informações completas do saque</p>
			</Modal.Header>
			<Modal.Body>
				<DetailsContent cashout={cashout} />
			</Modal.Body>
			{canReprocess && cashout.status !== 'Completed' && (
				<Modal.Footer>
					<Button variant="secondary" isDisabled={isPending} onPress={() => setIsReprocessModalOpen(true)}>
						<Icon icon={ArrowRight01Icon} className="icon-sm" />
						<span>Reprocessar saque</span>
					</Button>
				</Modal.Footer>
			)}

			<AdminReprocessConfirmModal
				isOpen={isReprocessModalOpen}
				onOpenChange={setIsReprocessModalOpen}
				title="Reprocessar saque"
				description="Selecione o status de destino para reprocessar este saque."
				confirmLabel="Reprocessar saque"
				statusLabel="Status de destino"
				acknowledgeLabel="Estou ciente do impacto operacional deste reprocessamento."
				options={[
					{
						value: 'Completed',
						label: payoutStatusParse.Completed.label,
						color: payoutStatusParse.Completed.color,
						icon: payoutStatusParse.Completed.icon,
					},
					{
						value: 'Failed',
						label: payoutStatusParse.Failed.label,
						color: payoutStatusParse.Failed.color,
						icon: payoutStatusParse.Failed.icon,
					},
					{
						value: 'Rejected',
						label: payoutStatusParse.Rejected.label,
						color: payoutStatusParse.Rejected.color,
						icon: payoutStatusParse.Rejected.icon,
					},
				]}
				defaultStatus="Completed"
				isPending={isPending}
				onConfirm={async (targetStatus) => {
					await handleReprocess(targetStatus as AdminReprocessCashoutTargetStatus);
				}}
			/>
		</>
	);
}

export function AdminCashoutDetailsModal({
	isOpen,
	onOpenChange,
	cashoutPromise,
	canReprocess,
	onReprocessed,
}: AdminCashoutDetailsModalProps) {
	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-4xl">
					<Modal.CloseTrigger />
					{cashoutPromise && (
						<Suspense
							fallback={
								<>
									<Modal.Header>
										<Modal.Icon className="bg-accent text-accent-foreground">
											<Icon icon={Wallet01Icon} className="icon-md" />
										</Modal.Icon>
										<Modal.Heading>Detalhes do Saque</Modal.Heading>
										<p className="text-sm text-muted">Informações completas do saque</p>
									</Modal.Header>
									<Modal.Body>
										<ContentSkeleton />
									</Modal.Body>
								</>
							}
						>
							<ModalContent
								cashoutPromise={cashoutPromise}
								canReprocess={canReprocess}
								onReprocessed={onReprocessed}
							/>
						</Suspense>
					)}
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

