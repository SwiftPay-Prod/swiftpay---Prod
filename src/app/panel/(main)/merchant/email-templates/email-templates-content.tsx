'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Tooltip, Chip } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { Mail02Icon, PencilEdit01Icon } from '@hugeicons/core-free-icons';
import { DataTable } from '@/components/ui/data-table';
import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
import { merchantEmailTemplateTypeParse } from '@/parse';
import { MerchantEmailTemplateType } from '@/types/enums';
import type { DataTableColumn } from '@/components/ui/data-table';
import type { ApiResponse, Paginated } from '@/types/common';
import type { MinimalEmailTemplateData } from '@/types/merchant/email-templates';
import { formatDateTime } from '@/utils/datetime';
import { Routes } from '@/router/routes';
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
			key: 'status',
			header: 'Status',
			render: (row) => {
				if (row.comingSoon) {
					return (
						<span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-mono text-white/50">
							Em breve
						</span>
					);
				}
				return <RevolutStatusBadge status={row.enabled ? 'Active' : 'Inactive'} />;
			},
		},
		{
			key: 'updatedAt',
			header: 'Última alteração',
			render: (row) => (
				<span className="text-xs font-mono text-white/50">{row.updatedAt ? formatDateTime(row.updatedAt) : '—'}</span>
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
		<div className="flex flex-col gap-6 text-white">
			{/* Executive Header */}
			<div className="flex items-center gap-3 border-b border-white/10 pb-5">
				<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
					<Icon icon={Mail02Icon} className="icon-sm text-[#4f55f1]" />
				</div>
				<div>
					<h1 className="text-xl font-bold tracking-tight text-white">Templates de Email</h1>
					<p className="text-xs text-white/50 mt-0.5">
						Personalize as mensagens e notificações transacionais de compra e entrega enviadas aos seus clientes
					</p>
				</div>
			</div>

			{/* Main Data Table */}
			<div className="rounded-[24px] border border-white/12 bg-[#16181a] p-5 sm:p-6 overflow-hidden">
				<DataTable
					columns={columns}
					data={rows}
					keyExtractor={(row) => row.type}
					renderMobileCard={renderMobileEmailTemplateCard}
					emptyMessage="Nenhum template disponível"
				/>
			</div>
		</div>
	);
}

