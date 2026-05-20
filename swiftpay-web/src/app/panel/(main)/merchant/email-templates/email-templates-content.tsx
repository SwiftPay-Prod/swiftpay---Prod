'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Chip, Tooltip } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { Mail02Icon, PencilEdit01Icon, Settings02Icon } from '@hugeicons/core-free-icons';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Routes } from '@/router/routes';
import { merchantEmailTemplateTypeParse } from '@/parse';
import { MerchantEmailTemplateType } from '@/types/enums';
import type { DataTableColumn } from '@/components/ui/data-table';
import type { ApiResponse, Paginated } from '@/types/common';
import type { MinimalEmailTemplateData } from '@/types/merchant/email-templates';
import { formatDateTime } from '@/utils/datetime';

interface EmailTemplatesContentProps {
	templatesPromise: Promise<ApiResponse<Paginated<MinimalEmailTemplateData>>>;
}

interface TemplateRow {
	type: MerchantEmailTemplateType;
	enabled: boolean;
	updatedAt: string | null;
	comingSoon: boolean;
}

const TEMPLATE_TYPES: TemplateRow[] = [
	{ type: MerchantEmailTemplateType.PaymentConfirmation, enabled: true, updatedAt: null, comingSoon: false },
	{ type: MerchantEmailTemplateType.DigitalDelivery, enabled: true, updatedAt: null, comingSoon: false },
	{ type: MerchantEmailTemplateType.Welcome, enabled: true, updatedAt: null, comingSoon: false },
	{ type: MerchantEmailTemplateType.OrderShipped, enabled: false, updatedAt: null, comingSoon: true },
	{ type: MerchantEmailTemplateType.OrderDelivered, enabled: false, updatedAt: null, comingSoon: true },
	{ type: MerchantEmailTemplateType.AbandonedCart, enabled: false, updatedAt: null, comingSoon: true },
];


function renderMobileEmailTemplateCard(item: TemplateRow, _index: number, openActions?: () => void) {
	const parse = merchantEmailTemplateTypeParse[item.type];
	return (
		<div
			className={`rounded-xl border border-divider bg-surface p-3 overflow-hidden${openActions ? ' cursor-pointer' : ''}`}
			onClick={openActions}
			role={openActions ? 'button' : undefined}
			tabIndex={openActions ? 0 : undefined}
			onKeyDown={openActions ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openActions(); } } : undefined}
		>
			<div className="flex items-start justify-between gap-3 mb-3">
				<span className="font-medium text-sm">{parse.label}</span>
				<Chip
					variant="soft"
					color={item.comingSoon ? 'warning' : item.enabled ? 'success' : 'danger'}
					size="sm"
				>
					{item.comingSoon ? 'Em breve' : item.enabled ? 'Ativo' : 'Inativo'}
				</Chip>
			</div>
			<div className="flex flex-col gap-0.5">
				<span className="text-xs text-muted">Descrição</span>
				<span className="text-sm text-muted">{parse.description ?? ''}</span>
			</div>
			{item.updatedAt && (
				<div className="flex flex-col gap-0.5 mt-3">
					<span className="text-xs text-muted">Atualizado em</span>
					<span className="text-sm">{formatDateTime(item.updatedAt)}</span>
				</div>
			)}
		</div>
	);
}

export function EmailTemplatesContent({ templatesPromise }: EmailTemplatesContentProps) {
	const router = useRouter();
	const response = use(templatesPromise);
	const templates = response?.data?.items ?? [];
	const templateByType = new Map(templates.map((template) => [template.type, template]));

	const rows = TEMPLATE_TYPES.map((template) => {
		const saved = templateByType.get(template.type);
		return {
			...template,
			enabled: template.comingSoon ? false : (saved?.enabled ?? template.enabled),
			updatedAt: saved?.updatedAt ?? null,
		};
	}).sort((a, b) => {
		if (!a.updatedAt && !b.updatedAt) return 0;
		if (!a.updatedAt) return 1;
		if (!b.updatedAt) return -1;
		return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
	});

	function handleConfigureTemplate(type: MerchantEmailTemplateType) {
		router.push(Routes.panel.merchant.emailTemplatesUpsert(type));
	}

	const columns: DataTableColumn<TemplateRow>[] = [
		{
			key: 'type',
			header: 'Tipo',
			width: '250px',
			render: (row) => {
				const parse = merchantEmailTemplateTypeParse[row.type];
				const bgColorClass = {
					success: 'bg-success text-success-foreground',
					accent: 'bg-accent text-accent-foreground',
					warning: 'bg-warning text-warning-foreground',
					danger: 'bg-danger text-danger-foreground',
					default: 'bg-muted text-muted-foreground',
					secondary: 'bg-secondary text-secondary-foreground',
				}[parse.color] ?? 'bg-accent text-accent-foreground';
				return (
					<div className="flex items-center gap-3">
						<div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bgColorClass}`}>
							{parse.icon}
						</div>
						<span className="font-medium">{parse.label}</span>
					</div>
				);
			},
		},
		{
			key: 'description',
			header: 'Descrição',
			render: (row) => {
				const parse = merchantEmailTemplateTypeParse[row.type];
				return <span className="text-muted">{parse.description}</span>;
			},
		},
		{
			key: 'updatedAt',
			header: 'Atualizado em',
			width: '180px',
			render: (row) => (
				<span className="text-muted">{row.updatedAt ? formatDateTime(row.updatedAt) : 'Nunca'}</span>
			),
		},
		{
			key: 'status',
			header: 'Status',
			width: '140px',
			align: 'center',
			render: (row) => (
				<Chip
					variant="soft"
					color={row.comingSoon ? 'warning' : row.enabled ? 'success' : 'danger'}
					size="sm"
				>
					{row.comingSoon ? 'Em breve' : row.enabled ? 'Ativo' : 'Inativo'}
				</Chip>
			),
		},
		{
			key: 'actions',
			header: 'Ações',
			width: '100px',
			align: 'center',
			render: (row) => (
				<div className="flex items-center justify-center">
					<Tooltip>
						<Button
							isIconOnly
							variant="tertiary"
							isDisabled={row.comingSoon}
							onPress={() => handleConfigureTemplate(row.type)}
						>
							<Icon icon={PencilEdit01Icon} className="icon-sm" />
						</Button>
						<Tooltip.Content>
							{row.comingSoon ? 'Template em breve' : 'Configurar template'}
						</Tooltip.Content>
					</Tooltip>
				</div>
			),
		},
	];

	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={Mail02Icon} className="icon-md text-accent-foreground" />}
				title="Templates de Email"
				description="Gerencie os templates de email enviados para seus clientes"
				action={{
					label: 'Configurações',
					icon: <Icon icon={Settings02Icon} className="icon-sm" />,
					onPress: () => {},
					tooltip: 'Em breve',
					isDisabled: true,
				}}
			/>

			<DataTable
				columns={columns}
				data={rows}
				keyExtractor={(row) => row.type}
				renderMobileCard={renderMobileEmailTemplateCard}
				emptyMessage="Nenhum template disponível"
			/>
		</div>
	);
}

