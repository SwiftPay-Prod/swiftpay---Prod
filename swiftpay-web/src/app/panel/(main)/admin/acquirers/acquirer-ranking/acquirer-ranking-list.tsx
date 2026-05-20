'use client';

import { use, useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Avatar, Button, Card, Chip, Modal, Tooltip, toast } from '@heroui/react';
import { Award05Icon, HelpCircleIcon, Loading03Icon, RefreshIcon, SearchVisualIcon, ServerStack01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { MultiSelectChips } from '@/components/ui/multi-select-chips';
import { PageHeader } from '@/components/ui/page-header';
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
	const approvalBreakdownLevel = scoreBreakdown ? getApprovalGaugeLevel(scoreBreakdown.approvalRate) : null;
	const analyzedBreakdownLevel = scoreBreakdown ? getWeightedComponentGaugeLevel(scoreBreakdown.analyzedComponent, SCORE_ANALYZED_WEIGHT) : null;
	const failureBreakdownLevel = scoreBreakdown ? getWeightedComponentGaugeLevel(scoreBreakdown.inverseFailureComponent, SCORE_FAILURE_WEIGHT) : null;
	const finalScoreBreakdownLevel = scoreBreakdown ? getScoreGaugeLevel(scoreBreakdown.calculatedScore) : null;

	return (
		<>
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={Award05Icon} className="icon-md text-accent-foreground" />}
				title="Ranking de processadoras"
				description={`Classificação pela taxa de aprovação com base nas últimas ${sampleSize} transações mais recentes por processadora.`}
			/>
			<Card>
				<Card.Header>
					<div className="flex w-full flex-col gap-2">
						<div className="flex items-center justify-between gap-2">
							<div className="flex items-center gap-2">
								<Icon icon={Award05Icon} className="icon-sm text-accent" />
								<span className="text-base font-bold">Aprovação por processadora</span>
							</div>
							<div className="flex items-center gap-1.5">
								{calculatedAt && (
									<Tooltip>
										<Tooltip.Trigger>
											<span className="text-xs text-muted">Atualizado {formatRelativeTime(calculatedAt)}</span>
										</Tooltip.Trigger>
										<Tooltip.Content>
											<Tooltip.Arrow />
											A classificação é recalculada conforme os filtros selecionados.
										</Tooltip.Content>
									</Tooltip>
								)}
								{isRankingProcessing && (
									<Chip size="sm" variant="primary" color="warning">
										<div className="flex items-center gap-1.5">
											<Icon icon={Loading03Icon} className="icon-xs animate-spin" />
											<span>Processando ranking</span>
										</div>
									</Chip>
								)}
								<Button
									variant="secondary"
									size="sm"
									onPress={handleRefresh}
									isPending={isRefreshPending}
									aria-label="Atualizar ranking"
									className="min-w-30"
								>
									<div className="flex items-center gap-1.5">
										<Icon icon={RefreshIcon} className="icon-xs" />
										<span>{isRefreshPending ? 'Atualizando...' : 'Atualizar'}</span>
									</div>
								</Button>
							</div>
						</div>

						<div className="flex flex-wrap items-end gap-2">
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
					</div>
				</Card.Header>

				<Card.Content className="px-3 pb-3">
					{items.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-2 py-12 text-muted">
							<Icon icon={SearchVisualIcon} size={32} />
							<p className="text-sm">Nenhuma processadora encontrada para os filtros selecionados.</p>
						</div>
					) : (
						<div className="flex flex-col gap-1">
							{items.map((entry) => {
								const approvalGaugeLevel = getApprovalGaugeLevel(entry.approvalRate);
								const scoreGaugeLevel = getScoreGaugeLevel(entry.score);

								return (
								<div
									key={entry.acquirerId}
									className="flex flex-wrap items-center gap-2 rounded-xl border border-divider bg-content1 p-2"
								>
									<div className="w-8 shrink-0 text-center text-sm font-bold text-accent">
										#{entry.position}
									</div>
									{entry.logoUrl ? (
										<Avatar size="sm">
											<Avatar.Image src={entry.logoUrl} alt={entry.displayName ?? entry.name} />
											<Avatar.Fallback>
												<Icon icon={ServerStack01Icon} className="icon-sm text-accent" />
											</Avatar.Fallback>
										</Avatar>
									) : (
										<div className="flex size-8 items-center justify-center rounded-lg bg-accent/10">
											<Icon icon={ServerStack01Icon} className="icon-sm text-accent" />
										</div>
									)}
									<div className="min-w-52 flex-1">
										<p className="text-sm font-semibold text-foreground">{entry.displayName ?? entry.name}</p>
										<div className="flex flex-wrap gap-1 pt-1">
											{entry.operationTypes.map((operationTypeItem) => {
												const parsed = acquirerOperationTypeParse[operationTypeItem];
												return (
													<Chip key={`${entry.acquirerId}-${operationTypeItem}`} size="sm" variant="primary" className={parsed.className}>
														{parsed.icon}
														{parsed.label}
													</Chip>
												);
											})}
										</div>
									</div>
									<div className="w-full sm:w-auto sm:ml-auto flex flex-col items-start sm:items-end gap-0.5 text-left sm:text-right">
										<div className="flex items-center gap-1">
											<Button
												isIconOnly
												size="sm"
												variant="ghost"
												onPress={() => handleOpenScoreDetails(entry)}
												aria-label={`Ver detalhes do cálculo de score da processadora ${entry.displayName ?? entry.name}`}
											>
												<Icon icon={HelpCircleIcon} className="icon-xs text-muted" />
											</Button>
											<Chip
												color={mapParseColorToChipColor(scoreGaugeLevel.chipColor)}
												variant="soft"
												size="sm"
												className={`max-w-full ${scoreGaugeLevel.chipClassName ?? ''}`.trim()}
											>
												Score {entry.score}/1000
											</Chip>
										</div>
										<Chip
											color={mapParseColorToChipColor(approvalGaugeLevel.chipColor)}
											variant="soft"
											size="sm"
											className={`max-w-full ${approvalGaugeLevel.chipClassName ?? ''}`.trim()}
										>
											Taxa de aprovação: {formatApprovalRate(entry.approvalRate)} • {approvalGaugeLevel.label}
										</Chip>
										<span className="text-xs text-muted">{entry.analyzedTransactions} analisadas</span>
										<span className="text-xs text-muted">{entry.approvedTransactions} aprovadas</span>
									</div>
								</div>
								);
							})}
						</div>
					)}
				</Card.Content>
			</Card>
		</div>

		<Modal.Backdrop isOpen={scoreDetailsEntry !== null} onOpenChange={handleCloseScoreDetails}>
			<Modal.Container size="lg" placement="center" scroll="outside">
				<Modal.Dialog className="max-w-2xl">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={HelpCircleIcon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Cálculo do score da processadora</Modal.Heading>
						<p className="text-sm text-muted">
							{scoreDetailsEntry ? (scoreDetailsEntry.displayName ?? scoreDetailsEntry.name) : ''}
						</p>
					</Modal.Header>

					<Modal.Body>
						{scoreDetailsEntry && scoreBreakdown && (
							<div className="flex flex-col gap-3 text-sm">
								<div className="rounded-lg border border-divider bg-content2 p-3">
									<p className="font-semibold text-foreground">Fórmula</p>
									<div className="mt-2 flex flex-col gap-1.5 text-muted">
										<p>1. Taxa de aprovação entra com peso 10.</p>
										<p>2. Volume analisado entra com peso 5.</p>
										<p>3. Eficiência contra falhas (1 - taxa de falha) entra com peso 5.</p>
										<p>4. A soma ponderada é normalizada e convertida para escala de 0 a 1000.</p>
									</div>
									<div className="mt-2 rounded-md border border-divider bg-content1 p-2">
										<p className="text-xs text-muted">Aplicação desta processadora</p>
										<p className="font-medium text-foreground">
											(({formatApprovalRate(scoreBreakdown.approvalRate)}/100 × 10) + ({scoreDetailsEntry.analyzedTransactions}/{sampleSize} × 5) + ((1 - {formatApprovalRate(scoreBreakdown.failureRate)}/100) × 5)) ÷ 20 × 1000
										</p>
									</div>
								</div>

								<div className="rounded-lg border border-divider bg-content2 p-3">
									<p className="font-semibold text-foreground">Como ficou para esta processadora</p>
									<div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
										<div className="rounded-md border border-divider bg-content1 p-2">
											<div className="flex items-center justify-between gap-2">
												<p className="text-xs text-muted">Taxa de aprovação</p>
												<Chip
													color={mapParseColorToChipColor(approvalBreakdownLevel?.chipColor ?? 'default')}
													variant="soft"
													size="sm"
													className={approvalBreakdownLevel?.chipClassName}
												>
													Peso {SCORE_APPROVAL_WEIGHT}
												</Chip>
											</div>
											<p className="font-medium text-foreground">
												{formatApprovalRate(scoreBreakdown.approvalRate)} → {scoreBreakdown.approvalComponent.toFixed(2)}/10
											</p>
										</div>

										<div className="rounded-md border border-divider bg-content1 p-2">
											<div className="flex items-center justify-between gap-2">
												<p className="text-xs text-muted">Volume analisado</p>
												<Chip
													color={mapParseColorToChipColor(analyzedBreakdownLevel?.chipColor ?? 'default')}
													variant="soft"
													size="sm"
													className={analyzedBreakdownLevel?.chipClassName}
												>
													Peso {SCORE_ANALYZED_WEIGHT}
												</Chip>
											</div>
											<p className="font-medium text-foreground">
												{scoreDetailsEntry.analyzedTransactions}/{sampleSize} → {scoreBreakdown.analyzedComponent.toFixed(2)}/5
											</p>
										</div>

										<div className="rounded-md border border-divider bg-content1 p-2">
											<div className="flex items-center justify-between gap-2">
												<p className="text-xs text-muted">Taxa de falha</p>
												<Chip
													color={mapParseColorToChipColor(failureBreakdownLevel?.chipColor ?? 'default')}
													variant="soft"
													size="sm"
													className={failureBreakdownLevel?.chipClassName}
												>
													Peso {SCORE_FAILURE_WEIGHT}
												</Chip>
											</div>
											<p className="font-medium text-foreground">
												{formatApprovalRate(scoreBreakdown.failureRate)} → {scoreBreakdown.inverseFailureComponent.toFixed(2)}/5
											</p>
										</div>

										<div className="rounded-md border border-divider bg-content1 p-2">
											<div className="flex items-center justify-between gap-2">
												<p className="text-xs text-muted">Score final</p>
												<Chip
													color={mapParseColorToChipColor(finalScoreBreakdownLevel?.chipColor ?? 'default')}
													variant="soft"
													size="sm"
													className={finalScoreBreakdownLevel?.chipClassName}
												>
													0 a 1000
												</Chip>
											</div>
											<p className="font-medium text-foreground">
												{scoreBreakdown.totalComponent.toFixed(2)}/20 → {scoreBreakdown.calculatedScore}/1000
											</p>
										</div>
									</div>
								</div>
							</div>
						)}
					</Modal.Body>

					<Modal.Footer>
						<Button variant="secondary" onPress={handleCloseScoreDetails}>
							Fechar
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
		</>
	);
}
