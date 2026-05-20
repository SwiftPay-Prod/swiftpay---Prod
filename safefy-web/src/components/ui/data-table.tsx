'use client';

import { Children, isValidElement, useState, type ReactNode } from 'react';
import { Accordion, Button, EmptyState, Pagination, Skeleton, Table } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import {
	ArrowReloadHorizontalIcon,
	RemoveCircleIcon,
	SortingDownIcon,
	SortingUpIcon,
} from '@hugeicons/core-free-icons';
import { AsyncButton } from './async-button';
import { MobileBottomSheet } from './mobile-bottom-sheet';

export interface DataTableColumn<T> {
	key: string;
	header: string;
	width?: string;
	align?: 'left' | 'center' | 'right';
	skeletonWidth?: string;
	sortable?: boolean;
	render: (item: T) => ReactNode;
}

export interface DataTableFiltersProps {
	children: ReactNode | (() => ReactNode);
	hasFilters?: boolean;
	onApply?: () => void;
	onClear?: () => void;
	onRefresh?: () => void;
	isApplying?: boolean;
	isRefreshing?: boolean;
}

export interface DataTableMobileActionsProps<T> {
	title: (item: T) => ReactNode;
	subtitle?: (item: T) => ReactNode;
	renderActions: (item: T, close: () => void) => ReactNode;
}

export interface DataTableProps<T> {
	columns: DataTableColumn<T>[];
	data: T[];
	keyExtractor: (item: T) => string;
	renderMobileCard?: (item: T, index: number, openActions?: () => void) => ReactNode;
	mobileActions?: DataTableMobileActionsProps<T>;
	isLoading?: boolean;
	skeletonRows?: number;
	emptyMessage?: string;
	minWidth?: string;
	rowClassName?: (item: T) => string;
	filters?: DataTableFiltersProps;
	pagination?: {
		page: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
		onPageChange: (page: number) => void;
		sortBy?: string;
		sortOrder?: 'asc' | 'desc';
		onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
		isNavigating?: boolean;
	};
	className?: string;
}

interface ExtractedMobileAction {
	label: string;
	icon?: ReactNode;
	onPress?: () => void;
	className?: string;
	variant?: 'primary' | 'secondary' | 'ghost' | 'tertiary' | 'outline';
	isDisabled?: boolean;
}

interface ActionElementProps {
	children?: ReactNode;
	onPress?: () => void;
	onClick?: () => void;
	className?: string;
	variant?: 'primary' | 'secondary' | 'ghost' | 'tertiary' | 'outline';
	isDisabled?: boolean;
}

function getVisiblePages(page: number, totalPages: number): Array<number | 'ellipsis'> {
	if (totalPages <= 0) {
		return [];
	}

	if (totalPages === 1) {
		return [1];
	}

	const pages: Array<number | 'ellipsis'> = [1];

	if (page > 3) {
		pages.push('ellipsis');
	}

	const start = Math.max(2, page - 1);
	const end = Math.min(totalPages - 1, page + 1);

	for (let i = start; i <= end; i += 1) {
		pages.push(i);
	}

	if (page < totalPages - 2) {
		pages.push('ellipsis');
	}

	pages.push(totalPages);

	const normalized: Array<number | 'ellipsis'> = [];
	for (const item of pages) {
		const previous = normalized[normalized.length - 1];

		if (item === previous) {
			continue;
		}

		if (item === 'ellipsis' && (previous === 'ellipsis' || previous == null)) {
			continue;
		}

		normalized.push(item);
	}

	if (normalized[normalized.length - 1] === 'ellipsis') {
		normalized.pop();
	}

	return normalized;
}

function getElementProps(node: ReactNode): ActionElementProps | undefined {
	if (!isValidElement(node)) {
		return undefined;
	}

	return node.props as ActionElementProps;
}

