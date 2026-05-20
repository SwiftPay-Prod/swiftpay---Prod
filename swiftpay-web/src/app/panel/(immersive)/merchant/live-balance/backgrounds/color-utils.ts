'use client';

export type Rgb = [number, number, number];

export interface RuntimePalette {
  accent: Rgb;
  secondary: Rgb;
  success: Rgb;
  warning: Rgb;
  danger: Rgb;
  background: Rgb;
  foreground: Rgb;
  isLight: boolean;
}

let _resolveCtx: CanvasRenderingContext2D | null = null;

function getResolveCtx(): CanvasRenderingContext2D | null {
  if (!_resolveCtx) {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 1;
    _resolveCtx = c.getContext('2d', { willReadFrequently: true }) ?? null;
  }
  return _resolveCtx;
}

function resolveColorRgb(cssVar: string): Rgb {
  const el = document.createElement('div');
  el.style.color = cssVar;
  el.style.position = 'fixed';
  el.style.pointerEvents = 'none';
  el.style.opacity = '0';
  document.body.appendChild(el);
  const computed = getComputedStyle(el).color;
  document.body.removeChild(el);

  const rgbMatch = computed.match(/^rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (rgbMatch) return [+rgbMatch[1]!, +rgbMatch[2]!, +rgbMatch[3]!];

  const srgbMatch = computed.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i);
  if (srgbMatch) {
    return [
      Math.round(parseFloat(srgbMatch[1]!) * 255),
      Math.round(parseFloat(srgbMatch[2]!) * 255),
      Math.round(parseFloat(srgbMatch[3]!) * 255),
    ];
  }

  const ctx = getResolveCtx();
  if (ctx) {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillStyle = computed;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    if (d[3]! > 0) return [d[0]!, d[1]!, d[2]!];
  }

  return [130, 90, 255];
}

export function resolveColor(cssVar: string): string {
  const el = document.createElement('div');
  el.style.color = cssVar;
  el.style.position = 'fixed';
  el.style.pointerEvents = 'none';
  el.style.opacity = '0';
  document.body.appendChild(el);
  const color = getComputedStyle(el).color;
  document.body.removeChild(el);
  return color;
}

export function parseRgb(color: string): Rgb {
  const match = color.match(/\d+/g);
  return match ? [parseInt(match[0]!, 10), parseInt(match[1]!, 10), parseInt(match[2]!, 10)] : [130, 90, 255];
}

export function toRgba(color: Rgb, alpha: number): string {
  return `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
}

export function mixRgb(a: Rgb, b: Rgb, ratio: number): Rgb {
  const safeRatio = Math.max(0, Math.min(1, ratio));
  const inverse = 1 - safeRatio;
  return [
    Math.round(a[0] * inverse + b[0] * safeRatio),
    Math.round(a[1] * inverse + b[1] * safeRatio),
    Math.round(a[2] * inverse + b[2] * safeRatio),
  ];
}

export function getLuminance(color: Rgb): number {
  return (0.2126 * color[0] + 0.7152 * color[1] + 0.0722 * color[2]) / 255;
}

export function resolveRuntimePalette(): RuntimePalette {
  const background = resolveColorRgb('var(--background)');
  const foreground = resolveColorRgb('var(--foreground)');
  return {
    accent: resolveColorRgb('var(--accent)'),
    secondary: resolveColorRgb('var(--secondary)'),
    success: resolveColorRgb('var(--success)'),
    warning: resolveColorRgb('var(--warning)'),
    danger: resolveColorRgb('var(--danger)'),
    background,
    foreground,
    isLight: getLuminance(background) > 0.62,
  };
}
