'use client';

import { Card } from '@heroui/react';
import {
	Analytics02Icon,
	CheckmarkCircle02Icon,
	CancelCircleIcon,
	MoneyExchange01Icon,
	MoneyReceiveSquareIcon,
	Alert01Icon,
	AnalyticsUpIcon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { Icon } from '@/components/ui/icon';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { AnimatedNumber } from '@/components/ui/animated-number';
import type { MerchantKpiData } from '@/types/merchant/dashboard';

interface MobileKpiGridProps {
	kpis: MerchantKpiData;
	isProcessing: boolean;
	isBalanceVisible: boolean;
}

export function MobileKpiGrid({ kpis, isProcessing, isBalanceVisible }: MobileKpiGridProps) {
	const averageTicket = kpis.completedTransactions > 0 ? Math.round(kpis.totalVolume / kpis.completedTransactions) : 0;
	const valueClassName = isBalanceVisible ? '' : 'visual-blur';

	return (
		<div className="grid grid-cols-2 gap-2">
			<StatCard
				icon={MoneyReceiveSquareIcon}
				iconClass="text-accent"
				iconBg="bg-accent/12"
				cardClassName="bg-linear-to-br from-accent/10 to-accent/5"
				label="Total de Vendas"
				isProcessing={isProcessing}
			>
				<AnimatedCurrency value={kpis.totalNetVolume} className={`text-lg font-bold tabular-nums text-foreground ${valueClassName}`} />
			</StatCard>

			<StatCard
				icon={Analytics02Icon}
				iconClass="text-secondary"
				iconBg="bg-secondary/10"
				cardClassName="bg-linear-to-br from-secondary-soft to-default/5"
				label="Transações"
				isProcessing={isProcessing}
			>
				<p className={`text-lg font-bold tabular-nums text-foreground ${valueClassName}`}>{kpis.totalTransactions}</p>
				<p className="text-[11px] text-muted">base do filtro</p>
			</StatCard>

			<StatCard
				icon={CheckmarkCircle02Icon}
				iconClass="text-success"
				iconBg="bg-success/10"
				cardClassName="bg-linear-to-br from-success-soft to-default/5"
				label="Transações OK"
				isProcessing={isProcessing}
			>
				<p className={`text-lg font-bold tabular-nums text-foreground ${valueClassName}`}>{kpis.completedTransactions}</p>
				<p className={`text-[11px] text-muted ${valueClassName}`}>de {kpis.totalTransactions}</p>
			</StatCard>

			<StatCard
				icon={CheckmarkCircle02Icon}
				iconClass="text-foreground"
				iconBg="bg-success/10"
				cardClassName="bg-linear-to-br from-success-soft to-default/5"
				label="Aprovação"
				isProcessing={isProcessing}
			>
				<AnimatedNumber
					value={kpis.approvalRate}
					suffix="%"
					maximumFractionDigits={1}
					className={`text-lg font-bold tabular-nums text-success ${valueClassName}`}
				/>
			</StatCard>

			<StatCard
				icon={AnalyticsUpIcon}
				iconClass="text-secondary"
				iconBg="bg-secondary/10"
				cardClassName="bg-linear-to-br from-secondary-soft to-default/5"
				label="Ticket Médio"
				isProcessing={isProcessing}
			>
				<AnimatedCurrency value={averageTicket} className={`text-lg font-bold tabular-nums text-foreground ${valueClassName}`} />
			</StatCard>

			<StatCard
				icon={MoneyExchange01Icon}
				iconClass="text-foreground"
				iconBg="bg-warning/10"
				cardClassName="bg-linear-to-br from-secondary-soft to-warning/10"
				label="Saque Pendente"
				isProcessing={isProcessing}
			>
				<AnimatedCurrency value={kpis.pendingPayouts} className={`text-lg font-bold tabular-nums text-foreground ${valueClassName}`} />
			</StatCard>

			<StatCard
				icon={MoneyExchange01Icon}
				iconClass="text-warning"
				iconBg="bg-warning/10"
				cardClassName="bg-linear-to-br from-warning-soft to-default/5"
				label="Reembolso"
				isProcessing={isProcessing}
			>
				<AnimatedCurrency value={kpis.refundedAmount} className={`text-lg font-bold tabular-nums text-foreground ${valueClassName}`} />
				<p className={`text-[11px] text-muted ${valueClassName}`}>{kpis.refundedTransactions} transações</p>
			</StatCard>

			<StatCard
				icon={Alert01Icon}
				iconClass="text-foreground"
				iconBg="bg-danger/10"
				cardClassName="bg-linear-to-br from-danger-soft to-default/5"
				label="Chargeback"
				isProcessing={isProcessing}
			>
				<p className={`text-lg font-bold tabular-nums text-foreground ${valueClassName}`}>{kpis.chargebackCount}</p>
				<AnimatedNumber value={kpis.chargebackRate} suffix="%" maximumFractionDigits={1} className={`text-[11px] text-muted ${valueClassName}`} />
			</StatCard>

			<StatCard
				icon={MoneyExchange01Icon}
				iconClass="text-secondary"
				iconBg="bg-secondary/10"
				cardClassName="bg-linear-to-br from-secondary-soft to-warning/10"
				label="Total Sacado"
				isProcessing={isProcessing}
			>
				<AnimatedCurrency value={kpis.totalPayouts} className={`text-lg font-bold tabular-nums text-foreground ${valueClassName}`} />
			</StatCard>

			<StatCard
				icon={MoneyReceiveSquareIcon}
				iconClass="text-accent"
				iconBg="bg-accent/12"
				cardClassName="bg-linear-to-br from-accent-soft to-default/5"
				label="Volume Bruto"
				isProcessing={isProcessing}
			>
				<AnimatedCurrency value={kpis.totalVolume} className={`text-lg font-bold tabular-nums text-foreground ${valueClassName}`} />
			</StatCard>

			<StatCard
				icon={CancelCircleIcon}
				iconClass="text-danger"
				iconBg="bg-danger/10"
				cardClassName="bg-linear-to-br from-danger-soft to-default/5"
				label="Falhas"
				isProcessing={isProcessing}
			>
				<p className={`text-lg font-bold tabular-nums text-foreground ${valueClassName}`}>{kpis.failedTransactions}</p>
				<AnimatedNumber value={kpis.failedRate} suffix="%" maximumFractionDigits={1} className={`text-[11px] text-muted ${valueClassName}`} />
			</StatCard>
		</div>
	);
}

interface StatCardProps {
	icon: IconSvgElement;
	iconClass: string;
	iconBg: string;
	cardClassName: string;
	label: string;
	isProcessing: boolean;
	children: React.ReactNode;
}

function StatCard({ icon, iconClass, iconBg, cardClassName, label, isProcessing, children }: StatCardProps) {
	return (
		<Card className={`overflow-hidden ${cardClassName} ${isProcessing ? 'opacity-70' : ''}`}>
			<Card.Content className="p-3">
				<div className="mb-2 flex items-center gap-1.5">
					<div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
						<Icon icon={icon} className={`icon-sm ${iconClass}`} />
					</div>
					<p className="line-clamp-1 text-xs text-muted">{label}</p>
				</div>
				{children}
			</Card.Content>
		</Card>
	);
}
