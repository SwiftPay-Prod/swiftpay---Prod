'use client';

import { useEffect, useRef } from 'react';
import confetti, { type CreateTypes, type Options as ConfettiOptions } from 'canvas-confetti';
import { cn } from '@/utils/utils';

export interface ConfettiBurstOptions extends ConfettiOptions {
  particleCount?: number;
}

interface ConfettiProps {
  triggerKey: number;
  className?: string;
  zIndex?: number;
  disableForReducedMotion?: boolean;
  bursts?: ConfettiBurstOptions[];
  options?: ConfettiOptions;
}

function launchBursts(instance: CreateTypes, bursts: ConfettiBurstOptions[], fallbackOptions?: ConfettiOptions) {
  bursts.forEach((burst) => {
    instance({
      ...fallbackOptions,
      ...burst,
    });
  });
}

export function Confetti({
  triggerKey,
  className,
  zIndex = 100,
  disableForReducedMotion = true,
  bursts,
  options,
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (triggerKey <= 0) {
      return;
    }

    if (disableForReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const instance = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    });

    const defaultBursts: ConfettiBurstOptions[] = [
      {
        particleCount: 50,
        angle: 60,
        spread: 62,
        startVelocity: 54,
        decay: 0.92,
        scalar: 1.05,
        ticks: 260,
        gravity: 1,
        drift: 0.05,
        origin: { x: 0.12, y: 0.58 },
      },
      {
        particleCount: 50,
        angle: 120,
        spread: 62,
        startVelocity: 54,
        decay: 0.92,
        scalar: 1.05,
        ticks: 260,
        gravity: 1,
        drift: -0.05,
        origin: { x: 0.88, y: 0.58 },
      },
      {
        particleCount: 40,
        angle: 90,
        spread: 96,
        startVelocity: 42,
        decay: 0.91,
        scalar: 0.95,
        ticks: 220,
        gravity: 1.08,
        origin: { x: 0.5, y: 0.42 },
      },
    ];

    launchBursts(instance, bursts && bursts.length > 0 ? bursts : defaultBursts, options);
  }, [bursts, disableForReducedMotion, options, triggerKey]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
      style={{ zIndex }}
    />
  );
}