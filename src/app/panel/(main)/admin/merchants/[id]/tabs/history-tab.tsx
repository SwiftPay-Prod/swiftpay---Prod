'use client';

import { use, Suspense, useState, useTransition, type ReactNode } from 'react';
import Link from 'next/link';
import { Card, Alert, Chip, Skeleton, Button, Modal, Tooltip } from '@heroui/react';
import {
	ArrowRight01Icon,
	Clock01Icon,
	UserCircle02Icon,
	MoreHorizontalIcon,
	Settings01Icon,
	Link01Icon,
	ViewIcon,
	Cancel01Icon,
	TextFontIcon,
} from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { InternalTagTabs } from '@/components/ui/internal-tag-tabs';
import { SelectFilter } from '@/components/ui/select-filter';
import type { AcquirerHistoryItem, SettingsHistoryItem } from '@/types/admin/merchants';
import type { ApiResponse, Paginated } from '@/types/common';
import { MerchantSettingsChangeCategory } from '@/types/enums';
import {
	merchantAcquirerChangeActionParse,
	merchantSettingsChangeCategoryParse,
	feeChargeModeParse,
	withdrawalApprovalModeParse,
	mapParseColorToChipColor,
	parseToFilterOptions,
} from '@/parse';
import { formatRelativeTime, formatDate } from '@/utils/datetime';
import { formatCurrency } from '@/utils/currency';
import { adminGetMerchantAcquirerHistory, adminGetMerchantSettingsHistory } from '@/app/actions/admin/merchants';
import { Routes } from '@/router/routes';

type AcquirerHistoryPromise = Promise<ApiResponse<Paginated<AcquirerHistoryItem>>>;
type SettingsHistoryPromise = Promise<ApiResponse<Paginated<SettingsHistoryItem>>>;

interface HistoryTabProps {
	merchantId: string;
	acquirerHistoryPromise: AcquirerHistoryPromise;
	settingsHistoryPromise: SettingsHistoryPromise;
}

const categoryOptions = parseToFilterOptions(merchantSettingsChangeCategoryParse, 'Todas categorias');

function HistoryTabSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<Skeleton className="h-10 w-48 rounded-lg" />
			<Card>
				<Card.Content className="p-0">
					<div className="flex flex-col gap-4 p-4">
						{[...Array(5)].map((_, i) => (
							<Skeleton key={i} className="h-12 w-full rounded-lg" />
						))}
					</div>
				</Card.Content>
			</Card>
		</div>
	);
}

export function HistoryTab({ merchantId, acquirerHistoryPromise, settingsHistoryPromise }: HistoryTabProps) {
	return (
		<Suspense fallback={<HistoryTabSkeleton />}>
			<HistoryTabContent
				merchantId={merchantId}
				initialAcquirerPromise={acquirerHistoryPromise}
				initialSettingsPromise={settingsHistoryPromise}
			/>
		</Suspense>
	);
}

function HistoryTabContent({
	merchantId,
	initialAcquirerPromise,
	initialSettingsPromise,
}: {
	merchantId: string;
	initialAcquirerPromise: AcquirerHistoryPromise;
	initialSettingsPromise: SettingsHistoryPromise;
}) {
	const [activeTab, setActiveTab] = useState<string>('acquirer');

	return (
		<div className="flex flex-col gap-4">
			<InternalTagTabs
				ariaLabel="Tipo de histórico"
				selectedKey={activeTab}
				onSelectionChange={setActiveTab}
				items={[
					{
						id: 'acquirer',
						label: 'Alterações de Adquirente',
						icon: <Icon icon={Link01Icon} className="icon-sm" />,
						className: 'justify-start',
					},
					{
						id: 'settings',
						label: 'Alterações de Configurações',
						icon: <Icon icon={Settings01Icon} className="icon-sm" />,
						className: 'justify-start',
					},
				]}
				tagClassName="shrink-0"
			/>

			{activeTab === 'acquirer' ? (
				<AcquirerHistorySection merchantId={merchantId} initialPromise={initialAcquirerPromise} />
			) : (
				<SettingsHistorySection merchantId={merchantId} initialPromise={initialSettingsPromise} />
			)}
		</div>
	);
}

