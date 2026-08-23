'use client';

import { Card, Skeleton, Separator } from '@heroui/react';

function FormFieldSkeleton() {
	return (
		<div className="flex flex-col gap-2">
			<Skeleton className="h-4 w-32 rounded" />
			<Skeleton className="h-10 w-full rounded" />
			<Skeleton className="h-3 w-48 rounded" />
		</div>
	);
}

function FormCardSkeleton({ fieldsCount = 2 }: { fieldsCount?: number }) {
	const colsClass = fieldsCount === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2';
	
	return (
		<Card>
			<Card.Header>
				<div className="flex items-center gap-2">
					<Skeleton className="size-6 rounded" />
					<div>
						<Skeleton className="h-5 w-48 rounded" />
						<Skeleton className="h-4 w-64 rounded mt-1" />
					</div>
				</div>
			</Card.Header>
			<Separator />
			<Card.Content className="flex flex-col gap-4">
				<div className={`grid grid-cols-1 gap-4 ${colsClass}`}>
					{[...Array(fieldsCount)].map((_, i) => (
						<FormFieldSkeleton key={i} />
					))}
				</div>
			</Card.Content>
		</Card>
	);
}

export function SettingsTabSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<FormCardSkeleton fieldsCount={2} />
			<FormCardSkeleton fieldsCount={3} />
			<FormCardSkeleton fieldsCount={3} />
			
			<Card>
				<Card.Header>
					<div className="flex items-center gap-2">
						<Skeleton className="size-6 rounded" />
						<div>
							<Skeleton className="h-5 w-48 rounded" />
							<Skeleton className="h-4 w-64 rounded mt-1" />
						</div>
					</div>
				</Card.Header>
				<Separator />
				<Card.Content className="flex flex-col gap-4">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<FormFieldSkeleton />
						<FormFieldSkeleton />
					</div>
					<Separator />
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<FormFieldSkeleton />
						<FormFieldSkeleton />
						<FormFieldSkeleton />
					</div>
				</Card.Content>
			</Card>

			<FormCardSkeleton fieldsCount={3} />

			<div className="flex items-center justify-between rounded-lg border border-default bg-card p-4">
				<div className="flex items-center gap-2">
					<Skeleton className="size-6 rounded" />
					<Skeleton className="h-4 w-80 rounded" />
				</div>
				<Skeleton className="h-10 w-40 rounded" />
			</div>
		</div>
	);
}
