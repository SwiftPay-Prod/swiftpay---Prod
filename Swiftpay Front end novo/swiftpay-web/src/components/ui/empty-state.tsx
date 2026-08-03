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
				'flex flex-col items-center justify-center rounded-xl border border-dashed border-muted bg-surface/50 p-8 text-center',
				className
			)}
		>
			{children}
		</div>
	);
}

function EmptyStateIndicator({ children, className }: EmptyStateIndicatorProps) {
	return (
		<div className={cn('mb-4 flex size-14 items-center justify-center rounded-full bg-muted/20 text-muted', className)}>
			{children}
		</div>
	);
}

function EmptyStateHeading({ children, className }: EmptyStateHeadingProps) {
	return <h4 className={cn('mb-1 text-base font-semibold text-foreground', className)}>{children}</h4>;
}

function EmptyStateDescription({ children, className }: EmptyStateDescriptionProps) {
	return <p className={cn('mb-4 max-w-sm text-sm text-muted', className)}>{children}</p>;
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

