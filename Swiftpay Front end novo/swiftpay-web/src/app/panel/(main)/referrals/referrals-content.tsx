'use client';

import { useState } from 'react';
import { Card, Description } from '@heroui/react';
import { UserGroupIcon, Link01Icon, Analytics01Icon, InformationCircleIcon } from '@hugeicons/core-free-icons';
import { PageHeader } from '@/components/ui/page-header';
import { Icon } from '@/components/ui/icon';
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

	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={UserGroupIcon} size={24} />}
				title={title}
				description={description}
			/>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
				<Card>
					<Card.Header className="flex items-start justify-between gap-3">
						<div className="flex items-center gap-3">
							<div className="flex size-10 items-center justify-center rounded-lg bg-accent-soft">
								<Icon icon={Link01Icon} className="icon-md text-accent" />
							</div>
							<div className="flex flex-col gap-1">
								<Card.Title>Seu link de indicação</Card.Title>
								<Description>Use este link para convidar novos usuários.</Description>
							</div>
						</div>
					</Card.Header>
					<Card.Content className="flex flex-col gap-4">
						<div className="rounded-xl border border-divider bg-surface p-3">
							<div className="flex flex-col gap-2">
								<div className="flex items-center justify-between gap-2">
									<div className="min-w-0 flex-1">
										<span className="text-xs text-muted">Código de indicação</span>
										<p className="mt-1 text-sm font-semibold text-foreground">{referralCode || 'Não gerado'}</p>
									</div>
									<CopyReferralLinkButton
										value={referralCode}
										copiedMessage="Código de indicação copiado para a área de transferência."
										ariaLabel="Copiar código"
									/>
								</div>
								<div className="h-px w-full bg-divider" />
								<div className="flex items-center justify-between gap-2">
									<div className="min-w-0 flex-1">
										<span className="text-xs text-muted">Link de indicação</span>
										<p className="mt-1 text-sm text-foreground break-all">{referralLink}</p>
									</div>
									<CopyReferralLinkButton
										value={referralCode ? referralLink : ''}
										copiedMessage="Link de indicação copiado para a área de transferência."
										ariaLabel="Copiar link"
									/>
								</div>
							</div>
						</div>

						<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
							<div className="rounded-xl border border-divider bg-surface p-3">
								<span className="text-xs text-muted">Chave PIX de recebimento</span>
								<p className="text-sm font-medium text-foreground">{payoutPixKeyType ? 'Configurada' : 'Não configurada'}</p>
								{payoutPixKeyType && payoutPixKey && (
									<p className="mt-1 font-mono text-xs text-muted break-all">{payoutPixKey}</p>
								)}
							</div>
							<div className="rounded-xl border border-divider bg-surface p-3">
								<span className="text-xs text-muted">Próxima janela de saque</span>
								<p className="text-sm font-medium text-foreground">{nextAllowedAtLabel}</p>
							</div>
							<div className="rounded-xl border border-accent-soft bg-accent-soft p-3">
								<span className="text-xs text-accent">Saldo disponível</span>
								<p className="text-sm font-semibold text-accent">{formatCurrency(data.availableCommissionBalance ?? 0)}</p>
							</div>
						</div>

						{!referralCode && showHeaderActions && (
							<div className="rounded-xl border border-divider bg-surface p-3">
								<div className="flex flex-col gap-3">
									<span className="text-sm text-muted">
										Você ainda não possui um link permanente. Gere agora para começar a indicar.
									</span>
									<div>
										<GenerateReferralLinkButton />
									</div>
								</div>
							</div>
						)}
						{showHeaderActions && (
							<div className="flex flex-wrap items-center gap-2">
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
					</Card.Content>
				</Card>

				<Card>
					<Card.Header className="flex items-start justify-between gap-3">
						<div className="flex items-center gap-3">
							<div className="flex size-10 items-center justify-center rounded-lg bg-accent-soft">
								<Icon icon={Analytics01Icon} className="icon-md text-accent" />
							</div>
							<div className="flex flex-col gap-1">
								<Card.Title>Regras da sua indicação</Card.Title>
								<Description>Esses valores definem como sua indicação funciona hoje.</Description>
							</div>
						</div>
					</Card.Header>
					<Card.Content className="flex flex-col gap-3">
						<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
							<div className="rounded-xl border border-accent-soft bg-accent-soft p-3">
								<span className="text-xs text-muted">Duração da indicação</span>
								<p className="text-sm font-medium text-accent">{data.referralDurationMonths ?? 0} meses</p>
							</div>
							<div className="rounded-xl border border-success-soft bg-success-soft p-3">
								<span className="text-xs text-muted">Comissão sobre lucro</span>
								<p className="text-sm font-medium text-success">
									{basisPointsToPercentage(data.referralCommissionPercentage ?? 0)}%
								</p>
							</div>
							<div className="rounded-xl border border-warning-soft bg-warning-soft p-3">
								<span className="text-xs text-muted">Intervalo para novo saque</span>
								<p className="text-sm font-medium text-warning">{withdrawalIntervalLabel}</p>
							</div>
							<div className="rounded-xl border border-secondary-soft bg-secondary-soft p-3">
								<span className="text-xs text-muted">Saque mínimo da comissão</span>
								<p className="text-sm font-medium text-secondary">
									{formatCurrency(data.referralCommissionMinWithdrawalAmount ?? 0)}
								</p>
							</div>
							<div className="rounded-xl border border-danger-soft bg-danger-soft p-3">
								<span className="text-xs text-muted">Taxa fixa de saque da comissão</span>
								<p className="text-sm font-medium text-danger">
									{formatCurrency(data.referralCommissionWithdrawalFeeFixed ?? 0)}
								</p>
							</div>
							<div className="rounded-xl border border-success-soft bg-success-soft p-3">
								<span className="text-xs text-success">Comissão total estimada</span>
								<p className="text-sm font-semibold text-success">
									{formatCurrency(data.estimatedCommissionTotal ?? 0)}
								</p>
							</div>
							<div className="rounded-xl border border-secondary-soft bg-secondary-soft p-3">
								<span className="text-xs text-muted">Comissão já paga</span>
								<p className="text-sm font-medium text-secondary">
									{formatCurrency(data.paidCommissionTotal ?? 0)}
								</p>
							</div>
						</div>

						<div className="flex items-start gap-2 rounded-xl border border-warning-soft bg-warning-soft p-3 text-sm text-warning">
							<Icon icon={InformationCircleIcon} className="icon-sm mt-0.5 shrink-0" />
							<span>
								Se a conta indicada ficar Inativa ou Suspensa, o ganho sobre as transações dela fica congelado até
								reativação.
							</span>
						</div>
					</Card.Content>
				</Card>
			</div>

			<Card>
				<Card.Header>
					<div className="flex flex-col gap-1">
						<Card.Title>Indicados e comissões</Card.Title>
						<Description>Acompanhe usuários indicados, histórico de comissões e solicitações de saque.</Description>
					</div>
				</Card.Header>
				<Card.Content>
					<ReferralsDataTabs
						referredUsers={data.referredUsers ?? []}
						referralDurationMonths={data.referralDurationMonths ?? 0}
						paymentHistory={data.paymentHistory ?? []}
						withdrawalRequests={data.withdrawalRequests ?? []}
						payoutPixKeyType={payoutPixKeyType}
						payoutPixKey={payoutPixKey}
						onFetchReferredUserMovements={onFetchReferredUserMovements}
					/>
				</Card.Content>
			</Card>
		</div>
	);
}
