'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Chip, Tooltip } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { formatRelativeTime } from '@/utils/datetime';
import { notificationPriorityParse, notificationStatusTypeParse, notificationTypeParse } from '@/parse/notification';
import type { NotificationPriority, NotificationStatusType, NotificationType } from '@/types/enums';
import { Routes } from '@/router/routes';
import { Building06Icon, CheckmarkCircle02Icon, Delete01Icon, UserIcon } from '@hugeicons/core-free-icons';

export interface NotificationItemData {
	id: string;
	title: string;
	message: string | null;
	type: NotificationType;
	priority: NotificationPriority;
	statusType?: NotificationStatusType | null;
	isRead: boolean;
	createdAt: string;
	actionUrl?: string | null;
	actionLabel?: string | null;
	isMerchant: boolean;
}

interface NotificationItemProps {
	notification: NotificationItemData;
	onMarkAsRead?: (id: string) => void;
	onDelete?: (id: string) => void;
	isPending?: boolean;
	variant?: 'default' | 'compact';
	onNavigate?: () => void;
	showScopeChip?: boolean;
}

export function NotificationItem({
	notification,
	onMarkAsRead,
	onDelete,
	isPending = false,
	variant = 'default',
	onNavigate,
	showScopeChip = true,
}: NotificationItemProps) {
	const router = useRouter();
	const [isExpanded, setIsExpanded] = useState(false);

	const typeParse = notificationTypeParse[notification.type];
	const priorityParse = notificationPriorityParse[notification.priority];
	const statusTypeParse = notification.statusType ? notificationStatusTypeParse[notification.statusType] : null;

	const iconToShow = statusTypeParse?.icon ?? typeParse?.icon;
	const iconColorClass = statusTypeParse?.color ?? typeParse?.color ?? 'default';
	const hasLongMessage = (notification.message?.length ?? 0) > (variant === 'compact' ? 110 : 140);

	const scopeConfig = notification.isMerchant
		? {
				label: 'Organização',
				icon: Building06Icon,
				chipColor: 'accent' as const,
				dotClass: 'bg-accent',
				unreadContainerClass: 'bg-accent-soft border-accent-soft',
		  }
		: {
				label: 'Pessoal',
				icon: UserIcon,
				chipColor: 'default' as const,
				dotClass: 'bg-accent',
				unreadContainerClass: 'bg-accent-soft border-accent-soft',
		  };

	function normalizeActionUrl(actionUrl?: string | null): string | null {
		if (!actionUrl) return null;

		const normalized = actionUrl.trim();
		const parsed = normalized.startsWith('http://') || normalized.startsWith('https://')
			? new URL(normalized)
			: new URL(normalized, 'http://localhost');

		const path = parsed.pathname;
		if (path === '/merchants/review') {
			return Routes.panel.merchant.review;
		}

		if (path.startsWith('/merchants/')) {
			return `/panel${path}`;
		}

		if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
			return `${parsed.pathname}${parsed.search}${parsed.hash}`;
		}

		return normalized;
	}

	function handleViewDetails() {
		onNavigate?.();
		const actionUrl = normalizeActionUrl(notification.actionUrl);
		if (actionUrl) {
			router.push(actionUrl);
		}
	}

	return (
		<div
			className={`relative flex rounded-xl gap-3 border transition-all ${
				notification.isRead ? 'bg-surface border-divider' : scopeConfig.unreadContainerClass
			} ${variant === 'compact' ? 'p-3' : 'px-4 py-3'}`}
		>
			<div className={`shrink-0 flex items-center justify-center ${variant === 'compact' ? 'size-8' : 'size-9'} rounded-lg bg-${iconColorClass}/10 text-${iconColorClass}`}>
				{iconToShow}
			</div>

			<div className="flex flex-col gap-1.5 grow min-w-0">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0">
						<div className="flex items-center gap-2 min-w-0">
							<h3 className={`${variant === 'compact' ? 'text-sm' : 'text-sm'} truncate ${!notification.isRead ? 'font-semibold text-foreground' : 'font-medium text-foreground/75'}`}>
								{notification.title}
							</h3>
							{!notification.isRead && <span className={`size-2 rounded-full ${scopeConfig.dotClass} shrink-0`} />}
							
						</div>

						{notification.message && (
							<div>
								<p className={`${variant === 'compact' ? 'text-xs' : 'text-sm'} text-muted ${!isExpanded ? 'line-clamp-2' : ''}`}>
									{notification.message}
								</p>
								{hasLongMessage && (
									<button
										type="button"
										onClick={() => setIsExpanded((current) => !current)}
										className="mt-0.5 text-xs text-accent hover:underline"
									>
										{isExpanded ? 'Ver menos' : 'Ver mais'}
									</button>
								)}
							</div>
						)}

						{notification.actionUrl && (
							<button type="button" onClick={handleViewDetails} className="text-xs text-accent hover:underline mt-1 cursor-pointer">
								{notification.actionLabel ?? 'Ver detalhes'}
							</button>
						)}

						<div className="flex flex-wrap items-center gap-1.5 mt-0.5">
							{showScopeChip && (
								<Chip variant="soft" color={scopeConfig.chipColor} size="sm">
									<Icon icon={scopeConfig.icon} className="icon-xs" />
									{scopeConfig.label}
								</Chip>
							)}

							{statusTypeParse && (
								<Chip
									variant="soft"
									color={statusTypeParse.color as 'default' | 'accent' | 'success' | 'warning' | 'danger'}
									size="sm"
								>
									{statusTypeParse.label}
								</Chip>
							)}

							{notification.priority !== 'Normal' && (
								<Chip
									variant="soft"
									color={priorityParse.color as 'default' | 'accent' | 'success' | 'warning' | 'danger'}
									size="sm"
								>
									{priorityParse.label}
								</Chip>
							)}
						</div>
					</div>

					<div className="flex flex-col justify-end items-end gap-1 shrink-0">
						<span className="text-xs text-muted tabular-nums">{formatRelativeTime(notification.createdAt)}</span>
						<div className="flex gap-1">
							{!notification.isRead && onMarkAsRead && (
								<Tooltip>
									<Button
										isIconOnly
										variant="secondary"
										size="sm"
										className="bg-success-soft text-success"
										onPress={() => onMarkAsRead(notification.id)}
										isDisabled={isPending}
									>
										<Icon icon={CheckmarkCircle02Icon} className="icon-xs" />
									</Button>
									<Tooltip.Content>Marcar como lida</Tooltip.Content>
								</Tooltip>
							)}
							{onDelete && (
								<Tooltip>
									<Button
										isIconOnly
										variant="danger-soft"
										size="sm"
										className="bg-danger-soft text-danger"
										onPress={() => onDelete(notification.id)}
										isDisabled={isPending}
									>
										<Icon icon={Delete01Icon} className="icon-xs" />
									</Button>
									<Tooltip.Content>Excluir</Tooltip.Content>
								</Tooltip>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
