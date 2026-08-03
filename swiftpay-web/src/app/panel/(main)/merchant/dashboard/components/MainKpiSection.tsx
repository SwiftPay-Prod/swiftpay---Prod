'use client';

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

export function MainKpiSection({
	kpis,
	balance,
	cacheInfo,
	averageTicket,
	isBalanceVisible,
}: MainKpiSectionProps) {
	const valueBlur = isBalanceVisible ? '' : 'visual-blur';

	return (
		<>
			<div className="mockup-kpi-card">
				<div className="mockup-kpi-label">Saldo Disponível</div>
				<div className={`mockup-kpi-value ${valueBlur}`}>
					<AnimatedCurrency value={balance.available} />
				</div>
				{cacheInfo.isProcessing && <div className="mockup-kpi-subtext">Atualizando...</div>}
			</div>
			<div className="mockup-kpi-card">
				<div className="mockup-kpi-label">Total de Vendas</div>
				<div className={`mockup-kpi-value ${valueBlur}`}>
					<AnimatedCurrency value={kpis.totalNetVolume} />
				</div>
				{kpis.volumeGrowth != null && kpis.volumeGrowth !== 0 && (
					<div className={`mockup-kpi-subtext ${kpis.volumeGrowth > 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
						{kpis.volumeGrowth > 0 ? '↑' : '↓'} {Math.abs(kpis.volumeGrowth).toFixed(1)}% {kpis.growthComparisonLabel || ''}
					</div>
				)}
				{cacheInfo.isProcessing && <div className="mockup-kpi-subtext">Atualizando...</div>}
			</div>
			<div className="mockup-kpi-card">
				<div className="mockup-kpi-label">Transações</div>
				<div className={`mockup-kpi-value ${valueBlur}`}>
					<AnimatedNumber value={kpis.completedTransactions} />
				</div>
				<div className="mockup-kpi-subtext">de {kpis.totalTransactions} total</div>
				{cacheInfo.isProcessing && <div className="mockup-kpi-subtext">Atualizando...</div>}
			</div>
			<div className="mockup-kpi-card">
				<div className="mockup-kpi-label">Taxa de Aprovação</div>
				<div className={`mockup-kpi-value ${valueBlur}`}>
					<AnimatedNumber value={kpis.approvalRate} suffix="%" maximumFractionDigits={1} />
				</div>
				{cacheInfo.isProcessing && <div className="mockup-kpi-subtext">Atualizando...</div>}
			</div>
		</>
	);
}
