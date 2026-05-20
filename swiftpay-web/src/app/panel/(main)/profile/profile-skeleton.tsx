import { Skeleton, Card } from '@heroui/react';
import { PageHeader } from '@/components/ui/page-header';
import { Icon } from '@/components/ui/icon';
import { UserCircleIcon } from '@hugeicons/core-free-icons';

export function ProfileSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<PageHeader
				icon={<Icon icon={UserCircleIcon} size={24} />}
				title="Perfil"
				description="Edite suas informações públicas."
			/>
			<Card>
				<Card.Header>
					<Card.Title>Foto & Identidade</Card.Title>
				</Card.Header>
				<Card.Content className="flex flex-col gap-6">
					<div className="flex items-start gap-6">
						<Skeleton className="w-24 h-24 rounded-full shrink-0" />
						<div className="flex flex-col gap-2 flex-1">
							<Skeleton className="h-9 w-32 rounded-lg" />
							<Skeleton className="h-9 w-24 rounded-lg" />
							<Skeleton className="h-4 w-56 rounded-lg" />
						</div>
					</div>
					<div className="flex flex-col gap-2">
						<Skeleton className="h-4 w-16 rounded-lg" />
						<Skeleton className="h-10 w-full rounded-lg" />
					</div>
					<div className="flex flex-col gap-2">
						<Skeleton className="h-4 w-12 rounded-lg" />
						<Skeleton className="h-24 w-full rounded-lg" />
						<Skeleton className="h-4 w-20 rounded-lg" />
					</div>
				</Card.Content>
			</Card>
			<Card>
				<Card.Header>
					<Card.Title>Redes Sociais</Card.Title>
				</Card.Header>
				<Card.Content>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className="flex flex-col gap-2">
								<Skeleton className="h-4 w-20 rounded-lg" />
								<Skeleton className="h-10 w-full rounded-lg" />
							</div>
						))}
					</div>
				</Card.Content>
			</Card>
		</div>
	);
}
