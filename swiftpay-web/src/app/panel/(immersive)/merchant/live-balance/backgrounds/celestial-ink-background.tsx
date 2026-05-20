'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/utils/utils';
import type { LiveBalanceBackgroundProps } from './types';
import { resolveRuntimePalette, toRgba } from './color-utils';

function hash(n: number): number {
  const s = Math.sin(n) * 43758.5453;
  return s - Math.floor(s);
}

function noise2(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix + iy * 157);
  const b = hash(ix + 1 + iy * 157);
  const c = hash(ix + (iy + 1) * 157);
  const d = hash(ix + 1 + (iy + 1) * 157);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x: number, y: number, octaves: number): number {
  let v = 0; let amp = 0.5;
  for (let i = 0; i < octaves; i++) {
    v += amp * noise2(x, y);
    x *= 2.1; y *= 2.1; amp *= 0.5;
  }
  return v;
}

interface Drop {
  x: number;
  y: number;
  r: number;
  age: number;
  maxAge: number;
  colorIndex: number;
}

const INK_DROPS = 6;

function makeDrop(W: number, H: number): Drop {
  return {
    x: Math.random() * W,
    y: Math.random() * H,
    r: 0,
    age: 0,
    maxAge: 200 + Math.random() * 180,
    colorIndex: Math.floor(Math.random() * 4),
  };
}

export function CelestialInkBackground({ className }: LiveBalanceBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let t = 0;
    let drops: Drop[] = [];
    const palette = resolveRuntimePalette();
    const colors = [palette.accent, palette.secondary, palette.warning, palette.danger];

    function resize() {
      canvas!.width = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
      drops = Array.from({ length: INK_DROPS }, () =>
        makeDrop(canvas!.width, canvas!.height)
      );
    }

    function drawNoiseMesh(W: number, H: number) {
      const tileW = 32;
      const tileH = 32;
      const cols = Math.ceil(W / tileW) + 1;
      const rows = Math.ceil(H / tileH) + 1;
      const tOffset = t * 0.28;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const nx = (col / cols) * 5 + tOffset;
          const ny = (row / rows) * 5 + tOffset * 0.7;
          const v = fbm(nx, ny, 3);
          const ci = Math.floor(v * 4) % 4;
          const [r, g, b] = colors[ci] ?? palette.accent;
          const alpha = (v - 0.25) * 0.09;
          if (alpha <= 0) continue;
          ctx!.fillStyle = `rgba(${r},${g},${b},${Math.min(alpha, 0.12)})`;
          ctx!.fillRect(col * tileW - tileW, row * tileH - tileH, tileW + 1, tileH + 1);
        }
      }
    }

    function frame() {
      const W = canvas!.width;
      const H = canvas!.height;
      t += 0.008;

      ctx!.fillStyle = toRgba(palette.background, 0.12);
      ctx!.fillRect(0, 0, W, H);

      drawNoiseMesh(W, H);

      for (const d of drops) {
        d.age++;
        const progress = d.age / d.maxAge;
        d.r = progress * Math.min(W, H) * 0.22;

        const alpha = progress < 0.15
          ? progress / 0.15
          : progress > 0.65
            ? 1 - (progress - 0.65) / 0.35
            : 1;

        const [r, g, b] = colors[d.colorIndex] ?? palette.accent;

        const gradient = ctx!.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
        gradient.addColorStop(0,   `rgba(${r},${g},${b},${alpha * 0.18})`);
        gradient.addColorStop(0.5, `rgba(${r},${g},${b},${alpha * 0.09})`);
        gradient.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx!.beginPath();
        ctx!.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx!.fillStyle = gradient;
        ctx!.fill();

        const rings = 3;
        for (let i = 0; i < rings; i++) {
          const rr = d.r * (0.4 + i * 0.28);
          const ringAlpha = alpha * (0.25 - i * 0.07);
          if (ringAlpha <= 0) continue;
          ctx!.beginPath();
          ctx!.arc(d.x, d.y, rr, 0, Math.PI * 2);
          ctx!.strokeStyle = `rgba(${r},${g},${b},${ringAlpha})`;
          ctx!.lineWidth = 0.8;
          ctx!.stroke();
        }

        if (d.age >= d.maxAge) {
          Object.assign(d, makeDrop(W, H));
        }
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
