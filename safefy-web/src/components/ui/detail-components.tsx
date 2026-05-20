'use client';

import { Button, Tooltip } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { Copy01Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { toast } from '@heroui/react';

interface DetailRowProps {
	label: string;
	value: React.ReactNode;
	mono?: boolean;
}

export function DetailRow({ label, value, mono = false }: DetailRowProps) {
	return (
		<div className="flex flex-col gap-1 min-w-0 overflow-hidden">
			<span className="text-xs text-foreground/60">{label}</span>
			<span className={`text-sm font-medium text-foreground break-all ${mono ? 'font-mono text-xs' : ''}`}>
				{value ?? '-'}
			</span>
		</div>
	);
}

interface CopyableValueProps {
	value: string | null;
	label: string;
}

export function CopyableValue({ value, label }: CopyableValueProps) {
	if (!value) return <span className="text-foreground/50">-</span>;

	function handleCopy() {
		void navigator.clipboard.writeText(value!).catch(() => undefined);
		toast(`${label} copiado`, {
			description: 'O valor foi copiado para a área de transferência.',
			indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			variant: 'success',
		});
	}

	return (
		<div className="flex items-center gap-2 min-w-0">
			<span className="font-mono text-xs text-foreground truncate flex-1 min-w-0">{value}</span>
			<Tooltip>
				<Button isIconOnly size="sm" variant="ghost" onPress={handleCopy} className="shrink-0">
					<Icon icon={Copy01Icon} className="icon-xs" />
					<Tooltip.Content>Copiar</Tooltip.Content>
				</Button>
			</Tooltip>
		</div>
	);
}

interface SectionTitleProps {
	icon: React.ReactNode;
	title: string;
}

export function SectionTitle({ icon, title }: SectionTitleProps) {
	return (
		<div className="flex items-center gap-2 mb-2">
			<div className="text-accent">{icon}</div>
			<h4 className="font-semibold text-sm text-foreground">{title}</h4>
		</div>
	);
}

