'use client';

import { Select, ListBox, Spinner, DateRangePicker, DateField, RangeCalendar } from '@heroui/react';
import {
	ArrowReloadHorizontalIcon,
	HelpCircleIcon,
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
import { DashboardBannerCarousel } from '@/components/panel/dashboard-banner-carousel';
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

	return (
		<div className="flex flex-col gap-3 pb-24">
			<DashboardBannerCarousel isCompact />

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

			<div className="flex items-center gap-2 rounded-2xl border border-default-200 bg-content1 px-3 py-3 shadow-xs">
				<AsyncButton variant="secondary" size="sm" onPress={onOpenLiveScreen}>
					<Icon icon={LiveStreaming02Icon} className="icon-sm" />
					Ao vivo
				</AsyncButton>
				<Select
					variant="secondary"
					key={`period-select-${period.selected}`}
					aria-label="Selecionar período"
					defaultValue={period.selected}
					onChange={(key) => {
						if (key) period.change(key as DashboardPeriod);
					}}
					className="flex-1"
				>
					<Select.Trigger>
						<Select.Value />
						<Select.Indicator />
					</Select.Trigger>
					<Select.Popover>
						<ListBox>
							{PERIOD_OPTIONS.map((opt) => (
								<ListBox.Item key={opt.key} id={opt.key} textValue={opt.label}>
									{opt.label}
									<ListBox.ItemIndicator />
								</ListBox.Item>
							))}
						</ListBox>
					</Select.Popover>
				</Select>
				<AsyncButton variant="secondary" size="sm" onPress={actions.refresh} isPending={hookData.isRefreshing}>
					<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
					Atualizar
				</AsyncButton>
			</div>

			{period.selected === 'custom' && (
				<DateRangePicker
					value={rangeValue}
					onChange={(value) => {
						const nextStartDate = value?.start ? value.start.toString().slice(0, 10) : period.customRange.startDate;
						const nextEndDate = value?.end ? value.end.toString().slice(0, 10) : period.customRange.endDate;
						if (nextStartDate && nextEndDate) {
							period.setCustomRange(nextStartDate, nextEndDate);
						}
					}}
				>
					<DateField.Group fullWidth variant="secondary">
						<DateField.Input slot="start">{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
						<DateRangePicker.RangeSeparator />
						<DateField.Input slot="end">{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
						<DateField.Suffix>
							<DateRangePicker.Trigger>
								<DateRangePicker.TriggerIndicator />
							</DateRangePicker.Trigger>
						</DateField.Suffix>
					</DateField.Group>
					<DateRangePicker.Popover>
						<RangeCalendar aria-label="Período personalizado" visibleDuration={{ months: 2 }}>
							<RangeCalendar.Header>
								<RangeCalendar.YearPickerTrigger>
									<RangeCalendar.YearPickerTriggerHeading />
									<RangeCalendar.YearPickerTriggerIndicator />
								</RangeCalendar.YearPickerTrigger>
								<RangeCalendar.NavButton slot="previous" />
								<RangeCalendar.NavButton slot="next" />
							</RangeCalendar.Header>
							<RangeCalendar.Grid>
								<RangeCalendar.GridHeader>
									{(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
								</RangeCalendar.GridHeader>
								<RangeCalendar.GridBody>{(date) => <RangeCalendar.Cell date={date} />}</RangeCalendar.GridBody>
							</RangeCalendar.Grid>
							<RangeCalendar.YearPickerGrid>
								<RangeCalendar.YearPickerGridBody>
									{({ year }) => <RangeCalendar.YearPickerCell year={year} />}
								</RangeCalendar.YearPickerGridBody>
							</RangeCalendar.YearPickerGrid>
						</RangeCalendar>
					</DateRangePicker.Popover>
				</DateRangePicker>
			)}

			{hookData.dashboard && (
				<>
					<MobileKpiGrid
						kpis={hookData.dashboard.kpis}
						isProcessing={hookData.dashboard.cacheInfo.isProcessing}
						isBalanceVisible={isBalanceVisible}
					/>
				</>
			)}

			{hookData.dashboard && (
				<MobileCharts
					volumeChart={hookData.dashboard.volumeChart}
					weeklyChart={hookData.dashboard.weeklyChart}
					periodStartDate={hookData.dashboard.periodInfo.startDate}
					periodEndDate={hookData.dashboard.periodInfo.endDate}
					approvalRate={hookData.dashboard.kpis.approvalRate}
					approvalRateLevel={hookData.dashboard.kpis.approvalRateLevel}
					isProcessing={hookData.dashboard.cacheInfo.isProcessing}
					periodLabel={hookData.dashboard.periodInfo.label}
					isBalanceVisible={isBalanceVisible}
				/>
			)}

			{hookData.dashboard?.cacheInfo.lastUpdatedAt && (
				<div className="flex items-start gap-2 rounded-xl border border-default-200 bg-default-50/60 px-4 py-3 dark:bg-default-100/5">
					<Icon icon={HelpCircleIcon} className="icon-sm shrink-0 text-muted" />
					<div className="flex-1">
						<p className="text-xs text-muted">Atualizado {formatRelativeTime(hookData.dashboard.cacheInfo.lastUpdatedAt)}</p>
						<p className="text-[11px] text-muted">
							O saldo fica em tempo real. As demais estatísticas são atualizadas a cada{' '}
							{hookData.dashboard.cacheInfo.cacheDurationMinutes} minutos.
						</p>
					</div>
				</div>
			)}

			{hookData.dashboard && !hookData.dashboard.cacheInfo.lastUpdatedAt && !hookData.dashboard.cacheInfo.isProcessing && (
				<p className="text-xs text-muted">Aguardando primeiro processamento...</p>
			)}

			{hookData.dashboard?.cacheInfo.isProcessing && (
				<div className="flex items-center gap-2 rounded-xl bg-warning-soft px-4 py-3">
					<Spinner size="sm" color="warning" />
					<div className="flex-1">
						<p className="text-xs font-medium text-warning">Atualizando estatísticas...</p>
						<p className="text-[11px] text-muted">O saldo está sempre atualizado em tempo real</p>
					</div>
				</div>
			)}
		</div>
	);
}

interface MobileSectionHeaderProps {
	eyebrow: string;
	title: string;
	description: string;
	icon: React.ComponentProps<typeof Icon>['icon'];
}

function MobileSectionHeader({ eyebrow, title, description, icon }: MobileSectionHeaderProps) {
	return (
		<div className="flex items-start gap-3 px-1">
			<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent shadow-xs">
				<Icon icon={icon} className="icon-md" />
			</div>
			<div className="min-w-0 flex-1">
				<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
				<h2 className="text-base font-semibold text-foreground">{title}</h2>
				<p className="text-xs leading-5 text-muted">{description}</p>
			</div>
		</div>
	);
}