function AcquirerHistorySection({
	merchantId,
	initialPromise,
}: {
	merchantId: string;
	initialPromise: AcquirerHistoryPromise;
}) {
	const [currentPromise, setCurrentPromise] = useState<AcquirerHistoryPromise>(initialPromise);
	const [isPending, startTransition] = useTransition();
	const [currentPage, setCurrentPage] = useState(1);
	const [sortBy, setSortBy] = useState('createdAt');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const pageSize = 10;

	const response = use(currentPromise);
	const data = response?.data ?? { items: [], totalItems: 0, page: 1, pageSize: 10, totalPages: 0 };

	function fetchData(page: number) {
		startTransition(() => {
			setCurrentPromise(adminGetMerchantAcquirerHistory(merchantId, { page, pageSize, sortBy, sortOrder }));
		});
	}

	function handleRefresh() {
		fetchData(currentPage);
	}

	function handlePageChange(page: number) {
		setCurrentPage(page);
		fetchData(page);
	}

	function handleSortChange(nextSortBy: string, nextSortOrder: 'asc' | 'desc') {
		setSortBy(nextSortBy);
		setSortOrder(nextSortOrder);
		setCurrentPage(1);
		startTransition(() => {
			setCurrentPromise(
				adminGetMerchantAcquirerHistory(merchantId, {
					page: 1,
					pageSize,
					sortBy: nextSortBy,
					sortOrder: nextSortOrder,
				})
			);
		});
	}

	function renderMobileAcquirerHistoryCard(item: AcquirerHistoryItem, _index: number, _openActions?: () => void): ReactNode {
		const actionParse = merchantAcquirerChangeActionParse[item.action];
		const changedByName = item.changedByUserName?.trim() || 'Usuário';

		return (
			<div className="rounded-xl border border-divider bg-surface p-3 overflow-hidden">
				<div className="flex flex-col gap-3">
					{/* Header: Action chip */}
					<div className="flex items-center justify-between">
						{actionParse ? (
							<Chip variant="soft" color={mapParseColorToChipColor(actionParse.color)} size="sm">
								{actionParse.icon}
								{actionParse.label}
							</Chip>
						) : (
							<span className="text-sm text-muted">{item.action}</span>
						)}
					</div>

					{/* Change display */}
					{(item.previousAcquirerName || item.newAcquirerName) && (
						<div className="flex flex-col gap-1">
							<span className="text-xs font-medium text-muted">Alteração</span>
							<div className="flex items-center gap-2">
								{item.previousAcquirerName && (
									<span className="text-sm font-medium text-danger">{item.previousAcquirerName}</span>
								)}
								{item.previousAcquirerName && item.newAcquirerName && (
									<Icon icon={ArrowRight01Icon} className="icon-xs text-muted shrink-0" />
								)}
								{item.newAcquirerName && (
									<span className="text-sm font-medium text-success">{item.newAcquirerName}</span>
								)}
							</div>
						</div>
					)}

					{/* Reason */}
					{item.reason?.trim() && (
						<div className="flex items-start gap-2">
							<Icon icon={TextFontIcon} className="icon-xs text-muted shrink-0 mt-0.5" />
							<div className="flex flex-col gap-1 min-w-0">
								<span className="text-xs font-medium text-muted">Motivo</span>
								<span className="text-sm text-muted">{item.reason.trim()}</span>
							</div>
						</div>
					)}

					{/* Changed by */}
					<div className="flex items-center gap-2">
						<Icon icon={UserCircle02Icon} className="icon-xs text-muted shrink-0" />
						<div className="flex items-center gap-2 min-w-0">
							<span className="text-xs text-muted">Alterado por:</span>
							<span className="text-xs font-medium">{changedByName}</span>
							{item.changedByUserId && (
								<Link href={Routes.panel.admin.userDetails(item.changedByUserId)}>
									<Button isIconOnly variant="tertiary" size="sm">
										<Icon icon={Link01Icon} className="icon-xs" />
									</Button>
								</Link>
							)}
						</div>
					</div>

					{/* Date */}
					<div className="flex items-center gap-2">
						<Icon icon={Clock01Icon} className="icon-xs text-muted shrink-0" />
						<span className="text-xs text-muted" title={formatDate(item.createdAt)}>
							{formatRelativeTime(item.createdAt)}
						</span>
					</div>
				</div>
			</div>
		);
	}

	const columns: DataTableColumn<AcquirerHistoryItem>[] = [
		{
			key: 'action',
			header: 'Ação',
			render: (item) => {
				const parse = merchantAcquirerChangeActionParse[item.action];
				if (!parse) return <span className="text-muted">{item.action}</span>;
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(parse.color)} size="sm">
						{parse.icon}
						{parse.label}
					</Chip>
				);
			},
		},
		{
			key: 'change',
			header: 'Alteração',
			render: (item) => {
				if (item.previousAcquirerName && item.newAcquirerName) {
					return (
						<div className="flex items-center gap-2">
							<span className="font-medium text-danger">{item.previousAcquirerName}</span>
							<Icon icon={ArrowRight01Icon} className="icon-sm text-muted" />
							<span className="font-medium text-success">{item.newAcquirerName}</span>
						</div>
					);
				}
				if (item.newAcquirerName) {
					return <span className="font-medium text-success">{item.newAcquirerName}</span>;
				}
				if (item.previousAcquirerName) {
					return <span className="font-medium text-danger">{item.previousAcquirerName}</span>;
				}
				return <span className="text-muted">—</span>;
			},
		},
		{
			key: 'reason',
			header: 'Motivo',
			render: (item) => {
				const reason = item.reason?.trim();
				if (reason) {
					return (
						<span className="text-sm text-muted line-clamp-1" title={reason}>
							{reason}
						</span>
					);
				}
				return <span className="text-sm text-muted">Nao informado</span>;
			},
		},
		{
			key: 'changedBy',
			header: 'Alterado por',
			render: (item) => {
				const name = item.changedByUserName?.trim();
				if (!name && !item.changedByUserId) return <span className="text-muted">Sistema</span>;
				const label = name || 'Usuário';
				return (
					<div className="flex items-center gap-2">
						<Icon icon={UserCircle02Icon} className="icon-sm text-muted" />
						<span className="text-sm">{label}</span>
						{item.changedByUserId && (
							<Tooltip>
								<Tooltip.Trigger>
									<Link href={Routes.panel.admin.userDetails(item.changedByUserId)}>
										<Button isIconOnly variant="tertiary" size="sm">
											<Icon icon={Link01Icon} className="icon-sm" />
										</Button>
									</Link>
								</Tooltip.Trigger>
								<Tooltip.Content>Ver usuario</Tooltip.Content>
							</Tooltip>
						)}
					</div>
				);
			},
		},
		{
			key: 'date',
			header: 'Data',
			render: (item) => (
				<div className="flex items-center gap-2">
					<Icon icon={Clock01Icon} className="icon-sm text-muted" />
					<span className="text-sm text-muted" title={formatDate(item.createdAt)}>
						{formatRelativeTime(item.createdAt)}
					</span>
				</div>
			),
		},
	];

	return (
		<div className="flex flex-col gap-4">
			{response?.error && (
				<Alert status="danger">
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Title>Erro ao carregar histórico</Alert.Title>
						<Alert.Description>{response.error.message}</Alert.Description>
					</Alert.Content>
				</Alert>
			)}

			<DataTable
				columns={columns}
				data={data.items}
				keyExtractor={(item) => item.id}
				renderMobileCard={renderMobileAcquirerHistoryCard}
				isLoading={isPending}
				skeletonRows={pageSize}
				emptyMessage="Nenhum histórico de alteração de adquirente encontrado."
				minWidth="min-w-200"
				filters={{
					children: null,
					hasFilters: false,
					onClear: () => {},
					onRefresh: handleRefresh,
					isRefreshing: isPending,
				}}
				pagination={{
					page: data.page,
					pageSize: data.pageSize,
					totalItems: data.totalItems,
					totalPages: data.totalPages,
					onPageChange: handlePageChange,
					sortBy,
					sortOrder,
					onSortChange: handleSortChange,
					isNavigating: isPending,
				}}
			/>
		</div>
	);
}

