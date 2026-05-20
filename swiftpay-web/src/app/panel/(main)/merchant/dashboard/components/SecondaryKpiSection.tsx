'use client';

import { CancelCircleIcon, CheckmarkCircle02Icon, MoneyExchange01Icon } from '@hugeicons/core-free-icons';
import { KpiCard } from '../DashboardCards';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { AnimatedNumber } from '@/components/ui/animated-number';
import type { MerchantKpiData, DashboardCacheInfo } from '@/types/merchant/dashboard';

interface SecondaryKpiSectionProps {
	kpis: MerchantKpiData;
	cacheInfo: DashboardCacheInfo;
	isBalanceVisible: boolean;
}

export function SecondaryKpiSection({ kpis, cacheInfo, isBalanceVisible }: SecondaryKpiSectionProps) {
	const valueClassName = isBalanceVisible ? '' : 'visual-blur';

	return (
		<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
			<KpiCard
				icon={CheckmarkCircle02Icon}
				cardClassName="bg-linear-to-br from-success-soft to-default/5"
				iconColor="text-success"
				contentClassName="min-h-22 gap-1.5! p-3!"
				label="Transações OK"
				tooltip="Quantidade de transações aprovadas no período filtrado."
				value={
					<div className="flex items-baseline gap-2 whitespace-nowrap">
						<span className={`text-lg font-semibold ${valueClassName}`}>{kpis.completedTransactions}</span>
						<span className={`text-xs text-muted ${valueClassName}`}>de {kpis.totalTransactions}</span>
					</div>
				}
				growth={kpis.transactionsGrowth}
				growthComparisonLabel={kpis.growthComparisonLabel}
				isProcessing={cacheInfo.isProcessing}
			/>
			<KpiCard
				icon={MoneyExchange01Icon}
				cardClassName="bg-linear-to-br from-secondary-soft to-warning/10"
				iconColor="text-secondary"
				contentClassName="min-h-22 gap-1.5! p-3!"
				label="Total Sacado"
				tooltip="Valor total de saques concluídos no período filtrado."
				value={<AnimatedCurrency value={kpis.totalPayouts} className={`text-lg font-semibold ${valueClassName}`} />}
				isProcessing={cacheInfo.isProcessing}
			/>
			<KpiCard
				icon={CancelCircleIcon}
				cardClassName="bg-linear-to-br from-danger-soft to-default/5"
				iconColor="text-danger"
				contentClassName="min-h-22 gap-1.5! p-3!"
				label="Falhas"
				tooltip="Quantidade de transações com falha no período e taxa de falha."
				value={
					<div className="flex items-baseline gap-1 whitespace-nowrap">
						<span className={`text-lg font-semibold ${valueClassName}`}>{kpis.failedTransactions}</span>
						<span className={`text-xs text-muted ${valueClassName}`}>
							(<AnimatedNumber value={kpis.failedRate} suffix="%" maximumFractionDigits={1} />)
						</span>
					</div>
				}
				growth={kpis.failedRateGrowth}
				growthComparisonLabel={kpis.growthComparisonLabel}
				invertColors
				isProcessing={cacheInfo.isProcessing}
			/>
		</div>
	);
}
