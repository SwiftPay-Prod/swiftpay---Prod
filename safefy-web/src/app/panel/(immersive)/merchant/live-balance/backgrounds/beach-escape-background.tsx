'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/utils/utils';
import type { LiveBalanceBackgroundProps } from './types';

interface WaveLayer {
  amplitude: number;
  wavelength: number;
  speed: number;
  y: number;
  color: string;
  foam: string;
}

interface PalmLeaf {
  length: number;
  bend: number;
  width: number;
}

interface Cloud {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

function buildWaveLayers(height: number): WaveLayer[] {
  return [
    {
      amplitude: height * 0.018,
      wavelength: 0.012,
      speed: 0.65,
      y: height * 0.63,
      color: 'rgba(16, 133, 163, 0.76)',
      foam: 'rgba(255,255,255,0.42)',
    },
    {
      amplitude: height * 0.022,
      wavelength: 0.015,
      speed: 0.48,
      y: height * 0.71,
      color: 'rgba(11, 108, 153, 0.82)',
      foam: 'rgba(255,255,255,0.34)',
    },
    {
      amplitude: height * 0.028,
      wavelength: 0.019,
      speed: 0.3,
      y: height * 0.8,
      color: 'rgba(14, 83, 128, 0.9)',
      foam: 'rgba(255,255,255,0.26)',
    },
  ];
}

function buildPalmLeaves(width: number): PalmLeaf[] {
  return Array.from({ length: 9 }).map((_, index) => ({
    length: width * (0.11 + (index % 4) * 0.018),
    bend: 0.18 + (index % 5) * 0.03,
    width: 1.4 + (index % 3) * 0.45,
  }));
}

function buildClouds(width: number, height: number): Cloud[] {
  return Array.from({ length: 6 }).map((_, index) => ({
    x: width * (0.08 + index * 0.15),
    y: height * (0.1 + (index % 3) * 0.07),
    width: width * (0.1 + (index % 3) * 0.03),
    height: height * (0.045 + (index % 2) * 0.012),
    speed: 0.18 + (index % 4) * 0.04,
  }));
}

export function BeachEscapeBackground({ className }: LiveBalanceBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const context = ctx;
    const canvasEl = canvas;
    let raf = 0;
    let waves = buildWaveLayers(canvasEl.offsetHeight || 800);
    let palmLeaves = buildPalmLeaves(canvasEl.offsetWidth || 1440);
    let clouds = buildClouds(canvasEl.offsetWidth || 1440, canvasEl.offsetHeight || 800);
    let time = 0;

    function resize() {
      canvasEl.width = canvasEl.offsetWidth;
      canvasEl.height = canvasEl.offsetHeight;
      waves = buildWaveLayers(canvasEl.height);
      palmLeaves = buildPalmLeaves(canvasEl.width);
      clouds = buildClouds(canvasEl.width, canvasEl.height);
    }

    function drawSky(width: number, height: number) {
      const skyGradient = context.createLinearGradient(0, 0, 0, height * 0.72);
      skyGradient.addColorStop(0, '#4cc5ff');
      skyGradient.addColorStop(0.26, '#88e4ff');
      skyGradient.addColorStop(0.62, '#ffd7a3');
      skyGradient.addColorStop(1, '#ffb36f');
      context.fillStyle = skyGradient;
      context.fillRect(0, 0, width, height);

      const sun = context.createRadialGradient(width * 0.78, height * 0.24, 0, width * 0.78, height * 0.24, height * 0.22);
      sun.addColorStop(0, 'rgba(255,249,214,0.98)');
      sun.addColorStop(0.16, 'rgba(255,221,129,0.82)');
      sun.addColorStop(0.52, 'rgba(255,189,92,0.24)');
      sun.addColorStop(1, 'rgba(255,189,92,0)');
      context.fillStyle = sun;
      context.fillRect(0, 0, width, height);
    }

    function drawCloudLayer(width: number, height: number, phase: number) {
      clouds.forEach((cloud) => {
        const x = (cloud.x + phase * 24 * cloud.speed) % (width + cloud.width * 1.8) - cloud.width * 0.9;
        const y = cloud.y + Math.sin(phase * cloud.speed + cloud.x * 0.0008) * 4;
        const cloudGradient = context.createRadialGradient(x, y, 0, x, y, cloud.width * 0.6);
        cloudGradient.addColorStop(0, 'rgba(255,255,255,0.74)');
        cloudGradient.addColorStop(0.65, 'rgba(255,255,255,0.28)');
        cloudGradient.addColorStop(1, 'rgba(255,255,255,0)');
        context.fillStyle = cloudGradient;

        context.beginPath();
        context.ellipse(x, y, cloud.width * 0.4, cloud.height * 0.6, 0, 0, Math.PI * 2);
        context.ellipse(x + cloud.width * 0.2, y - cloud.height * 0.14, cloud.width * 0.26, cloud.height * 0.52, 0, 0, Math.PI * 2);
        context.ellipse(x - cloud.width * 0.18, y - cloud.height * 0.1, cloud.width * 0.24, cloud.height * 0.48, 0, 0, Math.PI * 2);
        context.fill();
      });
    }

    function drawSea(width: number, height: number) {
      const seaGradient = context.createLinearGradient(0, height * 0.6, 0, height);
      seaGradient.addColorStop(0, 'rgba(64,206,226,0.74)');
      seaGradient.addColorStop(0.46, 'rgba(14,128,185,0.9)');
      seaGradient.addColorStop(1, 'rgba(5,50,99,0.98)');
      context.fillStyle = seaGradient;
      context.fillRect(0, height * 0.56, width, height * 0.44);

      context.strokeStyle = 'rgba(255,255,255,0.34)';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(0, height * 0.58);
      context.quadraticCurveTo(width * 0.4, height * 0.55, width, height * 0.59);
      context.stroke();
    }

    function drawIsland(width: number, height: number) {
      context.save();
      context.fillStyle = 'rgba(31,70,76,0.42)';
      context.beginPath();
      context.moveTo(width * 0.1, height * 0.58);
      context.quadraticCurveTo(width * 0.18, height * 0.53, width * 0.28, height * 0.58);
      context.lineTo(width * 0.1, height * 0.58);
      context.fill();
      context.restore();
    }

    function drawBeach(width: number, height: number) {
      const beachGradient = context.createLinearGradient(0, height * 0.82, 0, height);
      beachGradient.addColorStop(0, 'rgba(255,222,148,0.94)');
      beachGradient.addColorStop(0.4, 'rgba(235,191,116,0.98)');
      beachGradient.addColorStop(1, 'rgba(171,117,60,1)');
      context.fillStyle = beachGradient;
      context.beginPath();
      context.moveTo(0, height * 0.9);
      context.quadraticCurveTo(width * 0.24, height * 0.82, width * 0.52, height * 0.9);
      context.quadraticCurveTo(width * 0.7, height * 0.96, width, height * 0.84);
      context.lineTo(width, height);
      context.lineTo(0, height);
      context.closePath();
      context.fill();

      const wetSand = context.createLinearGradient(0, height * 0.8, 0, height * 0.9);
      wetSand.addColorStop(0, 'rgba(213,172,105,0)');
      wetSand.addColorStop(1, 'rgba(141,96,53,0.42)');
      context.fillStyle = wetSand;
      context.fillRect(0, height * 0.8, width, height * 0.12);
    }

    function drawWaveLayer(layer: WaveLayer, width: number, height: number, phase: number) {
      context.beginPath();
      context.moveTo(0, height);
      for (let x = 0; x <= width; x += 6) {
        const y = layer.y + Math.sin(x * layer.wavelength + phase * layer.speed) * layer.amplitude;
        context.lineTo(x, y);
      }
      context.lineTo(width, height);
      context.closePath();
      context.fillStyle = layer.color;
      context.fill();

      context.beginPath();
      for (let x = 0; x <= width; x += 8) {
        const y = layer.y + Math.sin(x * layer.wavelength + phase * layer.speed) * layer.amplitude;
        if (x === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.strokeStyle = layer.foam;
      context.lineWidth = 2.2;
      context.stroke();
    }

    function drawReflection(width: number, height: number, phase: number) {
      const glow = context.createLinearGradient(width * 0.72, height * 0.28, width * 0.62, height * 0.84);
      glow.addColorStop(0, 'rgba(255,250,214,0.42)');
      glow.addColorStop(0.5, 'rgba(255,232,173,0.12)');
      glow.addColorStop(1, 'rgba(255,232,173,0)');
      context.save();
      context.translate(Math.sin(phase * 0.22) * 10, 0);
      context.fillStyle = glow;
      context.beginPath();
      context.moveTo(width * 0.67, height * 0.34);
      context.quadraticCurveTo(width * 0.7, height * 0.55, width * 0.58, height * 0.88);
      context.quadraticCurveTo(width * 0.66, height * 0.6, width * 0.73, height * 0.35);
      context.closePath();
      context.fill();
      context.restore();
    }

    function drawShoreFoam(width: number, height: number, phase: number) {
      context.save();
      context.beginPath();
      for (let x = 0; x <= width; x += 8) {
        const y = height * 0.83 + Math.sin(x * 0.015 + phase * 1.8) * 7 + Math.cos(x * 0.008 + phase * 1.2) * 5;
        if (x === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.strokeStyle = 'rgba(255,255,255,0.55)';
      context.lineWidth = 5;
      context.shadowColor = 'rgba(255,255,255,0.18)';
      context.shadowBlur = 12;
      context.stroke();
      context.restore();
    }

    function drawPalmSilhouette(width: number, height: number, phase: number) {
      context.save();
      context.translate(width * 0.08, height * 0.96);
      context.rotate(-0.18);

      context.beginPath();
      context.moveTo(0, 0);
      context.bezierCurveTo(width * 0.02, -height * 0.18, width * 0.05, -height * 0.42, width * 0.1, -height * 0.72);
      context.lineWidth = 16;
      context.strokeStyle = 'rgba(51, 31, 12, 0.82)';
      context.lineCap = 'round';
      context.stroke();

      const sway = Math.sin(phase * 0.35) * 0.1;
      palmLeaves.forEach((leaf, index) => {
        context.save();
        context.translate(width * 0.1, -height * 0.72);
        context.rotate(-1.15 + index * 0.2 + sway);
        context.beginPath();
        context.moveTo(0, 0);
        context.quadraticCurveTo(leaf.length * 0.42, -leaf.length * leaf.bend, leaf.length, -leaf.length * 0.08);
        context.strokeStyle = 'rgba(19, 70, 42, 0.74)';
        context.lineWidth = leaf.width;
        context.lineCap = 'round';
        context.stroke();
        context.restore();
      });

      context.restore();
    }

    function drawBirds(width: number, height: number, phase: number) {
      context.save();
      context.strokeStyle = 'rgba(84, 74, 68, 0.42)';
      context.lineWidth = 2;
      const flockX = width * 0.18 + ((phase * 22) % (width * 1.2));
      const flockY = height * 0.18 + Math.sin(phase * 0.45) * 12;

      for (let index = 0; index < 4; index += 1) {
        const x = flockX + index * 26;
        const y = flockY + (index % 2) * 8;
        context.beginPath();
        context.arc(x, y, 8, Math.PI * 1.1, Math.PI * 1.9);
        context.arc(x + 16, y, 8, Math.PI * 1.1, Math.PI * 1.9);
        context.stroke();
      }

      context.restore();
    }

    function frame() {
      const width = canvasEl.width;
      const height = canvasEl.height;
      time += 0.012;

      context.clearRect(0, 0, width, height);
      drawSky(width, height);
      drawCloudLayer(width, height, time);
      drawSea(width, height);
      drawIsland(width, height);
      drawReflection(width, height, time);
      waves.forEach((layer, index) => drawWaveLayer(layer, width, height, time + index * 0.9));
      drawBeach(width, height);
      drawShoreFoam(width, height, time);
      drawPalmSilhouette(width, height, time);
      drawBirds(width, height, time);

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

  return <canvas ref={canvasRef} className={cn('absolute inset-0 h-full w-full', className)} />;
}