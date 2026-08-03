import { Icon } from '@/components/ui/icon';
import { ArrowUp01Icon, ArrowDown01Icon } from '@hugeicons/core-free-icons';

interface PositionChangeProps {
	change: number;
	previousPosition: number | null;
}

export function PositionChange({ change, previousPosition }: PositionChangeProps) {
	if (previousPosition === null) return <span className="text-xs text-muted">novo</span>;
	if (change === 0) return <span className="text-xs text-muted">—</span>;
	if (change > 0)
		return (
			<span className="flex items-center gap-0.5 text-xs text-success">
				<Icon icon={ArrowUp01Icon} className="icon-xs" />
				{change}
			</span>
		);
	return (
		<span className="flex items-center gap-0.5 text-xs text-danger">
			<Icon icon={ArrowDown01Icon} className="icon-xs" />
			{Math.abs(change)}
		</span>
	);
}
