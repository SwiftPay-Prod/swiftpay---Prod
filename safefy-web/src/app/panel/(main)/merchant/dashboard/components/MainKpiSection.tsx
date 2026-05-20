'use client';

import {
	Alert01Icon,
	AnalyticsUpIcon,
	ArrowReloadHorizontalIcon,
	MoneyExchange01Icon,
	MoneyReceiveSquareIcon,
	TransactionHistoryIcon,
	Wallet01Icon,
} from '@hugeicons/core-free-icons';
import { KpiCard } from '../DashboardCards';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { AnimatedNumber } from '@/components/ui/animated-number';
import type { MerchantKpiData, MerchantBalanceData, DashboardCacheInfo } from '@/types/merchant/dashboard';

interface MainKpiSectionProps {
	kpis: MerchantKpiData;
	balance: MerchantBalanceData;
	cacheInfo: DashboardCacheInfo;
	averageTicket: number;
	isBalanceVisible: boolean;
	hasReserveEnabled: boolean;
	reserveConfig: {
		pixReservePercentage: number;
		boletoReservePercentage: number;
		creditCardReservePercentage: number;
	} | null;
}

function formatReservePercentage(basisPoints: number): string {
	return `${(basisPoints / 100).toFixed(2)}%`;
}

export function MainKpiSection({
	kpis,
	balance,
	cacheInfo,
	averageTicket,
	isBalanceVisible,
	hasReserveEnabled,
	reserveConfig,
}: MainKpiSectionProps) {
	const valueClassName = isBalanceVisible ? '' : 'visual-blur';
	const reserveSummary = reserveConfig
		? [
				`PIX ${formatReservePercentage(reserveConfig.pixReservePercentage)}`,
				`Boleto ${formatReservePercentage(reserveConfig.boletoReservePercentage)}`,
				`Cartão ${formatReservePercentage(reserveConfig.creditCardReservePercentage)}`,
		  ].join(' | ')
		: null;

	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
			<KpiCard
				icon={Wallet01Icon}
				cardClassName="bg-linear-to-br from-success/10 to-success/5"
				iconColor="text-success"
				label="Saldo Disponível"
				tooltip="Valor disponível para saque agora. Atualizado em tempo real."
				value={<AnimatedCurrency value={balance.available} className={`text-xl font-bold text-success ${valueClassName}`} />}
				isProcessing={false}
			/>
			<KpiCard
				icon={MoneyReceiveSquareIcon}
				cardClassName="bg-linear-to-br from-accent/10 to-accent/5"
				iconColor="text-accent"
				label="Total de Vendas"
				tooltip="Total de vendas descontando as taxas da plataforma no período filtrado."
				value={<AnimatedCurrency value={kpis.totalNetVolume} className={`text-xl font-bold text-accent ${valueClassName}`} />}
				growth={kpis.volumeGrowth}
				growthComparisonLabel={kpis.growthComparisonLabel}
				isProcessing={cacheInfo.isProcessing}
			/>
			<KpiCard
				icon={TransactionHistoryIcon}
				cardClassName="bg-linear-to-br from-warning-soft to-default/5"
				iconColor="text-warning"
				label="Vendas Pendentes"
				tooltip="Pagamentos ainda em processamento. Esses valores não estão disponíveis para saque ainda."
				value={<AnimatedCurrency value={balance.pending} className={`text-xl font-bold ${valueClassName}`} />}
				isProcessing={cacheInfo.isProcessing}
			/>
			{hasReserveEnabled && (
				<KpiCard
					icon={Wallet01Icon}
					cardClassName="bg-linear-to-br from-secondary-soft to-default/5"
					iconColor="text-secondary"
					label="Saldo Reservado"
					tooltip={`Valor temporariamente retido pela reserva financeira das suas vendas. Esse montante continua sendo da organização e é transferido para o saldo disponível ao final do prazo de compensação configurado por método. ${reserveSummary ? `Configuração atual: ${reserveSummary}.` : ''}`}
					value={<AnimatedCurrency value={balance.reserved} className={`text-xl font-bold ${valueClassName}`} />}
					isProcessing={cacheInfo.isProcessing}
				/>
			)}
			<KpiCard
				icon={AnalyticsUpIcon}
				cardClassName="bg-linear-to-br from-secondary-soft to-default/5"
				iconColor="text-secondary"
				label="Ticket Médio"
				tooltip="Valor médio de cada transação aprovada no período filtrado."
				value={<AnimatedCurrency value={averageTicket} className={`text-xl font-bold ${valueClassName}`} />}
				isProcessing={cacheInfo.isProcessing}
			/>
			<KpiCard
				icon={MoneyExchange01Icon}
				cardClassName="bg-linear-to-br from-accent-soft to-default/5"
				iconColor="text-foreground"
				label="Volume Bruto"
				tooltip="Somatório bruto de todos os pagamentos aprovados no período filtrado."
				value={<AnimatedCurrency value={kpis.totalVolume} className={`text-xl font-bold ${valueClassName}`} />}
				isProcessing={cacheInfo.isProcessing}
			/>
			<KpiCard
				icon={ArrowReloadHorizontalIcon}
				cardClassName="bg-linear-to-br from-secondary-soft to-warning/10"
				iconColor="text-secondary"
				label="Saque Pendente"
				tooltip="Total de saques solicitados que ainda não foram concluídos."
				value={<AnimatedCurrency value={kpis.pendingPayouts} className={`text-xl font-bold ${valueClassName}`} />}
				isProcessing={cacheInfo.isProcessing}
			/>
			<KpiCard
				icon={Alert01Icon}
				cardClassName="bg-linear-to-br from-warning-soft to-default/5"
				iconColor="text-warning"
				label="Reembolso"
				tooltip="Valor total de estornos e reembolsos realizados no período filtrado."
				value={<AnimatedCurrency value={kpis.refundedAmount} className={`text-xl font-bold ${valueClassName}`} />}
				isProcessing={cacheInfo.isProcessing}
			/>
			<KpiCard
				icon={Alert01Icon}
				cardClassName="bg-linear-to-br from-danger-soft to-default/5"
				iconColor="text-danger"
				label="Chargeback"
				tooltip="Quantidade e percentual de disputas/chargebacks no período."
				value={
					<div className="flex items-baseline gap-2">
						<span className={`text-xl font-bold ${valueClassName}`}>{kpis.chargebackCount}</span>
						<span className={`text-sm text-muted ${valueClassName}`}>
							(<AnimatedNumber value={kpis.chargebackRate} suffix="%" maximumFractionDigits={1} />)
						</span>
					</div>
				}
				isProcessing={cacheInfo.isProcessing}
			/>
		</div>
	);
}
