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
				className={`flex flex-col border rounded-lg cursor-default select-none transition-all duration-500 ${
					isSidebar ? 'gap-1.5 px-3 py-2 min-w-48 h-14 w-full' : 'gap-1 px-2.5 py-1.5 min-w-32 h-9'
				}`}
				style={{
					backgroundColor: isLoaded ? `${parse!.color}22` : undefined,
					borderColor: isLoaded ? `${parse!.color}66` : undefined,
				}}
			>
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-1 min-w-0">
						<Icon
							icon={ChampionIcon}
							className={`${isSidebar ? 'icon-xs' : 'icon-xxs'} shrink-0 transition-colors duration-500`}
							style={{ color: parse?.color }}
						/>
						<span
							className={`${isSidebar ? 'text-xs' : 'text-[10px]'} font-semibold truncate transition-colors duration-500`}
							style={{ color: parse?.color }}
						>
							<span
								className={`inline-block transition-all duration-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-40'}`}
							>
								{displayName ?? '—'}
							</span>
						</span>
					</div>
					<div className={`flex justify-end gap-1 ${isSidebar ? 'text-xs' : 'text-[10px]'} text-muted`}>
						<span
							className={`truncate transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-40'} ${isBalanceVisible ? '' : 'visual-blur'}`}
						>
							{totalVolume != null ? formatCurrencyCompact(totalVolume) : '—'}
						</span>
						/
						<span
							className={`shrink-0 transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-40'} ${isBalanceVisible ? '' : 'visual-blur'}`}
						>
							{maxThreshold != null ? formatCurrencyCompact(maxThreshold) : '—'}
						</span>
					</div>
				</div>
				<ProgressBar
					value={progress ?? 0}
					className={isSidebar ? 'h-1.5' : 'h-1'}
					color={parse?.color}
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