function getFirstText(node: ReactNode): string | undefined {
	if (typeof node === 'string') {
		const normalized = node.trim();
		return normalized.length > 0 ? normalized : undefined;
	}

	if (typeof node === 'number') {
		return String(node);
	}

	if (Array.isArray(node)) {
		for (const child of node) {
			const found = getFirstText(child);
			if (found) {
				return found;
			}
		}
		return undefined;
	}

	if (isValidElement(node)) {
		const props = getElementProps(node);
		return getFirstText(props?.children);
	}

	return undefined;
}

function getElementTypeName(node: ReactNode): string {
	if (!isValidElement(node)) {
		return '';
	}

	if (typeof node.type === 'string') {
		return node.type;
	}

	const displayName = (node.type as { displayName?: string }).displayName;
	if (displayName) {
		return displayName;
	}

	const name = (node.type as { name?: string }).name;
	return name ?? '';
}

function extractMobileActions(node: ReactNode, inheritedLabel?: string): ExtractedMobileAction[] {
	if (node == null || typeof node === 'boolean') {
		return [];
	}

	if (Array.isArray(node)) {
		return node.flatMap((child) => extractMobileActions(child, inheritedLabel));
	}

	if (!isValidElement(node)) {
		return [];
	}

	const props = getElementProps(node);
	if (!props) {
		return [];
	}

	const nodeTypeName = getElementTypeName(node);
	const tooltipLabel = nodeTypeName.toLowerCase().includes('tooltip') ? getFirstText(props.children) : undefined;
	const nextInheritedLabel = tooltipLabel ?? inheritedLabel;
	const children = Children.toArray(props.children);
	const hasActionHandler = typeof props.onPress === 'function' || typeof props.onClick === 'function';

	if (hasActionHandler) {
		const directLabel = getFirstText(props.children);
		const resolvedLabel = directLabel ?? nextInheritedLabel;
		if (!resolvedLabel) {
			return [];
		}

		const iconCandidate = Children.toArray(props.children).find((child) => isValidElement(child));
		const onPress =
			typeof props.onPress === 'function'
				? props.onPress
				: typeof props.onClick === 'function'
					? () => props.onClick?.()
					: undefined;

		return [
			{
				label: resolvedLabel,
				icon: iconCandidate,
				onPress,
				className: props.className,
				variant: props.variant,
				isDisabled: props.isDisabled,
			},
		];
	}

	return children.flatMap((child) => extractMobileActions(child, nextInheritedLabel));
}

