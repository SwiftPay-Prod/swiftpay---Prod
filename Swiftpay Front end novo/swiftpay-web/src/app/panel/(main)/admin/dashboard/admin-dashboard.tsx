'use client';

import { Alert, Card, DateField, DateRangePicker, ListBox, RangeCalendar, Select, Skeleton, Tabs } from '@heroui/react';
import {
	AnalyticsUpIcon,
	UserGroupIcon,
	Wallet01Icon,
	ArrowDataTransferHorizontalIcon,
	Analytics02Icon,
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

			<div className="flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
				{data.periodInfo.label}
			</div>

			<DashboardRefreshControls cacheInfo={data.cacheInfo} isRefreshing={isRefreshing} onRefresh={handleRefresh} />
		</div>
	);

	return (
		<div className="flex flex-col gap-4">
			<InternalTabs
				ariaLabel="Navegação do dashboard"
				items={DASHBOARD_SECTIONS}
				selectedKey={activeSection}
				onSelectionChange={setActiveSection}
			>
				<Tabs.Panel id="overview">
					<div className="flex flex-col gap-4">
						<PageHeader
							icon={DASHBOARD_SECTION_HEADERS.overview.icon}
							title={DASHBOARD_SECTION_HEADERS.overview.title}
							description={DASHBOARD_SECTION_HEADERS.overview.description}
							actions={headerActions}
						/>
						<OverviewTab financial={data.financial} growth={data.growth} selectedPeriod={data.periodInfo.period} />
					</div>
				</Tabs.Panel>
				<Tabs.Panel id="financial">
					<div className="flex flex-col gap-4">
						<PageHeader
							icon={DASHBOARD_SECTION_HEADERS.financial.icon}
							title={DASHBOARD_SECTION_HEADERS.financial.title}
							description={DASHBOARD_SECTION_HEADERS.financial.description}
							actions={headerActions}
						/>
						<FinancialTab
							financial={data.financial}
							volumeChart={data.volumeChart}
							growth={data.growth}
							periodLabel={data.periodInfo.label}
						/>
					</div>
				</Tabs.Panel>
				<Tabs.Panel id="transactions">
					<div className="flex flex-col gap-4">
						<PageHeader
							icon={DASHBOARD_SECTION_HEADERS.transactions.icon}
							title={DASHBOARD_SECTION_HEADERS.transactions.title}
							description={DASHBOARD_SECTION_HEADERS.transactions.description}
							actions={headerActions}
						/>
						<TransactionsTab
							financial={data.financial}
							volumeChart={data.volumeChart}
							growth={data.growth}
							periodLabel={data.periodInfo.label}
						/>
					</div>
				</Tabs.Panel>
				<Tabs.Panel id="users-orgs">
					<div className="flex flex-col gap-4">
						<PageHeader
							icon={DASHBOARD_SECTION_HEADERS['users-orgs'].icon}
							title={DASHBOARD_SECTION_HEADERS['users-orgs'].title}
							description={DASHBOARD_SECTION_HEADERS['users-orgs'].description}
							actions={headerActions}
						/>
						<UsersOrgsTab
							users={data.users}
							merchants={data.merchants}
							growth={data.growth}
							periodLabel={data.periodInfo.label}
						/>
					</div>
				</Tabs.Panel>
				<Tabs.Panel id="growth">
					<div className="flex flex-col gap-4">
						<PageHeader
							icon={DASHBOARD_SECTION_HEADERS.growth.icon}
							title={DASHBOARD_SECTION_HEADERS.growth.title}
							description={DASHBOARD_SECTION_HEADERS.growth.description}
							actions={headerActions}
						/>
						<GrowthTab
							registrationChart={data.registrationChart}
							growth={data.growth}
							users={data.users}
							merchants={data.merchants}
							periodLabel={data.periodInfo.label}
						/>
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
