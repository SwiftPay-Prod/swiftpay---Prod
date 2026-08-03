'use client';

import { Icon } from '@/components/icon';
import { Clock01Icon } from '@hugeicons/core-free-icons';
import { useState, useEffect, useCallback } from 'react';

interface TimerBarProps {
	initialMinutes?: number;
	primaryColor: string;
	secondaryColor: string | null;
	timerText?: string | null;
	timerExpiredText?: string | null;
}

export function TimerBar({ initialMinutes = 10, primaryColor, secondaryColor, timerText, timerExpiredText }: TimerBarProps) {
	const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);

	useEffect(() => {
		const timer = setInterval(() => {
			setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
		}, 1000);
		return () => clearInterval(timer);
	}, []);

	const formatTime = useCallback((seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}, []);

	const gradientStyle = secondaryColor ? `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` : primaryColor;

	const displayText = timerText || 'Oferta especial expira em';
	const expiredText = timerExpiredText || 'Oferta expirada!';
	const isExpired = timeLeft === 0;

	return (
		<div className="sticky top-0 z-50 text-white shadow-lg/15" style={{ background: gradientStyle }}>
			<div className="max-w-6xl mx-auto px-4 py-3">
				<div className="flex items-center justify-center gap-1">
					<Icon icon={Clock01Icon} className="icon-xs animate-pulse" />
					{isExpired ? (
						<span className="animate-pulse font-semibold text-sm">{expiredText}</span>
					) : (
						<>
							<span className="animate-pulse pe-2 text-sm sm:text-sm italic">{displayText}:</span>
							<span className="font-semibold text-sm px-2 py-0.5 rounded bg-white/20">{formatTime(timeLeft)}</span>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
