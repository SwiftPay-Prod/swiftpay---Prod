'use client';

import { Button, Card, Skeleton, Separator } from '@heroui/react';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { useRouter } from 'next/navigation';
import { Routes } from '@/router/routes';

interface MerchantEvaluateSkeletonProps {
	merchantId: string;
}

export function MerchantEvaluateSkeleton({ merchantId }: MerchantEvaluateSkeletonProps) {
	const router = useRouter();

	return (
		<div className="flex h-full flex-col gap-4">
			<div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
				<div className="flex items-center gap-4">
					<Button isIconOnly variant="tertiary" onPress={() => router.push(Routes.panel.admin.merchantDetails(merchantId))}>
						<Icon icon={ArrowLeft01Icon} className="icon-md" />
					</Button>
					<div>
						<Skeleton className="h-8 w-48 rounded-lg" />
						<Skeleton className="mt-2 h-4 w-56 rounded-lg" />
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Skeleton className="h-6 w-20 rounded-full" />
					<Skeleton className="h-6 w-24 rounded-full" />
				</div>
			</div>

			<div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
				<div className="flex flex-col gap-6 lg:col-span-2">
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
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									{Array.from({ length: 4 }).map((_, j) => (
										<div key={j} className="flex flex-col gap-1">
											<Skeleton className="h-3 w-24 rounded-lg" />
											<Skeleton className="h-5 w-40 rounded-lg" />
										</div>
									))}
								</div>
							</Card.Content>
						</Card>
					))}
				</div>

				<div className="sticky top-22 flex flex-col gap-6">
					<Card>
						<Card.Header>
							<Skeleton className="h-5 w-24 rounded-lg" />
						</Card.Header>
						<Separator />
						<Card.Content className="flex flex-col gap-4">
							{Array.from({ length: 3 }).map((_, i) => (
								<Skeleton key={i} className="h-10 w-full rounded-lg" />
							))}
						</Card.Content>
					</Card>
				</div>
			</div>
		</div>
	);
}
