'use client';

import Image from 'next/image';
import { Tooltip } from '@heroui/react';
import { LockIcon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { merchantLevelParse } from '@/parse';
import type { MerchantLevel } from '@/types/merchant/achievements';

interface BorderCardProps {
  level: MerchantLevel;
  borderImageUrl: string;
  isUnlocked: boolean;
  isSelected: boolean;
  isPending?: boolean;
  onSelect: (level: MerchantLevel | null) => void;
}

export function BorderCard({ level, borderImageUrl, isUnlocked, isSelected, isPending, onSelect }: BorderCardProps) {
  const parse = merchantLevelParse[level];

  return (
    <Tooltip>
      <button
        type="button"
        disabled={isPending}
        onClick={() => onSelect(isSelected ? null : level)}
        className={[
          'relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center w-full cursor-pointer',
          isUnlocked
            ? 'bg-surface border-divider hover:border-accent hover:bg-accent/5'
            : 'bg-surface/50 border-divider/50 opacity-50 hover:opacity-70',
          isSelected && 'ring-2 ring-accent border-accent bg-accent/10',
        ].filter(Boolean).join(' ')}
      >
        <div className="relative w-20 h-20">
          <Image
            src={borderImageUrl}
            alt={parse.label}
            fill
            className={['object-contain', !isUnlocked && 'grayscale'].filter(Boolean).join(' ')}
            unoptimized
          />
          {!isUnlocked && (
            <div className="absolute bottom-0 right-0 bg-surface border border-divider rounded-full p-0.5">
              <Icon icon={LockIcon} className="icon-xs text-muted" />
            </div>
          )}
          {isSelected && (
            <div className="absolute bottom-0 right-0 bg-accent rounded-full p-0.5">
              <Icon icon={CheckmarkCircle02Icon} className="icon-xs text-accent-foreground" />
            </div>
          )}
        </div>

        <span className="text-xs font-semibold text-foreground">{parse.label}</span>
      </button>
      <Tooltip.Content placement="top left">
        {isUnlocked ? parse.description : `Desbloqueado no nível ${parse.label}`}
      </Tooltip.Content>
    </Tooltip>
  );
}
