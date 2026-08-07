'use client';

import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { AnimatedNumber } from '@/components/ui/animated-number';
import type { MerchantKpiData, DashboardCacheInfo } from '@/types/merchant/dashboard';

interface SecondaryKpiSectionProps {
	kpis: MerchantKpiData;
	cacheInfo: DashboardCacheInfo;
	isBalanceVisible: boolean;
}

export function SecondaryKpiSection({ kpis, cacheInfo, isBalanceVisible }: SecondaryKpiSectionProps) {
	const valueBlur = isBalanceVisible ? '' : 'visual-blur';

	return (
		<>
			<div className="mockup-kpi-sec-card">
				<div className="mockup-kpi-sec-label">Ticket Médio</div>
				<div className={`mockup-kpi-sec-value ${valueBlur}`}>
					<AnimatedCurrency value={kpis.completedTransactions > 0 ? Math.round(kpis.totalVolume / kpis.completedTransactions) : 0} />
				</div>
			</div>

			<div className="mockup-kpi-sec-card">
				<div className="mockup-kpi-sec-label text-rose-400/90">Recusadas</div>
				<div className={`mockup-kpi-sec-value text-rose-400 ${valueBlur}`}>
					<AnimatedNumber value={kpis.failedTransactions} />
				</div>
			</div>

			<div className="mockup-kpi-sec-card">
				<div className="mockup-kpi-sec-label text-amber-400/90">Estornadas</div>
				<div className={`mockup-kpi-sec-value text-amber-400 ${valueBlur}`}>
					<AnimatedCurrency value={kpis.refundedAmount} />
				</div>
			</div>

			<div className="mockup-kpi-sec-card">
				<div className="flex items-center justify-between mb-1">
					<div className="mockup-kpi-sec-label text-rose-400/90">Chargebacks</div>
					{kpis.chargebackRate > 0 && (
						<span className="text-xs font-mono font-medium text-rose-400 bg-rose-500/10 px-1 py-0.2 rounded border border-rose-500/20">
							<AnimatedNumber value={kpis.chargebackRate} suffix="%" maximumFractionDigits={1} />
						</span>
					)}
				</div>
				<div className={`mockup-kpi-sec-value text-rose-400 ${valueBlur}`}>
					<AnimatedNumber value={kpis.chargebackCount} />
				</div>
			</div>
		</>
	);
}
