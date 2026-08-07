'use client';

import { Button, Chip, Tooltip, Avatar } from '@heroui/react';
import {
	CancelCircleIcon,
	CheckmarkCircle02Icon,
	Edit02Icon,
	Image01Icon,
	PaintBoardIcon,
	ViewIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import type { AdminMinimalTemplate } from '@/types/admin/templates';
import {
	checkoutTemplateTypeParse,
	templateActiveStatusParse,
	templateFreeParse,
	templateFreeOptions,
	templateActiveStatusOptions,
	checkoutTemplateTypeOptions,
	mapParseColorToChipColor,
	pageSizeFilterOptions,
} from '@/parse';
import { basisPointsToPercentage, formatCurrency } from '@/utils/currency';
import { FormattedDate } from '@/components/ui/formatted-date';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { SearchFilter } from '@/components/ui/search-filter';
import { SelectFilter } from '@/components/ui/select-filter';
import { TemplateModal } from './modals/template-modal';
import { useTemplatesTable, type TemplatesTableFilters } from './use-templates-table';

interface TemplatesTableProps {
	initialFilters: TemplatesTableFilters;
}

function getColumns(
	onView: (id: string) => void,
	onEdit: (id: string) => void
): DataTableColumn<AdminMinimalTemplate>[] {
	return [
		{
			key: 'template',
			header: 'Template',
			render: (template) => (
				<div className="flex items-center gap-3">
					{template.thumbnailUrl ? (
						<Avatar size="md" className="rounded-lg shrink-0">
							<Avatar.Image src={template.thumbnailUrl} alt={template.name} className="object-cover" />
							<Avatar.Fallback className="rounded-lg">
								<Icon icon={PaintBoardIcon} size={20} className="text-accent" />
							</Avatar.Fallback>
						</Avatar>
					) : (
						<div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-accent/10">
							<Icon icon={PaintBoardIcon} size={20} className="text-accent" />
						</div>
					)}
					<div className="flex flex-col">
						<span className="font-medium text-foreground">{template.name}</span>
						<span className="text-sm text-muted font-mono">{template.code}</span>
					</div>
				</div>
			),
		},
		{
			key: 'type',
			header: 'Tipo',
			render: (template) => {
				const typeParsed = checkoutTemplateTypeParse[template.type];
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(typeParsed.color)} size="sm" className="gap-1">
						{typeParsed.icon}
						{typeParsed.label}
					</Chip>
				);
			},
		},
		{
			key: 'status',
			header: 'Status',
			render: (template) => {
				const statusParsed = templateActiveStatusParse[template.isActive ? 'active' : 'inactive'];
				return (
					<div className="flex items-center gap-2">
						{template.isActive ? (
							<>
								<Icon icon={CheckmarkCircle02Icon} size={16} className="text-success" />
								<span className="text-sm text-success">{statusParsed.label}</span>
							</>
						) : (
							<>
								<Icon icon={CancelCircleIcon} size={16} className="text-muted" />
								<span className="text-sm text-muted">{statusParsed.label}</span>
							</>
						)}
					</div>
				);
			},
		},
		{
			key: 'pricing',
			header: 'Preço',
			render: (template) => {
				const isFree = template.feeMode === null;
				const freeParsed = templateFreeParse[isFree ? 'free' : 'paid'];
				return (
					<div className="flex flex-col gap-0.5">
						<Chip variant="soft" color={mapParseColorToChipColor(freeParsed.color)} size="sm" className="gap-1">
							{freeParsed.icon}
							{freeParsed.label}
						</Chip>
						{!isFree && (
							<span className="text-xs text-muted ml-1">
								{template.feeFixed > 0 && formatCurrency(template.feeFixed)}
								{template.feeFixed > 0 && template.feePercentage > 0 && ' + '}
								{template.feePercentage > 0 && `${(template.feePercentage / 100).toFixed(2)}%`}
							</span>
						)}
					</div>
				);
			},
		},
		{
			key: 'features',
			header: 'Recursos',
			render: (template) => {
				const features = [];
				if (template.supportsCoupons) features.push('Cupons');
				if (template.supportsShipping) features.push('Frete');

				return (
					<div className="flex flex-wrap gap-1">
						{features.length > 0 ? (
							features.map((feature) => (
								<Chip variant="soft" key={feature} color="default" size="sm">
									{feature}
								</Chip>
							))
						) : (
							<span className="text-sm text-muted">—</span>
						)}
					</div>
				);
			},
		},
		{
			key: 'usageCount',
			header: 'Uso',
			render: (template) => (
				<div className="flex flex-col">
					<span className="text-sm text-foreground">{template.activeCheckouts} ativos</span>
					<span className="text-xs text-muted">{template.usageCount} total</span>
				</div>
			),
		},
		{
			key: 'createdAt',
			header: 'Criado em',
			render: (template) => (
				<div className="flex items-center gap-2 text-sm text-muted">
					<FormattedDate date={template.createdAt} />
				</div>
			),
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			render: (template) => (
				<div className="flex flex-row gap-x-1 justify-center">
					<Tooltip>
						<Button isIconOnly variant="tertiary" onClick={() => onView(template.id)}>
							<Icon icon={ViewIcon} className="icon-sm" />
							<Tooltip.Content>Ver detalhes</Tooltip.Content>
						</Button>
					</Tooltip>
					<Tooltip>
						<Button isIconOnly variant="tertiary" onClick={() => onEdit(template.id)}>
							<Icon icon={Edit02Icon} className="icon-sm" />
							<Tooltip.Content>Editar</Tooltip.Content>
						</Button>
					</Tooltip>
				</div>
			),
		},
	];
}

