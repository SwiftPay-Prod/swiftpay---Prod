'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/utils/utils';
import type { LiveBalanceBackgroundProps } from './types';
import { mixRgb, resolveRuntimePalette, toRgba } from './color-utils';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  colorIndex: number;
}

const PARTICLE_COUNT = 220;
const COLS = 40;
const ROWS = 25;
const NOISE_SCALE = 0.0035;
const FIELD_SPEED = 0.00025;

function flowAngle(nx: number, ny: number, t: number): number {
  const s1 = Math.sin(nx * 2.4 + t * 2.1) * Math.cos(ny * 1.8 - t * 1.3);
  const s2 = Math.cos(nx * 1.2 - t * 0.9) * Math.sin(ny * 2.6 + t * 1.7);
  const s3 = Math.sin((nx + ny) * 1.6 + t * 1.1);
  return (s1 + s2 + s3) * Math.PI;
}

function spawnParticle(W: number, H: number): Particle {
  return {
    x: Math.random() * W,
    y: Math.random() * H,
    vx: 0,
    vy: 0,
    life: Math.random() * 160,
    maxLife: 160 + Math.random() * 80,
    colorIndex: Math.floor(Math.random() * 4),
  };
}

export function NeuralFlowBackground({ className }: LiveBalanceBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let t = 0;
    let particles: Particle[] = [];
    const palette = resolveRuntimePalette();
    const colors = [
      palette.accent,
      palette.secondary,
      mixRgb(palette.accent, palette.secondary, 0.5),
      mixRgb(palette.foreground, palette.accent, 0.35),
    ];

    function resize() {
      canvas!.width = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
      particles = Array.from({ length: PARTICLE_COUNT }, () =>
        spawnParticle(canvas!.width, canvas!.height)
      );
    }

    function frame() {
      const W = canvas!.width;
      const H = canvas!.height;
      t += FIELD_SPEED;

      ctx!.fillStyle = toRgba(palette.background, 0.06);
      ctx!.fillRect(0, 0, W, H);

      const cellW = W / COLS;
      const cellH = H / ROWS;

      for (const p of particles) {
        const col = Math.floor(p.x / cellW);
        const row = Math.floor(p.y / cellH);
        const nx = (col / COLS) * NOISE_SCALE * W;
        const ny = (row / ROWS) * NOISE_SCALE * H;

        const angle = flowAngle(nx, ny, t);
        const speed = 1.2 + Math.sin(t * 4 + p.colorIndex) * 0.4;
        p.vx = p.vx * 0.85 + Math.cos(angle) * speed * 0.15;
        p.vy = p.vy * 0.85 + Math.sin(angle) * speed * 0.15;

        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        if (p.life > p.maxLife || p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          Object.assign(p, spawnParticle(W, H));
        }

        const progress = p.life / p.maxLife;
        const fade = progress < 0.15
          ? progress / 0.15
          : progress > 0.75
            ? 1 - (progress - 0.75) / 0.25
            : 1;

        const [r, g, b] = colors[p.colorIndex] ?? palette.accent;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 1.1, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${r},${g},${b},${fade * 0.65})`;
        ctx!.fill();
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
