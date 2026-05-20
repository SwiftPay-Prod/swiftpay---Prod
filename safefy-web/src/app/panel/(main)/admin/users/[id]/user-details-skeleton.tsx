'use client';

import { Button, Card, Skeleton, Separator } from '@heroui/react';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { useRouter } from 'next/navigation';
import { Routes } from '@/router/routes';

export function UserDetailsSkeleton() {
	const router = useRouter();

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col items-start md:flex-row md:items-center justify-between">
				<div className="flex items-center gap-4">
					<Button isIconOnly variant="tertiary" onPress={() => router.push(Routes.panel.admin.users)}>
						<Icon icon={ArrowLeft01Icon} className="icon-md" />
					</Button>
					<div>
						<Skeleton className="h-8 w-48 rounded-lg" />
						<Skeleton className="mt-2 h-4 w-56 rounded-lg" />
					</div>
				</div>
				<Skeleton className="mt-4 md:mt-0 h-10 w-24 rounded-lg" />
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i}>
						<Card.Header>
							<div className="flex items-center gap-2">
								<Skeleton className="size-5 rounded-md" />
								<Skeleton className="h-5 w-40 rounded-lg" />
							</div>
						</Card.Header>
						<Separator />
						<Card.Content className="flex flex-col gap-4">
							{Array.from({ length: 4 }).map((_, j) => (
								<div key={j} className="flex justify-between">
									<Skeleton className="h-4 w-24 rounded-lg" />
									<Skeleton className="h-4 w-32 rounded-lg" />
								</div>
							))}
						</Card.Content>
					</Card>
				))}
			</div>

			<Card>
				<Card.Header>
					<div className="flex items-center gap-2">
						<Skeleton className="size-5 rounded-md" />
						<Skeleton className="h-5 w-40 rounded-lg" />
					</div>
				</Card.Header>
				<Separator />
				<Card.Content>
					<div className="flex flex-col gap-3">
						<div className="grid grid-cols-3 gap-4 border-b border-border pb-2">
							<Skeleton className="h-4 w-24 rounded-lg" />
							<Skeleton className="h-4 w-24 rounded-lg" />
							<Skeleton className="h-4 w-24 rounded-lg" />
						</div>
						{Array.from({ length: 2 }).map((_, i) => (
							<div key={i} className="grid grid-cols-3 gap-4">
								<Skeleton className="h-4 w-32 rounded-lg" />
								<Skeleton className="h-4 w-28 rounded-lg" />
								<Skeleton className="h-4 w-24 rounded-lg" />
							</div>
						))}
					</div>
				</Card.Content>
			</Card>
		</div>
	);
}
