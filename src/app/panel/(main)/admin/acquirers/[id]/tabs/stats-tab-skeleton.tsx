'use client';

import { Card, Skeleton, Separator } from '@heroui/react';

function KpiCardSkeleton() {
	return (
		<Card>
			<Card.Content className="flex flex-col gap-1 p-3">
				<div className="flex items-center gap-1.5">
					<Skeleton className="size-4 rounded" />
					<Skeleton className="h-3 w-16 rounded" />
				</div>
				<Skeleton className="h-5 w-20 rounded" />
			</Card.Content>
		</Card>
	);
}

function ChartCardSkeleton() {
	return (
		<Card>
			<Card.Header className="px-4 pt-3">
				<div className="flex items-center gap-2">
					<Skeleton className="size-4 rounded" />
					<Skeleton className="h-4 w-24 rounded" />
				</div>
				<Skeleton className="mt-1 h-3 w-16 rounded" />
			</Card.Header>
			<Card.Content className="px-4 pb-3">
				<Skeleton className="h-32 w-full rounded" />
			</Card.Content>
		</Card>
	);
}

export function StatsTabSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<KpiCardSkeleton />
				<KpiCardSkeleton />
				<KpiCardSkeleton />
				<KpiCardSkeleton />
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<ChartCardSkeleton />
				<ChartCardSkeleton />
				<ChartCardSkeleton />
			</div>

			<Card>
				<Card.Header>
					<div className="flex items-center gap-2">
						<Skeleton className="size-6 rounded" />
						<Skeleton className="h-6 w-40 rounded" />
					</div>
				</Card.Header>
				<Separator />
				<Card.Content>
					<div className="grid gap-6 md:grid-cols-4">
						{[...Array(4)].map((_, i) => (
							<div key={i} className="flex items-center gap-3">
								<Skeleton className="size-10 rounded-xl" />
								<div>
									<Skeleton className="h-4 w-20 rounded" />
									<Skeleton className="mt-1 h-6 w-24 rounded" />
								</div>
							</div>
						))}
					</div>
				</Card.Content>
			</Card>

			<Card>
				<Card.Header>
					<div className="flex items-center gap-2">
						<Skeleton className="size-6 rounded" />
						<Skeleton className="h-6 w-40 rounded" />
					</div>
				</Card.Header>
				<Separator />
				<Card.Content>
					<div className="grid gap-6 md:grid-cols-3">
						{[...Array(3)].map((_, i) => (
							<div key={i}>
								<Skeleton className="h-4 w-20 rounded" />
								<Skeleton className="mt-1 h-8 w-32 rounded" />
							</div>
						))}
					</div>
				</Card.Content>
			</Card>

			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<Card.Header>
						<div className="flex items-center gap-2">
							<Skeleton className="size-6 rounded" />
							<Skeleton className="h-6 w-40 rounded" />
						</div>
					</Card.Header>
					<Separator />
					<Card.Content className="space-y-4">
						{[...Array(3)].map((_, i) => (
							<div key={i}>
								<div className="flex items-center justify-between">
									<div>
										<Skeleton className="h-4 w-32 rounded" />
										<Skeleton className="mt-1 h-6 w-24 rounded" />
									</div>
									<Skeleton className="h-6 w-32 rounded-full" />
								</div>
								{i < 2 && <Separator className="mt-4" />}
							</div>
						))}
					</Card.Content>
				</Card>

				<Card>
					<Card.Header>
						<div className="flex items-center gap-2">
							<Skeleton className="size-6 rounded" />
							<Skeleton className="h-6 w-36 rounded" />
						</div>
					</Card.Header>
					<Separator />
					<Card.Content className="space-y-4">
						{[...Array(4)].map((_, i) => (
							<div key={i}>
								<div className="flex items-center justify-between">
									<div>
										<Skeleton className="h-4 w-32 rounded" />
										<Skeleton className="mt-1 h-6 w-24 rounded" />
									</div>
									{i === 0 && (
										<div className="text-right">
											<Skeleton className="h-4 w-16 rounded" />
											<Skeleton className="mt-1 h-6 w-20 rounded" />
										</div>
									)}
								</div>
								{i < 3 && <Separator className="mt-4" />}
							</div>
						))}
					</Card.Content>
				</Card>
			</div>
		</div>
	);
}
