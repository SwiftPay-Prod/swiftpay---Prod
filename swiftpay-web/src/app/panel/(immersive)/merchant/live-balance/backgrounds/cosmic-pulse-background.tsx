'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/utils/utils';
import type { LiveBalanceBackgroundProps } from './types';
import { resolveRuntimePalette, toRgba } from './color-utils';

interface Wave {
  amplitude: number;
  wavelength: number;
  speed: number;
  phase: number;
  colorIndex: number;
  yBase: number;
  lineWidth: number;
  alpha: number;
}

const WAVE_COUNT = 18;

export function CosmicPulseBackground({ className }: LiveBalanceBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let waves: Wave[] = [];
    let t = 0;
    const palette = resolveRuntimePalette();
    const colors = [palette.accent, palette.secondary, palette.warning, palette.danger];

    function buildWaves(H: number) {
      waves = Array.from({ length: WAVE_COUNT }, (_, i) => ({
        amplitude: 14 + Math.random() * 28,
        wavelength: 0.004 + Math.random() * 0.008,
        speed: (0.008 + Math.random() * 0.016) * (Math.random() < 0.5 ? 1 : -1),
        phase: Math.random() * Math.PI * 2,
        colorIndex: Math.floor(Math.random() * 4),
        yBase: (H * 0.1) + (i / WAVE_COUNT) * H * 0.8,
        lineWidth: 0.6 + Math.random() * 1.4,
        alpha: 0.12 + Math.random() * 0.28,
      }));
    }

    function resize() {
      canvas!.width = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
      buildWaves(canvas!.height);
    }

    function drawWave(w: Wave, W: number) {
      const [r, g, b] = colors[w.colorIndex] ?? palette.accent;
      ctx!.beginPath();
      const step = 6;
      for (let x = 0; x <= W; x += step) {
        const y = w.yBase + Math.sin(x * w.wavelength + w.phase + t * 18) * w.amplitude;
        if (x === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.strokeStyle = `rgba(${r},${g},${b},${w.alpha})`;
      ctx!.lineWidth = w.lineWidth;
      ctx!.stroke();
    }

    function drawGlowWave(w: Wave, W: number) {
      const [r, g, b] = colors[w.colorIndex] ?? palette.accent;
      ctx!.beginPath();
      for (let x = 0; x <= W; x += 6) {
        const y = w.yBase + Math.sin(x * w.wavelength + w.phase + t * 18) * w.amplitude;
        if (x === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.strokeStyle = `rgba(${r},${g},${b},${w.alpha * 0.28})`;
      ctx!.lineWidth = w.lineWidth * 4;
      ctx!.stroke();
      drawWave(w, W);
    }

    function frame() {
      const W = canvas!.width;
      const H = canvas!.height;
      t += 0.001;

      ctx!.fillStyle = toRgba(palette.background, 0.14);
      ctx!.fillRect(0, 0, W, H);

      for (const w of waves) {
        w.phase += w.speed;
        drawGlowWave(w, W);
      }

      const bright = waves.filter((_, i) => i % 4 === 0);
      for (const w of bright) {
        const bw: Wave = { ...w, lineWidth: w.lineWidth * 2.2, alpha: w.alpha * 0.6 };
        ctx!.save();
        ctx!.globalCompositeOperation = 'lighter';
        drawWave(bw, W);
        ctx!.restore();
      }

      raf = requestAnimationFrame(frame);
    }

    const obs = new ResizeObserver(resize);
    obs.observe(canvas);
    resize();
    ctx.fillStyle = toRgba(palette.background, 1);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    frame();

    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0 h-full w-full bg-background', className)}
    />
  );
}
