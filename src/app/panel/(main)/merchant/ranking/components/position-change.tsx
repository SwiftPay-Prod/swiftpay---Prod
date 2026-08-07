import { Icon } from '@/components/ui/icon';
import { ArrowUp01Icon, ArrowDown01Icon } from '@hugeicons/core-free-icons';

interface PositionChangeProps {
	change: number;
	previousPosition: number | null;
}

export function PositionChange({ change, previousPosition }: PositionChangeProps) {
	if (previousPosition === null) {
		return (
			<span className="inline-flex items-center text-xs font-mono font-medium text-accent bg-accent/10 px-1.5 py-0.2 rounded border border-accent/20">
				Novo
			</span>
		);
	}
	if (change === 0) {
		return (
			<span className="inline-flex items-center text-xs font-mono text-muted-foreground bg-surface px-1.5 py-0.2 rounded border border-border/50">
				—
			</span>
		);
	}
	if (change > 0) {
		return (
			<span className="inline-flex items-center gap-0.5 text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
				<Icon icon={ArrowUp01Icon} className="w-3 h-3 shrink-0" />
				{change}
			</span>
		);
	}
	return (
		<span className="inline-flex items-center gap-0.5 text-xs font-mono font-medium text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
			<Icon icon={ArrowDown01Icon} className="w-3 h-3 shrink-0" />
			{Math.abs(change)}
		</span>
	);
}
