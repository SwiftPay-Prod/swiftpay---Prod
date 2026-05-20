'use client';

import { useEffect, useRef } from 'react';
import { createNoise3D } from 'simplex-noise';
import { cn } from '@/utils/utils';
import type { LiveBalanceBackgroundProps } from './types';
import { resolveRuntimePalette, type Rgb } from './color-utils';

const PARTICLE_COUNT = 500;
const PROP_COUNT = 9;
const PROPS_LENGTH = PARTICLE_COUNT * PROP_COUNT;

const BASE_TTL = 50;
const RANGE_TTL = 150;
const BASE_SPEED = 0.0;
const RANGE_SPEED = 1.5;
const BASE_RADIUS = 1;
const RANGE_RADIUS = 2;
const NOISE_STEPS = 3;
const X_OFF = 0.00125;
const Y_OFF = 0.00125;
const Z_OFF = 0.0005;

const TAU = 2 * Math.PI;

function rand(n: number): number {
  return n * Math.random();
}

function randRange(n: number): number {
  return n - rand(2 * n);
}

function fadeInOut(t: number, m: number): number {
  const hm = 0.5 * m;
  return Math.abs(((t + hm) % m) - hm) / hm;
}

function lerp(n1: number, n2: number, speed: number): number {
  return (1 - speed) * n1 + speed * n2;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}

export function FirefliesBackground({ className }: LiveBalanceBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const noise3D = createNoise3D();
    let tick = 0;
    let raf = 0;
    let particleProps = new Float32Array(PROPS_LENGTH);
    let center: [number, number] = [0, 0];

    const palette = resolveRuntimePalette();
    const colors: Rgb[] = [palette.accent, palette.secondary, palette.warning];
    const hues = colors.map(([r, g, b]) => rgbToHsl(r, g, b)[0]);
    const baseHue = hues[0] ?? 220;
    const rangeHue = 100;
    const rangeY = Math.max(200, canvas.offsetHeight * 0.6);

    function initParticle(i: number) {
      const W = canvas!.width;
      const x = rand(W);
      const y = center[1] + randRange(rangeY);
      const life = 0;
      const ttl = BASE_TTL + rand(RANGE_TTL);
      const speed = BASE_SPEED + rand(RANGE_SPEED);
      const radius = BASE_RADIUS + rand(RANGE_RADIUS);
      const hue = baseHue + rand(rangeHue);
      particleProps.set([x, y, 0, 0, life, ttl, speed, radius, hue], i);
    }

    function initParticles() {
      tick = 0;
      particleProps = new Float32Array(PROPS_LENGTH);
      for (let i = 0; i < PROPS_LENGTH; i += PROP_COUNT) {
        initParticle(i);
      }
    }

    function drawParticle(
      x: number, y: number, x2: number, y2: number,
      life: number, ttl: number,
      radius: number, hue: number,
    ) {
      ctx!.save();
      ctx!.lineCap = 'round';
      ctx!.lineWidth = radius;
      ctx!.strokeStyle = `hsla(${hue},100%,60%,${fadeInOut(life, ttl)})`;
      ctx!.beginPath();
      ctx!.moveTo(x, y);
      ctx!.lineTo(x2, y2);
      ctx!.stroke();
      ctx!.closePath();
      ctx!.restore();
    }

    function updateParticle(i: number) {
      const W = canvas!.width;
      const H = canvas!.height;

      const x = particleProps[i]!;
      const y = particleProps[i + 1]!;
      const n = noise3D(x * X_OFF, y * Y_OFF, tick * Z_OFF) * NOISE_STEPS * TAU;
      const vx = lerp(particleProps[i + 2]!, Math.cos(n), 0.5);
      const vy = lerp(particleProps[i + 3]!, Math.sin(n), 0.5);
      let life = particleProps[i + 4]!;
      const ttl = particleProps[i + 5]!;
      const speed = particleProps[i + 6]!;
      const x2 = x + vx * speed;
      const y2 = y + vy * speed;
      const radius = particleProps[i + 7]!;
      const hue = particleProps[i + 8]!;

      drawParticle(x, y, x2, y2, life, ttl, radius, hue);

      life++;
      particleProps[i] = x2;
      particleProps[i + 1] = y2;
      particleProps[i + 2] = vx;
      particleProps[i + 3] = vy;
      particleProps[i + 4] = life;

      const outOfBounds = x2 > W || x2 < 0 || y2 > H || y2 < 0;
      if (outOfBounds || life > ttl) {
        initParticle(i);
      }
    }

    function renderGlow() {
      ctx!.save();
      ctx!.filter = 'blur(8px) brightness(200%)';
      ctx!.globalCompositeOperation = 'lighter';
      ctx!.drawImage(canvas!, 0, 0);
      ctx!.restore();

      ctx!.save();
      ctx!.filter = 'blur(4px) brightness(200%)';
      ctx!.globalCompositeOperation = 'lighter';
      ctx!.drawImage(canvas!, 0, 0);
      ctx!.restore();
    }

    function renderToScreen() {
      ctx!.save();
      ctx!.globalCompositeOperation = 'lighter';
      ctx!.drawImage(canvas!, 0, 0);
      ctx!.restore();
    }

    function frame() {
      tick++;
      const W = canvas!.width;
      const H = canvas!.height;

      ctx!.clearRect(0, 0, W, H);

      for (let i = 0; i < PROPS_LENGTH; i += PROP_COUNT) {
        updateParticle(i);
      }

      renderGlow();
      renderToScreen();

      raf = requestAnimationFrame(frame);
    }

    function resize() {
      canvas!.width = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
      center = [0.5 * canvas!.width, 0.5 * canvas!.height];
      initParticles();
    }

    const obs = new ResizeObserver(resize);
    obs.observe(canvas);
    resize();
    frame();

    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
    };
  }, []);

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,color-mix(in_oklch,var(--background)_82%,white)_0%,color-mix(in_oklch,var(--secondary)_8%,var(--background))_70%,color-mix(in_oklch,var(--accent)_8%,var(--background))_100%)] dark:bg-[linear-gradient(to_bottom,color-mix(in_oklch,var(--background)_96%,var(--secondary))_0%,var(--background)_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.2),transparent_38%)] dark:bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.05),transparent_38%)]" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