function renderMobileTemplateCard(template: AdminMinimalTemplate, _index: number, openActions?: () => void) {
	return (
		<div
			className={`rounded-xl border border-divider bg-surface p-3 overflow-hidden ${openActions ? 'cursor-pointer' : ''}`}
			onClick={openActions}
			role={openActions ? 'button' : undefined}
			tabIndex={openActions ? 0 : undefined}
			onKeyDown={
				openActions
					? (event) => {
							if (event.key === 'Enter' || event.key === ' ') {
								event.preventDefault();
								openActions();
							}
						}
					: undefined
			}
		>
			<div className="flex flex-col gap-2">
				<div className="flex items-start gap-2">
					{template.thumbnailUrl ? (
					<Avatar size="sm" className="rounded-lg shrink-0">
						<Avatar.Image src={template.thumbnailUrl} alt={template.name} className="object-cover" />
						<Avatar.Fallback className="rounded-lg">
							<Icon icon={PaintBoardIcon} className="icon-sm text-accent" />
						</Avatar.Fallback>
					</Avatar>
					) : (
						<div className="flex items-center justify-center size-10 rounded-lg bg-accent/10 shrink-0">
							<Icon icon={PaintBoardIcon} className="icon-sm text-accent" />
						</div>
					)}
					<div className="flex flex-col gap-0.5 min-w-0">
						<span className="text-sm font-medium truncate">{template.name}</span>
						<span className="text-xs text-muted font-mono">{template.code}</span>
					</div>
				</div>
				<Chip
					variant="soft"
					color={mapParseColorToChipColor(checkoutTemplateTypeParse[template.type].color)}
					className="text-xs w-fit"
				>
					{checkoutTemplateTypeParse[template.type].label}
				</Chip>
				<div className="flex items-center gap-1.5">
					{template.isActive ? (
						<Icon icon={CheckmarkCircle02Icon} className="icon-sm text-success" />
					) : (
						<Icon icon={CancelCircleIcon} className="icon-sm text-muted" />
					)}
					<span className="text-xs text-muted">{template.isActive ? 'Ativo' : 'Inativo'}</span>
				</div>
				{template.feeMode === null ? (
					<Chip
						variant="soft"
						color={mapParseColorToChipColor(templateFreeParse.free.color)}
						className="text-xs w-fit"
					>
						{templateFreeParse.free.label}
					</Chip>
				) : (
					<div className="flex flex-col gap-0.5">
						<span className="text-xs text-muted">Taxa:</span>
						<span className="text-sm">
							{template.feeFixed > 0 && formatCurrency(template.feeFixed)}
							{template.feeFixed > 0 && template.feePercentage > 0 && ' + '}
							{template.feePercentage > 0 && `${basisPointsToPercentage(template.feePercentage)}%`}
						</span>
					</div>
				)}
				<div className="flex flex-wrap gap-1">
					{template.supportsCoupons && (
						<Chip variant="soft" color="default" className="text-xs">
							Cupons
						</Chip>
					)}
					{template.supportsShipping && (
						<Chip variant="soft" color="default" className="text-xs">
							Frete
						</Chip>
					)}
				</div>
				<div className="flex items-center gap-2 text-xs text-muted">
					<span>{template.activeCheckouts} checkouts ativos</span>
					<span>•</span>
					<span>{template.usageCount} usos</span>
				</div>
				<FormattedDate date={template.createdAt} className="text-xs text-muted" />
			</div>
		</div>
	);
}

