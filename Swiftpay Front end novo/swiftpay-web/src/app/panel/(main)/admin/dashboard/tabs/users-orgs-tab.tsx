'use client';

import { Card } from '@heroui/react';
import {
Building02Icon,
UserGroupIcon,
TransactionHistoryIcon,
UserAdd01Icon,
CancelCircleIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import type { AdminDashboardGrowthKpis, AdminMerchantKpis, AdminUserKpis } from '@/types/admin/dashboard';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { churnChartConfig, merchantStatusChartConfig, CHART_COLORS } from '../dashboard-chart-config';
import { GrowthIndicator } from '../components/growth-indicator';

export function UsersOrgsTab({
users,
merchants,
growth,
periodLabel,
}: {
users: AdminUserKpis;
merchants: AdminMerchantKpis;
growth: AdminDashboardGrowthKpis;
periodLabel: string;
}) {
return (
<div className="flex flex-col gap-4">
<UserAndMerchantKpiCards users={users} merchants={merchants} growth={growth} />
<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
<MerchantStatusChart merchants={merchants} periodLabel={periodLabel} />
<ChurnAnalysisChart users={users} merchants={merchants} periodLabel={periodLabel} />
</div>
</div>
);
}

function UserAndMerchantKpiCards({
users,
merchants,
growth,
}: {
users: AdminUserKpis;
merchants: AdminMerchantKpis;
growth: AdminDashboardGrowthKpis;
}) {
return (
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
<Card>
<Card.Content className="flex items-center gap-4 p-4">
<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
<Icon icon={UserGroupIcon} className="icon-sm text-accent" />
</div>
<div className="flex flex-col">
<span className="text-xs text-muted">Usuarios</span>
<div className="flex items-baseline gap-2">
<span className="text-xl font-bold">{users.totalUsers}</span>
<span className="text-xs text-success">({users.activeUsers} ativos)</span>
</div>
<GrowthIndicator growth={growth.usersGrowth} comparisonLabel={growth.growthComparisonLabel} />
</div>
</Card.Content>
</Card>

<Card>
<Card.Content className="flex items-center gap-4 p-4">
<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/10">
<Icon icon={Building02Icon} className="icon-sm text-success" />
</div>
<div className="flex flex-col">
<span className="text-xs text-muted">Organizacoes</span>
<div className="flex items-baseline gap-2">
<span className="text-xl font-bold">{merchants.totalMerchants}</span>
<span className="text-xs text-success">({merchants.activeMerchants} ativas)</span>
</div>
<GrowthIndicator growth={growth.merchantsGrowth} comparisonLabel={growth.growthComparisonLabel} />
</div>
</Card.Content>
</Card>

<Card>
<Card.Content className="flex items-center gap-4 p-4">
<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/10">
<Icon icon={TransactionHistoryIcon} className="icon-sm text-warning" />
</div>
<div className="flex flex-col">
<span className="text-xs text-muted">Aguardando KYC</span>
<span className="text-xl font-bold">{merchants.pendingKycMerchants}</span>
<GrowthIndicator growth={growth.pendingKycGrowth} comparisonLabel={growth.growthComparisonLabel} invertColors />
</div>
</Card.Content>
</Card>

<Card>
<Card.Content className="flex items-center gap-4 p-4">
<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-default/10">
<Icon icon={UserAdd01Icon} className="icon-sm text-default-500" />
</div>
<div className="flex flex-col">
<span className="text-xs text-muted">Novos este mes</span>
<div className="flex items-center gap-3">
<div className="flex items-baseline gap-1">
<span className="text-xl font-bold">{users.newUsersThisMonth}</span>
<span className="text-xs text-muted">users</span>
</div>
<div className="flex items-baseline gap-1">
<span className="text-xl font-bold">{merchants.newMerchantsThisMonth}</span>
<span className="text-xs text-muted">orgs</span>
</div>
</div>
<GrowthIndicator growth={growth.registrationsGrowth} comparisonLabel={growth.growthComparisonLabel} />
</div>
</Card.Content>
</Card>
</div>
);
}

function MerchantStatusChart({ merchants, periodLabel }: { merchants: AdminMerchantKpis; periodLabel: string }) {
const chartData = [
{ name: 'Ativos', value: merchants.activeMerchants, fill: CHART_COLORS.success },
{ name: 'Pendentes KYC', value: merchants.pendingKycMerchants, fill: CHART_COLORS.warning },
{ name: 'Rascunho', value: merchants.draftMerchants, fill: CHART_COLORS.default },
{ name: 'Suspensos', value: merchants.suspendedMerchants, fill: CHART_COLORS.danger },
].filter((item) => item.value > 0);

if (merchants.totalMerchants === 0) {
return (
<Card>
<Card.Header className="px-4 pt-4">
<Card.Title className="flex items-center gap-2 text-base">
<Icon icon={Building02Icon} className="icon-sm text-accent" />
Status das Organizacoes
</Card.Title>
<Card.Description className="text-xs">{periodLabel}, distribuicao por status</Card.Description>
</Card.Header>
<Card.Content className="flex h-48 items-center justify-center px-4 pb-4">
<p className="text-sm text-muted">Nenhuma organizacao cadastrada</p>
</Card.Content>
</Card>
);
}

return (
<Card>
<Card.Header className="px-4 pt-4">
<Card.Title className="flex items-center gap-2 text-base">
<Icon icon={Building02Icon} className="icon-sm text-accent" />
Status das Organizacoes
</Card.Title>
<Card.Description className="text-xs">{periodLabel}, distribuicao por status</Card.Description>
</Card.Header>
<Card.Content className="px-4 pb-4">
<ChartContainer config={merchantStatusChartConfig} className="mx-auto h-48 w-full">
<PieChart>
<ChartTooltip content={<ChartTooltipContent formatter={(value) => `${value} organizacoes`} />} />
<Pie
data={chartData}
dataKey="value"
nameKey="name"
cx="50%"
cy="50%"
innerRadius={40}
outerRadius={70}
paddingAngle={2}
>
{chartData.map((entry, index) => (
<Cell key={`cell-${index}`} fill={entry.fill} />
))}
</Pie>
</PieChart>
</ChartContainer>
<div className="mt-2 flex flex-wrap justify-center gap-4">
<div className="flex items-center gap-2">
<div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS.success }} />
<span className="text-xs text-muted">Ativos: {merchants.activeMerchants}</span>
</div>
<div className="flex items-center gap-2">
<div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS.warning }} />
<span className="text-xs text-muted">Pendentes: {merchants.pendingKycMerchants}</span>
</div>
<div className="flex items-center gap-2">
<div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS.default }} />
<span className="text-xs text-muted">Rascunho: {merchants.draftMerchants}</span>
</div>
<div className="flex items-center gap-2">
<div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS.danger }} />
<span className="text-xs text-muted">Suspensos: {merchants.suspendedMerchants}</span>
</div>
</div>
</Card.Content>
</Card>
);
}

