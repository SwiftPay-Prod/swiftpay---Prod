'use client';

import type { ReactNode } from 'react';
import { Skeleton } from '@heroui/react';
import { ArrowDown01Icon, ArrowUp01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';

interface ExpandableListProps<T> {
	items: T[];
	getKey: (item: T) => string;
	getTitle: (item: T) => ReactNode;
	getSubtitle?: (item: T) => ReactNode;
	renderLeading?: (item: T) => ReactNode;
	renderTrailing?: (item: T) => ReactNode;
	renderContent: (item: T) => ReactNode;
	renderFooter?: (item: T) => ReactNode;
	expandedKey: string | null;
	onToggle: (key: string) => void;
	empty: ReactNode;
	className?: string;
}

export function ExpandableList<T>({
	items,
	getKey,
	getTitle,
	getSubtitle,
	renderLeading,
	renderTrailing,
	renderContent,
	renderFooter,
	expandedKey,
	onToggle,
	empty,
	className,
}: ExpandableListProps<T>) {
	const safeItems = Array.isArray(items) ? items : [];

	if (safeItems.length === 0) return <>{empty}</>;

	return (
		<div className={`flex flex-col gap-2 ${className ?? ''}`}>
			{safeItems.map((item) => {
				const key = getKey(item);
				const isExpanded = expandedKey === key;

				return (
					<div key={key} className="rounded-xl border border-border overflow-hidden bg-surface">
						<button
							type="button"
							onClick={() => onToggle(key)}
							className="flex items-center justify-between w-full px-4 py-3 hover:bg-surface-secondary transition-colors text-left cursor-pointer"
						>
							<div className="flex items-center gap-3 min-w-0 flex-1">
								{renderLeading && (
									<div className="shrink-0">{renderLeading(item)}</div>
								)}
								<div className="flex flex-col gap-1 min-w-0">
									<span className="font-medium text-foreground truncate">{getTitle(item)}</span>
									{getSubtitle && (
										<span className="text-xs text-muted truncate">{getSubtitle(item)}</span>
									)}
								</div>
							</div>
							<div className="flex items-center gap-2">
								{renderTrailing && <div className="flex items-center gap-2">{renderTrailing(item)}</div>}
								<Icon
									icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon}
									className="icon-sm text-muted shrink-0"
								/>
							</div>
						</button>

						{isExpanded && (
							<div className="px-4 py-4 border-t border-border bg-surface-secondary">
								{renderContent(item)}
							</div>
						)}

						{renderFooter && (
							<div className="px-4 py-3 border-t border-border">
								{renderFooter(item)}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}

export function ExpandableListSkeleton({ rows = 3 }: { rows?: number }) {
	return (
		<div className="flex flex-col gap-2">
			{Array.from({ length: rows }).map((_, index) => (
				<div key={index} className="rounded-xl border border-border overflow-hidden bg-surface p-4">
					<div className="flex items-center gap-3">
						<Skeleton className="size-10 rounded-lg shrink-0" />
						<div className="flex flex-col gap-2 flex-1">
							<Skeleton className="h-4 w-1/2 rounded-lg" />
							<Skeleton className="h-3 w-1/4 rounded-lg" />
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

interface ExpandableListContentSkeletonProps {
	lines?: number;
	showReactions?: boolean;
}

export function ExpandableListContentSkeleton({ lines = 3, showReactions = false }: ExpandableListContentSkeletonProps) {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				{Array.from({ length: lines }).map((_, index) => (
					<Skeleton
						key={index}
						className={`h-4 rounded-lg ${index === lines - 1 ? 'w-1/2' : index === lines - 2 ? 'w-3/4' : 'w-full'}`}
					/>
				))}
			</div>
			{showReactions && (
				<div className="border-t border-border pt-4">
					<Skeleton className="h-8 w-8 rounded-lg" />
				</div>
			)}
		</div>
	);
}

