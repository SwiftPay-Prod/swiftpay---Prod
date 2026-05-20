'use client';

import { Skeleton, Card, Tabs } from '@heroui/react';
import { ChampionIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';

export function AchievementsPageSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={ChampionIcon} size={24} />}
				title="Conquistas"
				description="Seus emblemas, dinastias e progresso de nível."
			/>

			<Card>
				<Card.Content className="flex items-center gap-4 p-4">
					<Skeleton className="w-16 h-16 rounded-full shrink-0" />
					<div className="flex flex-col gap-2 flex-1 min-w-0">
						<Skeleton className="h-5 w-32 rounded-lg" />
						<Skeleton className="h-2 w-full rounded-full" />
						<Skeleton className="h-4 w-48 rounded-lg" />
					</div>
				</Card.Content>
			</Card>

			<Tabs selectedKey="achievements">
				<Tabs.ListContainer>
					<Tabs.List aria-label="Abas de conquistas">
						<Tabs.Tab id="achievements">
							<Skeleton className="h-4 w-20 rounded-lg" />
							<Tabs.Indicator />
						</Tabs.Tab>
						<Tabs.Tab id="borders">
							<Skeleton className="h-4 w-20 rounded-lg" />
							<Tabs.Indicator />
						</Tabs.Tab>
					</Tabs.List>
				</Tabs.ListContainer>
				<Tabs.Panel id="achievements" className="p-0 pt-4">
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
						{Array.from({ length: 10 }).map((_, i) => (
							<Skeleton key={i} className="h-36 rounded-xl" />
						))}
					</div>
				</Tabs.Panel>
			</Tabs>
		</div>
	);
}
