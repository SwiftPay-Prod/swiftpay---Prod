'use client';

import { useRouter } from 'next/navigation';
import { Tooltip, Spinner, Alert, Select, ListBox, DateRangePicker, DateField, RangeCalendar } from '@heroui/react';
import {
	ArrowReloadHorizontalIcon,
	HelpCircleIcon,
	CalendarCheckIn01Icon,
	LiveStreaming02Icon,
	ViewIcon,
	ViewOffSlashIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { PERIOD_OPTIONS, useMerchantDashboard } from '@/hooks/use-merchant-dashboard';
import { useDashboardLayout } from '@/hooks/use-dashboard-layout';
import { useBalanceVisibility } from '@/hooks/use-balance-visibility';
import type { ReadMerchantDashboardData, DashboardPeriod } from '@/types/merchant/dashboard';
import { formatRelativeTime } from '@/utils/datetime';
import { AsyncButton } from '@/components/ui/async-button';
import { DashboardSkeleton } from './DashboardSkeleton';
import { MobileMerchantDashboard } from '@/components/panel/mobile-merchant-dashboard';
import { DashboardBannerCarousel } from '@/components/panel/dashboard-banner-carousel';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { parseDate } from '@internationalized/date';
import { VolumeChart } from './components/VolumeChart';
import { WeeklyVolumeChart } from './components/WeeklyVolumeChart';
import { ApprovalRateGauge } from './components/ApprovalRateGauge';
import { MainKpiSection } from './components/MainKpiSection';
import { SecondaryKpiSection } from './components/SecondaryKpiSection';
import { DashboardLayoutPicker } from './components/DashboardLayoutPicker';
import { Routes } from '@/router/routes';

interface MerchantReserveConfig {
	pixReservePercentage: number;
	boletoReservePercentage: number;
	creditCardReservePercentage: number;
}

interface DashboardContentProps {
	dashboard: ReadMerchantDashboardData;
	onRefresh: () => void;
	isRefreshing: boolean;
	selectedPeriod: DashboardPeriod;
	onPeriodChange: (period: DashboardPeriod) => void;
	customStartDate: string;
	customEndDate: string;
	onCustomRangeChange: (startDate: string, endDate: string) => void;
	isBalanceVisible: boolean;
	onToggleBalanceVisibility: () => void;
	onOpenLiveScreen: () => void;
	hasReserveEnabled: boolean;
	reserveConfig: MerchantReserveConfig | null;
}

function DashboardContent({
	dashboard,
	onRefresh,
	isRefreshing,
	selectedPeriod,
	onPeriodChange,
	customStartDate,
	customEndDate,
	onCustomRangeChange,
	isBalanceVisible,
	onToggleBalanceVisibility,
	onOpenLiveScreen,
	hasReserveEnabled,
	reserveConfig,
}: DashboardContentProps) {
	const kpis = dashboard.kpis;
	const balance = dashboard.balance;
	const cacheInfo = dashboard.cacheInfo;
	const periodInfo = dashboard.periodInfo;
	const averageTicket = kpis.completedTransactions > 0 ? Math.round(kpis.totalVolume / kpis.completedTransactions) : 0;

	const { layout, changeLayout } = useDashboardLayout();

	const rangeValue =
		customStartDate && customEndDate ? { start: parseDate(customStartDate), end: parseDate(customEndDate) } : null;

	const periodDays = periodInfo
		? Math.max(
				1,
				Math.floor(
					(new Date(periodInfo.endDate).getTime() - new Date(periodInfo.startDate).getTime()) / (1000 * 60 * 60 * 24)
				) + 1
			)
		: 7;
	const isHourlyGranularity = periodDays <= 2;

	const weeklyChart = (
		<WeeklyVolumeChart
			data={dashboard.weeklyChart}
			isHourlyGranularity={isHourlyGranularity}
			isProcessing={cacheInfo.isProcessing}
		/>
	);

	const volumeChart = (
		<VolumeChart
			data={dashboard.volumeChart}
			adaptiveData={dashboard.weeklyChart}
			isHourlyGranularity={isHourlyGranularity}
			isProcessing={cacheInfo.isProcessing}
			periodLabel={periodInfo?.label}
		/>
	);

	const approvalGauge = (
		<ApprovalRateGauge
			approvalRate={kpis.approvalRate}
			approvalRateLevel={kpis.approvalRateLevel}
			isProcessing={cacheInfo.isProcessing}
			isBalanceVisible={isBalanceVisible}
		/>
	);

	const mainKpis = (
		<MainKpiSection
			kpis={kpis}
			balance={balance}
			cacheInfo={cacheInfo}
			averageTicket={averageTicket}
			isBalanceVisible={isBalanceVisible}
			hasReserveEnabled={hasReserveEnabled}
			reserveConfig={reserveConfig}
		/>
	);

	const secondaryKpis = (
		<SecondaryKpiSection kpis={kpis} cacheInfo={cacheInfo} isBalanceVisible={isBalanceVisible} />
	);

	function renderSections() {
		switch (layout) {
			case 'focus-charts':
				return (
					<>
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							{weeklyChart}
							{volumeChart}
						</div>
						{mainKpis}
						{secondaryKpis}
						{approvalGauge}
					</>
				);
			case 'focus-kpis':
				return (
					<>
						{mainKpis}
						{secondaryKpis}
						{weeklyChart}
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							{volumeChart}
							{approvalGauge}
						</div>
					</>
				);
			case 'compact':
				return (
					<>
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
							<div className="lg:col-span-2">{weeklyChart}</div>
							{approvalGauge}
						</div>
						{mainKpis}
						{secondaryKpis}
						{volumeChart}
					</>
				);
			default:
				return (
					<>
						{weeklyChart}
						{mainKpis}
						{secondaryKpis}
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							{volumeChart}
							{approvalGauge}
						</div>
					</>
				);
		}
	}

	return (
		<div className="flex flex-col gap-4">
			<DashboardBannerCarousel />

			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-wrap items-center gap-2">
					<Select
						variant="secondary"
						key={`period-select-${selectedPeriod}`}
						aria-label="Selecionar período"
						defaultValue={selectedPeriod}
						onChange={(key) => {
							if (key) onPeriodChange(key as DashboardPeriod);
						}}
						className="w-44"
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

					{selectedPeriod === 'custom' && (
						<DateRangePicker
							value={rangeValue}
							onChange={(value) => {
								const nextStartDate = value?.start ? value.start.toString().slice(0, 10) : customStartDate;
								const nextEndDate = value?.end ? value.end.toString().slice(0, 10) : customEndDate;
								if (nextStartDate && nextEndDate) {
									onCustomRangeChange(nextStartDate, nextEndDate);
								}
							}}
						>
							<DateField.Group fullWidth variant="secondary" className="min-w-72">
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

					{periodInfo && (
						<div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1">
							<Icon icon={CalendarCheckIn01Icon} className="icon-xs text-accent" />
							<span className="text-xs font-medium text-accent">{periodInfo.label}</span>
						</div>
					)}
				</div>

				<div className="flex items-center gap-3">
					<DashboardLayoutPicker layout={layout} onLayoutChange={changeLayout} />
					<AsyncButton variant="secondary" size="sm" onPress={onToggleBalanceVisibility}>
						<Icon icon={isBalanceVisible ? ViewOffSlashIcon : ViewIcon} className="icon-sm" />
						{isBalanceVisible ? 'Ofuscar' : 'Mostrar'}
					</AsyncButton>
					<AsyncButton variant="secondary" size="sm" onPress={onOpenLiveScreen}>
						<Icon icon={LiveStreaming02Icon} className="icon-sm text-danger" />
						Live
					</AsyncButton>
					{cacheInfo.isProcessing && (
						<div className="flex items-center gap-2 rounded-full bg-warning-soft px-3 py-1">
							<Spinner size="sm" color="warning" />
							<span className="text-xs font-medium text-warning">Atualizando...</span>
						</div>
					)}
					{cacheInfo.lastUpdatedAt && (
						<div className="flex items-center gap-1.5">
							<span className="text-xs text-muted">Atualizado {formatRelativeTime(cacheInfo.lastUpdatedAt)}</span>
							<Tooltip>
								<Tooltip.Trigger>
									<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-muted" />
								</Tooltip.Trigger>
								<Tooltip.Content className="max-w-72">
									<Tooltip.Arrow />
									<span className="font-medium">Como funciona a atualização?</span>
									<br />
									<span className="text-xs">
										O <strong>saldo</strong> é sempre atualizado em tempo real. As demais estatísticas são atualizadas a
										cada {cacheInfo.cacheDurationMinutes} minutos.
									</span>
								</Tooltip.Content>
							</Tooltip>
						</div>
					)}
					{!cacheInfo.lastUpdatedAt && !cacheInfo.isProcessing && (
						<span className="text-xs text-muted">Aguardando primeiro processamento...</span>
					)}
					<AsyncButton variant="secondary" size="sm" onPress={onRefresh} isPending={isRefreshing}>
						<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
						Atualizar
					</AsyncButton>
				</div>
			</div>

			{renderSections()}
		</div>
	);
}

interface MerchantDashboardProps {
	merchantId: string;
}

export function MerchantDashboard({ merchantId }: MerchantDashboardProps) {
	const isMobile = useIsMobile();
	const router = useRouter();
	const { data: hookData, period, actions } = useMerchantDashboard({ merchantId });
	const { isVisible: isBalanceVisible, toggle: toggleBalanceVisibility } = useBalanceVisibility();

	function openLiveBalanceRoute() {
		router.push(Routes.panel.merchant.liveBalance);
	}

	if (hookData.isLoading) {
		return <DashboardSkeleton />;
	}

	if (hookData.error) {
		return (
			<Alert status="danger">
				<Alert.Indicator />
				<Alert.Content>
					<Alert.Title>Erro ao carregar dados</Alert.Title>
					<Alert.Description>{hookData.error}</Alert.Description>
				</Alert.Content>
			</Alert>
		);
	}

	if (!hookData.dashboard) {
		return (
			<Alert status="warning">
				<Alert.Indicator />
				<Alert.Content>
					<Alert.Title>Dados não disponíveis</Alert.Title>
					<Alert.Description>Não foi possível carregar os dados do dashboard.</Alert.Description>
				</Alert.Content>
			</Alert>
		);
	}

	if (isMobile) {
		return (
			<MobileMerchantDashboard
				merchantId={merchantId}
				onOpenLiveScreen={openLiveBalanceRoute}
				isBalanceVisible={isBalanceVisible}
				onToggleBalanceVisibility={toggleBalanceVisibility}
				hasReserveEnabled={hookData.hasReserveEnabled}
			/>
		);
	}

	return (
		<DashboardContent
			dashboard={hookData.dashboard}
			onRefresh={actions.refresh}
			isRefreshing={hookData.isRefreshing}
			selectedPeriod={period.selected}
			onPeriodChange={period.change}
			customStartDate={period.customRange.startDate}
			customEndDate={period.customRange.endDate}
			onCustomRangeChange={period.setCustomRange}
			isBalanceVisible={isBalanceVisible}
			onToggleBalanceVisibility={toggleBalanceVisibility}
			onOpenLiveScreen={openLiveBalanceRoute}
			hasReserveEnabled={hookData.hasReserveEnabled}
			reserveConfig={hookData.reserveConfig}
		/>
	);
}
