'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/utils/utils';
import type { LiveBalanceBackgroundProps } from './types';
import { mixRgb, resolveRuntimePalette, toRgba } from './color-utils';

interface Streak {
  x: number;
  y: number;
  length: number;
  speed: number;
  width: number;
  alpha: number;
  color: [number, number, number];
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: [number, number, number];
}

const STREAK_COUNT = 34;
const SPARK_COUNT = 26;
const ANGLE = -0.34;

function createStreak(width: number, height: number, palette: ReturnType<typeof resolveRuntimePalette>): Streak {
  const colors: [number, number, number][] = [
    mixRgb(palette.danger, palette.warning, 0.15),
    mixRgb(palette.danger, palette.accent, 0.18),
    mixRgb(palette.warning, palette.foreground, 0.2),
    mixRgb(palette.danger, palette.foreground, 0.1),
  ];

  return {
    x: Math.random() * width * 1.3 - width * 0.15,
    y: Math.random() * height * 1.2 - height * 0.1,
    length: 120 + Math.random() * 260,
    speed: 12 + Math.random() * 18,
    width: 1 + Math.random() * 5,
    alpha: 0.08 + Math.random() * 0.26,
    color: colors[Math.floor(Math.random() * colors.length)] ?? palette.danger,
  };
}

function createSpark(width: number, height: number, palette: ReturnType<typeof resolveRuntimePalette>): Spark {
  const colors: [number, number, number][] = [
    mixRgb(palette.warning, palette.foreground, 0.12),
    mixRgb(palette.warning, palette.accent, 0.08),
    mixRgb(palette.danger, palette.warning, 0.35),
  ];

  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: 1.2 + Math.random() * 3,
    vy: -0.4 - Math.random() * 1.6,
    life: 0,
    maxLife: 50 + Math.random() * 70,
    size: 1.2 + Math.random() * 2.8,
    color: colors[Math.floor(Math.random() * colors.length)] ?? palette.warning,
  };
}

