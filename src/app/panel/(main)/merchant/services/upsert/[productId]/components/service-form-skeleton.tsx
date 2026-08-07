import { Card, Skeleton } from '@heroui/react';

function SectionSkeleton({ lines = 2, hasHeader = true }: { lines?: number; hasHeader?: boolean }) {
	return (
		<Card>
			<div className="flex flex-col gap-6">
				{hasHeader && (
					<div className="flex items-center gap-3">
						<Skeleton className="w-8 h-8 rounded-lg" />
						<div className="flex flex-col gap-1">
							<Skeleton className="w-32 h-4 rounded" />
							<Skeleton className="w-48 h-3 rounded" />
						</div>
					</div>
				)}
				{Array.from({ length: lines }).map((_, i) => (
					<Skeleton key={i} className="w-full h-10 rounded-lg" />
				))}
			</div>
		</Card>
	);
}

export function ServiceFormSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			{/* Header Skeleton */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Skeleton className="w-10 h-10 rounded-xl" />
					<div className="flex flex-col gap-1">
						<Skeleton className="w-48 h-6 rounded" />
						<Skeleton className="w-64 h-4 rounded" />
					</div>
				</div>
				<Skeleton className="w-36 h-10 rounded-lg" />
			</div>

			{/* Informações Básicas */}
			<SectionSkeleton lines={4} />

			{/* Preço */}
			<SectionSkeleton lines={1} />

			{/* Imagens */}
			<Card>
				<div className="flex flex-col gap-6">
					<div className="flex items-center gap-3">
						<Skeleton className="w-8 h-8 rounded-lg" />
						<div className="flex flex-col gap-1">
							<Skeleton className="w-20 h-4 rounded" />
							<Skeleton className="w-48 h-3 rounded" />
						</div>
					</div>
					<div className="flex gap-2">
						{Array.from({ length: 4 }).map((_, i) => (
							<Skeleton key={i} className="w-24 h-24 rounded-lg" />
						))}
					</div>
				</div>
			</Card>

			{/* Categorias */}
			<SectionSkeleton lines={1} />

			{/* Cupons */}
			<SectionSkeleton lines={1} />

			{/* Variantes */}
			<SectionSkeleton lines={2} />
		</div>
	);
}
