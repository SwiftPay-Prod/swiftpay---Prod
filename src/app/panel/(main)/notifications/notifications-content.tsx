'use client';

import { use, useTransition, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button, Card, Tabs } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { EmptyState } from '@/components/ui/empty-state';
import { SelectFilter } from '@/components/ui/select-filter';
import { SearchFilter } from '@/components/ui/search-filter';
import { AsyncButton } from '@/components/ui/async-button';
import {
	notificationTypeParse,
	notificationPriorityParse,
	notificationStatusTypeParse,
	notificationFilterParse,
	notificationScopeFilterParse,
} from '@/parse/notification';
import { NotificationItem } from '@/components/panel/notifications/notification-item';
import { parseToFilterOptions, pageSizeFilterOptions } from '@/parse';
import type { NotificationFilters } from './page';
import type { ReadNotificationCountData } from '@/types/merchant/notifications';
import type { UnifiedNotificationData, ReadUserNotificationCountData } from '@/types/user/notifications';
import type { ApiResponse, Paginated } from '@/types/common';
import {
	CheckmarkCircle02Icon,
	Settings05Icon,
	ArrowRight02Icon,
	ArrowLeft02Icon,
	ArrowReloadHorizontalIcon,
	RemoveCircleIcon,
	Notification01Icon,
} from '@hugeicons/core-free-icons';
import {
	markNotificationRead,
	markAllNotificationsRead,
	deleteNotification as deleteMerchantNotification,
} from '@/app/actions/merchant/notifications';
import { markUserNotificationRead, markAllUserNotificationsRead, deleteUserNotification } from '@/app/actions/user';
import { toast } from '@heroui/react';
import { CancelCircleIcon } from '@hugeicons/core-free-icons';

type NotificationsPromise = Promise<ApiResponse<Paginated<UnifiedNotificationData>>>;
type MerchantCountPromise = Promise<ApiResponse<ReadNotificationCountData>>;
type UserCountPromise = Promise<ApiResponse<ReadUserNotificationCountData>>;

interface NotificationsContentProps {
	notificationsPromise: NotificationsPromise;
	merchantCountPromise: MerchantCountPromise;
	userCountPromise: UserCountPromise;
	merchantId: string;
	filters: NotificationFilters;
}

const typeOptions = parseToFilterOptions(notificationTypeParse, 'Todos os tipos');
const priorityOptions = parseToFilterOptions(notificationPriorityParse, 'Todas as prioridades');
const statusTypeOptions = parseToFilterOptions(notificationStatusTypeParse, 'Todos os status');
const readStatusOptions = parseToFilterOptions(notificationFilterParse);
const scopeOptions = parseToFilterOptions(notificationScopeFilterParse);

