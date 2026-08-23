'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
	return (
		<div className="flex flex-col gap-6 animate-pulse">
			{/* Executive Toolbar Skeleton */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
				<div className="flex flex-col gap-1.5">
					<Skeleton className="h-6 w-36 rounded-lg bg-white/5" />
					<Skeleton className="h-3.5 w-64 rounded-md bg-white/5" />
				</div>
				<div className="flex items-center gap-2">
					<Skeleton className="h-9 w-72 rounded-full bg-white/5" />
					<Skeleton className="h-8 w-8 rounded-full bg-white/5" />
				</div>
			</div>

			{/* Hero Balance Card Skeleton */}
			<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-6 sm:p-7 flex flex-col gap-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2.5">
						<Skeleton className="h-8 w-8 rounded-xl bg-white/5" />
						<Skeleton className="h-4 w-28 rounded-md bg-white/5" />
					</div>
					<Skeleton className="h-6 w-24 rounded-full bg-white/5" />
				</div>

				<div className="flex flex-col gap-2">
					<Skeleton className="h-10 sm:h-12 w-64 rounded-xl bg-white/5" />
					<div className="flex items-center gap-3">
						<Skeleton className="h-4 w-32 rounded-md bg-white/5" />
						<Skeleton className="h-4 w-32 rounded-md bg-white/5" />
					</div>
				</div>

				<div className="flex flex-wrap gap-2.5 pt-1">
					<Skeleton className="h-10 w-36 rounded-full bg-white/10" />
					<Skeleton className="h-10 w-36 rounded-full bg-white/5" />
					<Skeleton className="h-10 w-36 rounded-full bg-white/5" />
				</div>
			</div>

			{/* 3-Column Financial Metrics Grid Skeleton */}
			<div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
				{[...Array(3)].map((_, i) => (
					<div key={i} className="rounded-[20px] border border-white/12 bg-[#16181a] p-5 sm:p-6 flex flex-col justify-between gap-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Skeleton className="h-7 w-7 rounded-lg bg-white/5" />
								<Skeleton className="h-3.5 w-24 rounded-md bg-white/5" />
							</div>
							<Skeleton className="h-5 w-14 rounded-full bg-white/5" />
						</div>
						<div className="flex flex-col gap-1.5">
							<Skeleton className="h-7 sm:h-8 w-36 rounded-lg bg-white/5" />
							<Skeleton className="h-3 w-48 rounded-md bg-white/5" />
						</div>
					</div>
				))}
			</div>

			{/* Bespoke Analytics & Core Operations Grid */}
			<div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
				{/* Chart + Payment Breakdown Column */}
				<div className="lg:col-span-2 flex flex-col gap-5">
					<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-6 sm:p-7 flex flex-col gap-5">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<Skeleton className="h-9 w-9 rounded-2xl bg-white/5" />
								<Skeleton className="h-5 w-44 rounded-md bg-white/5" />
							</div>
							<Skeleton className="h-8 w-56 rounded-full bg-white/5" />
						</div>
						<Skeleton className="h-56 w-full rounded-2xl bg-white/5" />
					</div>

					<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-6 sm:p-7 flex flex-col gap-4">
						<Skeleton className="h-5 w-48 rounded-md bg-white/5" />
						<div className="flex flex-col gap-3">
							{[...Array(3)].map((_, i) => (
								<div key={i} className="rounded-[18px] border border-white/8 bg-[#0a0a0a] p-4 flex flex-col gap-2">
									<div className="flex items-center justify-between">
										<Skeleton className="h-8 w-36 rounded-md bg-white/5" />
										<Skeleton className="h-6 w-24 rounded-md bg-white/5" />
									</div>
									<Skeleton className="h-1.5 w-full rounded-full bg-white/5" />
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Risk & Quick Actions Column */}
				<div className="lg:col-span-1 flex flex-col gap-5">
					<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-6 sm:p-7 flex flex-col gap-4">
						<div className="flex items-center justify-between">
							<Skeleton className="h-5 w-44 rounded-md bg-white/5" />
							<Skeleton className="h-5 w-24 rounded-full bg-white/5" />
						</div>
						<div className="grid grid-cols-2 gap-3">
							{[...Array(4)].map((_, i) => (
								<div key={i} className="rounded-[18px] border border-white/8 bg-[#0a0a0a] p-4 flex flex-col gap-2">
									<Skeleton className="h-3 w-16 rounded-md bg-white/5" />
									<Skeleton className="h-6 w-20 rounded-md bg-white/5" />
								</div>
							))}
						</div>
					</div>

					<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-6 sm:p-7 flex flex-col gap-4">
						<Skeleton className="h-5 w-32 rounded-md bg-white/5" />
						<div className="flex flex-col gap-2">
							{[...Array(3)].map((_, i) => (
								<Skeleton key={i} className="h-12 w-full rounded-[16px] bg-white/5" />
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