function SettingsHistorySection({
	merchantId,
	initialPromise,
}: {
	merchantId: string;
	initialPromise: SettingsHistoryPromise;
}) {
	const [currentPromise, setCurrentPromise] = useState<SettingsHistoryPromise>(initialPromise);
	const [isPending, startTransition] = useTransition();
	const [category, setCategory] = useState<MerchantSettingsChangeCategory | 'all'>('all');
	const [currentPage, setCurrentPage] = useState(1);
	const [sortBy, setSortBy] = useState('createdAt');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const [selectedItem, setSelectedItem] = useState<SettingsHistoryItem | null>(null);
	const pageSize = 10;

	const response = use(currentPromise);
	const data = response?.data ?? { items: [], totalItems: 0, page: 1, pageSize: 10, totalPages: 0 };

	function fetchData(filters: { page: number; category?: MerchantSettingsChangeCategory }) {
		startTransition(() => {
			setCurrentPromise(
				adminGetMerchantSettingsHistory(merchantId, {
					page: filters.page,
					pageSize,
					category: filters.category,
					sortBy,
					sortOrder,
				})
			);
		});
	}

	function handleRefresh() {
		fetchData({
			page: currentPage,
			category: category === 'all' ? undefined : category,
		});
	}

	function handleCategoryChange(key: string) {
		const newCategory = (key || 'all') as MerchantSettingsChangeCategory | 'all';
		setCategory(newCategory);
		setCurrentPage(1);
		fetchData({
			page: 1,
			category: newCategory === 'all' ? undefined : newCategory,
		});
	}

	function handlePageChange(page: number) {
		setCurrentPage(page);
		fetchData({
			page,
			category: category === 'all' ? undefined : category,
		});
	}

	function handleClearFilters() {
		setCategory('all');
		setCurrentPage(1);
		fetchData({ page: 1 });
	}

	function handleSortChange(nextSortBy: string, nextSortOrder: 'asc' | 'desc') {
		setSortBy(nextSortBy);
		setSortOrder(nextSortOrder);
		setCurrentPage(1);
		startTransition(() => {
			setCurrentPromise(
				adminGetMerchantSettingsHistory(merchantId, {
					page: 1,
					pageSize,
					category: category === 'all' ? undefined : category,
					sortBy: nextSortBy,
					sortOrder: nextSortOrder,
				})
			);
		});
	}

	const hasFilters = category !== 'all';

	function renderMobileSettingsHistoryCard(item: SettingsHistoryItem, index: number, openActions?: () => void): ReactNode {
		const categoryParse = merchantSettingsChangeCategoryParse[item.category];
		const changedByName = item.changedByUserName?.trim() || 'Usuário';
		const changedFieldsArray = item.changedFields?.split(',').map((f) => f.trim()) ?? [];
		const fieldsCount = changedFieldsArray.length;
		const hasDetails = item.previousValuesJson || item.newValuesJson;

		return (
			<div
				className={`rounded-xl border border-divider bg-surface p-3 overflow-hidden ${openActions && hasDetails ? 'cursor-pointer' : ''}`}
				onClick={openActions && hasDetails ? openActions : undefined}
				role={openActions && hasDetails ? 'button' : undefined}
				tabIndex={openActions && hasDetails ? 0 : undefined}
				onKeyDown=
					{openActions && hasDetails
						? (event) => {
								if (event.key === 'Enter' || event.key === ' ') {
									event.preventDefault();
									openActions();
								}
							}
						: undefined}
			>
				<div className="flex flex-col gap-3">
					{/* Header: Category chip */}
					<div className="flex items-center justify-between">
						{categoryParse ? (
							<Chip variant="soft" color={mapParseColorToChipColor(categoryParse.color)} size="sm">
								{categoryParse.icon}
								{categoryParse.label}
							</Chip>
						) : (
							<span className="text-sm text-muted">{item.category}</span>
						)}
					</div>

					{/* Description */}
					{item.description && (
						<div className="flex items-start gap-2">
							<Icon icon={TextFontIcon} className="icon-xs text-muted shrink-0 mt-0.5" />
							<span className="text-sm text-muted">{item.description}</span>
						</div>
					)}

					{/* Changed fields count */}
					{fieldsCount > 0 && (
						<div className="flex items-center gap-2">
							<Icon icon={MoreHorizontalIcon} className="icon-xs text-muted shrink-0" />
							<span className="text-xs text-muted">
								{fieldsCount} {fieldsCount === 1 ? 'campo' : 'campos'} alterado{fieldsCount === 1 ? '' : 's'}
							</span>
						</div>
					)}

					{/* Changed by */}
					<div className="flex items-center gap-2">
						<Icon icon={UserCircle02Icon} className="icon-xs text-muted shrink-0" />
						<div className="flex items-center gap-2 min-w-0">
							<span className="text-xs text-muted">Alterado por:</span>
							<span className="text-xs font-medium">{changedByName}</span>
							{item.changedByUserId && (
								<Link href={Routes.panel.admin.userDetails(item.changedByUserId)}>
									<Button isIconOnly variant="tertiary" size="sm">
										<Icon icon={Link01Icon} className="icon-xs" />
									</Button>
								</Link>
							)}
						</div>
					</div>

					{/* Date */}
					<div className="flex items-center gap-2">
						<Icon icon={Clock01Icon} className="icon-xs text-muted shrink-0" />
						<span className="text-xs text-muted" title={formatDate(item.createdAt)}>
							{formatRelativeTime(item.createdAt)}
						</span>
					</div>
				</div>
			</div>
		);
	}

	const columns: DataTableColumn<SettingsHistoryItem>[] = [
		{
			key: 'category',
			header: 'Categoria',
			render: (item) => {
				const parse = merchantSettingsChangeCategoryParse[item.category];
				if (!parse) return <span className="text-muted">{item.category}</span>;
				return (
					<Chip variant="soft" color={mapParseColorToChipColor(parse.color)} size="sm">
						{parse.icon}
						{parse.label}
					</Chip>
				);
			},
		},
		{
			key: 'description',
			header: 'Descrição',
			render: (item) => (
				<span className="text-sm line-clamp-1" title={item.description ?? undefined}>
					{item.description ?? '—'}
				</span>
			),
		},
		{
			key: 'changedFields',
			header: 'Campos Alterados',
			render: (item) => {
				if (!item.changedFields) return <span className="text-muted">—</span>;
				const fields = item.changedFields.split(',').map((f) => f.trim());
				return (
					<div className="flex items-center gap-1">
						<Icon icon={MoreHorizontalIcon} className="icon-sm text-muted shrink-0" />
						<span className="text-sm text-muted line-clamp-1" title={item.changedFields}>
							{fields.length} {fields.length === 1 ? 'campo' : 'campos'}
						</span>
					</div>
				);
			},
		},
		{
			key: 'changedBy',
			header: 'Alterado por',
			render: (item) => {
				const name = item.changedByUserName?.trim();
				if (!name && !item.changedByUserId) return <span className="text-muted">Sistema</span>;
				const label = name || 'Usuário';
				return (
					<div className="flex items-center gap-2">
						<Icon icon={UserCircle02Icon} className="icon-sm text-muted" />
						<span className="text-sm">{label}</span>
						{item.changedByUserId && (
							<Tooltip>
								<Tooltip.Trigger>
									<Link href={Routes.panel.admin.userDetails(item.changedByUserId)}>
										<Button isIconOnly variant="tertiary" size="sm">
											<Icon icon={Link01Icon} className="icon-sm" />
										</Button>
									</Link>
								</Tooltip.Trigger>
								<Tooltip.Content>Ver usuario</Tooltip.Content>
							</Tooltip>
						)}
					</div>
				);
			},
		},
		{
			key: 'date',
			header: 'Data',
			render: (item) => (
				<div className="flex items-center gap-2">
					<Icon icon={Clock01Icon} className="icon-sm text-muted" />
					<span className="text-sm text-muted" title={formatDate(item.createdAt)}>
						{formatRelativeTime(item.createdAt)}
					</span>
				</div>
			),
		},
		{
			key: 'actions',
			header: 'Ações',
			align: 'center',
			render: (item) => (
				<div className="flex items-center justify-center">
					<Tooltip>
						<Button
							isIconOnly
							variant="tertiary"
							size="sm"
							onPress={() => setSelectedItem(item)}
							isDisabled={!item.previousValuesJson && !item.newValuesJson}
						>
							<Icon icon={ViewIcon} className="icon-sm" />
						</Button>
						<Tooltip.Content>Ver detalhes da alteração</Tooltip.Content>
					</Tooltip>
				</div>
			),
		},
	];

	const renderFiltersContent = () => (
		<SelectFilter
			label="Categoria"
			value={category}
			options={categoryOptions}
			onChange={handleCategoryChange}
			allLabel="Todas categorias"
		/>
	);

	return (
		<div className="flex flex-col gap-4">
			{response?.error && (
				<Alert status="danger">
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Title>Erro ao carregar histórico</Alert.Title>
						<Alert.Description>{response.error.message}</Alert.Description>
					</Alert.Content>
				</Alert>
			)}

			<DataTable
				columns={columns}
				data={data.items}
				keyExtractor={(item) => item.id}
				renderMobileCard={renderMobileSettingsHistoryCard}
				isLoading={isPending}
				skeletonRows={pageSize}
				emptyMessage="Nenhum histórico de alteração de configurações encontrado."
				minWidth="min-w-200"
				filters={{
					children: renderFiltersContent,
					hasFilters,
					onClear: handleClearFilters,
					onRefresh: handleRefresh,
					isRefreshing: isPending,
				}}
				pagination={{
					page: data.page,
					pageSize: data.pageSize,
					totalItems: data.totalItems,
					totalPages: data.totalPages,
					onPageChange: handlePageChange,
					sortBy,
					sortOrder,
					onSortChange: handleSortChange,
					isNavigating: isPending,
				}}
			/>

			<SettingsDetailsModal
				item={selectedItem}
				onClose={() => setSelectedItem(null)}
			/>
		</div>
	);
}

