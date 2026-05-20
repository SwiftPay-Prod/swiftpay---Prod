'use client';

import type { ReactNode } from 'react';

interface InlineListProps<T> {
	items: T[];
	getKey: (item: T) => string;
	getTitle: (item: T) => ReactNode;
	getSubtitle?: (item: T) => ReactNode;
	renderLeading?: (item: T) => ReactNode;
	renderTrailing?: (item: T) => ReactNode;
	renderActions?: (item: T) => ReactNode;
	empty: ReactNode;
	className?: string;
}

export function InlineList<T>({
	items,
	getKey,
	getTitle,
	getSubtitle,
	renderLeading,
	renderTrailing,
	renderActions,
	empty,
	className,
}: InlineListProps<T>) {
	// Defensive check: ensure items is an array
	const safeItems = Array.isArray(items) ? items : [];

	if (safeItems.length === 0) return <>{empty}</>;

	return (
		<div className={`rounded-xl border border-divider overflow-hidden ${className ?? ''}`}>
			{safeItems.map((item, index) => (
				<div
					key={getKey(item)}
					className={`px-4 py-3 ${index % 2 === 0 ? 'bg-surface-secondary' : 'bg-surface-tertiary'} transition-colors`}
				>
					<div className="flex items-center justify-between gap-3">
						<div className="flex items-center gap-3 min-w-0">
							{renderLeading && <div className="shrink-0">{renderLeading(item)}</div>}
							<div className="flex flex-col min-w-0">
								<span className="font-semibold text-foreground truncate">{getTitle(item)}</span>
								{getSubtitle && (
									<span className="text-xs text-muted truncate">{getSubtitle(item)}</span>
								)}
							</div>
						</div>
						<div className="flex items-center gap-2">
							{renderTrailing && <div className="flex items-center gap-3">{renderTrailing(item)}</div>}
							{renderActions && <div className="flex items-center gap-1">{renderActions(item)}</div>}
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