function ChurnAnalysisChart({
users,
merchants,
periodLabel,
}: {
users: AdminUserKpis;
merchants: AdminMerchantKpis;
periodLabel: string;
}) {
const churnData = [
{
category: 'Organizacoes',
suspended: merchants.suspendedMerchants,
inactive: merchants.draftMerchants,
rejected: merchants.rejectedKycMerchants,
},
{
category: 'Usuarios',
suspended: users.suspendedUsers,
inactive: users.inactiveUsers,
rejected: 0,
},
];

const totalChurn =
merchants.suspendedMerchants + merchants.rejectedKycMerchants + users.suspendedUsers + users.inactiveUsers;

const reasonsData = [
{
name: 'Suspensos/Banidos',
value: merchants.suspendedMerchants + users.suspendedUsers,
fill: CHART_COLORS.danger,
},
{ name: 'Inativos', value: merchants.draftMerchants + users.inactiveUsers, fill: CHART_COLORS.warning },
{ name: 'KYC Rejeitado', value: merchants.rejectedKycMerchants, fill: CHART_COLORS.default },
].filter((item) => item.value > 0);

return (
<Card>
<Card.Header className="px-4 pt-4">
<Card.Title className="flex items-center gap-2 text-base">
<Icon icon={CancelCircleIcon} className="icon-sm text-danger" />
Analise de Evasao (Churn)
</Card.Title>
<Card.Description className="text-xs">
{periodLabel}, total de usuarios/orgs inativos ou suspensos: {totalChurn}
</Card.Description>
</Card.Header>
<Card.Content className="px-4 pb-4">
<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
<div>
<p className="mb-2 text-xs font-medium text-muted">Por Categoria</p>
<ChartContainer config={churnChartConfig} className="h-40 w-full">
<BarChart accessibilityLayer data={churnData} layout="vertical">
<CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-default-200" />
<XAxis type="number" tickLine={false} axisLine={false} fontSize={10} />
<YAxis type="category" dataKey="category" tickLine={false} axisLine={false} fontSize={10} width={70} />
<ChartTooltip content={<ChartTooltipContent />} />
<Legend />
<Bar dataKey="suspended" fill="var(--color-suspended)" stackId="a" name="Suspensos" />
<Bar dataKey="inactive" fill="var(--color-inactive)" stackId="a" name="Inativos" />
<Bar dataKey="rejected" fill="var(--color-rejected)" stackId="a" name="Rejeitados" radius={[0, 4, 4, 0]} />
</BarChart>
</ChartContainer>
</div>
<div>
<p className="mb-2 text-xs font-medium text-muted">Principais Motivos</p>
{reasonsData.length > 0 ? (
<ChartContainer config={churnChartConfig} className="mx-auto h-40 w-full">
<PieChart>
<ChartTooltip content={<ChartTooltipContent formatter={(value) => `${value} usuarios/orgs`} />} />
<Pie
data={reasonsData}
dataKey="value"
nameKey="name"
cx="50%"
cy="50%"
innerRadius={30}
outerRadius={55}
paddingAngle={2}
>
{reasonsData.map((entry, index) => (
<Cell key={`cell-${index}`} fill={entry.fill} />
))}
</Pie>
</PieChart>
</ChartContainer>
) : (
<div className="flex h-40 items-center justify-center">
<p className="text-sm text-muted">Nenhuma evasao registrada</p>
</div>
)}
<div className="mt-2 flex flex-wrap justify-center gap-3">
{reasonsData.map((item) => (
<div key={item.name} className="flex items-center gap-1">
<div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />
<span className="text-xs text-muted">
{item.name}: {item.value}
</span>
</div>
))}
</div>
</div>
</div>
</Card.Content>
</Card>
);
}