export function DataTable<T>({
	columns,
	data,
	keyExtractor,
	renderMobileCard,
	mobileActions,
	isLoading = false,
	skeletonRows = 10,
	emptyMessage = 'Nenhum item encontrado',
	minWidth = 'min-w-200',
	rowClassName,
	filters,
	pagination,
	className,
}: DataTableProps<T>) {
	const autoActionsColumn = columns.find((column) => column.key === 'actions' || column.header === 'Ações');
	const effectiveMobileActions =
		mobileActions ??
		(autoActionsColumn
			? {
					title: () => 'Ações',
					subtitle: () => undefined,
					renderActions: (item: T, close: () => void) => {
						const desktopActions = autoActionsColumn.render(item);
						const extracted = extractMobileActions(desktopActions);

						if (extracted.length === 0) {
							return desktopActions;
						}

						return extracted.map((action, index) => (
							<Button
								key={`${action.label}-${index}`}
								variant={action.variant ?? 'secondary'}
								className={`w-full justify-start ${action.className ?? ''}`.trim()}
								isDisabled={action.isDisabled}
								onPress={() => {
									action.onPress?.();
									close();
								}}
							>
								{action.icon}
								{action.label}
							</Button>
						));
					},
				}
			: undefined);
	const [activeMobileItem, setActiveMobileItem] = useState<T | null>(null);
	const [isMobileActionsOpen, setIsMobileActionsOpen] = useState(false);

	function renderFiltersChildren() {
		if (!filters) {
			return null;
		}

		if (typeof filters.children === 'function') {
			return filters.children();
		}

		return filters.children;
	}

	const filtersApplyAction = filters?.onApply ?? filters?.onRefresh;

	function closeMobileActions() {
		setIsMobileActionsOpen(false);
		setTimeout(() => {
			setActiveMobileItem(null);
		}, 220);
	}

	function openMobileActions(item: T) {
		setActiveMobileItem(item);
		setIsMobileActionsOpen(true);
	}

	const totalPages = pagination?.totalPages ?? 0;
	const pages = pagination ? getVisiblePages(pagination.page, totalPages) : [];
	const start = pagination ? (pagination.page - 1) * pagination.pageSize + 1 : 0;
	const end = pagination ? Math.min(pagination.page * pagination.pageSize, pagination.totalItems) : 0;
	const isPaginationBusy = isLoading || (pagination?.isNavigating ?? false);
	const currentSortBy = pagination?.sortBy ?? undefined;
	const currentSortOrder = pagination?.sortOrder ?? 'desc';

	function handleSortChange(sortBy: string) {
		if (!pagination?.onSortChange) {
			return;
		}

		const nextSortOrder: 'asc' | 'desc' = currentSortBy === sortBy && currentSortOrder === 'desc' ? 'asc' : 'desc';
		pagination.onSortChange(sortBy, nextSortOrder);
	}

	function getCellStyle(column: DataTableColumn<T>) {
		return {
			width: column.width,
			textAlign: column.align ?? 'left',
		};
	}

	return (
		<div className={`flex flex-col gap-4 ${className ?? ''}`}>
			{filters && (
				<>
					<div className="hidden md:block rounded-xl bg-surface p-4">
						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
							{renderFiltersChildren()}
							<div className="flex items-end justify-end gap-2 col-span-full sm:col-span-1 sm:col-start-2 lg:col-start-3 xl:col-start-4">
								{filtersApplyAction && (
									<AsyncButton variant="secondary" onPress={filters.onRefresh} isPending={filters.isRefreshing}>
										<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
										Atualizar
									</AsyncButton>
								)}
								{filters.onClear && filters.hasFilters && (
									<Button variant="ghost" onPress={filters.onClear}>
										<Icon icon={RemoveCircleIcon} className="icon-sm" />
										Limpar
									</Button>
								)}
							</div>
						</div>
					</div>

					<div className="md:hidden rounded-xl bg-surface">
						<Accordion>
							<Accordion.Item id="filters" className="rounded-xl border border-divider bg-surface">
								<Accordion.Heading>
									<Accordion.Trigger className="flex w-full items-center justify-between px-4 py-3">
										<span className="font-medium">Filtros</span>
										<Accordion.Indicator />
									</Accordion.Trigger>
								</Accordion.Heading>
								<Accordion.Panel>
									<Accordion.Body className="flex flex-col gap-3 p-4">
										<div className="grid grid-cols-1 gap-3">{renderFiltersChildren()}</div>
										<div className="flex items-center justify-end gap-2">
											{filtersApplyAction && (
												<AsyncButton variant="secondary" onPress={filters.onRefresh} isPending={filters.isRefreshing}>
													<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
													Atualizar
												</AsyncButton>
											)}
											{filters.onClear && filters.hasFilters && (
												<Button variant="ghost" onPress={filters.onClear}>
													<Icon icon={RemoveCircleIcon} className="icon-sm" />
													Limpar
												</Button>
											)}
										</div>
									</Accordion.Body>
								</Accordion.Panel>
							</Accordion.Item>
						</Accordion>
					</div>
				</>
			)}

			<div className="hidden md:block">
				<Table className="w-full">
					<Table.ScrollContainer>
						<Table.Content aria-label="Tabela de dados" className={`${minWidth}`}>
							<Table.Header>
								{columns.map((column, index) => {
									const isSortable =
										pagination != null &&
										pagination.onSortChange != null &&
										column.key !== 'actions' &&
										(column.sortable ?? true);
									const isActiveSort = currentSortBy === column.key;

									return (
										<Table.Column
											key={column.key}
											id={column.key}
											isRowHeader={index === 0}
											style={getCellStyle(column)}
										>
											{isSortable ? (
												<button
													type="button"
													onClick={() => handleSortChange(column.key)}
													className="inline-flex items-center gap-1"
												>
													<span>{column.header}</span>
													{isActiveSort && currentSortOrder === 'asc' ? (
														<Icon icon={SortingUpIcon} className="icon-xs" />
													) : isActiveSort ? (
														<Icon icon={SortingDownIcon} className="icon-xs" />
													) : null}
												</button>
											) : (
												column.header
											)}
										</Table.Column>
									);
								})}
							</Table.Header>
							<Table.Body
								renderEmptyState={() => (
									<EmptyState className="flex w-full flex-col items-center justify-center gap-2 py-12 text-center">
										<Icon icon={RemoveCircleIcon} className="icon-md text-muted" />
										<span className="text-sm text-muted">{emptyMessage}</span>
									</EmptyState>
								)}
							>
								{isLoading
									? Array.from({ length: skeletonRows }).map((_, rowIndex) => (
											<Table.Row key={`skeleton-${rowIndex}`}>
												{columns.map((column) => (
													<Table.Cell
														key={`${column.key}-skeleton-${rowIndex}`}
														style={getCellStyle(column)}
													>
														<Skeleton className={`h-5 rounded-lg ${column.skeletonWidth ?? 'w-3/4'}`} />
													</Table.Cell>
												))}
											</Table.Row>
										))
									: data.map((item) => (
											<Table.Row key={keyExtractor(item)} className={rowClassName?.(item) ?? ''}>
												{columns.map((column) => (
													<Table.Cell
														key={`${column.key}-${keyExtractor(item)}`}
														style={getCellStyle(column)}
													>
														{column.render(item)}
													</Table.Cell>
												))}
											</Table.Row>
										))}
							</Table.Body>
						</Table.Content>
					</Table.ScrollContainer>
					{pagination && (
						<Table.Footer>
							<Pagination size="sm">
								<Pagination.Summary>
									Mostrando {start}-{end} de {pagination.totalItems} resultados
								</Pagination.Summary>
								<Pagination.Content>
									<Pagination.Item>
										<Pagination.Previous
											isDisabled={pagination.page <= 1 || isLoading}
											onPress={() => pagination.onPageChange(pagination.page - 1)}
										>
											<Pagination.PreviousIcon />
											Anterior
										</Pagination.Previous>
									</Pagination.Item>
									{pages.map((pageItem, index) =>
										pageItem === 'ellipsis' ? (
											<Pagination.Item key={`ellipsis-${index}`}>
												<Pagination.Ellipsis />
											</Pagination.Item>
										) : (
											<Pagination.Item key={pageItem}>
												<Pagination.Link
													isActive={pageItem === pagination.page}
													onPress={() => pagination.onPageChange(pageItem)}
												>
													{pageItem}
												</Pagination.Link>
											</Pagination.Item>
										)
									)}
									<Pagination.Item>
										<Pagination.Next
											isDisabled={pagination.page >= pagination.totalPages || isLoading}
											onPress={() => pagination.onPageChange(pagination.page + 1)}
										>
											Próximo
											<Pagination.NextIcon />
										</Pagination.Next>
									</Pagination.Item>
								</Pagination.Content>
							</Pagination>
						</Table.Footer>
					)}
				</Table>
			</div>

			<div className="md:hidden">
				{isLoading ? (
					<div className="flex flex-col gap-2 p-2 rounded-xl border border-divider bg-surface">
						{Array.from({ length: Math.min(skeletonRows, 5) }).map((_, index) => (
							<Skeleton key={index} className="h-16 rounded-xl" />
						))}
					</div>
				) : data.length === 0 ? (
					<div className="px-4 py-12 text-center text-muted">{emptyMessage}</div>
				) : (
					<div className="grid grid-cols-1 gap-2">
						{data.map((item, index) => (
							<div key={keyExtractor(item)} className={rowClassName?.(item) ?? ''}>
								{renderMobileCard ? (
									renderMobileCard(item, index, effectiveMobileActions ? () => openMobileActions(item) : undefined)
								) : (
									<div
										className={`rounded-xl border border-divider bg-surface overflow-hidden ${
											effectiveMobileActions ? 'cursor-pointer' : ''
										}`}
										onClick={effectiveMobileActions ? () => openMobileActions(item) : undefined}
										role={effectiveMobileActions ? 'button' : undefined}
										tabIndex={effectiveMobileActions ? 0 : undefined}
										onKeyDown={
											effectiveMobileActions
												? (event) => {
														if (event.key === 'Enter' || event.key === ' ') {
															event.preventDefault();
															openMobileActions(item);
														}
													}
												: undefined
										}
									>
										<div className="flex flex-col gap-2 min-w-0">
											<div className="flex items-start justify-between gap-3 min-w-0">
												<div className="min-w-0 flex-1 overflow-hidden">{columns[0]?.render(item)}</div>
											</div>
											<div className="grid grid-cols-2 gap-2">
												{columns
													.slice(1)
													.filter((col) => col.key !== 'actions')
													.map((column) => (
														<div key={column.key} className="rounded-lg bg-content1 p-2 min-w-0 overflow-hidden">
															<span className="text-xs text-muted">{column.header}</span>
															<div className="mt-1 text-sm truncate">{column.render(item)}</div>
														</div>
													))}
											</div>
										</div>
									</div>
								)}
							</div>
						))}
					</div>
				)}

				{pagination && (
					<div className="mt-3 rounded-xl border border-divider bg-surface p-3">
						<Pagination size="sm">
							<Pagination.Summary>
								Mostrando {start}-{end} de {pagination.totalItems} resultados
							</Pagination.Summary>
							<Pagination.Content>
								<Pagination.Item>
									<Pagination.Previous
										isDisabled={pagination.page <= 1 || isPaginationBusy}
										onPress={() => pagination.onPageChange(pagination.page - 1)}
									>
										<Pagination.PreviousIcon />
										Anterior
									</Pagination.Previous>
								</Pagination.Item>
								{pages.map((pageItem, index) =>
									pageItem === 'ellipsis' ? (
										<Pagination.Item key={`mobile-ellipsis-${index}`}>
											<Pagination.Ellipsis />
										</Pagination.Item>
									) : (
										<Pagination.Item key={`mobile-${pageItem}`}>
											<Pagination.Link
												isActive={pageItem === pagination.page}
												isDisabled={isPaginationBusy}
												onPress={() => pagination.onPageChange(pageItem)}
											>
												{pageItem}
											</Pagination.Link>
										</Pagination.Item>
									)
								)}
								<Pagination.Item>
									<Pagination.Next
										isDisabled={pagination.page >= pagination.totalPages || isPaginationBusy}
										onPress={() => pagination.onPageChange(pagination.page + 1)}
									>
										Próximo
										<Pagination.NextIcon />
									</Pagination.Next>
								</Pagination.Item>
							</Pagination.Content>
						</Pagination>
					</div>
				)}
			</div>

			{effectiveMobileActions && (
				<MobileBottomSheet
					isOpen={isMobileActionsOpen}
					onClose={closeMobileActions}
					title={activeMobileItem ? effectiveMobileActions.title(activeMobileItem) : undefined}
					subtitle={activeMobileItem ? effectiveMobileActions.subtitle?.(activeMobileItem) : undefined}
				>
					{activeMobileItem ? effectiveMobileActions.renderActions(activeMobileItem, closeMobileActions) : null}
				</MobileBottomSheet>
			)}
		</div>
	);
}
