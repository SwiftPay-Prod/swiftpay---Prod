'use client';

import { Select, ListBox, DateRangePicker, DateField, RangeCalendar } from '@heroui/react';
import {
	ArrowReloadHorizontalIcon,
	LiveStreaming02Icon,
} from '@hugeicons/core-free-icons';
import { parseDate } from '@internationalized/date';
import { Icon } from '@/components/ui/icon';
import { AsyncButton } from '@/components/ui/async-button';
import { PERIOD_OPTIONS, useMerchantDashboard } from '@/hooks/use-merchant-dashboard';
import { useMerchant } from '@/contexts/merchant-context';
import { formatRelativeTime } from '@/utils/datetime';
import { MobileBalanceCard } from './mobile-merchant-dashboard/mobile-balance-card';
import { MobileKpiGrid } from './mobile-merchant-dashboard/mobile-kpi-grid';
import { MobileCharts } from './mobile-merchant-dashboard/mobile-charts';
import { MobileDashboardSkeleton } from './mobile-merchant-dashboard/mobile-dashboard-skeleton';
import type { DashboardPeriod } from '@/types/merchant/dashboard';

interface MobileMerchantDashboardProps {
	merchantId: string;
	onOpenLiveScreen?: () => void;
	isBalanceVisible: boolean;
	onToggleBalanceVisibility: () => void;
	hasReserveEnabled: boolean;
}

export function MobileMerchantDashboard({
	merchantId,
	onOpenLiveScreen,
	isBalanceVisible,
	onToggleBalanceVisibility,
	hasReserveEnabled,
}: MobileMerchantDashboardProps) {
	const { data: hookData, period, actions } = useMerchantDashboard({ merchantId });
	const { selectedMerchant } = useMerchant();

	const rangeValue =
		period.customRange.startDate && period.customRange.endDate
			? { start: parseDate(period.customRange.startDate), end: parseDate(period.customRange.endDate) }
			: null;

	if (hookData.isLoading) {
		return <MobileDashboardSkeleton />;
	}

	const selectedPeriodOption = PERIOD_OPTIONS.find((opt) => opt.key === period.selected);

	return (
		<div className="flex flex-col gap-3 pb-28">
			{/* NO BANNER ON MOBILE - DIRECT TO OBSIDIAN BALANCE CARD */}
			<MobileBalanceCard
				merchantName={selectedMerchant?.name ?? null}
				merchantStatus={selectedMerchant?.status}
				available={hookData.dashboard?.balance.available ?? null}
				pending={hookData.dashboard?.balance.pending ?? null}
				reserved={hookData.dashboard?.balance.reserved ?? null}
				hasReserveEnabled={hasReserveEnabled}
				isVisible={isBalanceVisible}
				onToggleVisibility={onToggleBalanceVisibility}
			/>

			{/* Period Filter Bar */}
			<div className="flex items-center gap-2 rounded-lg border border-border/80 bg-card px-3 py-2">
				<AsyncButton variant="secondary" size="sm" onPress={onOpenLiveScreen} className="bg-surface border border-border/80 text-foreground shrink-0">
					<Icon icon={LiveStreaming02Icon} className="icon-sm text-accent" />
					Ao vivo
				</AsyncButton>
				
				<div className="w-full">
					<Select
						variant="secondary"
						className="w-full"
						value={period.selected}
						onChange={(key) => {
							if (key) period.change(key as DashboardPeriod);
						}}
					>
						<Select.Trigger className="w-full bg-surface-secondary border border-border">
							<Select.Value>{selectedPeriodOption?.label ?? 'Período'}</Select.Value>
							<Select.Indicator />
						</Select.Trigger>
						<Select.Popover className="bg-card border border-border">
							<ListBox>
								{PERIOD_OPTIONS.map((item) => (
									<ListBox.Item key={item.key} id={item.key} textValue={item.label} className="text-foreground hover:bg-surface-secondary">
										{item.label}
										<ListBox.ItemIndicator />
									</ListBox.Item>
								))}
							</ListBox>
						</Select.Popover>
					</Select>
				</div>
			</div>

			{period.selected === 'custom' && (
				<div className="rounded-xl border border-border bg-card p-3">
					<p className="mb-2 text-xs font-semibold text-muted-foreground">Intervalo Personalizado</p>
					<DateRangePicker
						aria-label="Intervalo personalizado"
						className="w-full"
						value={rangeValue}
						onChange={(val) => {
							if (val?.start && val?.end) {
								period.setCustomRange(val.start.toString(), val.end.toString());
							}
						}}
					>
						<DateField slot="start" />
						<DateField slot="end" />
						<RangeCalendar />
					</DateRangePicker>
				</div>
			)}

			{/* KPI Grid */}
			<MobileKpiGrid
				kpis={hookData.dashboard?.kpis ?? null}
				isProcessing={hookData.isRefreshing}
				isBalanceVisible={isBalanceVisible}
			/>

			{/* Charts Section */}
			<MobileCharts
				volumeChart={hookData.dashboard?.volumeChart ?? []}
				weeklyChart={hookData.dashboard?.weeklyChart ?? []}
				periodStartDate={hookData.dashboard?.periodInfo.startDate ?? ''}
				periodEndDate={hookData.dashboard?.periodInfo.endDate ?? ''}
				approvalRate={hookData.dashboard?.kpis.approvalRate ?? 0}
				approvalRateLevel={hookData.dashboard?.kpis.approvalRateLevel ?? null}
				isProcessing={hookData.isRefreshing}
				periodLabel={selectedPeriodOption?.label ?? 'Período'}
				isBalanceVisible={isBalanceVisible}
			/>

			{/* Updated Status Footer */}
			<div className="rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Icon icon={ArrowReloadHorizontalIcon} className="icon-xs animate-spin text-accent" />
						<span>Atualizado {formatRelativeTime(hookData.dashboard?.cacheInfo.lastUpdatedAt ?? null)}</span>
					</div>
					<AsyncButton variant="ghost" size="sm" onPress={actions.refresh} isPending={hookData.isRefreshing} className="text-accent hover:text-accent/80">
						Atualizar
					</AsyncButton>
				</div>
			</div>
		</div>
	);
}
