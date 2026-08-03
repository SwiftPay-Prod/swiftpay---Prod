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
				<div className="mockup-kpi-sec-label">Recusadas</div>
				<div className={`mockup-kpi-sec-value ${valueBlur}`}>
					<AnimatedNumber value={kpis.failedTransactions} />
				</div>
			</div>
			<div className="mockup-kpi-sec-card">
				<div className="mockup-kpi-sec-label">Estornadas</div>
				<div className={`mockup-kpi-sec-value ${valueBlur}`}>
					<AnimatedCurrency value={kpis.refundedAmount} />
				</div>
			</div>
			<div className="mockup-kpi-sec-card">
				<div className="mockup-kpi-sec-label">Chargebacks</div>
				<div className={`mockup-kpi-sec-value ${valueBlur}`}>
					<AnimatedNumber value={kpis.chargebackCount} />
					{kpis.chargebackRate > 0 && (
						<span className="text-xs text-muted-foreground ml-1">
							(<AnimatedNumber value={kpis.chargebackRate} suffix="%" maximumFractionDigits={1} />)
						</span>
					)}
				</div>
			</div>
		</>
	);
}
