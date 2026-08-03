'use client';

import { Suspense, use } from 'react';
import { Modal, Card, Chip, Skeleton, Disclosure, DisclosureGroup } from '@heroui/react';
import {
	Clock04Icon,
	CheckmarkCircle02Icon,
	Alert01Icon,
	MoneyReceive02Icon,
	MoneyRemoveIcon,
	PercentCircleIcon,
	ArrowDataTransferHorizontalIcon,
	Wallet01Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import {
	bankReconciliationStatusParse,
	mapParseColorToChipColor,
} from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import type { BalanceHistoryDetails, BalanceCorrection } from '@/types/merchant/balance-history';
import type { ApiResponse } from '@/types/common';

type DetailsPromise = Promise<ApiResponse<BalanceHistoryDetails>>;

interface BalanceHistoryDetailsModalProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	detailsPromise: DetailsPromise | null;
}

function ContentSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<Skeleton className="h-32 rounded-lg" />
			<Skeleton className="h-48 rounded-lg" />
			<Skeleton className="h-24 rounded-lg" />
		</div>
	);
}

function getSeverityColor(severity: string): 'default' | 'warning' | 'danger' {
	switch (severity.toLowerCase()) {
		case 'high':
			return 'danger';
		case 'medium':
			return 'warning';
		default:
			return 'default';
	}
}

function CorrectionItem({ correction }: { correction: BalanceCorrection }) {
	const severityColor = getSeverityColor(correction.severity);

	return (
		<Card className="p-4">
			<div className="flex flex-col gap-3">
				<div className="flex items-start justify-between gap-2">
					<div className="flex items-center gap-2">
						<Icon icon={Alert01Icon} className="icon-sm text-warning" />
						<span className="font-medium">{correction.typeLabel}</span>
					</div>
					<div className="flex items-center gap-2">
						<Chip variant="soft" color={severityColor} size="sm">
							{correction.severityLabel}
						</Chip>
						{correction.wasCorrected && (
							<Chip variant="soft" color="success" size="sm" className="gap-1">
								<Icon icon={CheckmarkCircle02Icon} className="icon-xs" />
								Corrigido
							</Chip>
						)}
					</div>
				</div>

				<p className="text-sm text-muted">{correction.description}</p>

				{(correction.expectedAmount !== 0 || correction.actualAmount !== 0) && (
					<div className="flex flex-wrap gap-4 pt-2 border-t border-divider">
						<div className="flex flex-col">
							<span className="text-xs text-muted">Valor Esperado</span>
							<span className="font-medium">{formatCurrency(correction.expectedAmount)}</span>
						</div>
						<div className="flex flex-col">
							<span className="text-xs text-muted">Valor Encontrado</span>
							<span className="font-medium">{formatCurrency(correction.actualAmount)}</span>
						</div>
						{correction.difference !== 0 && (
							<div className="flex flex-col">
								<span className="text-xs text-muted">Diferença</span>
								<span className={correction.difference > 0 ? 'font-medium text-success' : 'font-medium text-danger'}>
									{correction.difference > 0 ? '+' : ''}{formatCurrency(correction.difference)}
								</span>
							</div>
						)}
					</div>
				)}

				{correction.correctionDescription && (
					<p className="text-sm text-success mt-2 bg-success/10 p-2 rounded">
						{correction.correctionDescription}
					</p>
				)}
			</div>
		</Card>
	);
}

