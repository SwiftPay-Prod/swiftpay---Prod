'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { TouchEvent } from 'react';
import type { SocialNotification } from '../types';
import type { SocialProofPosition } from '@/types/social-proof';

interface SocialProofProps {
	notifications: SocialNotification[];
	enabled?: boolean;
	intervalSeconds?: number;
	durationSeconds?: number;
	position?: SocialProofPosition;
}

function getDesktopPositionClasses(position: SocialProofPosition, visible: boolean): string {
	const baseClasses = 'transition-all duration-500';

	switch (position) {
		case 'BottomLeft':
			return `${baseClasses} bottom-14 left-4 ${visible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`;
		case 'BottomRight':
			return `${baseClasses} bottom-14 right-4 ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`;
		case 'TopLeft':
			return `${baseClasses} top-4 left-4 ${visible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`;
		case 'TopRight':
			return `${baseClasses} top-4 right-4 ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`;
		default:
			return `${baseClasses} bottom-14 left-4 ${visible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`;
	}
}

export function SocialProof({
	notifications,
	enabled = true,
	intervalSeconds = 8,
	durationSeconds = 4,
	position = 'BottomLeft',
}: SocialProofProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [visible, setVisible] = useState(false);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const isFirstRun = useRef(true);
	const touchStartYRef = useRef<number | null>(null);

	const clearAllTimeouts = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
	}, []);

	const showNotification = useCallback(() => {
		setVisible(true);

		timeoutRef.current = setTimeout(() => {
			setVisible(false);

			timeoutRef.current = setTimeout(() => {
				setCurrentIndex((prev) => (prev + 1) % notifications.length);
			}, 500);
		}, durationSeconds * 1000);
	}, [durationSeconds, notifications.length]);

	const dismissNotification = useCallback(() => {
		clearAllTimeouts();
		setVisible(false);

		timeoutRef.current = setTimeout(() => {
			setCurrentIndex((prev) => (prev + 1) % notifications.length);
		}, 350);
	}, [clearAllTimeouts, notifications.length]);

	const handleTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
		touchStartYRef.current = event.touches[0]?.clientY ?? null;
	}, []);

	const handleTouchEnd = useCallback(
		(event: TouchEvent<HTMLDivElement>) => {
			if (touchStartYRef.current === null) {
				return;
			}

			const endY = event.changedTouches[0]?.clientY ?? touchStartYRef.current;
			const deltaY = endY - touchStartYRef.current;
			touchStartYRef.current = null;

			if (deltaY <= -36) {
				dismissNotification();
			}
		},
		[dismissNotification]
	);

	const scheduleNextNotification = useCallback(() => {
		timeoutRef.current = setTimeout(() => {
			showNotification();
		}, intervalSeconds * 1000);
	}, [intervalSeconds, showNotification]);

	useEffect(() => {
		if (!enabled || notifications.length === 0) return;

		if (isFirstRun.current) {
			isFirstRun.current = false;
			timeoutRef.current = setTimeout(() => {
				showNotification();
			}, 3000);
		}

		return clearAllTimeouts;
	}, [enabled, notifications.length, showNotification, clearAllTimeouts]);

	useEffect(() => {
		if (!enabled || notifications.length === 0) return;
		if (isFirstRun.current) return;

		if (!visible) {
			scheduleNextNotification();
		}

		return clearAllTimeouts;
	}, [currentIndex, visible, enabled, notifications.length, scheduleNextNotification, clearAllTimeouts]);

	if (!enabled || notifications.length === 0) {
		return null;
	}

	const notification = notifications[currentIndex];

	return (
		<>
			<div
				className={`fixed z-50 top-0 left-0 right-0 px-2 pt-2 transition-all duration-500 lg:hidden ${
					visible ? 'translate-y-0 opacity-100 pointer-events-auto' : '-translate-y-full opacity-0 pointer-events-none'
				}`}
				onTouchStart={handleTouchStart}
				onTouchEnd={handleTouchEnd}
			>
				<div className="flex items-center gap-3 px-2 py-2 rounded-2xl shadow-xl hero-card backdrop-blur-sm border hero-border">
					<div className="w-9 h-9 rounded-full bg-linear-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
						{notification.name.charAt(0)}
					</div>
					<div className="flex-1 min-w-0">
						<p className="text-sm font-semibold hero-text truncate">{notification.name}</p>
						<p className="text-xs hero-text-muted truncate">{notification.action}</p>
						<p className="text-xs hero-text-subtle truncate">{notification.location} • agora</p>
					</div>
					<button
						type="button"
						onClick={dismissNotification}
						className="w-8 h-8 rounded-full hero-text-muted hover:hero-text flex items-center justify-center text-lg leading-none shrink-0"
						aria-label="Fechar notificação"
					>
						×
					</button>
				</div>
			</div>

			<div className={`fixed z-50 hidden lg:block ${getDesktopPositionClasses(position, visible)}`}>
				<div className="flex items-center gap-3 px-2 py-1 rounded-xl shadow-lg hero-card max-w-xs">
					<div className="w-10 h-10 rounded-full bg-linear-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold shrink-0">
						{notification.name.charAt(0)}
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-sm font-medium hero-text truncate">{notification.name}</p>
						<p className="text-xs hero-text-muted truncate">{notification.action}</p>
						<p className="text-xs hero-text-subtle truncate">{notification.location} • agora</p>
					</div>
				</div>
			</div>
		</>
	);
}
