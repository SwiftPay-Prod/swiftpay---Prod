import { Skeleton } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { UserCircleIcon } from '@hugeicons/core-free-icons';

export function ProfileSkeleton() {
	return (
		<div className="flex flex-col gap-6 text-white">
			<div className="flex items-center gap-3 border-b border-white/10 pb-5">
				<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#494fdf]/15 text-[#4f55f1] border border-[#494fdf]/25">
					<Icon icon={UserCircleIcon} className="icon-sm text-[#4f55f1]" />
				</div>
				<div>
					<h1 className="text-xl font-bold tracking-tight text-white">Perfil</h1>
					<p className="text-xs text-white/50 mt-0.5">Edite suas informações públicas.</p>
				</div>
			</div>
			<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-6 flex flex-col gap-6">
				<h3 className="text-sm font-bold text-white border-b border-white/8 pb-3">Foto & Identidade</h3>
				<div className="flex items-start gap-6">
					<Skeleton className="w-24 h-24 rounded-full bg-white/10 shrink-0" />
					<div className="flex flex-col gap-2 flex-1">
						<Skeleton className="h-9 w-32 rounded-lg bg-white/10" />
						<Skeleton className="h-9 w-24 rounded-lg bg-white/10" />
						<Skeleton className="h-4 w-56 rounded-lg bg-white/5" />
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<Skeleton className="h-4 w-16 rounded-lg bg-white/5" />
					<Skeleton className="h-10 w-full rounded-lg bg-white/5" />
				</div>
				<div className="flex flex-col gap-2">
					<Skeleton className="h-4 w-12 rounded-lg bg-white/5" />
					<Skeleton className="h-24 w-full rounded-lg bg-white/5" />
					<Skeleton className="h-4 w-20 rounded-lg bg-white/5" />
				</div>
			</div>

			<div className="rounded-[20px] border border-white/12 bg-[#16181a] p-6 flex flex-col gap-4">
				<h3 className="text-sm font-bold text-white border-b border-white/8 pb-3">Redes Sociais</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="flex flex-col gap-2">
							<Skeleton className="h-4 w-20 rounded-lg bg-white/5" />
							<Skeleton className="h-10 w-full rounded-lg bg-white/5" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
