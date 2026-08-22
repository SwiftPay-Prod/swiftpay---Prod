'use client';

import { RevolutStatusBadge } from '@/components/ui/revolut-status-badge';
import { InformationCircleIcon, Wrench01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { IntegrationPlatformInfo } from './integration-platform-info';

interface IntegrationCardProps {
	name: string;
	subtitle: string;
	description: string;
	imageUrl: string | null;
	isActive: boolean;
	isComingSoon: boolean;
	websiteUrl: string | null;
	onOpenDetails: () => void;
	onOpenConfigure: () => void;
}

export function IntegrationCard({
	name,
	subtitle,
	description,
	imageUrl,
	isActive,
	isComingSoon,
	websiteUrl,
	onOpenDetails,
	onOpenConfigure,
}: IntegrationCardProps) {
	return (
		<article className="flex h-full flex-col rounded-[20px] border border-white/12 bg-[#16181a] p-5">
			<div className="flex items-start justify-between gap-4">
				<IntegrationPlatformInfo
					name={name}
					subtitle={subtitle}
					imageUrl={imageUrl}
					isActive={isActive}
					websiteUrl={websiteUrl}
				/>
				<RevolutStatusBadge
					status={isActive ? 'active' : isComingSoon ? 'soon' : 'inactive'}
					label={isComingSoon ? 'Em breve' : isActive ? 'Ativa' : 'Inativa'}
					size="sm"
				/>
			</div>
			<p className="mt-3 line-clamp-2 text-sm text-white/50">{description}</p>
			<div className="mt-auto grid grid-cols-2 gap-2 pt-4">
				<button
					type="button"
					onClick={onOpenDetails}
					className="button-outline-dark w-full cursor-pointer text-xs"
				>
					<Icon icon={InformationCircleIcon} className="icon-sm" />
					Ver mais detalhes
				</button>
				<button
					type="button"
					onClick={onOpenConfigure}
					disabled={isComingSoon}
					className="button-primary w-full cursor-pointer text-xs"
				>
					<Icon icon={Wrench01Icon} className="icon-sm" />
					Configurar
				</button>
			</div>
		</article>
	);
}

