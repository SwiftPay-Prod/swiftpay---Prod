'use client';

import { Card } from '@heroui/react';
import { UserAdd01Icon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import type { AdminDailyRegistrationData, AdminDashboardGrowthKpis, AdminMerchantKpis, AdminUserKpis } from '@/types/admin/dashboard';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ComposedChart, CartesianGrid, Legend, Line, Bar, XAxis, YAxis } from 'recharts';
import { growthChartConfig, registrationChartConfig } from '../dashboard-chart-config';
import { GrowthIndicator } from '../components/growth-indicator';

export function GrowthTab({
	registrationChart,
	growth,
	users,
	merchants,
	periodLabel,
}: {
	registrationChart: AdminDailyRegistrationData[];
	growth: AdminDashboardGrowthKpis;
	users: AdminUserKpis;
	merchants: AdminMerchantKpis;
	periodLabel: string;
}) {
	const totalRegistrations = users.totalUsers + merchants.totalMerchants;

	return (
		<div className="flex flex-col gap-4">
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<Card>
					<Card.Content className="flex flex-col gap-2 p-4">
						<span className="text-xs text-muted">Novos usuários</span>
						<span className="text-2xl font-bold">{users.totalUsers.toLocaleString('pt-BR')}</span>
						<GrowthIndicator growth={growth.usersGrowth} comparisonLabel={growth.growthComparisonLabel} />
					</Card.Content>
				</Card>
				<Card>
					<Card.Content className="flex flex-col gap-2 p-4">
						<span className="text-xs text-muted">Novas organizações</span>
						<span className="text-2xl font-bold">{merchants.totalMerchants.toLocaleString('pt-BR')}</span>
						<GrowthIndicator growth={growth.merchantsGrowth} comparisonLabel={growth.growthComparisonLabel} />
					</Card.Content>
				</Card>
				<Card>
					<Card.Content className="flex flex-col gap-2 p-4">
						<span className="text-xs text-muted">Cadastros totais</span>
						<span className="text-2xl font-bold">{totalRegistrations.toLocaleString('pt-BR')}</span>
						<GrowthIndicator growth={growth.registrationsGrowth} comparisonLabel={growth.growthComparisonLabel} />
					</Card.Content>
				</Card>
			</div>
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<RegistrationChart data={registrationChart} periodLabel={periodLabel} />
				<GrowthComparisonChart data={registrationChart} periodLabel={periodLabel} />
			</div>
		</div>
	);
}

function RegistrationChart({ data, periodLabel }: { data: AdminDailyRegistrationData[]; periodLabel: string }) {
	const chartData = data.map((item) => ({
		...item,
		date: new Date(item.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
	}));

	return (
		<Card>
			<Card.Header className="px-4 pt-4">
				<Card.Title className="flex items-center gap-2 text-base">
					<Icon icon={UserAdd01Icon} className="icon-sm text-accent" />
					Novos cadastros
				</Card.Title>
				<Card.Description className="text-xs">{periodLabel}</Card.Description>
			</Card.Header>
			<Card.Content className="px-4 pb-4">
				<ChartContainer config={registrationChartConfig} className="h-48 w-full">
					<ComposedChart accessibilityLayer data={chartData}>
						<CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-default-200" />
						<XAxis dataKey="date" tickLine={false} tickMargin={8} axisLine={false} fontSize={10} />
						<YAxis tickLine={false} axisLine={false} fontSize={10} width={30} allowDecimals={false} />
						<ChartTooltip content={<ChartTooltipContent />} />
						<Legend />
						<Line
							type="monotone"
							dataKey="newUsers"
							stroke="var(--color-newUsers)"
							strokeWidth={2}
							dot={{ r: 4 }}
							name="Usuários"
						/>
						<Line
							type="monotone"
							dataKey="newMerchants"
							stroke="var(--color-newMerchants)"
							strokeWidth={2}
							dot={{ r: 4 }}
							name="Organizações"
						/>
					</ComposedChart>
				</ChartContainer>
			</Card.Content>
		</Card>
	);
}

function GrowthComparisonChart({ data, periodLabel }: { data: AdminDailyRegistrationData[]; periodLabel: string }) {
	const chartData = data.map((item) => ({
		date: new Date(item.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
		newUsers: item.newUsers,
		newMerchants: item.newMerchants,
		ratio: item.newMerchants > 0 ? item.newUsers / item.newMerchants : 0,
	}));

	const totalUsers = data.reduce((sum, item) => sum + item.newUsers, 0);
	const totalMerchants = data.reduce((sum, item) => sum + item.newMerchants, 0);

	return (
		<Card>
			<Card.Header className="px-4 pt-4">
				<Card.Title className="flex items-center gap-2 text-base">
					<Icon icon={UserGroupIcon} className="icon-sm text-accent" />
					Crescimento Usuários vs Orgs
				</Card.Title>
				<Card.Description className="text-xs">
					{periodLabel},
					{' '}
					{totalUsers} usuários / {totalMerchants} organizações no período
				</Card.Description>
			</Card.Header>
			<Card.Content className="px-4 pb-4">
				<ChartContainer config={growthChartConfig} className="h-48 w-full">
					<ComposedChart accessibilityLayer data={chartData}>
						<CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-default-200" />
						<XAxis dataKey="date" tickLine={false} tickMargin={8} axisLine={false} fontSize={10} />
						<YAxis yAxisId="left" tickLine={false} axisLine={false} fontSize={10} width={30} allowDecimals={false} />
						<YAxis
							yAxisId="right"
							orientation="right"
							tickLine={false}
							axisLine={false}
							fontSize={10}
							width={30}
							allowDecimals={false}
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									formatter={(value, name) => {
										if (name === 'ratio') return `${(value as number).toFixed(1)}x`;
										return String(value);
									}}
								/>
							}
						/>
						<Legend />
						<Bar
							yAxisId="left"
							dataKey="newUsers"
							fill="var(--color-newUsers)"
							radius={[4, 4, 0, 0]}
							name="Novos Usuários"
						/>
						<Bar
							yAxisId="left"
							dataKey="newMerchants"
							fill="var(--color-newMerchants)"
							radius={[4, 4, 0, 0]}
							name="Novas Orgs"
						/>
						<Line
							yAxisId="right"
							type="monotone"
							dataKey="ratio"
							stroke="var(--color-ratio)"
							strokeWidth={2}
							dot={{ r: 4 }}
							name="Razão User/Org"
						/>
					</ComposedChart>
				</ChartContainer>
			</Card.Content>
		</Card>
	);
}
