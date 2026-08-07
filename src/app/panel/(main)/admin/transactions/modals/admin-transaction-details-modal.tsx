'use client';

import { Suspense, use, useState, useTransition } from 'react';
import { Modal, Chip, Skeleton, Tabs, Button, toast } from '@heroui/react';
import {
	Building02Icon,
	UserIcon,
	Wallet01Icon,
	Link01Icon,
	InformationCircleIcon,
	DollarCircleIcon,
	CheckListIcon,
	HourglassIcon,
	CheckmarkCircle02Icon,
	MenuTwoLineIcon,
	ArrowRight01Icon,
	WalletRemove01Icon,
	Analytics01Icon,
	File01Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { InternalTabs, type InternalTabItem } from '@/components/ui/internal-tabs';
import type {
	AdminTransactionDetails,
	AdminTransactionLedgerData,
	AdminTransactionLedgerEntryData,
	AdminReprocessTransactionTargetStatus,
} from '@/types/admin/transactions';
import { LedgerEntryType, AccountType } from '@/types/enums';
import {
	paymentStatusParse,
	paymentMethodParse,
	callbackStatusParse,
	mapParseColorToChipColor,
	accountTypeParse,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import {
	adminGetTransactionLedger,
	adminReprocessCompletedTransactionDev,
} from '@/app/actions/admin/transactions';
import { EmailLink, DocumentDisplay, ExternalLink } from '@/components/ui/data-links';
import { DetailRow, CopyableValue, SectionTitle } from '@/components/ui/detail-components';
import { BoletoBarcodeImage } from '@/components/ui/boleto-barcode-image';
import type { ApiResponse } from '@/types/common';
import { AdminMerchantLink } from '@/components/admin/admin-merchant-link';
import { AdminReprocessConfirmModal } from '@/components/admin/admin-reprocess-confirm-modal';

type TransactionPromise = Promise<ApiResponse<AdminTransactionDetails>>;
type LedgerPromise = Promise<ApiResponse<AdminTransactionLedgerData>>;

interface AdminTransactionDetailsModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	transactionPromise: TransactionPromise | null;
	canReprocess: boolean;
	onReprocessed: () => void;
}

function LedgerTabSkeleton() {
	return (
		<div className="flex flex-col gap-5">
			<div className="grid grid-cols-3 gap-3 rounded-lg border border-foreground/10 bg-surface p-4">
				{[...Array(3)].map((_, i) => (
					<div key={i} className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<Skeleton className="size-4 rounded" />
							<Skeleton className="h-3 w-24 rounded" />
						</div>
						<Skeleton className="h-5 w-20 rounded" />
					</div>
				))}
			</div>

			<div className="relative">
				<div className="absolute left-5 top-0 bottom-0 w-px bg-foreground/10" />

				<div className="flex flex-col gap-6">
					{[...Array(2)].map((_, txIndex) => (
						<div key={txIndex} className="relative pl-12">
							<Skeleton className="absolute left-3 top-0 size-5 rounded-full" />

							<div className="rounded-lg border border-foreground/10 bg-surface overflow-hidden">
								<div className="flex items-center justify-between gap-3 border-b border-foreground/5 bg-foreground/2 px-4 py-3">
									<div className="flex flex-col gap-0.5">
										<Skeleton className="h-4 w-40 rounded" />
										<Skeleton className="h-3 w-56 rounded" />
									</div>
									<Skeleton className="h-3 w-28 rounded" />
								</div>

								<div className="divide-y divide-foreground/5">
									{[...Array(txIndex === 0 ? 2 : 3)].map((_, entryIndex) => (
										<div key={entryIndex} className="flex items-center justify-between gap-3 px-4 py-2.5">
											<div className="flex items-center gap-3 min-w-0">
												<Skeleton className="h-2 w-2 rounded-full" />
												<div className="flex flex-col gap-0.5 min-w-0">
													<Skeleton className="h-4 w-48 rounded" />
													<Skeleton className="h-5 w-20 rounded" />
												</div>
											</div>
											<Skeleton className="h-4 w-24 rounded" />
										</div>
									))}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

interface GroupedTransaction {
	id: string;
	timestamp: string;
	entries: AdminTransactionLedgerEntryData[];
	type: 'pending' | 'confirmed' | 'refund' | 'other';
	title: string;
	description: string;
}

function getTransactionType(entries: AdminTransactionLedgerEntryData[]): GroupedTransaction['type'] {
	const descriptions = entries.map((e) => e.description.toLowerCase());

	if (descriptions.some((d) => d.includes('pendente'))) return 'pending';
	if (descriptions.some((d) => d.includes('confirmado') || d.includes('recebido'))) return 'confirmed';
	if (descriptions.some((d) => d.includes('estorno'))) return 'refund';
	return 'other';
}

function getTransactionInfo(type: GroupedTransaction['type']): { title: string; description: string } {
	switch (type) {
		case 'pending':
			return {
				title: 'Pagamento Criado',
				description: 'QR Code gerado, aguardando pagamento do cliente',
			};
		case 'confirmed':
			return {
				title: 'Pagamento Confirmado',
				description: 'PIX recebido e processado com sucesso',
			};
		case 'refund':
			return {
				title: 'Estorno Realizado',
				description: 'Valor devolvido ao pagador',
			};
		default:
			return {
				title: 'Movimentação',
				description: 'Registro no ledger',
			};
	}
}

interface LedgerTabContentProps {
	ledgerPromise: LedgerPromise;
}

function LedgerContent({ ledgerPromise }: LedgerTabContentProps) {
	const response = use(ledgerPromise);
	const ledgerData = response?.data;

	if (response?.error) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<Icon icon={InformationCircleIcon} className="icon-xl text-danger mb-3" />
				<p className="text-muted">{response.error.message}</p>
			</div>
		);
	}

	if (!ledgerData || ledgerData.entries.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<Icon icon={CheckListIcon} className="icon-xl text-muted-foreground mb-3" />
				<p className="text-muted-foreground">Nenhum registro no ledger para esta transação</p>
			</div>
		);
	}

	const groups: Record<string, AdminTransactionLedgerEntryData[]> = {};
	for (const entry of ledgerData.entries) {
		if (!groups[entry.transactionId]) {
			groups[entry.transactionId] = [];
		}
		groups[entry.transactionId]!.push(entry);
	}

	const groupedTransactions = Object.entries(groups)
		.map(([id, entries]): GroupedTransaction => {
			const type = getTransactionType(entries);
			const info = getTransactionInfo(type);
			return {
				id,
				timestamp: entries[0]!.timestamp,
				entries,
				type,
				...info,
			};
		})
		.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

	return (
		<div className="flex flex-col gap-5">
			<div className="grid grid-cols-3 gap-3 rounded-lg border border-foreground/10 bg-surface p-4">
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<Icon icon={Wallet01Icon} className="icon-sm" />
						<span>Taxa Plataforma</span>
					</div>
					<span className="font-mono text-sm font-medium text-foreground">
						{formatCurrency(ledgerData.platformFee)}
					</span>
				</div>
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<Icon icon={WalletRemove01Icon} className="icon-sm" />
						<span>Taxa Adquirente</span>
					</div>
					<span className="font-mono text-sm font-medium text-foreground">
						{formatCurrency(ledgerData.acquirerFee)}
					</span>
				</div>
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<Icon icon={Analytics01Icon} className="icon-sm" />
						<span>{ledgerData.profit < 0 ? 'Prejuízo SwiftPay' : 'Lucro SwiftPay'}</span>
					</div>
					<span
						className={`font-mono text-sm font-medium ${
							ledgerData.profit > 0 ? 'text-success' : ledgerData.profit < 0 ? 'text-danger' : 'text-foreground'
						}`}
					>
						{formatCurrency(ledgerData.profit)}
					</span>
				</div>
			</div>

			<div className="relative">
				<div className="absolute left-5 top-0 bottom-0 w-px bg-foreground/10" />

				<div className="flex flex-col gap-6">
					{groupedTransactions.map((tx, index) => {
						const isLast = index === groupedTransactions.length - 1;
						const isPending = tx.type === 'pending';
						const isConfirmed = tx.type === 'confirmed';

						return (
							<div key={tx.id} className="relative pl-12">
								<div
									className={`absolute left-3 top-0 flex h-5 w-5 items-center justify-center rounded-full ${
										isPending
											? 'bg-warning text-warning-foreground'
											: isConfirmed
											? 'bg-success text-success-foreground'
											: 'bg-foreground/20 text-foreground'
									}`}
								>
									{isPending ? (
										<Icon icon={HourglassIcon} className="icon-xs" />
									) : isConfirmed ? (
										<Icon icon={CheckmarkCircle02Icon} className="icon-xs" />
									) : (
										<Icon icon={ArrowRight01Icon} className="icon-xs" />
									)}
								</div>

								<div className="rounded-lg border border-foreground/10 bg-surface overflow-hidden">
									<div className="flex items-center justify-between gap-3 border-b border-foreground/5 bg-foreground/2 px-4 py-3">
										<div className="flex flex-col gap-0.5">
											<span className="text-sm font-medium text-foreground">{tx.title}</span>
											<span className="text-xs text-muted-foreground">{tx.description}</span>
										</div>
										<span className="text-xs text-muted-foreground">{formatDate(tx.timestamp)}</span>
									</div>

									<div className="divide-y divide-foreground/5">
										{tx.entries.map((entry) => {
											const accountParsed = accountTypeParse[entry.account.type as AccountType];
											const isCredit = entry.type === LedgerEntryType.Credit;

											return (
												<div key={entry.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
													<div className="flex items-center gap-3 min-w-0">
														<div className={`h-2 w-2 shrink-0 rounded-full ${isCredit ? 'bg-success' : 'bg-danger'}`} />
														<div className="flex flex-col gap-0.5 min-w-0">
															<span className="text-sm text-foreground truncate">{entry.description}</span>
															<div className="flex items-center gap-1.5">
																<Chip variant="soft" size="sm" className="h-5 text-xs">
																	{accountParsed?.label ?? entry.account.type}
																</Chip>
															</div>
														</div>
													</div>
													<span
														className={`shrink-0 font-mono text-sm font-medium ${
															isCredit ? 'text-success' : 'text-danger'
														}`}
													>
														{isCredit ? '+' : '-'} {formatCurrency(entry.amount)}
													</span>
												</div>
											);
										})}
									</div>
								</div>

								{!isLast && (
									<div
										className="absolute left-5 top-5 bottom-0 w-px bg-foreground/10"
										style={{ height: 'calc(100% + 24px)' }}
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
		<div className="flex flex-col gap-6 p-4">
			<div className="grid grid-cols-2 gap-4">
				{Array.from({ length: 8 }).map((_, i) => (
					<Skeleton key={i} className="h-12 rounded-lg" />
				))}
			</div>
		</div>
	);
}

function DetailsContent({ transaction }: { transaction: AdminTransactionDetails }) {
	const statusParse = paymentStatusParse[transaction.status];
	const methodParse = paymentMethodParse[transaction.method];
	const callbackParse = callbackStatusParse[transaction.callbackStatus];

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 pb-4 border-b border-divider">
				<div className="flex flex-col gap-1">
					<span className="text-2xl sm:text-3xl font-bold text-foreground">{formatCurrency(transaction.amount)}</span>
					<span className="text-sm text-foreground/70">Valor da transação</span>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<div className="flex flex-col gap-1">
						<span className="text-xs text-foreground/60">Status</span>
						<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="md" className="gap-1">
							{statusParse.icon}
							{statusParse.label}
						</Chip>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs text-foreground/60">Método</span>
						<Chip variant="soft" color={mapParseColorToChipColor(methodParse.color)} size="md" className="gap-1">
							{methodParse.icon}
							{methodParse.label}
						</Chip>
					</div>
				</div>
			</div>

			<div className="rounded-lg bg-surface-secondary p-4">
				<SectionTitle icon={<Icon icon={DollarCircleIcon} className="icon-sm" />} title="Valores" />
				<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
					<DetailRow label="Valor Bruto" value={formatCurrency(transaction.amount)} />
					<DetailRow label="Taxa Plataforma" value={formatCurrency(transaction.platformFee)} />
					{transaction.checkoutFeeAmount > 0 && (
						<DetailRow label="Taxa do Checkout" value={formatCurrency(transaction.checkoutFeeAmount)} />
					)}
					{transaction.reserveDeductedAmount > 0 && (
						<DetailRow
							label="Desconto de reserva financeira"
							value={<span className="font-medium text-warning">-{formatCurrency(transaction.reserveDeductedAmount)}</span>}
						/>
					)}
					<DetailRow label="Valor Líquido" value={formatCurrency(transaction.netAmount)} />
					<DetailRow label="Taxa Adquirente" value={formatCurrency(transaction.acquirerFee)} />
					<DetailRow label="Líquido Adquirente" value={formatCurrency(transaction.acquirerNetAmount)} />
					<DetailRow
						label={transaction.profit < 0 ? 'Prejuízo SwiftPay' : 'Lucro SwiftPay'}
						value={
							<span
								className={
									transaction.profit > 0
										? 'text-success'
										: transaction.profit < 0
										? 'text-danger'
										: 'text-foreground'
								}
							>
								{formatCurrency(transaction.profit)}
							</span>
						}
					/>
				</div>
			</div>

			<div className="rounded-lg bg-surface-secondary p-4">
				<SectionTitle icon={<Icon icon={InformationCircleIcon} className="icon-sm" />} title="Informações Gerais" />
				<div className="grid grid-cols-2 gap-4">
					<DetailRow label="ID" value={<CopyableValue value={transaction.id} label="ID" />} mono />
					<DetailRow label="ID Externo" value={transaction.externalId ?? '-'} mono />
					<div className="col-span-2">
						<DetailRow
							label="Link de visualização"
							value={
								<ExternalLink
									url={transaction.transactionVisualizationUrl}
									fallback="Não configurado"
								/>
							}
							mono
						/>
					</div>
					<DetailRow label="Descrição" value={transaction.description ?? '-'} />
					<DetailRow label="Origin da Requisição" value={transaction.requestOrigin ?? '-'} />
					<DetailRow label="Criado em" value={formatDate(transaction.createdAt)} />
					<DetailRow label="Concluído em" value={formatDate(transaction.completedAt)} />
					<DetailRow label="Expira em" value={formatDate(transaction.expiresAt)} />
					{transaction.refundedAt && <DetailRow label="Reembolsado em" value={formatDate(transaction.refundedAt)} />}
					{transaction.failureReason && (
						<div className="col-span-2">
							<DetailRow label="Motivo da Falha" value={transaction.failureReason} />
						</div>
					)}
				</div>
			</div>

			<div className="rounded-lg bg-surface-secondary p-4">
				<SectionTitle icon={<Icon icon={Building02Icon} className="icon-sm" />} title="Organização" />
				<div className="grid grid-cols-2 gap-4">
					<DetailRow
						label="ID"
						value={<CopyableValue value={transaction.merchant.id} label="ID do Merchant" />}
						mono
					/>
					<DetailRow
						label="Nome"
						value={<AdminMerchantLink merchantId={transaction.merchant.id} name={transaction.merchant.name} />}
					/>
					<DetailRow label="Email" value={<EmailLink email={transaction.merchant.email} />} />
				</div>
			</div>

			{transaction.acquirer && (
				<div className="rounded-lg bg-surface-secondary p-4">
					<SectionTitle icon={<Icon icon={Wallet01Icon} className="icon-sm" />} title="Adquirente" />
					<div className="grid grid-cols-2 gap-4">
						<DetailRow label="Nome" value={transaction.acquirer.name ?? '-'} />					{transaction.acquirer.nominal && (
						<DetailRow label="Nominal" value={<span className="italic text-muted">{transaction.acquirer.nominal}</span>} />
					)}						<DetailRow label="Status" value={transaction.acquirer.status ?? '-'} />
						<DetailRow
							label="Transaction ID"
							value={<CopyableValue value={transaction.acquirer.transactionId} label="Transaction ID" />}
							mono
						/>
						<DetailRow
							label="Payment ID"
							value={<CopyableValue value={transaction.acquirer.paymentId} label="Payment ID" />}
							mono
						/>
					</div>
				</div>
			)}

			{transaction.customer && (
				<div className="rounded-lg bg-surface-secondary p-4">
					<SectionTitle icon={<Icon icon={UserIcon} className="icon-sm" />} title="Cliente" />
					<div className="grid grid-cols-2 gap-4">
						<DetailRow label="Nome" value={transaction.customer.name ?? '-'} />
						<DetailRow label="Email" value={<EmailLink email={transaction.customer.email} />} />
						<DetailRow label="Documento" value={<DocumentDisplay document={transaction.customer.document} />} />
					</div>
				</div>
			)}

			{transaction.pix && (
				<div className="rounded-lg bg-surface-secondary p-4">
					<SectionTitle icon={<Icon icon={Wallet01Icon} className="icon-sm" />} title="Dados PIX" />
					<div className="grid grid-cols-2 gap-4">
						<DetailRow label="TxId" value={<CopyableValue value={transaction.pix.txId} label="TxId" />} mono />
						<DetailRow
							label="EndToEndId"
							value={<CopyableValue value={transaction.pix.endToEndId} label="EndToEndId" />}
							mono
						/>
						<DetailRow label="Nome do Pagador" value={transaction.pix.payerName ?? '-'} />
						<DetailRow label="Documento do Pagador" value={<DocumentDisplay document={transaction.pix.payerDocument} />} />
						<DetailRow label="Banco do Pagador" value={transaction.pix.payerBank ?? '-'} />
						<DetailRow label="Pago em" value={formatDate(transaction.pix.paidAt)} />
						{transaction.pix.expiresAt && (
							<DetailRow label="Expira em" value={formatDate(transaction.pix.expiresAt)} />
						)}
					</div>
					{transaction.pix.copyAndPaste && (
						<div className="mt-4">
							<DetailRow
								label="Copia e Cola"
								value={<CopyableValue value={transaction.pix.copyAndPaste} label="PIX Copia e Cola" />}
								mono
							/>
						</div>
					)}
				</div>
			)}

			{transaction.boleto && (
				<div className="rounded-lg bg-surface-secondary p-4">
					<SectionTitle icon={<Icon icon={File01Icon} className="icon-sm" />} title="Dados do Boleto" />
					<BoletoBarcodeImage
						barcode={transaction.boleto.barcode}
						digitableLine={transaction.boleto.digitableLine}
						className="mb-4"
					/>
					<div className="grid grid-cols-2 gap-4">
						<div className="col-span-2">
							<DetailRow
								label="Link de visualização"
								value={<ExternalLink url={transaction.transactionVisualizationUrl} fallback="Não configurado" />}
								mono
							/>
						</div>
						<DetailRow
							label="Código de Barras"
							value={<CopyableValue value={transaction.boleto.barcode} label="Código de Barras" />}
							mono
						/>
						<DetailRow
							label="Linha Digitável"
							value={<CopyableValue value={transaction.boleto.digitableLine} label="Linha Digitável" />}
							mono
						/>
						<DetailRow label="Vencimento" value={formatDate(transaction.boleto.dueDate)} />
					</div>
				</div>
			)}

			<div className="rounded-lg bg-surface-secondary p-4">
				<SectionTitle icon={<Icon icon={Link01Icon} className="icon-sm" />} title="Callback/Webhook" />
				<div className="grid grid-cols-2 gap-4">
					<DetailRow
						label="Status"
						value={
							<Chip
								variant="soft"
								color={mapParseColorToChipColor(callbackParse.color)}
								size="sm"
								className="gap-1"
							>
								{callbackParse.icon}
								{callbackParse.label}
							</Chip>
						}
					/>
					<DetailRow label="Tentativas" value={String(transaction.callbackAttempts)} />
					<div className="col-span-2">
						<DetailRow label="URL" value={<ExternalLink url={transaction.callbackUrl} fallback="Não configurado" />} mono />
					</div>
					{transaction.callbackLastAttemptAt && (
						<DetailRow label="Última Tentativa" value={formatDate(transaction.callbackLastAttemptAt)} />
					)}
					{transaction.callbackError && (
						<div className="col-span-2">
							<DetailRow label="Erro" value={transaction.callbackError} />
						</div>
					)}
				</div>
			</div>

			{transaction.metadata && (
				<div className="rounded-lg bg-surface-secondary p-4">
					<SectionTitle icon={<Icon icon={InformationCircleIcon} className="icon-sm" />} title="Metadata" />
					<pre className="text-xs font-mono bg-background p-3 rounded-lg overflow-auto max-h-40">
						{JSON.stringify(JSON.parse(transaction.metadata), null, 2)}
					</pre>
				</div>
			)}
		</div>
	);
}

function ModalContent({
	transactionPromise,
	canReprocess,
	onReprocessed,
}: {
	transactionPromise: TransactionPromise;
	canReprocess: boolean;
	onReprocessed: () => void;
}) {
	const response = use(transactionPromise);
	const transaction = response?.data;
	const [activeTab, setActiveTab] = useState('details');
	const [ledgerPromise, setLedgerPromise] = useState<LedgerPromise | null>(null);
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

	if (!transaction) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<p className="text-muted">Transação não encontrada</p>
			</div>
		);
	}

	const transactionId = transaction.id;
	const tabItems: InternalTabItem[] = [
		{ id: 'details', label: 'Detalhes', icon: <Icon icon={InformationCircleIcon} className="icon-sm" /> },
		{ id: 'ledger', label: 'Ledger', icon: <Icon icon={CheckListIcon} className="icon-sm" /> },
	];

	function handleTabChange(key: string) {
		setActiveTab(key);
		if (key === 'ledger' && !ledgerPromise && transaction) {
			setLedgerPromise(adminGetTransactionLedger(transaction.id));
		}
	}

	async function handleReprocess(targetStatus: AdminReprocessTransactionTargetStatus) {
		startTransition(async () => {
			const result = await adminReprocessCompletedTransactionDev(transactionId, { targetStatus });

			if (result?.error) {
				toast.danger(result.error.message || 'Falha ao reprocessar transação.');
				return;
			}

			toast.success(result?.message || 'Transação reprocessada com sucesso.');
			setIsReprocessModalOpen(false);
			onReprocessed();
		});
	}

	return (
		<>
			<Modal.Header>
				<Modal.Icon className="bg-accent text-accent-foreground">
					<Icon icon={DollarCircleIcon} className="icon-md" />
				</Modal.Icon>
				<Modal.Heading>Detalhes da Transação</Modal.Heading>
				<p className="text-sm text-muted">Informações completas da transação</p>
			</Modal.Header>
			<Modal.Body>
				<InternalTabs
					ariaLabel="Abas de detalhes da transação"
					items={tabItems}
					selectedKey={activeTab}
					onSelectionChange={(key) => handleTabChange(key as string)}
				>

					<Tabs.Panel id="details" className="p-0">
						<DetailsContent transaction={transaction} />
					</Tabs.Panel>

					<Tabs.Panel id="ledger" className="p-0">
						{ledgerPromise && (
							<Suspense fallback={<LedgerTabSkeleton />}>
								<LedgerContent ledgerPromise={ledgerPromise} />
							</Suspense>
						)}
						{!ledgerPromise && <LedgerTabSkeleton />}
					</Tabs.Panel>
				</InternalTabs>
			</Modal.Body>
			{canReprocess && transaction.status !== 'Completed' && (
				<Modal.Footer>
					<Button variant="secondary" isDisabled={isPending} onPress={() => setIsReprocessModalOpen(true)}>
						<Icon icon={MenuTwoLineIcon} className="icon-sm" />
						<span>Reprocessar transação</span>
					</Button>
				</Modal.Footer>
			)}

			<AdminReprocessConfirmModal
				isOpen={isReprocessModalOpen}
				onOpenChange={setIsReprocessModalOpen}
				title="Reprocessar transação"
				description="Selecione o status de destino para reprocessar esta transação."
				confirmLabel="Reprocessar transação"
				statusLabel="Status de destino"
				acknowledgeLabel="Estou ciente do impacto operacional deste reprocessamento."
				options={[
					{
						value: 'Completed',
						label: paymentStatusParse.Completed.label,
						color: paymentStatusParse.Completed.color,
						icon: paymentStatusParse.Completed.icon,
					},
					{
						value: 'Failed',
						label: paymentStatusParse.Failed.label,
						color: paymentStatusParse.Failed.color,
						icon: paymentStatusParse.Failed.icon,
					},
				]}
				defaultStatus="Completed"
				isPending={isPending}
				onConfirm={async (targetStatus) => {
					await handleReprocess(targetStatus as AdminReprocessTransactionTargetStatus);
				}}
			/>
		</>
	);
}

export function AdminTransactionDetailsModal({
	isOpen,
	onOpenChange,
	transactionPromise,
	canReprocess,
	onReprocessed,
}: AdminTransactionDetailsModalProps) {
	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-4xl">
					<Modal.CloseTrigger />
					{transactionPromise && (
						<Suspense
							fallback={
								<>
									<Modal.Header>
										<Modal.Icon className="bg-accent text-accent-foreground">
											<Icon icon={DollarCircleIcon} className="icon-md" />
										</Modal.Icon>
										<Modal.Heading>Detalhes da Transação</Modal.Heading>
										<p className="text-sm text-muted">Informações completas da transação</p>
									</Modal.Header>
									<Modal.Body>
										<ContentSkeleton />
									</Modal.Body>
								</>
							}
						>
							<ModalContent
								transactionPromise={transactionPromise}
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

