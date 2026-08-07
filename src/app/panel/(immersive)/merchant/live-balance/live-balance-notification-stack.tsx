'use client';

import { useState } from 'react';
import { Button, Chip } from '@heroui/react';
import { Building06Icon, Cancel01Icon, UserIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { notificationPriorityParse, notificationStatusTypeParse, notificationTypeParse } from '@/parse/notification';
import type { NotificationPriority, NotificationStatusType, NotificationType } from '@/types/enums';
import { formatRelativeTime } from '@/utils/datetime';
import { cn } from '@/utils/utils';

const SWIPE_DISMISS_THRESHOLD = 92;

export interface LiveBalanceOverlayNotification {
	toastId: string;
	id: string;
	title: string;
	message: string | null;
	type: NotificationType;
	statusType: NotificationStatusType | null;
	priority: NotificationPriority;
	createdAt: string;
	isMerchant: boolean;
	isClosing?: boolean;
}

interface LiveBalanceNotificationStackProps {
	notifications: LiveBalanceOverlayNotification[];
	isLight: boolean;
	onDismiss: (toastId: string) => void;
}

function getToneClass(color: string, isLight: boolean) {
	switch (color) {
		case 'success':
			return isLight
				? 'border-emerald-400/35 bg-white/85 text-emerald-700 shadow-[0_18px_40px_rgba(16,185,129,0.24)]'
				: 'border-emerald-400/25 bg-black/55 text-emerald-200 shadow-[0_18px_40px_rgba(16,185,129,0.22)]';
		case 'warning':
			return isLight
				? 'border-amber-400/35 bg-white/85 text-amber-700 shadow-[0_18px_40px_rgba(245,158,11,0.24)]'
				: 'border-amber-400/25 bg-black/55 text-amber-100 shadow-[0_18px_40px_rgba(245,158,11,0.22)]';
		case 'danger':
			return isLight
				? 'border-rose-400/35 bg-white/85 text-rose-700 shadow-[0_18px_40px_rgba(244,63,94,0.2)]'
				: 'border-rose-400/25 bg-black/55 text-rose-100 shadow-[0_18px_40px_rgba(244,63,94,0.2)]';
		case 'accent':
			return isLight
				? 'border-sky-400/35 bg-white/85 text-sky-700 shadow-[0_18px_40px_rgba(14,165,233,0.22)]'
				: 'border-sky-400/25 bg-black/55 text-sky-100 shadow-[0_18px_40px_rgba(14,165,233,0.2)]';
		default:
			return isLight
				? 'border-foreground/12 bg-white/85 text-foreground shadow-[0_18px_40px_rgba(15,23,42,0.12)]'
				: 'border-white/10 bg-black/55 text-white shadow-[0_18px_40px_rgba(0,0,0,0.24)]';
	}
}

function NotificationCard({ notification, isLight, onDismiss }: {
	notification: LiveBalanceOverlayNotification;
	isLight: boolean;
	onDismiss: (toastId: string) => void;
}) {
	const [dragX, setDragX] = useState(0);
	const [isDragging, setIsDragging] = useState(false);
	const [pointerId, setPointerId] = useState<number | null>(null);
	const [startX, setStartX] = useState(0);
	const [dismissDirection, setDismissDirection] = useState<1 | -1 | 0>(0);

	const typeParse = notificationTypeParse[notification.type];
	const statusTypeParse = notification.statusType ? notificationStatusTypeParse[notification.statusType] : null;
	const priorityParse = notificationPriorityParse[notification.priority];
	const toneClass = getToneClass(statusTypeParse?.color ?? typeParse.color, isLight);

	function handleDismiss(direction: 1 | -1 | 0 = 1) {
		setDismissDirection(direction);
		onDismiss(notification.toastId);
	}

	function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
		setPointerId(event.pointerId);
		setStartX(event.clientX - dragX);
		setIsDragging(true);
		event.currentTarget.setPointerCapture(event.pointerId);
	}

	function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
		if (!isDragging || pointerId !== event.pointerId) {
			return;
		}

		setDragX(event.clientX - startX);
	}

	function handlePointerEnd(event: React.PointerEvent<HTMLDivElement>) {
		if (pointerId !== event.pointerId) {
			return;
		}

		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}

		setIsDragging(false);
		setPointerId(null);

		if (Math.abs(dragX) >= SWIPE_DISMISS_THRESHOLD) {
			handleDismiss(dragX >= 0 ? 1 : -1);
			return;
		}

		setDragX(0);
	}

	const closingTranslate = dismissDirection === -1 ? '-120%' : '120%';
	const interactiveStyle = notification.isClosing
		? { transform: `translate3d(${closingTranslate}, 0, 0) scale(0.96)`, opacity: 0 }
		: { transform: `translate3d(${dragX}px, 0, 0)` };

	return (
		<div
			key={notification.toastId}
			className={cn(
				'pointer-events-auto overflow-hidden rounded-[1.35rem] border p-3 backdrop-blur-xl transition-[transform,opacity] duration-220 ease-out touch-pan-y select-none',
				!notification.isClosing && 'animate-[live-balance-notification-in_320ms_cubic-bezier(0.22,1,0.36,1)]',
				isDragging && 'cursor-grabbing',
				toneClass
			)}
			style={interactiveStyle}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerEnd}
			onPointerCancel={handlePointerEnd}
		>
			<div className="flex items-start gap-3">
				<div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/12">
					{statusTypeParse?.icon ?? typeParse.icon}
				</div>

				<div className="min-w-0 grow">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<div className="flex items-center gap-2">
								<span className="text-sm font-semibold tracking-tight">{notification.title}</span>
								<span className="size-2 shrink-0 rounded-full bg-current/70" />
							</div>
							{notification.message && (
								<p className="mt-1 line-clamp-2 text-xs opacity-80">{notification.message}</p>
							)}
						</div>

						<div className="flex shrink-0 items-center gap-1.5">
							<span className="text-xs font-medium opacity-70">
								{formatRelativeTime(notification.createdAt)}
							</span>
							<Button
								variant="ghost"
								isIconOnly
								aria-label="Fechar notificacao"
								onPress={() => handleDismiss(1)}
								className="size-7 min-w-7 bg-white/10 text-current hover:bg-white/18"
							>
								<Icon icon={Cancel01Icon} className="icon-xs" />
							</Button>
						</div>
					</div>

					<div className="mt-2 flex flex-wrap items-center gap-1.5">
						<Chip variant="soft" color={notification.isMerchant ? 'accent' : 'default'} size="sm">
							<Icon icon={notification.isMerchant ? Building06Icon : UserIcon} className="icon-xs" />
							{notification.isMerchant ? 'Organizacao' : 'Pessoal'}
						</Chip>

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
			</div>
		</div>
	);
}

export function LiveBalanceNotificationStack({ notifications, isLight, onDismiss }: LiveBalanceNotificationStackProps) {
	if (notifications.length === 0) {
		return null;
	}

	return (
		<div className="pointer-events-none absolute inset-x-3 top-18 z-140 flex justify-end sm:inset-x-6 sm:top-24">
			<div className="flex w-full max-w-120 flex-col gap-2">
				{notifications.map((notification) => {
					return (
						<NotificationCard
							key={notification.toastId}
							notification={notification}
							isLight={isLight}
							onDismiss={onDismiss}
						/>
					);
				})}
			</div>

			<style jsx>{`
				@keyframes live-balance-notification-in {
					from {
						opacity: 0;
						transform: translate3d(20px, -10px, 0) scale(0.96);
					}
					to {
						opacity: 1;
						transform: translate3d(0, 0, 0) scale(1);
					}
				}
			`}</style>
		</div>
	);
}
