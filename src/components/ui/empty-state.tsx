'use client';

import type { ReactNode } from 'react';
import { cn } from '@/utils/utils';

interface EmptyStateProps {
	children: ReactNode;
	className?: string;
}

interface EmptyStateIndicatorProps {
	children: ReactNode;
	className?: string;
}

interface EmptyStateHeadingProps {
	children: ReactNode;
	className?: string;
}

interface EmptyStateDescriptionProps {
	children: ReactNode;
	className?: string;
}

interface EmptyStateActionProps {
	children: ReactNode;
	className?: string;
}

function EmptyStateRoot({ children, className }: EmptyStateProps) {
	return (
		<div
			className={cn(
				'flex flex-col items-center justify-center rounded-lg border border-border/80 bg-card p-6 text-center shadow-2xs',
				className
			)}
		>
			{children}
		</div>
	);
}

function EmptyStateIndicator({ children, className }: EmptyStateIndicatorProps) {
	return (
		<div className={cn('mb-3 flex size-10 items-center justify-center rounded-full bg-surface border border-border/80 text-muted-foreground', className)}>
			{children}
		</div>
	);
}

function EmptyStateHeading({ children, className }: EmptyStateHeadingProps) {
	return <h4 className={cn('mb-0.5 text-xs font-semibold text-foreground tracking-tight', className)}>{children}</h4>;
}

function EmptyStateDescription({ children, className }: EmptyStateDescriptionProps) {
	return <p className={cn('mb-3 max-w-xs text-xs text-muted-foreground', className)}>{children}</p>;
}

function EmptyStateAction({ children, className }: EmptyStateActionProps) {
	return <div className={cn('flex items-center gap-2', className)}>{children}</div>;
}

export const EmptyState = Object.assign(EmptyStateRoot, {
	Indicator: EmptyStateIndicator,
	Heading: EmptyStateHeading,
	Description: EmptyStateDescription,
	Action: EmptyStateAction,
});

export {
	EmptyStateIndicator,
	EmptyStateHeading,
	EmptyStateDescription,
	EmptyStateAction,
};

