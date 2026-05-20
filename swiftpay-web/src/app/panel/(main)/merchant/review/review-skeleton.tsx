'use client';

import { Card, Skeleton } from '@heroui/react';

export function ReviewSkeleton() {
	return (
		<div className="space-y-4 sm:space-y-6">
			<Card>
				<Card.Content className="p-4 sm:p-6">
					<div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<Skeleton className="h-8 w-48 rounded-lg" />
							<Skeleton className="mt-2 h-4 w-64 rounded-lg" />
						</div>
						<Skeleton className="h-8 w-28 rounded-lg" />
					</div>
					<Skeleton className="h-24 w-full rounded-lg" />
				</Card.Content>
			</Card>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 sm:gap-6">
				{Array.from({ length: 2 }).map((_, i) => (
					<Card key={i}>
						<Card.Header>
							<Skeleton className="h-5 w-40 rounded-lg" />
						</Card.Header>
						<Card.Content className="space-y-3 sm:space-y-4">
							{Array.from({ length: 3 }).map((_, j) => (
								<div key={j} className="flex items-center gap-3">
									<Skeleton className="size-5 rounded-md" />
									<div className="flex flex-col gap-1">
										<Skeleton className="h-3 w-20 rounded-lg" />
										<Skeleton className="h-4 w-32 rounded-lg" />
									</div>
								</div>
							))}
						</Card.Content>
					</Card>
				))}
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 sm:gap-6">
				{Array.from({ length: 2 }).map((_, i) => (
					<Card key={i}>
						<Card.Header>
							<Skeleton className="h-5 w-40 rounded-lg" />
						</Card.Header>
						<Card.Content className="space-y-3 sm:space-y-4">
							{Array.from({ length: 4 }).map((_, j) => (
								<div key={j} className="flex items-center gap-3">
									<Skeleton className="size-5 rounded-md" />
									<div className="flex flex-col gap-1">
										<Skeleton className="h-3 w-24 rounded-lg" />
										<Skeleton className="h-4 w-40 rounded-lg" />
									</div>
								</div>
							))}
						</Card.Content>
					</Card>
				))}
			</div>

			<Card>
				<Card.Header>
					<Skeleton className="h-5 w-48 rounded-lg" />
				</Card.Header>
				<Card.Content className="space-y-2 sm:space-y-3">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="flex items-center gap-3 rounded-lg border border-default p-3">
							<Skeleton className="size-10 rounded-lg" />
							<div className="flex flex-col gap-1">
								<Skeleton className="h-4 w-40 rounded-lg" />
								<Skeleton className="h-3 w-24 rounded-lg" />
							</div>
						</div>
					))}
				</Card.Content>
			</Card>

			<div className="flex justify-center">
				<Skeleton className="h-10 w-40 rounded-lg" />
			</div>
		</div>
	);
}

