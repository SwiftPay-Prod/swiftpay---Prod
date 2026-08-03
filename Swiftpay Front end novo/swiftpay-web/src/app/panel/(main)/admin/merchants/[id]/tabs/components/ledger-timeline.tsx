'use client';

import { use, useMemo, Suspense } from 'react';
import { Chip } from '@heroui/react';
import { LedgerTimelineSkeleton } from './ledger-timeline-skeleton';
import type { AdminPaymentLedgerData, AdminLedgerEntryData } from '@/types/admin/merchants';
import type { ApiResponse } from '@/types/common';
import { LedgerEntryType, AccountType } from '@/types/enums';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/datetime';
import { accountTypeParse } from '@/parse';
import {
	Analytics01Icon,
	ArrowRight01Icon,
	CheckListIcon,
	CheckmarkCircle02Icon,
	HourglassIcon,
	Wallet01Icon,
	WalletRemove01Icon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';

type LedgerPromise = Promise<ApiResponse<AdminPaymentLedgerData>>;

interface LedgerTimelineProps {
	fetchPromise: LedgerPromise;
}

interface GroupedTransaction {
	id: string;
	timestamp: string;
	entries: AdminLedgerEntryData[];
	type: 'pending' | 'confirmed' | 'refund' | 'other';
	title: string;
	description: string;
}

function getTransactionType(entries: AdminLedgerEntryData[]): GroupedTransaction['type'] {
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

export function LedgerTimeline({ fetchPromise }: LedgerTimelineProps) {
	return (
		<Suspense fallback={<LedgerTimelineSkeleton />}>
			<LedgerTimelineContent fetchPromise={fetchPromise} />
		</Suspense>
	);
}

function LedgerTimelineContent({ fetchPromise }: LedgerTimelineProps) {
	const response = use(fetchPromise);
	const ledgerData = response?.data ?? null;

	const groupedTransactions = useMemo(() => {
		if (!ledgerData?.entries) return [];

		const groups: Record<string, AdminLedgerEntryData[]> = {};
		for (const entry of ledgerData.entries) {
		if (!groups[entry.transactionId]) {
				groups[entry.transactionId] = [];
			}
			groups[entry.transactionId]!.push(entry);
		}

		return Object.entries(groups)
			.map(([id, entries]): GroupedTransaction => {
				const type = getTransactionType(entries);
				const info = getTransactionInfo(type);
				return {
					id,
					timestamp: entries[0]?.timestamp ?? '',
					entries,
					type,
					...info,
				};
			})
			.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
	}, [ledgerData]);

	if (response?.error) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<p className="text-foreground/60">{response.error.message ?? 'Erro ao carregar o ledger'}</p>
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
						<span>Lucro SwiftPay</span>
					</div>
					<span
						className={`font-mono text-sm font-medium ${ledgerData.profit > 0 ? 'text-success' : ledgerData.profit < 0 ? 'text-danger' : 'text-foreground'}`}
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
												<div
													key={entry.id}
													className="flex items-center justify-between gap-3 px-4 py-2.5"
												>
													<div className="flex items-center gap-3 min-w-0">
														<div
															className={`h-2 w-2 shrink-0 rounded-full ${isCredit ? 'bg-success' : 'bg-danger'}`}
														/>
														<div className="flex flex-col gap-0.5 min-w-0">
															<span className="text-sm text-foreground truncate">
																{entry.description}
															</span>
															<div className="flex items-center gap-1.5">
																<Chip variant="soft" size="sm" className="h-5 text-[10px]">
																	{accountParsed?.label ?? entry.account.type}
																</Chip>
															</div>
														</div>
													</div>
													<span
														className={`shrink-0 font-mono text-sm font-medium ${isCredit ? 'text-success' : 'text-danger'}`}
													>
														{isCredit ? '+' : '-'} {formatCurrency(entry.amount)}
													</span>
												</div>
											);
										})}
									</div>
								</div>

								{!isLast && (
									<div className="absolute left-5 top-5 bottom-0 w-px bg-foreground/10" style={{ height: 'calc(100% + 24px)' }} />
								)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
