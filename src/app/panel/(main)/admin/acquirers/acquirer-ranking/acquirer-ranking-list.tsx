'use client';

import { use, useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Avatar, Modal, toast } from '@heroui/react';
import { Award05Icon, HelpCircleIcon, Loading03Icon, RefreshIcon, SearchVisualIcon, ServerStack01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { MultiSelectChips } from '@/components/ui/multi-select-chips';
import { adminGetAcquirerRanking, adminTriggerRankingReprocess } from '@/app/actions/admin/ranking';
import { acquirerOperationTypeParse, mapParseColorToChipColor } from '@/parse';
import { formatRelativeTime } from '@/utils/datetime';
import { AcquirerOperationType } from '@/types/enums';
import type { ApiResponse } from '@/types/common';
import type { AdminAcquirerRankingData } from '@/types/admin/ranking';

type AcquirerRankingPromise = Promise<ApiResponse<AdminAcquirerRankingData>>;

interface AcquirerRankingListProps {
	fetchPromise: AcquirerRankingPromise;
	selectedOperationTypes: AcquirerOperationType[];
}

const OPERATION_FILTER_OPTIONS = [AcquirerOperationType.Black, AcquirerOperationType.White].map((type) => {
	const parsed = acquirerOperationTypeParse[type];
	return {
		id: type,
		label: parsed.label,
		icon: parsed.icon,
		chipColor: mapParseColorToChipColor(parsed.color),
		chipClassName: parsed.className,
	};
});

function formatApprovalRate(value: number): string {
	return `${value.toFixed(2)}%`;
}

type RankingApprovalGaugeLevel = {
	label: string;
	chipColor: 'default' | 'accent' | 'success' | 'warning' | 'danger';
	chipClassName?: string;
};

type RankingScoreGaugeLevel = {
	chipColor: 'default' | 'accent' | 'success' | 'warning' | 'danger';
	chipClassName?: string;
};

function getApprovalGaugeLevel(approvalRate: number): RankingApprovalGaugeLevel {
	if (approvalRate >= 50) {
		return { label: 'Excelente', chipColor: 'success' };
	}

	if (approvalRate >= 35) {
		return { label: 'Bom', chipColor: 'accent' };
	}

	if (approvalRate >= 25) {
		return {
			label: 'Média',
			chipColor: 'default',
			chipClassName: 'text-amber-500'
		};
	}

	if (approvalRate >= 15) {
		return { label: 'Abaixo', chipColor: 'warning' };
	}

	return { label: 'Crítico', chipColor: 'danger' };
}

function getScoreGaugeLevel(score: number): RankingScoreGaugeLevel {
	if (score >= 850) {
		return { chipColor: 'success' };
	}

	if (score >= 700) {
		return { chipColor: 'accent' };
	}

	if (score >= 500) {
		return {
			chipColor: 'default',
			chipClassName: 'text-amber-500'
		};
	}

	if (score >= 300) {
		return { chipColor: 'warning' };
	}

	return { chipColor: 'danger' };
}

function getWeightedComponentGaugeLevel(componentValue: number, maxComponentValue: number): RankingScoreGaugeLevel {
	if (maxComponentValue <= 0) {
		return getScoreGaugeLevel(0);
	}

	const normalized = Math.min(Math.max(componentValue / maxComponentValue, 0), 1);
	const normalizedScore = Math.round(normalized * 1000);

	return getScoreGaugeLevel(normalizedScore);
}

const SCORE_APPROVAL_WEIGHT = 10;
const SCORE_ANALYZED_WEIGHT = 5;
const SCORE_FAILURE_WEIGHT = 5;
const SCORE_TOTAL_WEIGHT = SCORE_APPROVAL_WEIGHT + SCORE_ANALYZED_WEIGHT + SCORE_FAILURE_WEIGHT;

type ScoreBreakdown = {
	approvalRate: number;
	failureRate: number;
	approvalComponent: number;
	analyzedComponent: number;
	inverseFailureComponent: number;
	totalComponent: number;
	calculatedScore: number;
};

function calculateScoreBreakdown(entry: AdminAcquirerRankingData['items'][number], sampleSize: number): ScoreBreakdown {
	if (entry.analyzedTransactions <= 0 || sampleSize <= 0) {
		return {
			approvalRate: 0,
			failureRate: 0,
			approvalComponent: 0,
			analyzedComponent: 0,
			inverseFailureComponent: 0,
			totalComponent: 0,
			calculatedScore: 0
		};
	}

	const approvalRate = entry.approvalRate;
	const failureRate = (entry.failedTransactions / entry.analyzedTransactions) * 100;

	const approvalNormalized = approvalRate / 100;
	const analyzedNormalized = Math.min(Math.max(entry.analyzedTransactions / sampleSize, 0), 1);
	const inverseFailureNormalized = 1 - (failureRate / 100);

	const approvalComponent = approvalNormalized * SCORE_APPROVAL_WEIGHT;
	const analyzedComponent = analyzedNormalized * SCORE_ANALYZED_WEIGHT;
	const inverseFailureComponent = inverseFailureNormalized * SCORE_FAILURE_WEIGHT;
	const totalComponent = approvalComponent + analyzedComponent + inverseFailureComponent;
	const normalizedScore = totalComponent / SCORE_TOTAL_WEIGHT;
	const calculatedScore = Math.min(Math.max(Math.round(normalizedScore * 1000), 0), 1000);

	return {
		approvalRate,
		failureRate,
		approvalComponent,
		analyzedComponent,
		inverseFailureComponent,
		totalComponent,
		calculatedScore
	};
}

export function AcquirerRankingList({ fetchPromise, selectedOperationTypes }: AcquirerRankingListProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [, startFilterTransition] = useTransition();
	const [isRefreshPending, startRefreshTransition] = useTransition();
	const [scoreDetailsEntry, setScoreDetailsEntry] = useState<AdminAcquirerRankingData['items'][number] | null>(null);
	const [liveDataState, setLiveDataState] = useState<{ key: string; data: AdminAcquirerRankingData } | null>(null);

	const response = use(fetchPromise);
	const selectedOperationTypesKey = [...selectedOperationTypes].sort().join(',');
	const liveData = liveDataState?.key === selectedOperationTypesKey ? liveDataState.data : null;
	const data = liveData ?? response?.data;
	const isRankingProcessing = data?.status === 'Processing';
	const items = data?.items ?? [];
	const calculatedAt = data?.calculatedAt ?? null;
	const sampleSize = data?.sampleSize ?? 1000;

	useEffect(() => {
		if (!isRankingProcessing) {
			return;
		}

		let cancelled = false;

		const intervalId = setInterval(() => {
			adminGetAcquirerRanking({ operationTypes: selectedOperationTypes }).then((rankingResponse) => {
				if (!cancelled && rankingResponse?.data) {
					setLiveDataState({
						key: selectedOperationTypesKey,
						data: rankingResponse.data,
					});
				}
			});
		}, 2000);

		return () => {
			cancelled = true;
			clearInterval(intervalId);
		};
	}, [isRankingProcessing, selectedOperationTypes, selectedOperationTypesKey]);

	function navigate(nextValues: {
		operationTypes?: string[];
	}) {
		startFilterTransition(() => {
			const params = new URLSearchParams(searchParams.toString());

			if (nextValues.operationTypes && nextValues.operationTypes.length > 0) {
				params.set('operationTypes', nextValues.operationTypes.join(','));
			} else {
				params.delete('operationTypes');
			}

			router.push(`${pathname}?${params.toString()}`, { scroll: false });
		});
	}

	function handleOperationTypesChange(values: string[]) {
		const normalized = values.filter(
			(value): value is AcquirerOperationType =>
				value === AcquirerOperationType.Black || value === AcquirerOperationType.White
		);
		const currentSorted = [...selectedOperationTypes].sort().join(',');
		const nextSorted = [...normalized].sort().join(',');

		if (currentSorted === nextSorted) {
			return;
		}

		navigate({ operationTypes: normalized });
	}

	function handleRefresh() {
		startRefreshTransition(async () => {
			const triggerResponse = await adminTriggerRankingReprocess();

			if (triggerResponse?.error) {
				toast.danger(triggerResponse.error.message || 'Não foi possível iniciar a atualização do ranking.');
				return;
			}

			toast.success(triggerResponse?.message || 'Atualização do ranking iniciada.');

			const rankingResponse = await adminGetAcquirerRanking({ operationTypes: selectedOperationTypes });
			if (rankingResponse?.data) {
				setLiveDataState({
					key: selectedOperationTypesKey,
					data: rankingResponse.data,
				});
			}
		});
	}

	function handleOpenScoreDetails(entry: AdminAcquirerRankingData['items'][number]) {
		setScoreDetailsEntry(entry);
	}

	function handleCloseScoreDetails() {
		setScoreDetailsEntry(null);
	}

	const scoreBreakdown = scoreDetailsEntry ? calculateScoreBreakdown(scoreDetailsEntry, sampleSize) : null;
	const _approvalBreakdownLevel = scoreBreakdown ? getApprovalGaugeLevel(scoreBreakdown.approvalRate) : null;
	const _analyzedBreakdownLevel = scoreBreakdown ? getWeightedComponentGaugeLevel(scoreBreakdown.analyzedComponent, SCORE_ANALYZED_WEIGHT) : null;
	const _failureBreakdownLevel = scoreBreakdown ? getWeightedComponentGaugeLevel(scoreBreakdown.inverseFailureComponent, SCORE_FAILURE_WEIGHT) : null;
	const _finalScoreBreakdownLevel = scoreBreakdown ? getScoreGaugeLevel(scoreBreakdown.calculatedScore) : null;

	const top1 = items[0] ?? null;
	const avgApprovalRate = items.length > 0
		? items.reduce((sum, item) => sum + item.approvalRate, 0) / items.length
		: 0;
	const totalAnalyzedTransactions = items.reduce((sum, item) => sum + item.analyzedTransactions, 0);

	return (
		<>
		<div className="flex flex-col gap-6 text-white">
			{/* Executive Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
				<div>
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-link border border-brand/25">
							<Icon icon={Award05Icon} className="icon-sm text-link" />
						</div>
						<h1 className="text-xl font-bold tracking-tight text-white">Ranking de Processadoras</h1>
					</div>
					<p className="text-xs text-white/50 mt-1">
						Classificação por score e taxa de conversão PIX com base nas últimas {sampleSize} transações por adquirente
					</p>
				</div>

				<div className="flex items-center gap-2">
					{calculatedAt && (
						<span className="text-xs font-mono text-white/40">
							Atualizado {formatRelativeTime(calculatedAt)}
						</span>
					)}
					{isRankingProcessing && (
						<div className="flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-mono text-warning">
							<Icon icon={Loading03Icon} className="icon-xs animate-spin" />
							<span>Processando</span>
						</div>
					)}
					<button
						type="button"
						onClick={handleRefresh}
						disabled={isRefreshPending}
						className="button-outline-dark cursor-pointer text-xs"
					>
						<Icon icon={RefreshIcon} className={`icon-xs ${isRefreshPending ? 'animate-spin' : ''}`} />
						<span>{isRefreshPending ? 'Atualizando...' : 'Atualizar Ranking'}</span>
					</button>
				</div>
			</div>

			{/* 3-Tile High Contrast KPI Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<div className="rounded-[20px] border border-white/12 bg-card p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Líder de Conversão
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/15 text-success border border-success/30">
							<Icon icon={Award05Icon} className="icon-xs text-success" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-success tracking-tight tabular-nums block truncate">
							{top1 ? (top1.displayName ?? top1.name) : '—'}
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">
							{top1 ? `Score ${top1.score}/1000 • ${formatApprovalRate(top1.approvalRate)} aprovação` : 'Sem dados'}
						</p>
					</div>
				</div>

				<div className="rounded-[20px] border border-white/12 bg-card p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Taxa Média de Aprovação
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-link border border-brand/30">
							<Icon icon={Award05Icon} className="icon-xs" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
							{formatApprovalRate(avgApprovalRate)}
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Média ponderada da plataforma</p>
					</div>
				</div>

				<div className="rounded-[20px] border border-white/12 bg-card p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Transações Auditadas
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<Icon icon={ServerStack01Icon} className="icon-xs" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
							{totalAnalyzedTransactions}
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Amostragem em tempo real</p>
					</div>
				</div>
			</div>

			{/* Ranking List */}
			<div className="rounded-[20px] border border-white/12 bg-card p-5 sm:p-6 space-y-5">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/8 pb-4">
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-link border border-brand/30">
							<Icon icon={Award05Icon} className="icon-xs" />
						</div>
						<span className="text-sm font-bold text-white">Classificação das Processadoras</span>
						<span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-mono text-white/60">
							{items.length} ativas
						</span>
					</div>
					<div className="flex min-w-64 flex-col gap-1">
						<MultiSelectChips
							label="Tipo de operação"
							placeholder="Selecione os tipos"
							options={OPERATION_FILTER_OPTIONS}
							value={selectedOperationTypes}
							onChange={(keys) => handleOperationTypesChange(keys.map((key) => String(key)))}
							selectedText="{count} tipo(s) selecionado(s)"
						/>
					</div>
				</div>

				{items.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-2 py-12 text-white/40">
						<Icon icon={SearchVisualIcon} size={32} />
						<p className="text-xs">Nenhuma processadora encontrada para os filtros selecionados.</p>
					</div>
				) : (
					<div className="flex flex-col gap-2.5">
						{items.map((entry) => {
							const _approvalGaugeLevel = getApprovalGaugeLevel(entry.approvalRate);

							return (
								<div
									key={entry.acquirerId}
									className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-white/8 bg-surface-deep p-4 hover:border-white/15 transition-colors"
								>
									<div className="flex items-center gap-3">
										<div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-extrabold ${entry.position === 1 ? 'bg-success/20 text-success border border-success/40' : entry.position === 2 ? 'bg-brand/20 text-link border border-brand/40' : 'bg-white/5 text-white/60 border border-white/10'}`}>
											#{entry.position}
										</div>
										{entry.logoUrl ? (
											<Avatar size="sm" className="bg-white/5 border border-white/10">
												<Avatar.Image src={entry.logoUrl} alt={entry.displayName ?? entry.name} />
												<Avatar.Fallback>
													<Icon icon={ServerStack01Icon} className="icon-sm text-link" />
												</Avatar.Fallback>
											</Avatar>
										) : (
											<div className="flex size-8 items-center justify-center rounded-lg bg-brand/15 text-link border border-brand/25">
												<Icon icon={ServerStack01Icon} className="icon-sm" />
											</div>
										)}
										<div>
											<p className="text-sm font-bold text-white">{entry.displayName ?? entry.name}</p>
											<div className="flex flex-wrap gap-1 pt-1">
												{entry.operationTypes.map((operationTypeItem) => {
													const parsed = acquirerOperationTypeParse[operationTypeItem];
													return (
														<span
															key={`${entry.acquirerId}-${operationTypeItem}`}
															className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-mono text-white/80"
														>
															{parsed.icon}
															{parsed.label}
														</span>
													);
												})}
											</div>
										</div>
									</div>

									<div className="flex items-center gap-4 sm:ml-auto">
										<div className="text-right">
											<p className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Aprovação</p>
											<span className="font-mono text-sm font-bold text-success tabular-nums">
												{formatApprovalRate(entry.approvalRate)}
											</span>
										</div>
										<div className="text-right">
											<p className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Score</p>
											<span className="font-mono text-sm font-bold text-white tabular-nums">
												{entry.score}<span className="text-white/40 text-xs">/1000</span>
											</span>
										</div>
										<button
											type="button"
											onClick={() => handleOpenScoreDetails(entry)}
											aria-label={`Ver detalhes do cálculo de score da processadora ${entry.displayName ?? entry.name}`}
											className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
										>
											<Icon icon={HelpCircleIcon} className="icon-xs" />
										</button>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>

		<Modal.Backdrop isOpen={scoreDetailsEntry !== null} onOpenChange={handleCloseScoreDetails}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-2xl rounded-[28px] border border-white/12 bg-card p-6 text-white">
					<Modal.CloseTrigger className="text-white/40 hover:text-white" />
					<Modal.Header className="pb-4 border-b border-white/8">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-link border border-brand/30">
								<Icon icon={HelpCircleIcon} className="icon-md" />
							</div>
							<div>
								<Modal.Heading className="text-base font-bold text-white">Cálculo do Score de Conversão</Modal.Heading>
								<p className="text-xs text-white/50">
									{scoreDetailsEntry ? (scoreDetailsEntry.displayName ?? scoreDetailsEntry.name) : ''}
								</p>
							</div>
						</div>
					</Modal.Header>

					<Modal.Body className="py-4">
						{scoreDetailsEntry && scoreBreakdown && (
							<div className="flex flex-col gap-4 text-sm">
								<div className="rounded-xl border border-white/8 bg-surface-deep p-4">
									<p className="font-bold text-xs text-white/70 uppercase tracking-wider">Fórmula de Ponderação</p>
									<div className="mt-2 flex flex-col gap-1 text-xs text-white/60">
										<p>1. Taxa de aprovação entra com peso 10.</p>
										<p>2. Volume analisado entra com peso 5.</p>
										<p>3. Eficiência contra falhas (1 - taxa de falha) entra com peso 5.</p>
										<p>4. A soma ponderada é normalizada e convertida para escala de 0 a 1000.</p>
									</div>
									<div className="mt-3 rounded-xl border border-white/8 bg-white/5 p-3">
										<p className="text-[11px] font-mono text-white/40">Aplicação desta processadora</p>
										<p className="font-mono text-xs font-semibold text-success mt-1">
											(({formatApprovalRate(scoreBreakdown.approvalRate)}/100 × 10) + ({scoreDetailsEntry.analyzedTransactions}/{sampleSize} × 5) + ((1 - {formatApprovalRate(scoreBreakdown.failureRate)}/100) × 5)) ÷ 20 × 1000
										</p>
									</div>
								</div>

								<div className="rounded-xl border border-white/8 bg-surface-deep p-4">
									<p className="font-bold text-xs text-white/70 uppercase tracking-wider mb-3">Métricas Auditadas</p>
									<div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
										<div className="rounded-xl border border-white/8 bg-white/5 p-3">
											<div className="flex items-center justify-between gap-2">
												<p className="text-xs text-white/50">Taxa de aprovação</p>
												<span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
													Peso {SCORE_APPROVAL_WEIGHT}
												</span>
											</div>
											<p className="font-mono text-sm font-bold text-white mt-1">
												{formatApprovalRate(scoreBreakdown.approvalRate)} → {scoreBreakdown.approvalComponent.toFixed(2)}/10
											</p>
										</div>

										<div className="rounded-xl border border-white/8 bg-white/5 p-3">
											<div className="flex items-center justify-between gap-2">
												<p className="text-xs text-white/50">Volume analisado</p>
												<span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-white/70">
													Peso {SCORE_ANALYZED_WEIGHT}
												</span>
											</div>
											<p className="font-mono text-sm font-bold text-white mt-1">
												{scoreDetailsEntry.analyzedTransactions}/{sampleSize} → {scoreBreakdown.analyzedComponent.toFixed(2)}/5
											</p>
										</div>

										<div className="rounded-xl border border-white/8 bg-white/5 p-3">
											<div className="flex items-center justify-between gap-2">
												<p className="text-xs text-white/50">Taxa de falha</p>
												<span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-mono text-red-400">
													Peso {SCORE_FAILURE_WEIGHT}
												</span>
											</div>
											<p className="font-mono text-sm font-bold text-white mt-1">
												{formatApprovalRate(scoreBreakdown.failureRate)} → {scoreBreakdown.inverseFailureComponent.toFixed(2)}/5
											</p>
										</div>

										<div className="rounded-xl border border-white/12 bg-brand/10 p-3">
											<div className="flex items-center justify-between gap-2">
												<p className="text-xs text-link font-bold">Score Final</p>
												<span className="rounded-full border border-brand/30 bg-brand/20 px-2 py-0.5 text-[10px] font-mono text-link">
													0 a 1000
												</span>
											</div>
											<p className="font-mono text-base font-extrabold text-white mt-1">
												{scoreBreakdown.totalComponent.toFixed(2)}/20 → <span className="text-success">{scoreBreakdown.calculatedScore}</span>/1000
											</p>
										</div>
									</div>
								</div>
							</div>
						)}
					</Modal.Body>

					<Modal.Footer className="pt-4 border-t border-white/8 flex items-center justify-end">
						<button
							type="button"
							onClick={handleCloseScoreDetails}
							className="button-outline-dark cursor-pointer text-xs"
						>
							Fechar
						</button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
		</>
	);
}
