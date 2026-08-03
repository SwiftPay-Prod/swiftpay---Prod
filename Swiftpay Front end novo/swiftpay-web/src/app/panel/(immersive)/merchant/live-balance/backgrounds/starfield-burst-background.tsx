'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/utils/utils';
import type { LiveBalanceBackgroundProps } from './types';
import { resolveRuntimePalette, toRgba } from './color-utils';

interface Star {
  x: number;
  y: number;
  z: number;
  pz: number;
  colorIndex: number;
  twinkle: number;
  twinkleSpeed: number;
}

const STAR_COUNT = 280;
const SPEED = 0.85;
const BURST_STARS = 40;

interface BurstStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  r: number;
  colorIndex: number;
}

function makeStar(W: number, H: number, spreadZ = true): Star {
  return {
    x: (Math.random() - 0.5) * W * 1.8,
    y: (Math.random() - 0.5) * H * 1.8,
    z: spreadZ ? Math.random() * W : W,
    pz: 0,
    colorIndex: Math.floor(Math.random() * 4),
    twinkle: Math.random() * Math.PI * 2,
    twinkleSpeed: 0.03 + Math.random() * 0.05,
  };
}

function makeBurstStar(W: number, H: number, ci: number): BurstStar {
  const angle = Math.random() * Math.PI * 2;
  const spd = 1.5 + Math.random() * 3.5;
  return {
    x: W / 2 + (Math.random() - 0.5) * 60,
    y: H / 2 + (Math.random() - 0.5) * 60,
    vx: Math.cos(angle) * spd,
    vy: Math.sin(angle) * spd,
    life: 0,
    maxLife: 60 + Math.random() * 80,
    r: 1 + Math.random() * 2.5,
    colorIndex: ci,
  };
}

export function StarfieldBurstBackground({ className }: LiveBalanceBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let stars: Star[] = [];
    let bursts: BurstStar[] = [];
    let nextBurst = 0;
    let burstCi = 0;
    let frame = 0;
    const palette = resolveRuntimePalette();
    const colors = [palette.accent, palette.secondary, palette.warning, palette.danger];

    function resize() {
      canvas!.width = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
      stars = Array.from({ length: STAR_COUNT }, () =>
        makeStar(canvas!.width, canvas!.height, true)
      );
    }

    function tick() {
      const W = canvas!.width;
      const H = canvas!.height;
      const cx = W / 2;
      const cy = H / 2;
      frame++;

      ctx!.fillStyle = toRgba(palette.background, 0.18);
      ctx!.fillRect(0, 0, W, H);

      if (frame >= nextBurst) {
        nextBurst = frame + 240 + Math.floor(Math.random() * 200);
        burstCi = (burstCi + 1) % 4;
        for (let i = 0; i < BURST_STARS; i++) {
          bursts.push(makeBurstStar(W, H, burstCi));
        }
      }

      for (const s of stars) {
        s.pz = s.z;
        s.z -= SPEED;
        s.twinkle += s.twinkleSpeed;
        if (s.z <= 0) {
          Object.assign(s, makeStar(W, H, false));
          s.pz = s.z;
        }
        const sx = (s.x / s.z) * W + cx;
        const sy = (s.y / s.z) * H + cy;
        const px = (s.x / s.pz) * W + cx;
        const py = (s.y / s.pz) * H + cy;
        if (sx < 0 || sx > W || sy < 0 || sy > H) continue;

        const size = Math.max(0.4, (1 - s.z / W) * 2.8);
        const twAlpha = 0.4 + Math.sin(s.twinkle) * 0.3;
        const [r, g, b] = colors[s.colorIndex] ?? palette.accent;

        ctx!.beginPath();
        ctx!.moveTo(px, py);
        ctx!.lineTo(sx, sy);
        ctx!.strokeStyle = `rgba(${r},${g},${b},${twAlpha * 0.7})`;
        ctx!.lineWidth = size * 0.5;
        ctx!.stroke();

        ctx!.beginPath();
        ctx!.arc(sx, sy, size * 0.6, 0, Math.PI * 2);
        ctx!.fillStyle = toRgba([255, 255, 255], twAlpha * 0.9);
        ctx!.fill();
      }

      bursts = bursts.filter(b => {
        b.life++;
        b.x += b.vx;
        b.y += b.vy;
        b.vx *= 0.97;
        b.vy *= 0.97;
        const prog = b.life / b.maxLife;
        const alpha = 1 - prog;
        const [r, g, b2] = colors[b.colorIndex] ?? palette.accent;
        const grad = ctx!.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 3);
        grad.addColorStop(0, `rgba(${r},${g},${b2},${alpha * 0.8})`);
        grad.addColorStop(1, `rgba(${r},${g},${b2},0)`);
        ctx!.beginPath();
        ctx!.arc(b.x, b.y, b.r * 3, 0, Math.PI * 2);
        ctx!.fillStyle = grad;
        ctx!.fill();
        return b.life < b.maxLife;
      });

      raf = requestAnimationFrame(tick);
    }

    const obs = new ResizeObserver(resize);
    obs.observe(canvas);
    resize();
    ctx.fillStyle = toRgba(palette.background, 1);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    tick();

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
