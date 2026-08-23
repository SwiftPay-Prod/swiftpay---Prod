'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Popover, Button, Separator, Tooltip, Skeleton, TagGroup, Tag, ScrollShadow } from '@heroui/react';
import { Icon } from '../../ui/icon';
import {
	Notification01Icon,
	TickDouble01Icon,
	ArrowRight01Icon,
	ArrowReloadHorizontalIcon,
	Building06Icon,
	UserIcon,
} from '@hugeicons/core-free-icons';
import { useNotifications } from '../../../contexts/notification-context';
import { useUserNotifications } from '../../../contexts/user-notification-context';
import { useMerchant } from '../../../contexts/merchant-context';
import { useIsMobile } from '../../../hooks/use-is-mobile';
import { Routes } from '../../../router/routes';
import type { NotificationData } from '../../../types/merchant/notifications';
import { NotificationItem } from './notification-item';

type HeaderNotification = {
	id: string;
	title: string;
	message: string;
	type: NotificationData['type'];
	statusType: NotificationData['statusType'] | null;
	priority: NotificationData['priority'];
	isRead: boolean;
	createdAt: string;
	actionUrl?: string | null;
	actionLabel?: string | null;
};

type NotificationScopeTab = 'User' | 'Merchant';

export function NotificationPopover() {
	const router = useRouter();
	const isMobile = useIsMobile();
	const { selectedMerchant } = useMerchant();

	const [isOpen, setIsOpen] = useState(false);
	const [selectedTab, setSelectedTab] = useState<NotificationScopeTab>('User');
	const [isMarkingAllAsRead, startMarkingAllAsRead] = useTransition();
	const [isRefreshing, startRefreshing] = useTransition();
	const notificationsListRef = useRef<HTMLDivElement | null>(null);

	const merchantNotifications = useNotifications();
	const userNotifications = useUserNotifications();

	const hasMerchantTab = Boolean(selectedMerchant);
	const activeTab: NotificationScopeTab = hasMerchantTab ? selectedTab : 'User';
	const totalUnread = userNotifications.unreadCount + (hasMerchantTab ? merchantNotifications.unreadCount : 0);
	const hasNewNotification = userNotifications.hasNewNotification || (hasMerchantTab && merchantNotifications.hasNewNotification);
	const displayCount = totalUnread > 99 ? '99+' : totalUnread.toString();

	useEffect(() => {
		if (isOpen) {
			userNotifications.clearNewNotificationFlag();
			if (hasMerchantTab) {
				merchantNotifications.clearNewNotificationFlag();
			}
		}
	}, [isOpen, hasMerchantTab, merchantNotifications, userNotifications]);

	useEffect(() => {
		const element = notificationsListRef.current;
		if (!element) return;

		element.animate(
			[
				{ opacity: 0.6, transform: 'translateY(4px)' },
				{ opacity: 1, transform: 'translateY(0)' },
			],
			{ duration: 180, easing: 'ease-out' }
		);
	}, [activeTab]);

	const isMerchantScope = activeTab === 'Merchant';
	const currentNotifications: HeaderNotification[] = isMerchantScope
		? merchantNotifications.notifications
		: userNotifications.notifications;
	const visibleNotifications = currentNotifications;
	const isLoadingNotifications = isMerchantScope
		? merchantNotifications.isLoadingNotifications
		: userNotifications.isLoadingNotifications;
	const currentUnreadCount = isMerchantScope
		? merchantNotifications.unreadCount
		: userNotifications.unreadCount;

	function renderScopeLabel(label: string, count: number) {
		return (
			<span className="text-base font-medium">{count > 0 ? `${label} (${count})` : label}</span>
		);
	}

	function handleViewAll() {
		setIsOpen(false);
		router.push(`${Routes.panel.notifications}?scope=${isMerchantScope ? 'Merchant' : 'User'}`);
	}

	function handleIconClick() {
		if (isMobile) {
			router.push(Routes.panel.notifications);
		}
	}

	function handleMarkAllAsRead() {
		startMarkingAllAsRead(async () => {
			if (isMerchantScope) {
				await merchantNotifications.markAllAsRead();
				return;
			}
			await userNotifications.markAllAsRead();
		});
	}

	function handleRefresh() {
		startRefreshing(async () => {
			if (isMerchantScope) {
				await Promise.all([merchantNotifications.refreshCount(), merchantNotifications.refreshNotifications()]);
				return;
			}

			await Promise.all([userNotifications.refreshCount(), userNotifications.refreshNotifications()]);
		});
	}

	async function handleMarkAsRead(id: string) {
		if (isMerchantScope) {
			const notification = merchantNotifications.notifications.find((n) => n.id === id);
			if (!notification || notification.isRead) return;
			await merchantNotifications.markAsRead(id);
			merchantNotifications.setNotificationAsRead(id);
			merchantNotifications.decrementCount();
			return;
		}

		const notification = userNotifications.notifications.find((n) => n.id === id);
		if (!notification || notification.isRead) return;
		await userNotifications.markAsRead(id);
		userNotifications.setNotificationAsRead(id);
		userNotifications.decrementCount();
	}

	const triggerButton = (
		<Button
			variant="ghost"
			size="sm"
			isIconOnly
			aria-label="Notificações"
			className="relative"
			onPress={handleIconClick}
		>
			<Icon icon={Notification01Icon} className={`icon-md text-default-500 ${hasNewNotification ? 'animate-glow-accent' : ''}`} />
			{totalUnread > 0 && (
				<span
					className={`absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 flex items-center justify-center rounded-full bg-accent text-white text-xs font-semibold ${hasNewNotification ? 'animate-pulse' : ''}`}
				>
					{displayCount}
				</span>
			)}
		</Button>
	);

	return (
		<Popover isOpen={!isMobile && isOpen} onOpenChange={setIsOpen}>
			<Tooltip>
				<Popover.Trigger>{triggerButton}</Popover.Trigger>
				<Tooltip.Content>Notificações</Tooltip.Content>
			</Tooltip>
			<Popover.Content placement="bottom right" className="w-125 p-0 border border-default-200">
				<div className="p-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Icon icon={Notification01Icon} className="icon-sm text-accent" />
							<h3 className="text-base font-semibold">Notificações</h3>
						</div>
						<div className="flex items-center gap-1">
							<Button
								variant="tertiary"
								size="sm"
								className="bg-secondary-soft text-secondary"
								onPress={handleRefresh}
								isIconOnly
								aria-label="Atualizar notificações"
								isPending={isRefreshing}
							>
								<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
							</Button>
							{currentUnreadCount > 0 && (
								<Button
									variant="tertiary"
									size="sm"
									className="bg-success-soft text-success"
									onPress={handleMarkAllAsRead}
									isIconOnly
									aria-label="Marcar todas como vistas"
									isPending={isMarkingAllAsRead}
								>
									<Icon icon={TickDouble01Icon} className="icon-sm" />
								</Button>
							)}
						</div>
					</div>
				</div>

				<Separator />

				<div className="px-2 py-2">
					<TagGroup
						aria-label="Filtrar notificações por tipo"
						selectionMode="single"
						selectedKeys={[activeTab]}
						onSelectionChange={(keys) => {
							if (keys === 'all') {
								return;
							}
							const key = Array.from(keys)[0];
							if (key === 'User' || key === 'Merchant') {
								setSelectedTab(key);
							}
						}}
					>
						<TagGroup.List className="flex w-full gap-2 *:flex-1 *:justify-center">
							<Tag
								id="User"
								textValue="Pessoal"
								className="cursor-pointer flex-1 justify-center gap-2 py-2 border border-border bg-surface text-foreground data-selected:border-accent-soft-hover data-selected:bg-accent-soft data-selected:text-accent"
							>
								<Icon icon={UserIcon} className="icon-xs" />
								{hasMerchantTab ? renderScopeLabel('Pessoal', userNotifications.unreadCount) : <span className="text-base font-medium">Pessoal</span>}
							</Tag>
							{hasMerchantTab && (
								<Tag
									id="Merchant"
									textValue="Organização"
									className="cursor-pointer flex-1 justify-center gap-2 py-2 border border-border bg-surface text-foreground data-selected:border-warning-soft-hover data-selected:bg-warning-soft data-selected:text-warning"
								>
									<Icon icon={Building06Icon} className="icon-xs" />
									{renderScopeLabel('Organização', merchantNotifications.unreadCount)}
								</Tag>
							)}
						</TagGroup.List>
					</TagGroup>
				</div>
				<Separator />

				<ScrollShadow className="p-2 max-h-110" hideScrollBar>
					<div ref={notificationsListRef}>
						{isLoadingNotifications ? (
							<div className="flex flex-col gap-2">
								{Array.from({ length: 4 }).map((_, i) => (
									<div key={i} className="flex gap-3 p-3 rounded-xl border border-border bg-surface">
										<Skeleton className="w-8 h-8 rounded-lg shrink-0" />
										<div className="flex-1 space-y-2">
											<Skeleton className="h-4 w-3/4 rounded" />
											<Skeleton className="h-3 w-full rounded" />
										</div>
									</div>
								))}
							</div>
						) : currentNotifications.length === 0 ? (
							<div className="py-10 text-center">
								<Icon icon={isMerchantScope ? Building06Icon : UserIcon} className="icon-lg text-muted mx-auto mb-2" />
								<p className="text-sm text-muted">Nenhuma notificação</p>
							</div>
						) : (
							<div className="flex flex-col gap-2">
								{visibleNotifications.map((notification) => (
									<NotificationItem
										key={notification.id}
										notification={{
											...notification,
											isMerchant: isMerchantScope,
										}}
										onMarkAsRead={handleMarkAsRead}
										onNavigate={() => setIsOpen(false)}
										variant="compact"
										showScopeChip={false}
									/>
								))}
							</div>
						)}
					</div>
				</ScrollShadow>

				<Separator />

				<div className="p-2">
					<Button variant="ghost" size="sm" className="w-full justify-between" onPress={handleViewAll}>
						Ver todas as notificações
						<Icon icon={ArrowRight01Icon} className="icon-sm" />
					</Button>
				</div>
			</Popover.Content>
		</Popover>
	);
}
