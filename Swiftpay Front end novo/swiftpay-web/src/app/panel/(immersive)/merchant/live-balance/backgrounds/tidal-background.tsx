'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/utils/utils';
import type { LiveBalanceBackgroundProps } from './types';
import { mixRgb, resolveRuntimePalette, toRgba } from './color-utils';

const WAVES = 7;
const SEGMENTS = 64;

export function TidalBackground({ className }: LiveBalanceBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasElement = canvas;
    const context = ctx;
    let raf = 0;
    let start = 0;

    function resize() {
      canvasElement.width = canvasElement.offsetWidth;
      canvasElement.height = canvasElement.offsetHeight;
    }

    function frame(ts: number) {
      const palette = resolveRuntimePalette();
      if (!start) {
        start = ts;
      }

      const elapsed = (ts - start) * 0.001;
      const width = canvasElement.width;
      const height = canvasElement.height;
      context.clearRect(0, 0, width, height);

      for (let wave = 0; wave < WAVES; wave++) {
        const progress = wave / (WAVES - 1);
        const baseY = height * (0.18 + progress * 0.64);
        const amplitude = 18 + progress * 28;
        const speed = 0.5 + progress * 0.22;
        const color = mixRgb(palette.accent, wave % 2 === 0 ? palette.secondary : palette.success, progress);

        context.beginPath();
        for (let segment = 0; segment <= SEGMENTS; segment++) {
          const x = (width / SEGMENTS) * segment;
          const y =
            baseY +
            Math.sin(segment * 0.34 + elapsed * speed + progress * 4.5) * amplitude +
            Math.cos(segment * 0.12 - elapsed * 0.45 + progress * 3.6) * (amplitude * 0.35);

          if (segment === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        }

        context.strokeStyle = toRgba(color, palette.isLight ? 0.12 + progress * 0.06 : 0.16 + progress * 0.08);
        context.lineWidth = 1.4 + progress * 0.5;
        context.stroke();
      }

      raf = requestAnimationFrame(frame);
    }

    const observer = new ResizeObserver(resize);
    observer.observe(canvasElement);
    resize();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--background)_78%,white)_0%,color-mix(in_oklch,var(--accent)_8%,var(--background))_55%,color-mix(in_oklch,var(--secondary)_9%,var(--background))_100%)] dark:bg-[linear-gradient(180deg,color-mix(in_oklch,var(--background)_90%,black)_0%,color-mix(in_oklch,var(--accent)_14%,black)_55%,color-mix(in_oklch,var(--secondary)_16%,black)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.32),transparent_38%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_36%)]" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