export function RossoVelocityBackground({ className }: LiveBalanceBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const canvasEl = canvas;
    const ctx = context;

    let raf = 0;
    let streaks: Streak[] = [];
    let sparks: Spark[] = [];
    const palette = resolveRuntimePalette();

    function resize() {
      canvasEl.width = canvasEl.offsetWidth;
      canvasEl.height = canvasEl.offsetHeight;
      streaks = Array.from({ length: STREAK_COUNT }, () => createStreak(canvasEl.width, canvasEl.height, palette));
      sparks = Array.from({ length: SPARK_COUNT }, () => createSpark(canvasEl.width, canvasEl.height, palette));
    }

    function drawBackground(width: number, height: number) {
      const baseGradient = ctx.createLinearGradient(0, 0, width, height);
      baseGradient.addColorStop(0, toRgba(mixRgb(palette.background, palette.danger, 0.22), 1));
      baseGradient.addColorStop(0.38, toRgba(mixRgb(palette.background, palette.danger, 0.44), 1));
      baseGradient.addColorStop(0.72, toRgba(mixRgb(palette.background, palette.warning, 0.18), 1));
      baseGradient.addColorStop(1, toRgba(mixRgb(palette.background, palette.foreground, 0.08), 1));
      ctx.fillStyle = baseGradient;
      ctx.fillRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(width * 0.82, height * 0.18, 0, width * 0.82, height * 0.18, width * 0.44);
      glow.addColorStop(0, toRgba(mixRgb(palette.warning, palette.foreground, 0.12), 0.42));
      glow.addColorStop(0.45, toRgba(mixRgb(palette.danger, palette.warning, 0.3), 0.16));
      glow.addColorStop(1, toRgba(palette.background, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    }

    function drawEnergyBands(width: number, height: number, phase: number) {
      ctx.save();
      ctx.translate(width * 0.5, height * 0.55);
      ctx.rotate(ANGLE);

      for (let index = 0; index < 4; index += 1) {
        const offset = (index - 1.5) * height * 0.12;
        const pulse = 0.72 + Math.sin(phase * 2.2 + index * 0.8) * 0.14;
        const bandGradient = ctx.createLinearGradient(-width * 0.58, offset, width * 0.58, offset);
        bandGradient.addColorStop(0, 'rgba(255,255,255,0)');
        bandGradient.addColorStop(0.2, `rgba(255,72,72,${0.06 * pulse})`);
        bandGradient.addColorStop(0.5, `rgba(255,115,115,${0.18 * pulse})`);
        bandGradient.addColorStop(0.82, `rgba(255,188,122,${0.1 * pulse})`);
        bandGradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = bandGradient;
        ctx.fillRect(-width * 0.62, offset - height * 0.032, width * 1.24, height * 0.064);
      }

      ctx.restore();

      const coreGlow = ctx.createRadialGradient(width * 0.68, height * 0.3, 0, width * 0.68, height * 0.3, width * 0.34);
      coreGlow.addColorStop(0, `rgba(255,120,120,${0.2 + Math.sin(phase * 2.4) * 0.04})`);
      coreGlow.addColorStop(0.45, 'rgba(255,94,94,0.12)');
      coreGlow.addColorStop(1, 'rgba(255,94,94,0)');
      ctx.fillStyle = coreGlow;
      ctx.fillRect(0, 0, width, height);
    }

    function drawStreak(streak: Streak, width: number, height: number) {
      const dx = Math.cos(ANGLE) * streak.length;
      const dy = Math.sin(ANGLE) * streak.length;
      const gradient = ctx.createLinearGradient(streak.x, streak.y, streak.x + dx, streak.y + dy);
      gradient.addColorStop(0, toRgba(streak.color, 0));
      gradient.addColorStop(0.18, toRgba(streak.color, streak.alpha * 0.25));
      gradient.addColorStop(0.6, toRgba(streak.color, streak.alpha));
      gradient.addColorStop(1, toRgba(streak.color, 0));

      ctx.beginPath();
      ctx.moveTo(streak.x, streak.y);
      ctx.lineTo(streak.x + dx, streak.y + dy);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = streak.width;
      ctx.lineCap = 'round';
      ctx.stroke();

      streak.x += Math.cos(ANGLE) * streak.speed;
      streak.y += Math.sin(ANGLE) * streak.speed;

      if (streak.x - streak.length > width || streak.y + streak.length < 0) {
        Object.assign(streak, createStreak(width, height, palette), {
          x: -width * 0.2,
          y: height * (0.6 + Math.random() * 0.45),
        });
      }
    }

    function drawSpark(spark: Spark, width: number, height: number) {
      spark.life += 1;
      spark.x += spark.vx;
      spark.y += spark.vy;
      const alpha = 1 - spark.life / spark.maxLife;

      const glow = ctx.createRadialGradient(spark.x, spark.y, 0, spark.x, spark.y, spark.size * 5);
      glow.addColorStop(0, toRgba(spark.color, alpha * 0.88));
      glow.addColorStop(1, toRgba(spark.color, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.size * 5, 0, Math.PI * 2);
      ctx.fill();

      if (spark.life >= spark.maxLife || spark.x > width + 50 || spark.y < -50) {
        Object.assign(spark, createSpark(width, height, palette), {
          x: width * (0.15 + Math.random() * 0.3),
          y: height * (0.72 + Math.random() * 0.22),
        });
      }
    }

    function frame() {
      const width = canvasEl.width;
      const height = canvasEl.height;
      const phase = performance.now() * 0.001;
      drawBackground(width, height);
      drawEnergyBands(width, height, phase);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      streaks.forEach((streak) => drawStreak(streak, width, height));
      sparks.forEach((spark) => drawSpark(spark, width, height));
      ctx.restore();

      raf = requestAnimationFrame(frame);
    }

    const observer = new ResizeObserver(resize);
    observer.observe(canvasEl);
    resize();
    frame();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={cn('absolute inset-0 h-full w-full bg-background', className)} />;
}
