'use client';

import { Alert, Card, DateField, DateRangePicker, ListBox, RangeCalendar, Select, Skeleton, Tabs, Tooltip } from '@heroui/react';
import {
	AnalyticsUpIcon,
	UserGroupIcon,
	Wallet01Icon,
	ArrowDataTransferHorizontalIcon,
	Analytics02Icon,
	Wallet03Icon,
	BankIcon,
	CheckmarkCircle02Icon,
	CancelCircleIcon,
	HelpCircleIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { InternalTabs, type InternalTabItem } from '@/components/ui/internal-tabs';
import { PageHeader } from '@/components/ui/page-header';
import { DashboardRefreshControls } from './dashboard-refresh-controls';
import { useAdminDashboard } from './use-admin-dashboard';
import { OverviewTab } from './tabs/overview-tab';
import { FinancialTab } from './tabs/financial-tab';
import { TransactionsTab } from './tabs/transactions-tab';
import { UsersOrgsTab } from './tabs/users-orgs-tab';
import { GrowthTab } from './tabs/growth-tab';
import { parseDate } from '@internationalized/date';
import type { AdminDashboardPeriod } from '@/types/admin/dashboard';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { GrowthIndicator } from './components/growth-indicator';

const DASHBOARD_SECTIONS: InternalTabItem[] = [
	{ id: 'overview', label: 'Visão Geral', icon: <Icon icon={Analytics02Icon} className="icon-sm" /> },
	{ id: 'financial', label: 'Financeiro', icon: <Icon icon={Wallet01Icon} className="icon-sm" /> },
	{
		id: 'transactions',
		label: 'Transações',
		icon: <Icon icon={ArrowDataTransferHorizontalIcon} className="icon-sm" />,
	},
	{ id: 'users-orgs', label: 'Usuários & Orgs', icon: <Icon icon={UserGroupIcon} className="icon-sm" /> },
	{ id: 'growth', label: 'Crescimento', icon: <Icon icon={AnalyticsUpIcon} className="icon-sm" /> },
];

type DashboardSectionId = 'overview' | 'financial' | 'transactions' | 'users-orgs' | 'growth';

const DASHBOARD_SECTION_HEADERS: Record<
	DashboardSectionId,
	{ icon: React.ReactNode; title: string; description: string }
> = {
	overview: {
		icon: <Icon icon={Analytics02Icon} className="icon-md text-accent-foreground" />,
		title: 'Visão Geral',
		description: 'Principais métricas e indicadores da plataforma',
	},
	financial: {
		icon: <Icon icon={Wallet01Icon} className="icon-md text-accent-foreground" />,
		title: 'Financeiro',
		description: 'TPV, receita de taxas e resultado líquido',
	},
	transactions: {
		icon: <Icon icon={Analytics02Icon} className="icon-md text-accent-foreground" />,
		title: 'Transações',
		description: 'Pipeline transacional, aprovação, ticket médio e falhas',
	},
	'users-orgs': {
		icon: <Icon icon={UserGroupIcon} className="icon-md text-accent-foreground" />,
		title: 'Usuários & Organizações',
		description: 'Cadastros, status e distribuição',
	},
	growth: {
		icon: <Icon icon={AnalyticsUpIcon} className="icon-md text-accent-foreground" />,
		title: 'Crescimento',
		description: 'Novos cadastros e evolução da plataforma',
	},
};

export function AdminDashboard() {
	const { data, error, isLoading, activeSection, setActiveSection, isRefreshing, handleRefresh, period } = useAdminDashboard();

	if (isLoading) {
		return <AdminDashboardSkeleton />;
	}

	if (error) {
		return (
			<Alert status="danger">
				<Alert.Indicator />
				<Alert.Content>
					<Alert.Title>Erro ao carregar dados</Alert.Title>
					<Alert.Description>{error}</Alert.Description>
				</Alert.Content>
			</Alert>
		);
	}

	if (!data) {
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

	const rangeValue =
		period.customRange.startDate && period.customRange.endDate
			? { start: parseDate(period.customRange.startDate), end: parseDate(period.customRange.endDate) }
			: null;

	const headerActions = (
		<div className="flex flex-wrap items-center gap-2">
			<Select
				variant="secondary"
				aria-label="Período"
				value={period.selected}
				onChange={(key) => {
					if (key) period.change(key as AdminDashboardPeriod);
				}}
				className="w-44"
			>
				<Select.Trigger>
					<Select.Value />
					<Select.Indicator />
				</Select.Trigger>
				<Select.Popover>
					<ListBox>
						{period.options.map((opt) => (
							<ListBox.Item key={opt.key} id={opt.key} textValue={opt.label}>
								{opt.label}
								<ListBox.ItemIndicator />
							</ListBox.Item>
						))}
					</ListBox>
				</Select.Popover>
			</Select>

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

			<DashboardRefreshControls cacheInfo={data.cacheInfo} isRefreshing={isRefreshing} onRefresh={handleRefresh} />
		</div>
	);

	return (
		<div className="flex flex-col gap-6">
			{/* Unified Executive Toolbar */}
			<div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-white/12 pb-4">
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
						<Icon icon={Analytics02Icon} className="icon-md text-accent" />
					</div>
					<div>
						<h1 className="text-base font-semibold text-white tracking-tight">Admin</h1>
						<p className="text-xs text-white/50 mt-0.5">Financeiro, operacional e crescimento</p>
					</div>
				</div>

				{headerActions}
			</div>

			{/* Consolidated Financial Hero */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<div className="rounded-[20px] border border-white/12 bg-[#16181a]">
					<div className="flex flex-col justify-between gap-3 p-5">
						<div className="flex items-center justify-between">
							<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">TPV</span>
							<Tooltip>
								<Tooltip.Trigger>
									<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-white/50 hover:text-white/80 transition-colors" />
								</Tooltip.Trigger>
								<Tooltip.Content className="max-w-72 bg-[#16181a] border border-white/12 text-white">
									<Tooltip.Arrow className="fill-[#16181a] stroke-white/12" />
									<span className="font-medium">TPV, Total Payment Volume</span>
									<br />
									<span className="text-xs">Soma de todos os pagamentos aprovados e processados com sucesso na plataforma.</span>
								</Tooltip.Content>
							</Tooltip>
						</div>
						<AnimatedCurrency value={data.financial.totalVolume} className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums" />
						<div className="flex items-center justify-between mt-1 text-xs">
							<GrowthIndicator growth={data.growth.volumeGrowth} comparisonLabel={data.growth.growthComparisonLabel} />
							<span className="font-mono text-white/40">
								{data.financial.completedTransactions.toLocaleString('pt-BR')} transações
							</span>
						</div>
					</div>
				</div>

				<div className="rounded-[20px] border border-white/12 bg-[#16181a]">
					<div className="flex flex-col justify-between gap-3 p-5">
						<div className="flex items-center justify-between">
							<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Receita Bruta</span>
							<Tooltip>
								<Tooltip.Trigger>
									<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-white/50 hover:text-white/80 transition-colors" />
								</Tooltip.Trigger>
								<Tooltip.Content className="max-w-72 bg-[#16181a] border border-white/12 text-white">
									<Tooltip.Arrow className="fill-[#16181a] stroke-white/12" />
									<span className="font-medium">Receita Bruta (Taxas Cobradas)</span>
									<br />
									<span className="text-xs">Total de taxas cobradas das organizações (pagamentos + saques).</span>
								</Tooltip.Content>
							</Tooltip>
						</div>
						<AnimatedCurrency value={data.financial.totalFees} className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums" />
						<div className="flex items-center justify-between mt-1 text-xs">
							<GrowthIndicator growth={data.growth.totalFeesGrowth} comparisonLabel={data.growth.growthComparisonLabel} />
							<span className="font-mono text-white/40">
								<AnimatedNumber
									value={data.financial.totalVolume > 0 ? (data.financial.totalFees / data.financial.totalVolume) * 100 : 0}
									maximumFractionDigits={2}
									minimumFractionDigits={2}
									suffix="% do volume"
								/>
							</span>
						</div>
					</div>
				</div>

				<div className="rounded-[20px] border border-white/12 bg-[#16181a]">
					<div className="flex flex-col justify-between gap-3 p-5">
						<div className="flex items-center justify-between">
							<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Custo Adquirentes</span>
							<Tooltip>
								<Tooltip.Trigger>
									<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-white/50 hover:text-white/80 transition-colors" />
								</Tooltip.Trigger>
								<Tooltip.Content className="max-w-72 bg-[#16181a] border border-white/12 text-white">
									<Tooltip.Arrow className="fill-[#16181a] stroke-white/12" />
									<span className="font-medium">Custo das Adquirentes</span>
									<br />
									<span className="text-xs">Total de taxas pagas às adquirentes para processar pagamentos e saques.</span>
								</Tooltip.Content>
							</Tooltip>
						</div>
						<AnimatedCurrency value={data.financial.totalAcquirerFees} className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums" />
						<div className="flex items-center justify-between mt-1 text-xs">
							<GrowthIndicator growth={data.growth.totalAcquirerFeesGrowth} comparisonLabel={data.growth.growthComparisonLabel} invertColors />
							<span className="font-mono text-white/40">
								<AnimatedNumber
									value={data.financial.totalVolume > 0 ? (data.financial.totalAcquirerFees / data.financial.totalVolume) * 100 : 0}
									maximumFractionDigits={2}
									minimumFractionDigits={2}
									suffix="% do volume"
								/>
							</span>
						</div>
					</div>
				</div>

				<div className="rounded-[20px] border border-white/12 bg-[#16181a]">
					<div className="flex flex-col justify-between gap-3 p-5">
						<div className="flex items-center justify-between">
							<span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Receita Líquida</span>
							<Tooltip>
								<Tooltip.Trigger>
									<Icon icon={HelpCircleIcon} className="icon-xs cursor-help text-white/50 hover:text-white/80 transition-colors" />
								</Tooltip.Trigger>
								<Tooltip.Content className="max-w-72 bg-[#16181a] border border-white/12 text-white">
									<Tooltip.Arrow className="fill-[#16181a] stroke-white/12" />
									<span className="font-medium">Receita Líquida</span>
									<br />
									<span className="text-xs">Receita bruta menos custo das adquirentes.</span>
								</Tooltip.Content>
							</Tooltip>
						</div>
						<AnimatedCurrency value={data.financial.totalNetRevenue} className="text-2xl font-extrabold font-mono text-white tracking-tight tabular-nums" />
						<div className="flex items-center justify-between mt-1 text-xs">
							<GrowthIndicator growth={data.growth.netRevenueGrowth} comparisonLabel={data.growth.growthComparisonLabel} />
							<span className="font-mono text-white/40">
								<AnimatedNumber
									value={data.financial.totalVolume > 0 ? (data.financial.totalNetRevenue / data.financial.totalVolume) * 100 : 0}
									maximumFractionDigits={2}
									minimumFractionDigits={2}
									suffix="% margem"
								/>
							</span>
						</div>
					</div>
				</div>
			</div>

			<InternalTabs
				ariaLabel="Navegação do dashboard"
				items={[
					{ id: 'overview', label: 'Visão Geral' },
					{ id: 'financial', label: 'Financeiro' },
					{ id: 'transactions', label: 'Transações' },
					{ id: 'users-orgs', label: 'Usuários & Orgs' },
					{ id: 'growth', label: 'Crescimento' },
				]}
				selectedKey={activeSection}
				onSelectionChange={setActiveSection}
			>
				<Tabs.Panel id="overview">
					<div className="flex flex-col gap-6 pt-1">
						<OverviewTab financial={data.financial} growth={data.growth} selectedPeriod={data.periodInfo.period} users={data.users} merchants={data.merchants} />
					</div>
				</Tabs.Panel>
				<Tabs.Panel id="financial">
					<div className="flex flex-col gap-6 pt-1">
						<FinancialTab financial={data.financial} volumeChart={data.volumeChart} growth={data.growth} periodLabel={data.periodInfo.label} />
					</div>
				</Tabs.Panel>
				<Tabs.Panel id="transactions">
					<div className="flex flex-col gap-6 pt-1">
						<TransactionsTab financial={data.financial} volumeChart={data.volumeChart} growth={data.growth} periodLabel={data.periodInfo.label} />
					</div>
				</Tabs.Panel>
				<Tabs.Panel id="users-orgs">
					<div className="flex flex-col gap-6 pt-1">
						<UsersOrgsTab users={data.users} merchants={data.merchants} growth={data.growth} periodLabel={data.periodInfo.label} />
					</div>
				</Tabs.Panel>
				<Tabs.Panel id="growth">
					<div className="flex flex-col gap-6 pt-1">
						<GrowthTab registrationChart={data.registrationChart} growth={data.growth} users={data.users} merchants={data.merchants} periodLabel={data.periodInfo.label} />
					</div>
				</Tabs.Panel>
			</InternalTabs>
		</div>
	);
}

export function AdminDashboardSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-end gap-3">
				<Skeleton className="h-4 w-32 rounded-lg" />
				<Skeleton className="h-9 w-24 rounded-lg" />
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{[...Array(4)].map((_, i) => (
					<Card key={i}>
						<Card.Content className="flex flex-col gap-2 p-4">
							<div className="flex items-center gap-2">
								<Skeleton className="h-5 w-5 rounded-md" />
								<Skeleton className="h-4 w-20 rounded-lg" />
							</div>
							<Skeleton className="h-8 w-32 rounded-lg" />
						</Card.Content>
					</Card>
				))}
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
				{[...Array(4)].map((_, i) => (
					<Card key={i}>
						<Card.Content className="flex items-center gap-4 p-4">
							<Skeleton className="h-12 w-12 shrink-0 rounded-full" />
							<div className="flex flex-col gap-1">
								<Skeleton className="h-4 w-20 rounded-lg" />
								<Skeleton className="h-6 w-28 rounded-lg" />
							</div>
						</Card.Content>
					</Card>
				))}
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{[...Array(2)].map((_, i) => (
					<Card key={i}>
						<Card.Header className="px-4 pt-4">
							<div className="flex items-center gap-2">
								<Skeleton className="h-4 w-4 rounded-md" />
								<Skeleton className="h-5 w-28 rounded-lg" />
							</div>
							<Skeleton className="mt-1 h-3 w-40 rounded-lg" />
						</Card.Header>
						<Card.Content className="px-4 pb-4">
							<Skeleton className="h-48 w-full rounded-lg" />
						</Card.Content>
					</Card>
				))}
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<Card>
					<Card.Header className="px-4 pt-4">
						<div className="flex items-center gap-2">
							<Skeleton className="h-4 w-4 rounded-md" />
							<Skeleton className="h-5 w-40 rounded-lg" />
						</div>
						<Skeleton className="mt-1 h-3 w-32 rounded-lg" />
					</Card.Header>
					<Card.Content className="px-4 pb-4">
						<div className="flex h-48 items-center justify-center">
							<Skeleton className="h-36 w-36 rounded-full" />
						</div>
					</Card.Content>
				</Card>
				<Card>
					<Card.Header className="px-4 pt-4">
						<div className="flex items-center gap-2">
							<Skeleton className="h-4 w-4 rounded-md" />
							<Skeleton className="h-5 w-28 rounded-lg" />
						</div>
						<Skeleton className="mt-1 h-3 w-40 rounded-lg" />
					</Card.Header>
					<Card.Content className="grid grid-cols-2 gap-4 px-4 pb-4">
						{[...Array(4)].map((_, i) => (
							<div key={i} className="flex flex-col gap-1">
								<Skeleton className="h-3 w-16 rounded-lg" />
								<Skeleton className="h-6 w-20 rounded-lg" />
							</div>
						))}
					</Card.Content>
				</Card>
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				{[...Array(2)].map((_, i) => (
					<Card key={i}>
						<Card.Content className="flex items-center gap-4 p-4">
							<Skeleton className="h-12 w-12 shrink-0 rounded-full" />
							<div className="flex flex-col gap-1">
								<Skeleton className="h-4 w-28 rounded-lg" />
								<Skeleton className="h-6 w-24 rounded-lg" />
							</div>
						</Card.Content>
					</Card>
				))}
			</div>
		</div>
	);
}
