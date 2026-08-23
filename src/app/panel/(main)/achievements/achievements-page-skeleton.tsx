'use client';

import { Skeleton, Tabs } from '@heroui/react';
import { StarAward02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';

export function AchievementsPageSkeleton() {
	return (
		<div className="flex flex-col gap-6 text-white">
			<div className="flex items-center justify-between border-b border-white/10 pb-5">
				<div className="flex items-center gap-2">
					<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-link border border-brand/25">
						<Icon icon={StarAward02Icon} className="icon-sm text-link" />
					</div>
					<h1 className="text-xl font-bold tracking-tight text-white">Conquistas</h1>
				</div>
			</div>
			<div className="rounded-[20px] border border-white/12 bg-card p-5">
				<div className="flex items-center gap-4">
					<Skeleton className="w-16 h-16 rounded-full bg-white/10 shrink-0" />
					<div className="flex flex-col gap-2 flex-1 min-w-0">
						<Skeleton className="h-5 w-32 rounded bg-white/10" />
						<Skeleton className="h-2 w-full rounded-full bg-white/5" />
						<Skeleton className="h-4 w-48 rounded bg-white/5" />
					</div>
				</div>
			</div>
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