function ModalContent({ detailsPromise }: { detailsPromise: DetailsPromise }) {
	const response = use(detailsPromise);
	const data = response?.data;

	if (response?.error) {
		return (
			<Modal.Body>
				<div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
					<Icon icon={Alert01Icon} className="icon-lg text-danger" />
					<p className="text-danger">{response.error.message}</p>
				</div>
			</Modal.Body>
		);
	}

	if (!data) {
		return (
			<Modal.Body>
				<div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
					<Icon icon={Clock04Icon} className="icon-lg text-muted" />
					<p className="text-muted">Detalhes não encontrados</p>
				</div>
			</Modal.Body>
		);
	}

	const statusParse = bankReconciliationStatusParse[data.status];
	const { balance, transactions, corrections } = data;
	const hasCorrections = corrections.length > 0;

	return (
		<>
			<Modal.Header>
				<Modal.Icon className="bg-accent text-accent-foreground">
					<Icon icon={Clock04Icon} className="icon-md" />
				</Modal.Icon>
				<Modal.Heading>Detalhes da Correção de Saldo</Modal.Heading>
				<p className="text-sm text-muted">
					Verificação realizada em {formatDate(data.processedAt)}
				</p>
			</Modal.Header>
			<Modal.Body>
				<div className="flex flex-col gap-6">
					{/* Status e Resumo */}
					<div className="flex flex-col gap-4">
						<div className="flex items-center gap-2">
							<span className="text-sm text-muted">Status:</span>
							<Chip variant="soft" color={mapParseColorToChipColor(statusParse.color)} size="sm" className="gap-1">
								{statusParse.icon}
								{statusParse.label}
							</Chip>
						</div>

						{hasCorrections && (
							<div className="bg-success/10 border border-success-soft-hover rounded-lg p-4">
								<div className="flex items-center gap-2">
									<Icon icon={CheckmarkCircle02Icon} className="icon-md text-success" />
									<span className="font-medium text-success">
										{corrections.length} correção(ões) aplicada(s) automaticamente
									</span>
								</div>
							</div>
						)}
					</div>

					{/* Comparação de Saldo */}
					<Card className="p-0 overflow-hidden">
						<div className="bg-surface-soft p-4 border-b border-divider">
							<div className="flex items-center gap-2">
								<Icon icon={Wallet01Icon} className="icon-md text-accent" />
								<span className="font-medium">Comparação de Saldo</span>
							</div>
						</div>
						<div className="p-4">
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div className="flex flex-col gap-1 p-3 bg-surface-secondary rounded-lg">
									<span className="text-xs text-muted">Saldo Anterior</span>
									<span className="text-lg font-semibold">{formatCurrency(balance.previousBalance)}</span>
								</div>
								<div className="flex flex-col gap-1 p-3 bg-surface-secondary rounded-lg">
									<span className="text-xs text-muted">Novo Saldo</span>
									<span className="text-lg font-semibold">{formatCurrency(balance.newBalance)}</span>
								</div>
								<div className={`flex flex-col gap-1 p-3 rounded-lg ${balance.balanceChange === 0 ? 'bg-surface-secondary' : balance.isPositiveChange ? 'bg-success/10' : 'bg-danger/10'}`}>
									<span className="text-xs text-muted">Diferença</span>
									{balance.balanceChange === 0 ? (
										<span className="text-lg font-semibold text-muted">Sem alteração</span>
									) : (
										<div className="flex items-center gap-2">
											<span className={`text-lg font-semibold ${balance.isPositiveChange ? 'text-success' : 'text-danger'}`}>
												{balance.isPositiveChange ? '+' : ''}{formatCurrency(balance.balanceChange)}
											</span>
											<Chip variant="soft" color={balance.isPositiveChange ? 'success' : 'danger'} size="sm">
												{balance.isPositiveChange ? 'Adição' : 'Redução'}
											</Chip>
										</div>
									)}
								</div>
							</div>

							{balance.balanceChange !== 0 && (
								<p className="text-sm text-muted mt-4 bg-surface-soft p-3 rounded-lg">
									{balance.isPositiveChange
										? '✓ Foi identificado que seu saldo estava menor do que deveria. O valor foi corrigido automaticamente e adicionado à sua conta.'
										: '✓ Foi identificado que seu saldo estava maior do que deveria. O valor foi corrigido automaticamente para refletir o saldo real da sua conta.'}
								</p>
							)}
						</div>
					</Card>

					{/* Timeline de Movimentações Analisadas */}
					<Card className="p-0 overflow-hidden">
						<div className="bg-surface-soft p-4 border-b border-divider">
							<div className="flex items-center gap-2">
								<Icon icon={ArrowDataTransferHorizontalIcon} className="icon-md text-accent" />
								<span className="font-medium">Movimentações Analisadas ({transactions.totalTransactionsAnalyzed} transações)</span>
							</div>
						</div>
						<div className="p-4">
							<div className="flex flex-col gap-3">
								<div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
									<div className="flex items-center gap-2">
										<Icon icon={MoneyReceive02Icon} className="icon-sm text-success" />
										<span className="text-sm">Recebimentos ({transactions.totalPayments})</span>
									</div>
									<span className="font-medium text-success">{formatCurrency(transactions.totalPaymentsAmount)}</span>
								</div>
								<div className="flex items-center justify-between p-3 bg-danger/10 rounded-lg">
									<div className="flex items-center gap-2">
										<Icon icon={MoneyRemoveIcon} className="icon-sm text-danger" />
										<span className="text-sm">Saques ({transactions.totalPayouts})</span>
									</div>
									<span className="font-medium text-danger">-{formatCurrency(transactions.totalPayoutsAmount)}</span>
								</div>
								<div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
									<div className="flex items-center gap-2">
										<Icon icon={PercentCircleIcon} className="icon-sm text-warning" />
										<span className="text-sm">Taxas</span>
									</div>
									<span className="font-medium text-warning">-{formatCurrency(transactions.totalFees)}</span>
								</div>
								<div className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg">
									<div className="flex items-center gap-2">
										<Icon icon={ArrowDataTransferHorizontalIcon} className="icon-sm text-muted" />
										<span className="text-sm">Estornos ({transactions.totalRefunds})</span>
									</div>
									<span className="font-medium text-muted">-{formatCurrency(transactions.totalRefundsAmount)}</span>
								</div>
								<div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg border border-accent-soft-hover">
									<div className="flex items-center gap-2">
										<Icon icon={Wallet01Icon} className="icon-sm text-accent" />
										<span className="text-sm font-medium">Novo Saldo</span>
									</div>
									<span className="font-semibold text-accent">{formatCurrency(balance.newBalance)}</span>
								</div>
							</div>
						</div>
					</Card>

					{/* Correções Encontradas */}
					{corrections.length > 0 && (
						<DisclosureGroup>
							<Disclosure id="corrections">
								<Disclosure.Trigger>
									<div className="flex items-center gap-2">
										<Icon icon={Alert01Icon} className="icon-sm text-warning" />
										<span className="font-medium">Inconsistências Encontradas ({corrections.length})</span>
									</div>
								</Disclosure.Trigger>
								<Disclosure.Content>
									<div className="flex flex-col gap-4 pt-4">
										<p className="text-sm text-muted">
											Abaixo estão as inconsistências identificadas durante a verificação do seu saldo.
											Todas foram corrigidas automaticamente pelo nosso sistema.
										</p>
										{corrections.map((correction) => (
											<CorrectionItem key={correction.id} correction={correction} />
										))}
									</div>
								</Disclosure.Content>
							</Disclosure>
						</DisclosureGroup>
					)}

					{/* Seção Informativa */}
					<div className="bg-surface-soft border border-divider rounded-lg p-4">
						<div className="flex flex-col gap-2">
							<span className="text-sm font-medium text-foreground">Por que isso acontece?</span>
							<p className="text-sm text-muted">
								Pequenas diferenças podem ocorrer devido a processamentos simultâneos de múltiplas transações,
								falhas de comunicação temporárias, ou situações excepcionais. Nosso sistema monitora constantemente
								sua conta e aplica correções automaticamente para garantir que seu saldo esteja sempre correto.
							</p>
						</div>
					</div>
				</div>
			</Modal.Body>
		</>
	);
}

export function BalanceHistoryDetailsModal({
	isOpen,
	onOpenChange,
	detailsPromise,
}: BalanceHistoryDetailsModalProps) {
	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-2xl">
					<Modal.CloseTrigger />
					{detailsPromise && (
						<Suspense
							fallback={
								<>
									<Modal.Header>
										<Modal.Icon className="bg-accent text-accent-foreground">
											<Icon icon={Clock04Icon} className="icon-md" />
										</Modal.Icon>
										<Modal.Heading>Detalhes da Correção de Saldo</Modal.Heading>
										<p className="text-sm text-muted">Carregando informações...</p>
									</Modal.Header>
									<Modal.Body>
										<ContentSkeleton />
									</Modal.Body>
								</>
							}
						>
							<ModalContent detailsPromise={detailsPromise} />
						</Suspense>
					)}
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

