'use client';

import { useEffect, useState, type ReactNode } from 'react';

interface MobileBottomSheetProps {
	isOpen: boolean;
	onClose: () => void;
	onClosed?: () => void;
	title?: ReactNode;
	subtitle?: ReactNode;
	children: ReactNode;
}

export function MobileBottomSheet({ isOpen, onClose, onClosed, title, subtitle, children }: MobileBottomSheetProps) {
	const [isMounted, setIsMounted] = useState(isOpen);
	const [isVisible, setIsVisible] = useState(isOpen);
	const resolvedTitle = title ?? 'Ações';

	useEffect(() => {
		if (isOpen) {
			Promise.resolve().then(() => setIsMounted(true));
			const frame = requestAnimationFrame(() => {
				setIsVisible(true);
			});
			return () => cancelAnimationFrame(frame);
		}

		const frame = requestAnimationFrame(() => setIsVisible(false));
		const timeout = setTimeout(() => {
			setIsMounted(false);
			onClosed?.();
		}, 220);
		return () => {
			cancelAnimationFrame(frame);
			clearTimeout(timeout);
		};
	}, [isOpen, onClosed]);

	if (!isMounted) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-200 md:hidden" aria-hidden={!isVisible}>
			<button
				type="button"
				className={`absolute inset-0 bg-overlay/50 transition-opacity duration-200 ${
					isVisible ? 'opacity-100' : 'opacity-0'
				}`}
				onClick={onClose}
			/>
			<div
				className={`absolute inset-x-0 bottom-0 rounded-t-3xl border border-border bg-surface p-4 transition-transform duration-200 ease-out ${
					isVisible ? 'translate-y-0' : 'translate-y-full'
				}`}
			>
				<div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-surface-deep" />
				{(resolvedTitle || subtitle) && (
					<div className="mb-3">
						{resolvedTitle ? <div className="text-sm font-semibold truncate">{resolvedTitle}</div> : null}
						{subtitle ? <div className="text-xs text-muted truncate">{subtitle}</div> : null}
					</div>
				)}
				<div className="flex flex-col gap-2">{children}</div>
			</div>
		</div>
	);
}
