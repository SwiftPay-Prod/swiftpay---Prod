'use client';

import type { ReactNode } from 'react';
import { Button, Tooltip, Skeleton } from '@heroui/react';

interface PageHeaderAction {
	label: string;
	icon?: ReactNode;
	onPress: () => void;
	isPending?: boolean;
	tooltip?: string;
	isDisabled?: boolean;
}

interface PageHeaderProps {
	icon: ReactNode;
	title: string;
	description: ReactNode;
	action?: PageHeaderAction;
	secondaryAction?: PageHeaderAction;
	tertiaryAction?: PageHeaderAction;
	actions?: ReactNode;
}

export function PageHeader({ icon, title, description, action, secondaryAction, tertiaryAction, actions }: PageHeaderProps) {
	return (
		<div className="flex flex-col gap-4 rounded-xl bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex items-start gap-3">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
					{icon}
				</div>
				<div>
					<h1 className="text-lg font-semibold text-foreground">{title}</h1>
					<div className="text-sm text-muted">{description}</div>
				</div>
			</div>
			{actions && (
				<div className="flex items-center gap-2">
					{actions}
				</div>
			)}
			{(action || secondaryAction || tertiaryAction) && (
				<div className="flex items-center gap-2">
					{tertiaryAction && (
						tertiaryAction.tooltip ? (
							<Tooltip>
								<Button variant="tertiary" onPress={tertiaryAction.onPress} isPending={tertiaryAction.isPending} isDisabled={tertiaryAction.isDisabled}>
									{tertiaryAction.icon}
									{tertiaryAction.label}
									<Tooltip.Content>{tertiaryAction.tooltip}</Tooltip.Content>
								</Button>
							</Tooltip>
						) : (
							<Button variant="tertiary" onPress={tertiaryAction.onPress} isPending={tertiaryAction.isPending} isDisabled={tertiaryAction.isDisabled}>
								{tertiaryAction.icon}
								{tertiaryAction.label}
							</Button>
						)
					)}
					{secondaryAction && (
						secondaryAction.tooltip ? (
							<Tooltip>
								<Button variant="secondary" onPress={secondaryAction.onPress} isPending={secondaryAction.isPending} isDisabled={secondaryAction.isDisabled}>
									{secondaryAction.icon}
									{secondaryAction.label}
									<Tooltip.Content>{secondaryAction.tooltip}</Tooltip.Content>
								</Button>
							</Tooltip>
						) : (
							<Button variant="secondary" onPress={secondaryAction.onPress} isPending={secondaryAction.isPending} isDisabled={secondaryAction.isDisabled}>
								{secondaryAction.icon}
								{secondaryAction.label}
							</Button>
						)
					)}
					{action && (
						action.tooltip ? (
							<Tooltip>
								<Button variant="primary" onPress={action.onPress} isPending={action.isPending} isDisabled={action.isDisabled}>
									{action.icon}
									{action.label}
									<Tooltip.Content>{action.tooltip}</Tooltip.Content>
								</Button>
							</Tooltip>
						) : (
							<Button variant="primary" onPress={action.onPress} isPending={action.isPending} isDisabled={action.isDisabled}>
								{action.icon}
								{action.label}
							</Button>
						)
					)}
				</div>
			)}
		</div>
	);
}

interface PageHeaderSkeletonProps {
	hasAction?: boolean;
	hasPrimaryAction?: boolean;
	hasSecondaryAction?: boolean;
	hasTertiaryAction?: boolean;
}

export function PageHeaderSkeleton({
	hasAction,
	hasPrimaryAction,
	hasSecondaryAction,
	hasTertiaryAction,
}: PageHeaderSkeletonProps) {
	return (
		<div className="flex flex-col gap-4 rounded-xl bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex items-center gap-3">
				<Skeleton className="h-10 w-10 rounded-lg" />
				<div className="flex flex-col gap-1">
					<Skeleton className="h-5 w-32 rounded-md" />
					<Skeleton className="h-4 w-48 rounded-md" />
				</div>
			</div>
			{(hasAction || hasPrimaryAction || hasSecondaryAction || hasTertiaryAction) && (
				<div className="flex items-center gap-2">
					{hasTertiaryAction && <Skeleton className="h-10 w-24 rounded-lg" />}
					{hasSecondaryAction && <Skeleton className="h-10 w-28 rounded-lg" />}
					{(hasAction || hasPrimaryAction) && <Skeleton className="h-10 w-32 rounded-lg" />}
				</div>
			)}
		</div>
	);
}

