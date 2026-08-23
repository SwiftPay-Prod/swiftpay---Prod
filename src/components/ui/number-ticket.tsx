'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';
import { cn } from '@/utils/utils';

interface NumberTicketProps {
  value: number;
  className?: string;
  durationMs?: number;
}

function clampCurrencyValue(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value));
}

function splitCurrencyParts(value: number): { integer: string; cents: string } {
  const safeValue = clampCurrencyValue(value);
  const integerValue = Math.floor(safeValue / 100);
  const cents = String(safeValue % 100).padStart(2, '0');
  const integer = new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 0,
  }).format(integerValue);

  return { integer, cents };
}

function getSpringConfig(durationMs: number): { damping: number; stiffness: number; mass: number } {
  const safeDuration = Math.max(350, Math.min(2800, durationMs));

  if (safeDuration <= 700) {
    return { damping: 30, stiffness: 170, mass: 0.7 };
  }

  if (safeDuration <= 1300) {
    return { damping: 38, stiffness: 125, mass: 0.85 };
  }

  if (safeDuration <= 1900) {
    return { damping: 46, stiffness: 96, mass: 0.95 };
  }

  return { damping: 52, stiffness: 82, mass: 1 };
}

export function NumberTicket({ value, className, durationMs = 900 }: NumberTicketProps) {
  const targetValue = clampCurrencyValue(value);
  const [displayValue, setDisplayValue] = useState<number>(0);
  const springConfig = useMemo(() => getSpringConfig(durationMs), [durationMs]);

  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, springConfig);

  useEffect(() => {
    motionValue.set(targetValue);
  }, [targetValue, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      const rounded = Math.max(0, Math.round(latest));
      setDisplayValue((previous) => {
        if (previous === rounded) {
          return previous;
        }

        return rounded;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [springValue]);

  useEffect(() => {
    if (displayValue === targetValue) {
      return;
    }

    const settleTimer = window.setTimeout(() => {
      const current = Math.round(springValue.get());
      if (current !== targetValue) {
        setDisplayValue(targetValue);
      }
    }, Math.max(450, durationMs + 120));

    return () => {
      window.clearTimeout(settleTimer);
    };
  }, [displayValue, durationMs, springValue, targetValue]);

  const { integer, cents } = splitCurrencyParts(displayValue);

  return (
    <div className={cn('inline-flex items-end justify-center gap-1 leading-none tabular-nums', className)} aria-live="polite">
      <span className="mb-[0.2em] text-[0.28em] font-semibold text-current/90">R$</span>
      <span className="font-black tracking-tight">{integer}</span>
      <span className="pb-[0.14em] text-[0.32em] font-semibold text-current/85">,{cents}</span>
    </div>
  );
}
