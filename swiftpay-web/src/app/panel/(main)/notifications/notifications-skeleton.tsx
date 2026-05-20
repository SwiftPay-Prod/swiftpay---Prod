'use client';

import { Button, Card, Input, Skeleton, Tabs, Accordion } from '@heroui/react';
import { PageHeader } from '@/components/ui/page-header';
import { SelectFilter } from '@/components/ui/select-filter';
import { Icon } from '@/components/ui/icon';
import {
	notificationTypeParse,
	notificationPriorityParse,
	notificationStatusTypeParse,
	notificationFilterParse,
	notificationScopeFilterParse,
} from '@/parse/notification';
import { parseToFilterOptions } from '@/parse';
import {
	Search01Icon,
	RemoveCircleIcon,
	ArrowReloadHorizontalIcon,
	ArrowDown01Icon,
	Notification01Icon,
} from '@hugeicons/core-free-icons';
import type { NotificationFilters } from './page';

interface NotificationsSkeletonProps {
	filters: NotificationFilters;
}

const typeOptions = parseToFilterOptions(notificationTypeParse, 'Todos os tipos');
const priorityOptions = parseToFilterOptions(notificationPriorityParse, 'Todas as prioridades');
const statusTypeOptions = parseToFilterOptions(notificationStatusTypeParse, 'Todos os status');
const readStatusOptions = parseToFilterOptions(notificationFilterParse);
const scopeOptions = parseToFilterOptions(notificationScopeFilterParse);

const pageSizeOptions = [
	{ value: '10', label: '10 por página' },
	{ value: '20', label: '20 por página' },
	{ value: '50', label: '50 por página' },
];

function NotificationItemSkeleton() {
	return (
		<div className="flex gap-4 px-4 py-4 border-b border-divider last:border-b-0">
			<div className="shrink-0">
				<Skeleton className="size-10 rounded-xl" />
			</div>
			<div className="flex flex-col gap-2 grow min-w-0">
				<div className="flex items-start justify-between gap-2">
					<Skeleton className="h-5 w-48 rounded-lg" />
					<Skeleton className="h-4 w-16 rounded-lg" />
				</div>
				<Skeleton className="h-4 w-full rounded-lg" />
				<div className="flex items-center gap-2 mt-1">
					<Skeleton className="h-6 w-24 rounded-lg" />
					<Skeleton className="h-5 w-16 rounded-full" />
				</div>
			</div>
		</div>
	);
}

export function NotificationsSkeleton({ filters }: NotificationsSkeletonProps) {
	const scopeTabKey = filters.scope ?? 'all';

	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={Notification01Icon} className="icon-md" />}
				title="Notificações"
				description="Gerencie suas notificações pessoais e da organização em um só lugar."
			/>

			{/* Tabs reais (desabilitados) */}
			<Card className="p-4">
				<Tabs selectedKey={scopeTabKey} className="w-fit">
					<Tabs.ListContainer>
						<Tabs.List aria-label="Escopo das notificações" className="gap-1">
							{scopeOptions.map((option) => {
								const indicatorClass =
									option.value === 'Merchant' ? 'bg-accent' : option.value === 'User' ? 'bg-secondary' : 'bg-muted';

								const selectedTextClass =
									option.value === 'Merchant'
										? 'data-[selected=true]:text-accent-foreground'
										: option.value === 'User'
											? 'data-[selected=true]:text-secondary-foreground'
											: '';

								return (
									<Tabs.Tab
										key={option.value}
										id={option.value}
										isDisabled={true}
										className={`flex items-center gap-2 px-4 py-2 ${selectedTextClass}`}
									>
										{option.icon}
										<span>{option.label}</span>
										<Skeleton className="h-5 w-6 rounded-md" />
										<Tabs.Indicator className={indicatorClass} />
									</Tabs.Tab>
								);
							})}
						</Tabs.List>
					</Tabs.ListContainer>
				</Tabs>
			</Card>

			{/* Filtros Desktop reais (desabilitados) */}
			<div className="hidden md:flex flex-col gap-4 rounded-xl bg-surface p-4 xl:flex-row xl:items-end xl:gap-4">
				<div className="relative grow">
					<Icon
						icon={Search01Icon}
						className="icon-sm text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
					/>
					<Input variant="secondary"
						aria-label="Buscar notificações"
						placeholder="Buscar por título ou mensagem..."
						defaultValue={filters.search ?? ''}
						disabled
						readOnly
						className="w-full pl-9"
					/>
				</div>

				<SelectFilter
					label="Tipo"
					value={(filters.type ?? 'all') as string}
					options={typeOptions}
					onChange={() => {}}
					isDisabled
					className="grow xl:grow-0 xl:w-40"
				/>

				<SelectFilter
					label="Categoria"
					value={(filters.statusType ?? 'all') as string}
					options={statusTypeOptions}
					onChange={() => {}}
					isDisabled
					className="grow xl:grow-0 xl:w-48"
				/>

				<SelectFilter
					label="Prioridade"
					options={priorityOptions}
					value={(filters.priority ?? 'all') as string}
					onChange={() => {}}
					isDisabled
					className="grow xl:grow-0 xl:w-44"
				/>

				<SelectFilter
					label="Status"
					options={readStatusOptions}
					value={filters.isRead === true ? 'read' : filters.isRead === false ? 'unread' : 'all'}
					onChange={() => {}}
					isDisabled
					className="grow xl:grow-0 xl:w-36"
				/>

				<SelectFilter
					label="Por página"
					options={pageSizeOptions}
					value={String(filters.pageSize)}
					onChange={() => {}}
					isDisabled
					className="grow xl:grow-0 xl:w-36"
				/>

				<div className="flex shrink-0 gap-2 xl:ml-auto">
					<Button variant="ghost" isDisabled>
						<Icon icon={RemoveCircleIcon} className="icon-sm" />
						Limpar
					</Button>
					<Button variant="secondary" isDisabled>
						<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm animate-spin" />
						Atualizar
					</Button>
				</div>
			</div>

			{/* Filtros Mobile */}
			<div className="md:hidden">
				<Accordion hideSeparator className="px-0 bg-surface rounded-xl">
					<Accordion.Item id="filters">
						<Accordion.Heading>
							<Accordion.Trigger className="flex items-center justify-between w-full rounded-xl bg-surface p-4">
								<span className="text-sm font-medium">Filtros</span>
								<Accordion.Indicator>
									<Icon icon={ArrowDown01Icon} className="icon-sm text-muted" />
								</Accordion.Indicator>
							</Accordion.Trigger>
						</Accordion.Heading>
					</Accordion.Item>
				</Accordion>
			</div>

			{/* Lista skeleton */}
			<Card className="overflow-hidden p-0">
				{Array.from({ length: filters.pageSize }).map((_, i) => (
					<NotificationItemSkeleton key={i} />
				))}
			</Card>

			{/* Pagination skeleton */}
			<div className="flex justify-center items-center gap-2">
				<Skeleton className="h-10 w-24 rounded-lg" />
				<Skeleton className="h-4 w-32 rounded-lg" />
				<Skeleton className="h-10 w-24 rounded-lg" />
			</div>
		</div>
	);
}

export function NotificationsListSkeleton({ pageSize = 10 }: { pageSize?: number }) {
	return (
		<Card className="overflow-hidden p-0">
			{Array.from({ length: pageSize }).map((_, i) => (
				<NotificationItemSkeleton key={i} />
			))}
		</Card>
	);
}

