'use client';

import { Skeleton } from '@heroui/react';

export function LedgerTimelineSkeleton() {
	return (
		<div className="flex flex-col gap-5">
			<div className="grid grid-cols-3 gap-3 rounded-lg border border-foreground/10 bg-surface p-4">
				{[...Array(3)].map((_, i) => (
					<div key={i} className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<Skeleton className="size-4 rounded" />
							<Skeleton className="h-3 w-24 rounded" />
						</div>
						<Skeleton className="h-5 w-20 rounded" />
					</div>
				))}
			</div>

			<div className="relative">
				<div className="absolute left-5 top-0 bottom-0 w-px bg-foreground/10" />

				<div className="flex flex-col gap-6">
					{[...Array(2)].map((_, txIndex) => (
						<div key={txIndex} className="relative pl-12">
							<Skeleton className="absolute left-3 top-0 size-5 rounded-full" />

							<div className="rounded-lg border border-foreground/10 bg-surface overflow-hidden">
								<div className="flex items-center justify-between gap-3 border-b border-foreground/5 bg-foreground/2 px-4 py-3">
									<div className="flex flex-col gap-0.5">
										<Skeleton className="h-4 w-40 rounded" />
										<Skeleton className="h-3 w-56 rounded" />
									</div>
									<Skeleton className="h-3 w-28 rounded" />
								</div>

								<div className="divide-y divide-foreground/5">
									{[...Array(txIndex === 0 ? 2 : 3)].map((_, entryIndex) => (
										<div
											key={entryIndex}
											className="flex items-center justify-between gap-3 px-4 py-2.5"
										>
											<div className="flex items-center gap-3 min-w-0">
												<Skeleton className="h-2 w-2 rounded-full" />
												<div className="flex flex-col gap-0.5 min-w-0">
													<Skeleton className="h-4 w-48 rounded" />
													<Skeleton className="h-5 w-20 rounded" />
												</div>
											</div>
											<Skeleton className="h-4 w-24 rounded" />
										</div>
									))}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
