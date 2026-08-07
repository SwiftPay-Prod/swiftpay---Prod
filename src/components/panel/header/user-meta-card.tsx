'use client';

import { Tooltip } from '@heroui/react';
import { ChampionIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { ProgressBar } from '@/components/ui/progress-bar';
import { merchantLevelParse } from '@/parse';
import { formatCurrency, formatCurrencyCompact } from '@/utils/currency';
import type { MerchantLevel } from '@/types/merchant/achievements';

interface UserMetaCardProps {
	level: MerchantLevel | null;
	progress: number | null;
	displayName: string | null;
	nextLevelDisplayName: string | null;
	totalVolume: number | null;
	maxThreshold: number | null;
	isBalanceVisible?: boolean;
	size?: 'compact' | 'sidebar';
}

export function UserMetaCard({
	level,
	progress,
	displayName,
	nextLevelDisplayName,
	totalVolume,
	maxThreshold,
	isBalanceVisible = true,
	size = 'compact',
}: UserMetaCardProps) {
	const parse = level ? merchantLevelParse[level] : null;
	const isMaxLevel = !nextLevelDisplayName;
	const remaining = maxThreshold && totalVolume != null ? maxThreshold - totalVolume : null;
	const isLoaded = level != null;
	const isSidebar = size === 'sidebar';

	return (
		<Tooltip>
			<div
				className={`flex flex-col border border-border/80 bg-surface/60 rounded-md cursor-default select-none transition-colors ${
					isSidebar ? 'gap-1.5 p-2.5 w-full' : 'gap-1 px-2.5 py-1.5 min-w-36 h-9'
				}`}
			>
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-1.5 min-w-0">
						<Icon
							icon={ChampionIcon}
							className={`${isSidebar ? 'icon-xs' : 'icon-xxs'} shrink-0 text-muted-foreground`}
						/>
						<span className={`${isSidebar ? 'text-xs' : 'text-xs'} font-medium text-foreground truncate`}>
							{displayName ?? '—'}
						</span>
					</div>
					<div className={`flex justify-end gap-1 ${isSidebar ? 'text-xs' : 'text-xs'} font-mono text-muted-foreground`}>
						<span className={isBalanceVisible ? '' : 'visual-blur'}>
							{totalVolume != null ? formatCurrencyCompact(totalVolume) : '—'}
						</span>
						/
						<span className={isBalanceVisible ? '' : 'visual-blur'}>
							{maxThreshold != null ? formatCurrencyCompact(maxThreshold) : '—'}
						</span>
					</div>
				</div>
				<ProgressBar
					value={progress ?? 0}
					className={isSidebar ? 'h-1' : 'h-0.5'}
					aria-label={`Progresso nível ${displayName ?? ''}`}
				/>
			</div>
			<Tooltip.Content placement="bottom end">
				{!isLoaded
					? 'Carregando nível...'
					: isMaxLevel
						? `Nível máximo (${displayName})!`
						: isBalanceVisible
							? `Faltam ${remaining !== null ? formatCurrency(remaining) : '—'} para ${nextLevelDisplayName}`
							: `Progresso para ${nextLevelDisplayName}`}
			</Tooltip.Content>
		</Tooltip>
	);
}
