'use client';

import { Skeleton } from '@heroui/react';
import { News01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';

export function BulletinsSkeleton() {
	return (
		<div className="flex flex-col gap-6 text-white">
			<div className="flex items-center justify-between border-b border-white/10 pb-5">
				<div className="flex items-center gap-2">
					<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
						<Icon icon={News01Icon} className="icon-sm text-[#4f55f1]" />
					</div>
					<h1 className="text-xl font-bold tracking-tight text-white">Informativos</h1>
				</div>
			</div>

			<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-0 overflow-hidden">
				<div className="flex flex-col">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="flex items-center gap-3 px-4 py-4 border-b border-white/8 last:border-b-0">
							<Skeleton className="size-10 rounded-lg bg-white/5 shrink-0" />
							<div className="flex flex-col gap-2 flex-1">
								<Skeleton className="h-4 w-3/4 rounded bg-white/10" />
								<Skeleton className="h-3 w-1/4 rounded bg-white/5" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

