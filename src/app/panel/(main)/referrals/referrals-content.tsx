'use client';

import { useMemo, useState } from 'react';
import { Card } from '@heroui/react';
import { UserGroupIcon, Link01Icon, Analytics01Icon, InformationCircleIcon, Wallet01Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { basisPointsToPercentage, formatCurrency } from '@/utils/currency';
import { ReferralWithdrawalIntervalUnit } from '@/types/enums';
import type { PixKeyType } from '@/types/enums';
import type { UserReferralsData } from '@/types/user/referrals';
import { CopyReferralLinkButton } from './components/copy-referral-link-button';
import { GenerateReferralLinkButton } from './components/generate-referral-link-button';
import { ReferralsDataTabs } from './components/referrals-data-tabs';
import { ReferralPixKeyManager } from './components/referral-pix-key-manager';
import { ReferralWithdrawalRequestPanel } from './components/referral-withdrawal-request-panel';
import type { ApiResponse } from '@/types/common';
import type { UserReferralReferredUserMovementsData } from '@/types/user/referrals';

type ReferredUserMovementsFetcher = (
	referredUserId: string,
	page: number,
	pageSize: number
) => Promise<ApiResponse<UserReferralReferredUserMovementsData>>;

interface ReferralsContentProps {
	data: UserReferralsData;
	showHeaderActions?: boolean;
	title?: string;
	description?: string;
	onFetchReferredUserMovements?: ReferredUserMovementsFetcher;
}

export function ReferralsContent({
	data,
	showHeaderActions = true,
	title = 'Indique e Ganhe',
	description = 'Compartilhe seu link de indicação e acompanhe os usuários que se cadastraram com seu código.',
	onFetchReferredUserMovements,
}: ReferralsContentProps) {
	const [payoutPixKeyType, setPayoutPixKeyType] = useState(data.payoutPixKeyType ?? null);
	const [payoutPixKey, setPayoutPixKey] = useState(data.payoutPixKey ?? null);
	const referralCode = data.referralCode ?? '';
	const referralLink = data.referralLink ?? '-';
	const withdrawalIntervalValue = data.referralCommissionWithdrawalIntervalValue ?? 1;
	const withdrawalIntervalUnit = data.referralCommissionWithdrawalIntervalUnit ?? ReferralWithdrawalIntervalUnit.Days;
	const withdrawalIntervalLabel = withdrawalIntervalValue === 0
		? 'Sem limite'
		: withdrawalIntervalUnit === ReferralWithdrawalIntervalUnit.Months
			? `${withdrawalIntervalValue} ${withdrawalIntervalValue === 1 ? 'mês' : 'meses'}`
			: `${withdrawalIntervalValue} ${withdrawalIntervalValue === 1 ? 'dia' : 'dias'}`;
	const nextAllowedAtLabel = data.referralCommissionNextAllowedWithdrawalRequestAt
		? new Date(data.referralCommissionNextAllowedWithdrawalRequestAt).toLocaleString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
		: 'Liberado';

	const stats = useMemo(
		() => [
			{
				label: 'Saldo disponível',
				value: <AnimatedCurrency value={data.availableCommissionBalance ?? 0} />,
				icon: <Icon icon={Wallet01Icon} className="icon-sm text-success" />,
				accent: 'text-success',
			},
			{
				label: 'Comissão estimada',
				value: <AnimatedCurrency value={data.estimatedCommissionTotal ?? 0} />,
				icon: <Icon icon={Analytics01Icon} className="icon-sm text-muted" />,
			},
			{
				label: 'Comissão já paga',
				value: <AnimatedCurrency value={data.paidCommissionTotal ?? 0} />,
				icon: <Icon icon={CheckmarkCircle02Icon} className="icon-sm text-success" />,
				accent: 'text-success',
			},
			{
				label: 'Usuários indicados',
				value: <AnimatedNumber value={data.referredUsers?.length ?? 0} />,
				icon: <Icon icon={UserGroupIcon} className="icon-sm text-muted" />,
			},
		],
		[data]
	);

	return (
		<div className="flex flex-col gap-6 text-white">
			{/* Executive Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
				<div>
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
							<Icon icon={UserGroupIcon} className="icon-sm text-[#4f55f1]" />
						</div>
						<h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
					</div>
					<p className="text-xs text-white/50 mt-1">{description}</p>
				</div>
			</div>

			{/* 4-Tile High Contrast KPI Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Saldo Disponível
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00a87e]/15 text-[#00a87e] border border-[#00a87e]/30">
							<Icon icon={Wallet01Icon} className="icon-xs" />
						</div>
					</div>
					<div>
						<AnimatedCurrency
							value={data.availableCommissionBalance ?? 0}
							className="text-2xl font-extrabold font-mono text-[#00a87e] tracking-tight tabular-nums block"
						/>
						<p className="text-xs text-[#00a87e]/80 font-mono mt-0.5">Liberado para saque PIX</p>
					</div>
				</div>

				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Comissão Estimada
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/30">
							<Icon icon={Analytics01Icon} className="icon-xs" />
						</div>
					</div>
					<div>
						<AnimatedCurrency
							value={data.estimatedCommissionTotal ?? 0}
							className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block"
						/>
						<p className="text-xs text-white/40 font-mono mt-0.5">Projeção de ganhos</p>
					</div>
				</div>

				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Comissão Já Paga
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<Icon icon={CheckmarkCircle02Icon} className="icon-xs" />
						</div>
					</div>
					<div>
						<AnimatedCurrency
							value={data.paidCommissionTotal ?? 0}
							className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block"
						/>
						<p className="text-xs text-white/40 font-mono mt-0.5">Total já transferido</p>
					</div>
				</div>

				<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 flex flex-col justify-between gap-3">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
							Usuários Indicados
						</span>
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
							<Icon icon={UserGroupIcon} className="icon-xs" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums block">
							<AnimatedNumber value={data.referredUsers?.length ?? 0} />
						</span>
						<p className="text-xs text-white/40 font-mono mt-0.5">Cadastrados com seu link</p>
					</div>
				</div>
			</div>
			<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
				<div className="rounded-[24px] border border-white/12 bg-[#16181a] p-5 sm:p-6 flex flex-col gap-4">
					<div className="flex items-center gap-3 border-b border-white/8 pb-4">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/30">
							<Icon icon={Link01Icon} className="icon-md" />
						</div>
						<div>
							<h3 className="text-sm font-bold text-white">Seu Link de Indicação</h3>
							<p className="text-xs text-white/50">Use este link para convidar novas organizações.</p>
						</div>
					</div>
					<div className="flex flex-col gap-4">
						<div className="rounded-xl border border-white/8 bg-[#0a0a0a] p-4">
							<div className="flex flex-col gap-3">
								<div className="flex items-center justify-between gap-2">
									<div className="min-w-0 flex-1">
										<span className="text-xs text-white/50">Código de indicação</span>
										<p className="mt-1 font-mono text-sm font-bold text-[#4f55f1]">{referralCode || 'Não gerado'}</p>
									</div>
									<CopyReferralLinkButton
										value={referralCode}
										copiedMessage="Código de indicação copiado para a área de transferência."
										ariaLabel="Copiar código"
									/>
								</div>
								<div className="h-px w-full bg-white/8" />
								<div className="flex items-center justify-between gap-2">
									<div className="min-w-0 flex-1">
										<span className="text-xs text-white/50">Link de indicação</span>
										<p className="mt-1 break-all font-mono text-xs text-white/70">{referralLink}</p>
									</div>
									<CopyReferralLinkButton
										value={referralCode ? referralLink : ''}
										copiedMessage="Link de indicação copiado para a área de transferência."
										ariaLabel="Copiar link"
									/>
								</div>
							</div>
						</div>

						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div className="rounded-xl border border-white/8 bg-[#0a0a0a] p-3.5">
								<span className="text-xs text-white/50">Chave PIX de recebimento</span>
								<p className="mt-1 text-sm font-bold text-white">{payoutPixKeyType ? 'Configurada' : 'Não configurada'}</p>
								{payoutPixKeyType && payoutPixKey && (
									<p className="mt-1 break-all font-mono text-xs text-white/60">{payoutPixKey}</p>
								)}
							</div>
							<div className="rounded-xl border border-white/8 bg-[#0a0a0a] p-3.5">
								<span className="text-xs text-white/50">Próxima janela de saque</span>
								<p className="mt-1 text-sm font-bold text-white">{nextAllowedAtLabel}</p>
							</div>
						</div>

						{!referralCode && showHeaderActions && (
							<div className="rounded-xl border border-white/8 bg-[#0a0a0a] p-4">
								<div className="flex flex-col gap-3">
									<span className="text-xs text-white/70">
										Você ainda não possui um link permanente. Gere agora para começar a indicar.
									</span>
									<div>
										<GenerateReferralLinkButton />
									</div>
								</div>
							</div>
						)}
						{showHeaderActions && (
							<div className="flex flex-wrap items-center gap-2 pt-2">
								<ReferralPixKeyManager
									initialPixKeyType={payoutPixKeyType}
									initialPixKey={payoutPixKey}
									onPixKeyUpdated={({ pixKeyType, pixKey }) => {
										setPayoutPixKeyType(pixKeyType);
										setPayoutPixKey(pixKey);
									}}
								/>
								<ReferralWithdrawalRequestPanel
									canRequest={data.canRequestReferralCommissionWithdrawal ?? false}
									intervalValue={withdrawalIntervalValue}
									intervalUnit={withdrawalIntervalUnit}
									nextAllowedAt={data.referralCommissionNextAllowedWithdrawalRequestAt ?? null}
									availableBalance={data.availableCommissionBalance ?? 0}
									minWithdrawalAmount={data.referralCommissionMinWithdrawalAmount ?? 0}
									withdrawalFeeFixed={data.referralCommissionWithdrawalFeeFixed ?? 0}
									hasPayoutPixKey={!!payoutPixKeyType && !!payoutPixKey}
									hasReferralCode={!!referralCode}
									payoutPixKeyType={payoutPixKeyType as PixKeyType | null}
									payoutPixKey={payoutPixKey}
								/>
							</div>
						)}
					</div>
				</div>

				<div className="rounded-[24px] border border-white/12 bg-[#16181a] p-5 sm:p-6 flex flex-col gap-4">
					<div className="flex items-center gap-3 border-b border-white/8 pb-4">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/30">
							<Icon icon={Analytics01Icon} className="icon-md" />
						</div>
						<div>
							<h3 className="text-sm font-bold text-white">Regras do Programa de Indicação</h3>
							<p className="text-xs text-white/50">Condições operacionais da sua comissão.</p>
						</div>
					</div>
					<div className="flex flex-col gap-4">
						<div className="rounded-xl border border-white/8 bg-[#0a0a0a] divide-y divide-white/8 overflow-hidden">
							<div className="flex items-center justify-between gap-3 px-4 py-3">
								<span className="text-xs text-white/50">Duração da indicação</span>
								<span className="font-mono text-sm font-bold text-white">{data.referralDurationMonths ?? 0} meses</span>
							</div>
							<div className="flex items-center justify-between gap-3 px-4 py-3">
								<span className="text-xs text-white/50">Comissão sobre lucro</span>
								<span className="font-mono text-sm font-bold text-[#00a87e]">{basisPointsToPercentage(data.referralCommissionPercentage ?? 0)}%</span>
							</div>
							<div className="flex items-center justify-between gap-3 px-4 py-3">
								<span className="text-xs text-white/50">Intervalo para novo saque</span>
								<span className="font-mono text-sm font-bold text-white">{withdrawalIntervalLabel}</span>
							</div>
							<div className="flex items-center justify-between gap-3 px-4 py-3">
								<span className="text-xs text-white/50">Saque mínimo da comissão</span>
								<span className="font-mono text-sm font-bold text-white">{formatCurrency(data.referralCommissionMinWithdrawalAmount ?? 0)}</span>
							</div>
							<div className="flex items-center justify-between gap-3 px-4 py-3">
								<span className="text-xs text-white/50">Taxa fixa de saque da comissão</span>
								<span className="font-mono text-sm font-bold text-white">{formatCurrency(data.referralCommissionWithdrawalFeeFixed ?? 0)}</span>
							</div>
						</div>

						<div className="flex items-start gap-2.5 rounded-xl border border-[#ec7e00]/30 bg-[#ec7e00]/10 p-3.5 text-xs text-[#ec7e00]">
							<Icon icon={InformationCircleIcon} className="icon-sm mt-0.5 shrink-0" />
							<span>
								Se a conta indicada ficar Inativa ou Suspensa, o ganho sobre as transações dela fica congelado até reativação.
							</span>
						</div>
					</div>
				</div>
			</div>

			<div className="rounded-[24px] border border-white/12 bg-[#16181a] p-5 sm:p-6">
				<div className="flex flex-col gap-1 border-b border-white/8 pb-4 mb-4">
					<h3 className="text-sm font-bold text-white">Indicados e Comissões</h3>
					<p className="text-xs text-white/50">Acompanhe usuários indicados, histórico de repasses e solicitações de saque.</p>
				</div>
				<ReferralsDataTabs
					referredUsers={data.referredUsers ?? []}
					referralDurationMonths={data.referralDurationMonths ?? 0}
					paymentHistory={data.paymentHistory ?? []}
					withdrawalRequests={data.withdrawalRequests ?? []}
					payoutPixKeyType={payoutPixKeyType}
					payoutPixKey={payoutPixKey}
					onFetchReferredUserMovements={onFetchReferredUserMovements}
				/>
			</div>
		</div>
	);
}
