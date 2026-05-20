'use client';

import { Button, Chip } from '@heroui/react';
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
		<article className="flex h-full flex-col rounded-xl border border-divider bg-surface p-4">
			<div className="flex items-start justify-between gap-4">
				<IntegrationPlatformInfo
					name={name}
					subtitle={subtitle}
					imageUrl={imageUrl}
					isActive={isActive}
					websiteUrl={websiteUrl}
				/>
				<Chip variant="soft" color={isActive ? 'success' : isComingSoon ? 'warning' : 'default'} size="sm">
					{isComingSoon ? 'Em breve' : isActive ? 'Ativa' : 'Inativa'}
				</Chip>
			</div>
			<p className="mt-3 line-clamp-2 text-sm text-muted">{description}</p>
			<div className="mt-auto grid grid-cols-2 gap-2 pt-4">
				<Button className="w-full" variant="tertiary" onPress={onOpenDetails}>
					<Icon icon={InformationCircleIcon} className="icon-sm" />
					Ver mais detalhes
				</Button>
				<Button className="w-full" variant="primary" onPress={onOpenConfigure} isDisabled={isComingSoon}>
					<Icon icon={Wrench01Icon} className="icon-sm" />
					Configurar
				</Button>
			</div>
		</article>
	);
}