export function NotificationsContent({
	notificationsPromise,
	merchantCountPromise,
	userCountPromise,
	merchantId,
	filters,
}: NotificationsContentProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

	const notificationsResponse = use(notificationsPromise);
	const merchantCountResponse = use(merchantCountPromise);
	const userCountResponse = use(userCountPromise);

	const notificationsData = notificationsResponse?.data ?? {
		items: [],
		totalItems: 0,
		page: 1,
		pageSize: 10,
		totalPages: 0,
	};
	const merchantCount = merchantCountResponse?.data ?? { unreadCount: 0, totalCount: 0 };
	const userCount = userCountResponse?.data ?? { unreadCount: 0, totalCount: 0 };

	// Os dados já vêm unificados e ordenados do backend
	const notifications = notificationsData.items;
	const totalPages = notificationsData.totalPages;

	// Unread count calculado pelos endpoints de count
	const unreadCount = merchantCount.unreadCount + userCount.unreadCount;

	const navigate = useCallback(
		(newParams: Record<string, string | number | undefined | null>) => {
			startTransition(() => {
				const params = new URLSearchParams(searchParams.toString());

				Object.entries(newParams).forEach(([key, value]) => {
					if (value === undefined || value === null || value === 'all' || value === '') {
						params.delete(key);
					} else {
						params.set(key, String(value));
					}
				});

				if (!('page' in newParams)) {
					params.delete('page');
				}

				router.push(`${pathname}?${params.toString()}`, { scroll: false });
			});
		},
		[searchParams, pathname, router]
	);

	const handleRefresh = useCallback(() => {
		startTransition(() => {
			router.refresh();
		});
	}, [router]);

	const handleMarkAsRead = useCallback(
		async (notification: UnifiedNotificationData) => {
			if (notification.isRead) return;

			const result = notification.isMerchant
				? await markNotificationRead(merchantId, notification.id)
				: await markUserNotificationRead(notification.id);

			if (result?.error) {
				toast('Erro ao marcar como lida', {
					description: result.error.message,
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
			} else {
				toast('Notificação marcada como lida', {
					description: 'A notificação foi marcada como lida.',
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});
				handleRefresh();
			}
		},
		[merchantId, handleRefresh]
	);

	const handleMarkAllAsRead = useCallback(async () => {
		const promises: Promise<ApiResponse<unknown>>[] = [];

		if (filters.scope === 'all' || filters.scope === 'Merchant') {
			promises.push(markAllNotificationsRead(merchantId) as Promise<ApiResponse<unknown>>);
		}
		if (filters.scope === 'all' || filters.scope === 'User') {
			promises.push(markAllUserNotificationsRead() as Promise<ApiResponse<unknown>>);
		}

		const results = await Promise.all(promises);
		const hasError = results.some((r) => r?.error);

		if (hasError) {
			toast('Erro ao marcar notificações', {
				description: 'Não foi possível marcar todas as notificações como lidas.',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				variant: 'danger',
			});
		} else {
			toast('Notificações marcadas como lidas', {
				description: 'Todas as notificações foram marcadas como lidas.',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
			handleRefresh();
		}
	}, [filters.scope, merchantId, handleRefresh]);

	const handleDelete = useCallback(
		async (notification: UnifiedNotificationData) => {
			const result = notification.isMerchant
				? await deleteMerchantNotification(merchantId, notification.id)
				: await deleteUserNotification(notification.id);

			if (result?.error) {
				toast('Erro ao excluir', {
					description: result.error.message,
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
			} else {
				toast('Notificação excluída', {
					description: 'A notificação foi excluída com sucesso.',
					indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
					variant: 'success',
				});
				handleRefresh();
			}
		},
		[merchantId, handleRefresh]
	);

	const handleClearFilters = useCallback(() => {
		navigate({
			search: undefined,
			type: undefined,
			statusType: undefined,
			priority: undefined,
			isRead: undefined,
			page: undefined,
			pageSize: undefined,
		});
	}, [navigate]);

	const hasActiveFilters = Boolean(filters.type || filters.statusType || filters.priority || filters.isRead !== undefined || filters.search);

	const scopeTabKey = filters.scope ?? 'all';

	const filtersContent = (
		<>
			<SearchFilter
				label="Buscar"
				placeholder="Título ou mensagem"
				defaultValue={filters.search ?? ''}
				resetKey={Number(hasActiveFilters)}
				onChange={(value) => navigate({ search: value.trim() || undefined })}
			/>

			<SelectFilter
				label="Tipo"
				value={(filters.type ?? 'all') as string}
				options={typeOptions}
				onChange={(key) => navigate({ type: key === 'all' ? undefined : key })}
			/>

			<SelectFilter
				label="Categoria"
				value={(filters.statusType ?? 'all') as string}
				options={statusTypeOptions}
				onChange={(key) => navigate({ statusType: key === 'all' ? undefined : key })}
			/>

			<SelectFilter
				label="Prioridade"
				options={priorityOptions}
				value={(filters.priority ?? 'all') as string}
				onChange={(key) => navigate({ priority: key === 'all' ? undefined : key })}
			/>

			<SelectFilter
				label="Status"
				options={readStatusOptions}
				value={filters.isRead === true ? 'read' : filters.isRead === false ? 'unread' : 'all'}
				onChange={(key) => {
					const isRead = key === 'read' ? true : key === 'unread' ? false : undefined;
					navigate({ isRead: isRead === undefined ? undefined : String(isRead) });
				}}
			/>

			<SelectFilter
				label="Por página"
				options={pageSizeFilterOptions}
				value={String(filters.pageSize)}
				onChange={(key) => navigate({ pageSize: key === '10' ? undefined : key })}
				showChips={false}
			/>
		</>
	);

	return (
		<div className="flex flex-col gap-6 text-white">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
				<div>
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-link border border-brand/25">
							<Icon icon={Notification01Icon} className="icon-sm text-link" />
						</div>
						<h1 className="text-xl font-bold tracking-tight text-white">Notificações</h1>
					</div>
					<p className="text-xs text-white/50 mt-1">
						Gerencie suas notificações pessoais e da organização em um só lugar
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Link
						href={Routes.panel.userSettings}
						title="Configurar notificações"
						className="button-outline-dark cursor-pointer text-xs"
					>
						<Icon icon={Settings05Icon} className="icon-xs" />
						<span>Configurar</span>
				</Link>
					{unreadCount > 0 && (
						<button
							type="button"
							onClick={handleMarkAllAsRead}
							disabled={isPending}
							className="button-outline-dark cursor-pointer text-xs"
						>
							<Icon icon={CheckmarkCircle02Icon} className="icon-xs" />
							<span>Marcar lidas</span>
						</button>
					)}
				</div>
			</div>

			{/* Tabs de escopo */}
			<Card className="p-4">
				<Tabs
					selectedKey={scopeTabKey}
					onSelectionChange={(key) => {
						navigate({ scope: key === 'all' ? undefined : key });
					}}
					className="w-full max-w-full overflow-x-auto"
				>
					<Tabs.ListContainer>
						<Tabs.List aria-label="Escopo das notificações" className="gap-1">
							{scopeOptions.map((option) => {
								const count =
									option.value === 'all'
										? merchantCount.totalCount + userCount.totalCount
										: option.value === 'Merchant'
											? merchantCount.totalCount
											: userCount.totalCount;

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
										isDisabled={isPending}
										className={`flex items-center gap-2 px-4 py-2 ${selectedTextClass}`}
									>
										{option.icon}
										<span>{option.label}</span>
										{count > 0 && (
											<span className="px-1.5 py-0.5 text-xs rounded-md font-medium bg-surface-deep">{count}</span>
										)}
										<Tabs.Indicator className={indicatorClass} />
									</Tabs.Tab>
								);
							})}
						</Tabs.List>
					</Tabs.ListContainer>
				</Tabs>
			</Card>

			<div className="rounded-xl bg-surface p-4">
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{filtersContent}
					<div className="flex items-end justify-end gap-2 col-span-full sm:col-span-1 sm:col-start-2 lg:col-start-3 xl:col-start-4">
						<Button variant="ghost" onPress={handleClearFilters} isDisabled={!hasActiveFilters}>
							<Icon icon={RemoveCircleIcon} className="icon-sm" />
							Limpar
						</Button>
						<AsyncButton variant="secondary" onPress={handleRefresh} isPending={isPending}>
							<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
							Atualizar
						</AsyncButton>
					</div>
				</div>
			</div>

			{notifications.length === 0 ? (
				<EmptyState>
					<EmptyState.Indicator>
						<Icon icon={Notification01Icon} className="icon-lg" />
					</EmptyState.Indicator>
					<EmptyState.Heading>Nenhuma notificação encontrada</EmptyState.Heading>
					<EmptyState.Description>
						{hasActiveFilters
							? 'Tente ajustar os filtros para encontrar o que procura.'
							: 'Você não tem notificações no momento.'}
					</EmptyState.Description>
				</EmptyState>
			) : (
				<>
					<Card className="overflow-hidden p-4">
						{notifications.map((notification) => (
							<div key={`${notification.isMerchant ? 'm' : 'u'}-${notification.id}`}>
								<NotificationItem
									notification={notification}
									onMarkAsRead={(id) => {
										const item = notifications.find((n) => n.id === id);
										if (item) {
											handleMarkAsRead(item);
										}
									}}
									onDelete={(id) => {
										const item = notifications.find((n) => n.id === id);
										if (item) {
											handleDelete(item);
										}
									}}
									isPending={isPending}
								/>
							</div>
						))}
					</Card>

					{totalPages > 1 && (
						<div className="flex justify-center items-center gap-2">
							<Button
								variant="tertiary"
								isDisabled={filters.page <= 1 || isPending}
								onPress={() => navigate({ page: filters.page - 1 })}
							>
								<Icon icon={ArrowLeft02Icon} className="icon-sm" />
								Anterior
							</Button>
							<span className="text-sm text-muted px-4">
								Página {filters.page} de {totalPages}
							</span>
							<Button
								variant="tertiary"
								isDisabled={filters.page >= totalPages || isPending}
								onPress={() => navigate({ page: filters.page + 1 })}
							>
								Próxima
								<Icon icon={ArrowRight02Icon} className="icon-sm" />
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	);
}


