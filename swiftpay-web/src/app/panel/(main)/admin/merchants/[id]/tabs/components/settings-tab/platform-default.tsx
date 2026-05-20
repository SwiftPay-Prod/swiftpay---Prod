'use client';

import { InformationCircleIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';

export function PlatformDefault({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center gap-2 text-xs text-muted">
			<Icon icon={InformationCircleIcon} className="icon-xs shrink-0" />
			<span>
				{label}: <span className="font-medium text-foreground">{value}</span>
			</span>
		</div>
	);
}