export function TemplatesTable({ initialFilters }: TemplatesTableProps) {
	const { data, filters, modals, actions } = useTemplatesTable({ initialFilters });

	const columns = getColumns(modals.details.open, actions.goToEdit);

	const typeFilterOptions = [
		{ value: 'all', label: 'Todos os tipos' },
		...checkoutTemplateTypeOptions.map((opt) => ({ value: opt.value, label: opt.label })),
	];

	const renderFiltersContent = () => (
		<>
			<SearchFilter
				key={
					filters.values.search === '' || filters.values.search === undefined || filters.values.search === null
						? 'empty'
						: 'filled'
				}
				label="Buscar"
				placeholder="Nome, código..."
				defaultValue={filters.values.search ?? ''}
				onChange={(value) => filters.update({ search: value || null })}
			/>

			<SelectFilter
				label="Tipo"
				value={filters.values.type ?? 'all'}
				options={typeFilterOptions}
				onChange={(value) => filters.update({ type: value === 'all' ? null : (value as typeof filters.values.type) })}
			/>

			<SelectFilter
				label="Status"
				value={filters.values.isActive === true ? 'true' : filters.values.isActive === false ? 'false' : 'all'}
				options={templateActiveStatusOptions}
				onChange={(value) =>
					filters.update({ isActive: value === 'true' ? true : value === 'false' ? false : undefined })
				}
			/>

			<SelectFilter
				label="Preço"
				value={filters.values.isFree === true ? 'true' : filters.values.isFree === false ? 'false' : 'all'}
				options={templateFreeOptions}
				onChange={(value) =>
					filters.update({ isFree: value === 'true' ? true : value === 'false' ? false : undefined })
				}
			/>

			<SelectFilter
				label="Por página"
				value={String(filters.values.pageSize ?? 10)}
				options={pageSizeFilterOptions}
				onChange={(value) => filters.update({ pageSize: Number(value), page: filters.values.page })}
				showChips={false}
			/>
		</>
	);

	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={PaintBoardIcon} size={24} />}
				title="Templates de Checkout"
				description="Gerencie os templates disponíveis para checkouts."
				action={{
					label: 'Novo Template',
					icon: <Icon icon={Image01Icon} className="icon-sm" />,
					onPress: actions.goToNew,
				}}
			/>

			<DataTable
				columns={columns}
				data={data.templates.items}
				keyExtractor={(template) => template.id}
				isLoading={data.isLoading}
				skeletonRows={filters.values.pageSize ?? 10}
				emptyMessage="Nenhum template encontrado"
				minWidth="min-w-250"			renderMobileCard={renderMobileTemplateCard}				filters={{
					children: renderFiltersContent,
					hasFilters: filters.hasFilters,
					onClear: filters.clear,
					onRefresh: filters.refresh,
					isRefreshing: data.isLoading,
				}}
				pagination={{
					page: data.templates.page,
					pageSize: data.templates.pageSize,
					totalItems: data.templates.totalItems,
					totalPages: data.templates.totalPages,
					onPageChange: (page) => filters.update({ page }),
					isNavigating: data.isLoading,
				}}
			/>

			<TemplateModal
				isOpen={modals.details.isOpen}
				onOpenChange={modals.details.close}
				templatePromise={modals.details.templatePromise}
			/>
		</div>
	);
}

