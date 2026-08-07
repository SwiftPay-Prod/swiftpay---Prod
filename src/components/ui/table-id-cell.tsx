'use client';

import { Button, Tooltip, toast } from '@heroui/react';
import { Copy01Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';

interface TableIdCellProps {
	id: string;
	shortLength?: number;
	copyLabel?: string;
}

export function TableIdCell({ id, shortLength = 8, copyLabel = 'ID' }: TableIdCellProps) {
	const shortId = id.length > shortLength ? `${id.slice(0, shortLength)}...` : id;

	function handleCopy() {
		void navigator.clipboard.writeText(id).catch(() => undefined);
		toast(`${copyLabel} copiado`, {
			description: 'O valor foi copiado para a área de transferência.',
			indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			variant: 'success',
		});
	}

	return (
		<div className="flex items-center gap-1.5 min-w-0">
			<Tooltip>
				<span className="font-mono text-xs text-muted truncate">{shortId}</span>
				<Tooltip.Content>{id}</Tooltip.Content>
			</Tooltip>
			<Tooltip>
				<Button isIconOnly size="sm" variant="ghost" onPress={handleCopy} className="shrink-0">
					<Icon icon={Copy01Icon} className="icon-xs" />
					<Tooltip.Content>Copiar ID</Tooltip.Content>
				</Button>
			</Tooltip>
		</div>
	);
}