interface SettingsDetailsModalProps {
	item: SettingsHistoryItem | null;
	onClose: () => void;
}

function SettingsDetailsModal({ item, onClose }: SettingsDetailsModalProps) {
	if (!item) return null;

	let previousValues: Record<string, unknown> | null = null;
	let newValues: Record<string, unknown> | null = null;

	try { if (item.previousValuesJson) previousValues = JSON.parse(item.previousValuesJson); } catch { /* ignore */ }
	try { if (item.newValuesJson) newValues = JSON.parse(item.newValuesJson); } catch { /* ignore */ }
	const changedFields = item.changedFields?.split(',').map((f) => f.trim()) ?? [];

	const categoryParse = merchantSettingsChangeCategoryParse[item.category];
	const moneyFields = new Set([
		'pixMinTransactionAmount',
		'pixMaxTransactionAmount',
		'pixApiFeeFixed',
		'pixCheckoutFeeFixed',
		'withdrawalFeeFixed',
		'minWithdrawalAmount',
	]);
	const percentageFields = new Set([
		'pixApiFeePercentage',
		'pixCheckoutFeePercentage',
		'withdrawalFeePercentage',
	]);
	const feeModeFields = new Set(['pixApiFeeMode', 'pixCheckoutFeeMode', 'withdrawalFeeMode']);
	const withdrawalModeFields = new Set(['withdrawalApprovalMode', 'defaultCashoutReviewMode']);

	function formatPercentageBasisPoints(value: number): string {
		if (!Number.isFinite(value)) return '—';
		return `${(value / 100).toFixed(2).replace('.', ',')}%`;
	}

	function normalizeFieldKey(field: string): string {
		if (!field) return field;
		if (field.includes('_')) {
			return field
				.split('_')
				.map((part, index) => (index === 0 ? part.toLowerCase() : part.charAt(0).toUpperCase() + part.slice(1)))
				.join('');
		}
		const firstChar = field.charAt(0);
		if (firstChar && firstChar === firstChar.toUpperCase()) {
			return field.charAt(0).toLowerCase() + field.slice(1);
		}
		return field;
	}

	function formatValue(field: string, value: unknown): string {
		if (value === null || value === undefined) return '—';
		if (feeModeFields.has(field)) {
			const parse = feeChargeModeParse[value as keyof typeof feeChargeModeParse];
			return parse?.label ?? String(value);
		}
		if (withdrawalModeFields.has(field)) {
			const parse = withdrawalApprovalModeParse[value as keyof typeof withdrawalApprovalModeParse];
			return parse?.label ?? String(value);
		}
		if (percentageFields.has(field) && typeof value === 'number') {
			return formatPercentageBasisPoints(value);
		}
		if (moneyFields.has(field) && typeof value === 'number') {
			return formatCurrency(value);
		}
		if (typeof value === 'boolean') return value ? 'Sim' : 'Nao';
		if (typeof value === 'number') return value.toLocaleString('pt-BR');
		if (typeof value === 'object') return JSON.stringify(value, null, 2);
		return String(value);
	}

	function getFieldLabel(field: string): string {
		const labels: Record<string, string> = {
			pixApiFeeMode: 'Modo de Taxa PIX API',
			pixApiFeeFixed: 'Taxa Fixa PIX API',
			pixApiFeePercentage: 'Taxa Percentual PIX API',
			pixCheckoutFeeMode: 'Modo de Taxa PIX Checkout',
			pixCheckoutFeeFixed: 'Taxa Fixa PIX Checkout',
			pixCheckoutFeePercentage: 'Taxa Percentual PIX Checkout',
			withdrawalFeeMode: 'Modo de Taxa de Saque',
			withdrawalFeeFixed: 'Taxa Fixa de Saque',
			withdrawalFeePercentage: 'Taxa Percentual de Saque',
			webhookUrl: 'URL do Webhook',
			webhookEnabled: 'Webhook Habilitado',
			webhookSecret: 'Secret do Webhook',
			pixTimeoutMinutes: 'Timeout PIX (min)',
			rateLimitPerMinute: 'Limite por Minuto',
			rateLimitPerHour: 'Limite por Hora',
			rateLimitPerDay: 'Limite por Dia',
			defaultCashoutReviewMode: 'Modo de Revisão de Saque',
			tradeOrLegalName: 'Nome Fantasia/Razão Social',
			documentNumber: 'CNPJ/CPF',
			email: 'E-mail',
			phone: 'Telefone',
			address: 'Endereço',
		};
		return labels[field] || field;
	}

	return (
		<Modal.Backdrop isOpen={!!item} onOpenChange={(open) => !open && onClose()}>
			<Modal.Container size="md" scroll="outside">
				<Modal.Dialog className="max-w-xl border border-divider bg-content1 shadow-lg">
					<Modal.Header className="border-b border-divider bg-content1 px-5 pt-5 pb-3">
						<Modal.Icon className="bg-accent text-accent-foreground">
							<Icon icon={Settings01Icon} className="icon-md" />
						</Modal.Icon>
						<Modal.Heading>Detalhes da Alteração</Modal.Heading>
						<p className="text-sm text-muted">
							{categoryParse?.label ?? item.category} • {formatDate(item.createdAt)}
						</p>
					</Modal.Header>
					<Modal.Body className="bg-content1 px-5 py-4">
						<div className="flex flex-col gap-5">
							{item.description && (
								<div className="rounded-lg bg-content2 border border-divider p-3">
									<div className="flex items-start gap-3">
										<Icon icon={TextFontIcon} className="icon-md text-muted shrink-0 mt-0.5" />
										<div>
											<p className="text-sm font-medium text-muted mb-1">Descrição</p>
											<p className="text-sm">{item.description}</p>
										</div>
									</div>
								</div>
							)}

							{item.reason && (
								<div className="rounded-lg bg-warning-soft border border-warning-soft-hover p-3">
									<p className="text-sm font-medium text-warning mb-1">Motivo</p>
									<p className="text-sm">{item.reason}</p>
								</div>
							)}

							<div className="flex flex-col gap-4">
								<h4 className="text-sm font-semibold">Campos Alterados</h4>
								<div className="flex flex-col gap-3">
									{changedFields.map((field) => {
										const normalizedField = normalizeFieldKey(field);
										const oldValue = previousValues?.[field] ?? previousValues?.[normalizedField];
										const newValue = newValues?.[field] ?? newValues?.[normalizedField];

										return (
											<div
												key={field}
												className="rounded-lg border border-divider bg-content2 p-3"
											>
												<p className="text-sm font-medium mb-3">{getFieldLabel(normalizedField)}</p>
												<div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
													<div className="rounded-md bg-danger-soft border border-danger-soft-hover p-2.5">
														<div className="flex items-center gap-2 mb-1">
															<Icon icon={Cancel01Icon} className="icon-xs text-danger" />
															<span className="text-xs font-medium text-danger">Antes</span>
														</div>
														<p className="text-sm font-mono break-all">
																{formatValue(normalizedField, oldValue)}
														</p>
													</div>
													<div className="hidden md:flex items-center justify-center text-muted">
														<Icon icon={ArrowRight01Icon} className="icon-md" />
													</div>
													<div className="rounded-md bg-success-soft border border-success-soft-hover p-2.5">
														<div className="flex items-center gap-2 mb-1">
															<Icon icon={ArrowRight01Icon} className="icon-xs text-success" />
															<span className="text-xs font-medium text-success">Depois</span>
														</div>
														<p className="text-sm font-mono break-all">
																{formatValue(normalizedField, newValue)}
														</p>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</div>

							<div className="flex items-center gap-2 text-sm text-muted rounded-lg border border-divider bg-content2 px-4 py-3">
								<Icon icon={UserCircle02Icon} className="icon-sm" />
								<span>Alterado por: {item.changedByUserName || 'Sistema'}</span>
								{item.changedByUserId && (
									<Tooltip>
										<Tooltip.Trigger>
											<Link href={Routes.panel.admin.userDetails(item.changedByUserId)}>
												<Button isIconOnly variant="tertiary" size="sm">
													<Icon icon={Link01Icon} className="icon-sm" />
												</Button>
											</Link>
										</Tooltip.Trigger>
										<Tooltip.Content>Ver usuario</Tooltip.Content>
									</Tooltip>
								)}
							</div>
						</div>
					</Modal.Body>
					<Modal.Footer className="border-t border-divider bg-content1 px-5 py-3">
						<Button variant="tertiary" onPress={onClose}>
							Fechar
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
