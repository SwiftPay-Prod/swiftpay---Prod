'use client';

import { Chip } from '@heroui/react';
import { AvatarUser } from '@/components/ui/avatar-user';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Icon } from '@/components/ui/icon';
import { Medal01Icon, ArrowRightDoubleIcon } from '@hugeicons/core-free-icons';
import { merchantLevelParse } from '@/parse';
import { formatCurrency } from '@/utils/currency';
import type { MerchantLevel } from '@/types/merchant/achievements';
import Image from 'next/image';

interface UserProfileProgressCardProps {
	name?: string | null;
	profileImageUrl?: string | null;
	borderImageUrl?: string | null;
	bannerImageUrl?: string | null;
	level?: MerchantLevel | null;
	nextLevel?: MerchantLevel | null;
	nextLevelLabel?: string | null;
	totalVolume?: number | null;
	maxThreshold?: number | null;
	progress?: number | null;
	earnedCount?: number | null;
	totalAchievements?: number | null;
	compact?: boolean;
}

export function UserProfileProgressCard({
	name,
	profileImageUrl,
	borderImageUrl,
	bannerImageUrl,
	level,
	nextLevel,
	nextLevelLabel,
	totalVolume,
	maxThreshold,
	progress,
	earnedCount,
	totalAchievements,
	compact = false,
}: UserProfileProgressCardProps) {
	const hasProgress = level != null && progress != null && totalVolume != null;
	const levelParse = level ? merchantLevelParse[level] : null;
	const nextLevelParse = nextLevel ? merchantLevelParse[nextLevel] : null;
	const resolvedNextLevelLabel = nextLevelLabel ?? nextLevelParse?.label ?? null;
	const achievedMaxLevel = hasProgress && !nextLevel;
	const remainingToNext =
		hasProgress && !achievedMaxLevel ? Math.max(0, (maxThreshold ?? 0) - (totalVolume ?? 0)) : 0;
	const cardPadding = compact ? 'p-2' : 'p-6';
	const avatarSize = compact ? 'md' : '2xl';

	return (
		<div className="flex flex-col">
			{bannerImageUrl && (
				<div className="relative h-20 w-full overflow-hidden rounded-lg mb-2">
					<Image src={bannerImageUrl} alt="Banner do perfil" fill className="object-cover" unoptimized />
				</div>
			)}
			<div className={[cardPadding, 'flex flex-col gap-5'].join(' ')}>
				<div className="flex items-center gap-4">
					<AvatarUser
						name={name}
						profileImageUrl={profileImageUrl}
						borderImageUrl={borderImageUrl}
						size={avatarSize}
					/>
					<div className="flex flex-col gap-2 min-w-0">
						{levelParse ? (
							<>
								<div className="flex items-center gap-2 flex-wrap">
									<span className="text-base font-semibold" style={{ color: levelParse.color }}>
										{levelParse.label}
									</span>
									{nextLevel && (
										<>
											<span className="inline-flex text-success">
												<Icon icon={ArrowRightDoubleIcon} className="icon-sm" />
											</span>
											{resolvedNextLevelLabel && (
												<span className="text-sm font-medium animate-pulse" style={{ color: nextLevelParse?.color }}>
													{resolvedNextLevelLabel}
												</span>
											)}
										</>
									)}
								</div>
								<div className="flex items-center gap-2 flex-wrap">
									<Chip
										size="sm"
										variant="soft"
										color="default"
										style={{ borderColor: levelParse.color, color: levelParse.color }}
									>
										{levelParse.label}
									</Chip>
									{earnedCount != null && totalAchievements != null && (
										<Chip size="sm" variant="soft" color="success">
											<Icon icon={Medal01Icon} className="icon-xs" />
											{earnedCount}/{totalAchievements} conquistas
										</Chip>
									)}
								</div>
							</>
						) : (
							<span className="text-sm font-semibold truncate">{name ?? 'Usuário'}</span>
						)}
					</div>
				</div>

				{hasProgress && (
					<div className="flex flex-col gap-1">
						<div className="flex items-end justify-between gap-2">
							<div className="flex flex-col gap-0.5">
								<span className="text-xs text-muted">Faturamento</span>
								<span className="text-sm font-semibold">{formatCurrency(totalVolume ?? 0)}</span>
							</div>
							<span className="text-sm font-normal">{formatCurrency(maxThreshold ?? 0)}</span>
						</div>
						<ProgressBar
							value={progress ?? 0}
							className="h-4"
							aria-label={`Progresso nível ${levelParse?.label ?? 'Usuário'}`}
						/>
						<div className="flex items-center justify-end text-xs text-muted">
							{achievedMaxLevel ? (
								<span className="font-medium text-success shrink-0">Nível máximo atingido!</span>
							) : (
								<span className="text-center shrink-0">
									Faltam{' '}
									<span className="font-semibold text-foreground">{formatCurrency(remainingToNext)}</span>{' '}
									para{' '}
									<span className="font-medium" style={{ color: nextLevelParse?.color ?? levelParse?.color }}>
										{resolvedNextLevelLabel ?? 'próximo nível'}
									</span>
								</span>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
