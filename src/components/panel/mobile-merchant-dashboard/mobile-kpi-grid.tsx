'use client';

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
	kpis: MerchantKpiData | null;
	isProcessing?: boolean;
	isBalanceVisible?: boolean;
}

export function MobileKpiGrid({ kpis, isProcessing = false, isBalanceVisible = true }: MobileKpiGridProps) {
	if (!kpis) return null;

	const averageTicket = kpis.completedTransactions > 0 ? Math.round(kpis.totalVolume / kpis.completedTransactions) : 0;
	const valueClassName = isBalanceVisible ? '' : 'visual-blur';

	return (
		<div className="grid grid-cols-2 gap-2.5">
			<StatCard
				icon={MoneyReceiveSquareIcon}
				iconClass="text-accent"
				iconBg="bg-accent/10"
				label="Total de Vendas"
				isProcessing={isProcessing}
			>
				<AnimatedCurrency value={kpis.totalNetVolume} className={`text-base font-bold tabular-nums text-foreground ${valueClassName}`} />
			</StatCard>

			<StatCard
				icon={Analytics02Icon}
				iconClass="text-info"
				iconBg="bg-info/10"
				label="Transações"
				isProcessing={isProcessing}
			>
				<p className={`text-base font-bold tabular-nums text-foreground ${valueClassName}`}>{kpis.totalTransactions}</p>
				<p className="text-\[0.6875rem\] text-muted-foreground">base do filtro</p>
			</StatCard>

			<StatCard
				icon={CheckmarkCircle02Icon}
				iconClass="text-accent"
				iconBg="bg-accent/10"
				label="Transações OK"
				isProcessing={isProcessing}
			>
				<p className={`text-base font-bold tabular-nums text-foreground ${valueClassName}`}>{kpis.completedTransactions}</p>
				<p className={`text-\[0.6875rem\] text-muted-foreground ${valueClassName}`}>de {kpis.totalTransactions}</p>
			</StatCard>

			<StatCard
				icon={CheckmarkCircle02Icon}
				iconClass="text-accent"
				iconBg="bg-accent/10"
				label="Aprovação"
				isProcessing={isProcessing}
			>
				<AnimatedNumber
					value={kpis.approvalRate}
					suffix="%"
					maximumFractionDigits={1}
					className={`text-base font-bold tabular-nums text-accent ${valueClassName}`}
				/>
			</StatCard>

			<StatCard
				icon={AnalyticsUpIcon}
				iconClass="text-indigo-400"
				iconBg="bg-indigo-500/10"
				label="Ticket Médio"
				isProcessing={isProcessing}
			>
				<AnimatedCurrency value={averageTicket} className={`text-base font-bold tabular-nums text-foreground ${valueClassName}`} />
			</StatCard>

			<StatCard
				icon={MoneyExchange01Icon}
				iconClass="text-warning"
				iconBg="bg-warning/10"
				label="Saque Pendente"
				isProcessing={isProcessing}
			>
				<AnimatedCurrency value={kpis.pendingPayouts} className={`text-base font-bold tabular-nums text-foreground ${valueClassName}`} />
			</StatCard>

			<StatCard
				icon={MoneyExchange01Icon}
				iconClass="text-warning"
				iconBg="bg-warning/10"
				label="Reembolso"
				isProcessing={isProcessing}
			>
				<AnimatedCurrency value={kpis.refundedAmount} className={`text-base font-bold tabular-nums text-foreground ${valueClassName}`} />
				<p className={`text-\[0.6875rem\] text-muted-foreground ${valueClassName}`}>{kpis.refundedTransactions} transações</p>
			</StatCard>

			<StatCard
				icon={Alert01Icon}
				iconClass="text-rose-400"
				iconBg="bg-rose-500/10"
				label="Chargeback"
				isProcessing={isProcessing}
			>
				<p className={`text-base font-bold tabular-nums text-foreground ${valueClassName}`}>{kpis.chargebackCount}</p>
				<AnimatedNumber value={kpis.chargebackRate} suffix="%" maximumFractionDigits={1} className={`text-\[0.6875rem\] text-muted-foreground ${valueClassName}`} />
			</StatCard>
		</div>
	);
}

interface StatCardProps {
	icon: IconSvgElement;
	iconClass: string;
	iconBg: string;
	label: string;
	isProcessing: boolean;
	children: React.ReactNode;
}

function StatCard({ icon, iconClass, iconBg, label, isProcessing, children }: StatCardProps) {
	return (
		<div className={`rounded-xl bg-surface-secondary p-3.5 overflow-hidden ${isProcessing ? 'opacity-70' : ''}`}>
			<div className="mb-2 flex items-center gap-2">
				<div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
					<Icon icon={icon} className={`icon-xs ${iconClass}`} />
				</div>
				<p className="line-clamp-1 text-xs font-semibold text-muted-foreground">{label}</p>
			</div>
			{children}
		</div>
	);
}
