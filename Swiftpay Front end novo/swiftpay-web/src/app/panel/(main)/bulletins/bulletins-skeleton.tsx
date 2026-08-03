'use client';

import { Button, Card, Skeleton } from '@heroui/react';
import { ArrowReloadHorizontalIcon, News01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';

export function BulletinsSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={News01Icon} className="icon-lg text-muted" />}
				title="Informativos"
				description="Veja os informativos e novidades da plataforma."
				actions={
					<Button variant="secondary" isDisabled>
						<Icon icon={ArrowReloadHorizontalIcon} className="icon-sm" />
						Atualizar
					</Button>
				}
			/>

			<Card className="p-0">
				<div className="flex flex-col">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="flex items-center gap-3 px-4 py-4 border-b border-divider last:border-b-0">
							<Skeleton className="size-10 rounded-lg shrink-0" />
							<div className="flex flex-col gap-2 flex-1">
								<Skeleton className="h-4 w-3/4 rounded-lg" />
								<Skeleton className="h-3 w-1/4 rounded-lg" />
							</div>
						</div>
					))}
				</div>
			</Card>
		</div>
	);
}

