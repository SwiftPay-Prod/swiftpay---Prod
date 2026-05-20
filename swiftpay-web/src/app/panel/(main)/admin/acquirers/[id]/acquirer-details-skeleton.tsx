'use client';

import { Button, Card, Skeleton, Separator, Tabs } from '@heroui/react';
import { AnalyticsUpIcon, ArrowLeft01Icon, Building02Icon, Settings02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { useRouter } from 'next/navigation';
import { Routes } from '@/router/routes';

export function AcquirerDetailsSkeleton() {
	const router = useRouter();

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
				<div className="flex items-center gap-4">
					<Button isIconOnly variant="tertiary" onPress={() => router.push(Routes.panel.admin.acquirers)}>
						<Icon icon={ArrowLeft01Icon} className="icon-md" />
					</Button>
					<div className="flex items-center gap-3">
						<Skeleton className="size-12 rounded-xl" />
						<div>
							<Skeleton className="h-8 w-40 rounded-lg" />
							<Skeleton className="mt-2 h-4 w-24 rounded-lg" />
						</div>
					</div>
				</div>
			</div>

			<Tabs selectedKey="general">
				<Tabs.ListContainer>
					<Tabs.List aria-label="Abas de detalhes da processadora">
						<Tabs.Tab id="general">
							<div className="flex items-center gap-2">
								<Icon icon={Building02Icon} className="icon-sm" />
								<span>Geral</span>
							</div>
							<Tabs.Indicator />
						</Tabs.Tab>
						<Tabs.Tab id="stats">
							<div className="flex items-center gap-2">
								<Icon icon={AnalyticsUpIcon} className="icon-sm" />
								<span>Estatísticas</span>
							</div>
							<Tabs.Indicator />
						</Tabs.Tab>
						<Tabs.Tab id="config">
							<div className="flex items-center gap-2">
								<Icon icon={Settings02Icon} className="icon-sm" />
								<span>Configurações</span>
							</div>
							<Tabs.Indicator />
						</Tabs.Tab>
					</Tabs.List>
				</Tabs.ListContainer>
				<Tabs.Panel id="general" className="p-0">
					<div className="pt-4 flex flex-col gap-6">
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
												<Skeleton className="h-4 w-28 rounded-lg" />
												<Skeleton className="h-4 w-36 rounded-lg" />
											</div>
										))}
									</Card.Content>
								</Card>
							))}
						</div>
					</div>
				</Tabs.Panel>
			</Tabs>
		</div>
	);
}
