'use client';

import { useEffect, useState } from 'react';
import { Tooltip } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { Time01Icon } from '@hugeicons/core-free-icons';

export function formatTimeRemaining(expiresAt: string | Date): string {
  const now = new Date();
  const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  const diffMs = expiry.getTime() - now.getTime();

  if (diffMs <= 0) return 'Expirado';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}

export function useTimeRemaining(expiresAt: string | Date | null) {
  const [timeRemaining, setTimeRemaining] = useState<string | null>(() =>
    expiresAt ? formatTimeRemaining(expiresAt) : null
  );

  useEffect(() => {
    if (!expiresAt) {
      return;
    }

    const updateTime = () => setTimeRemaining(formatTimeRemaining(expiresAt));
    updateTime();

    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return expiresAt ? timeRemaining : null;
}

interface TimeRemainingProps {
  expiresAt: string | Date | null;
  showIcon?: boolean;
  tooltip?: string;
  className?: string;
}

export function TimeRemaining({ 
  expiresAt, 
  showIcon = true, 
  tooltip = 'Tempo restante para expiração',
  className = ''
}: TimeRemainingProps) {
  const timeRemaining = useTimeRemaining(expiresAt);

  if (!timeRemaining) {
    return null;
  }

  const content = (
    <span className={`flex items-center gap-1 text-warning ${className}`} tabIndex={0}>
      {showIcon && <Icon icon={Time01Icon} className="size-4" />}
      <span className="text-tiny">{timeRemaining}</span>
    </span>
  );

  if (tooltip) {
    return (
      <Tooltip delay={0}>
        <Tooltip.Trigger className="cursor-help">
          {content}
        </Tooltip.Trigger>
        <Tooltip.Content>
          <p>{tooltip}</p>
        </Tooltip.Content>
      </Tooltip>
    );
  }

  return content;
}

