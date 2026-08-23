'use client';

import Image from 'next/image';
import { Tooltip } from '@heroui/react';
import { LockIcon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { formatDate } from '@/utils/datetime';
import type { MerchantAchievementItem } from '@/types/merchant/achievements';

interface AchievementCardProps {
  achievement: MerchantAchievementItem;
  isSelectedEmblem: boolean;
  onSelect: (achievement: MerchantAchievementItem) => void;
}

export function AchievementCard({ achievement, isSelectedEmblem, onSelect }: AchievementCardProps) {
  return (
    <Tooltip>
      <button
        type="button"
        onClick={() => onSelect(achievement)}
        className={[
          'relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center w-full cursor-pointer',
          achievement.isEarned
            ? 'bg-surface border-border hover:border-accent hover:bg-accent/5'
            : 'bg-surface/50 border-border/50 opacity-50 hover:opacity-70',
          isSelectedEmblem && 'ring-2 ring-accent border-accent bg-accent/10',
        ].filter(Boolean).join(' ')}
      >
        <div className="relative w-16 h-16">
          <Image
            src={achievement.imageUrl}
            alt={achievement.title}
            fill
            className={['object-contain', !achievement.isEarned && 'grayscale'].filter(Boolean).join(' ')}
            unoptimized
          />
          {!achievement.isEarned && (
            <div className="absolute bottom-0 right-0 bg-surface border border-border rounded-full p-0.5">
              <Icon icon={LockIcon} className="icon-xs text-muted" />
            </div>
          )}
          {achievement.isEarned && isSelectedEmblem && (
            <div className="absolute bottom-0 right-0 bg-accent rounded-full p-0.5">
              <Icon icon={CheckmarkCircle02Icon} className="icon-xs text-accent-foreground" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-0.5 min-w-0 w-full">
          <span className="text-xs font-semibold text-foreground truncate">{achievement.title}</span>
          <span className="text-xs text-muted truncate">{achievement.subtitle}</span>
          {achievement.isEarned && achievement.earnedAt && (
            <span className="text-xs text-success">{formatDate(achievement.earnedAt)}</span>
          )}
        </div>
      </button>
      <Tooltip.Content placement="top left">
        {achievement.isEarned ? achievement.description : 'Não desbloqueado ainda'}
      </Tooltip.Content>
    </Tooltip>
  );
}
