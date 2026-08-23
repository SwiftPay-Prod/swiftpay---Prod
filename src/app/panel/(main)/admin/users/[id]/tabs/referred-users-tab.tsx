import { Card, Chip, Separator } from '@heroui/react';
import { UserGroupIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { DataTable } from '@/components/ui/data-table';
import type { DataTableColumn } from '@/components/ui/data-table';
import { EmailLink } from '@/components/ui/data-links';
import type { AdminReferralsData, AdminMinimalReferredUser } from '@/types/admin/referrals';
import { userStatusParse, mapParseColorToChipColor } from '@/parse';
import { formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';

interface ReferredUsersTabProps {
	data: AdminReferralsData | null;
}

function getColumns(): DataTableColumn<AdminMinimalReferredUser>[] {
	return [
		{
			key: 'user',
			header: 'Usuário indicado',
			render: (item) => (
				<div className="flex flex-col">
					<span className="font-medium text-foreground">{item.name || 'Sem nome'}</span>
					<EmailLink email={item.email} className="text-sm" />
				</div>
			),
		},
		{
			key: 'status',
			header: 'Status',
			render: (item) => {
				const statusParsed = userStatusParse[item.status];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm" className="gap-1">
						{statusParsed.icon}
						{statusParsed.label}
					</Chip>
				);
			},
		},
		{
			key: 'referredAt',
			header: 'Indicado em',
			render: (item) => <span className="text-sm text-muted">{formatDate(item.referredAt)}</span>,
		},
		{
			key: 'estimatedCommissionFromPayments',
			header: 'Comissão pagamentos',
			render: (item) => <span>{formatCurrency(item.estimatedCommissionFromPayments)}</span>,
		},
		{
			key: 'estimatedCommissionFromPayouts',
			header: 'Comissão saques',
			render: (item) => <span>{formatCurrency(item.estimatedCommissionFromPayouts)}</span>,
		},
		{
			key: 'estimatedCommissionTotal',
			header: 'Comissão total',
			render: (item) => <span className="font-medium">{formatCurrency(item.estimatedCommissionTotal)}</span>,
		},
	];
}

function renderMobileReferredUserCard(item: AdminMinimalReferredUser) {
	const statusParsed = userStatusParse[item.status];
	return (
		<div className="rounded-xl border border-border bg-surface p-3 overflow-hidden">
			<div className="flex items-start justify-between gap-3 mb-3">
				<div>
					<span className="font-medium text-sm">{item.name || 'Sem nome'}</span>
					<EmailLink email={item.email} className="text-xs mt-0.5 block" />
				</div>
				<Chip variant="soft" color={mapParseColorToChipColor(statusParsed.color)} size="sm" className="gap-1">
					{statusParsed.icon}
					{statusParsed.label}
				</Chip>
			</div>
			<div className="grid grid-cols-2 gap-3">
				<div className="flex flex-col gap-0.5">
					<span className="text-xs text-muted">Indicado em</span>
					<span className="text-sm">{formatDate(item.referredAt)}</span>
				</div>
				<div className="flex flex-col gap-0.5">
					<span className="text-xs text-muted">Comissão Total</span>
					<span className="text-sm font-medium">{formatCurrency(item.estimatedCommissionTotal)}</span>
				</div>
				<div className="flex flex-col gap-0.5">
					<span className="text-xs text-muted">Pagamentos</span>
					<span className="text-sm">{formatCurrency(item.estimatedCommissionFromPayments)}</span>
				</div>
				<div className="flex flex-col gap-0.5">
					<span className="text-xs text-muted">Saques</span>
					<span className="text-sm">{formatCurrency(item.estimatedCommissionFromPayouts)}</span>
				</div>
			</div>
		</div>
	);
}

export function ReferredUsersTab({ data }: ReferredUsersTabProps) {
	const summary = data?.summary;
	const items = data?.referredUsers.items ?? [];
	const columns = getColumns();

	return (
		<div className="flex flex-col gap-6">
			<Card>
				<Card.Header>
					<div className="flex items-center gap-2">
						<Icon icon={UserGroupIcon} className="icon-md text-accent" />
						<Card.Title>Resumo de indicações</Card.Title>
					</div>
				</Card.Header>
				<Separator />
				<Card.Content>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
						<div className="rounded-xl bg-surface-secondary p-4">
							<p className="text-sm text-muted">Usuários indicados</p>
							<p className="text-xl font-semibold">{summary?.totalReferredUsers ?? 0}</p>
						</div>
						<div className="rounded-xl bg-surface-secondary p-4">
							<p className="text-sm text-muted">Gerentes de contas únicos</p>
							<p className="text-xl font-semibold">{summary?.totalReferrers ?? 0}</p>
						</div>
						<div className="rounded-xl bg-surface-secondary p-4">
							<p className="text-sm text-muted">Comissão pagamentos</p>
							<p className="text-xl font-semibold">{formatCurrency(summary?.totalEstimatedCommissionFromPayments ?? 0)}</p>
						</div>
						<div className="rounded-xl bg-surface-secondary p-4">
							<p className="text-sm text-muted">Comissão saques</p>
							<p className="text-xl font-semibold">{formatCurrency(summary?.totalEstimatedCommissionFromPayouts ?? 0)}</p>
						</div>
						<div className="rounded-xl bg-surface-secondary p-4">
							<p className="text-sm text-muted">Comissão total</p>
							<p className="text-xl font-semibold">{formatCurrency(summary?.totalEstimatedCommission ?? 0)}</p>
						</div>
					</div>
				</Card.Content>
			</Card>

			<DataTable
				columns={columns}
				data={items}
				keyExtractor={(item) => item.id}
				renderMobileCard={renderMobileReferredUserCard}
				emptyMessage="Nenhum usuário indicado por este usuário"
				minWidth="min-w-250"
			/>
		</div>
	);
}
