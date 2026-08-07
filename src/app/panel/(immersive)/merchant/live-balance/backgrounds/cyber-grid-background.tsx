'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/utils/utils';
import type { LiveBalanceBackgroundProps } from './types';
import { mixRgb, resolveRuntimePalette } from './color-utils';

const VERT = `#version 300 es
precision highp float;
in vec2 a_pos;
out vec2 v_uv;
void main(){
  v_uv = (a_pos * 0.5) + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;

uniform float u_t;
uniform vec2  u_res;
uniform vec3  u_c0;
uniform vec3  u_c1;
uniform vec3  u_c2;
uniform vec3  u_c3;
uniform vec3  u_bg;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i),            hash(i + vec2(1,0)), u.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
}

float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  for(int i = 0; i < 5; i++){
    v += a * noise(p); p *= 2.2; a *= 0.5;
  }
  return v;
}

float grid(vec2 uv, float cells, float thick){
  vec2 g = fract(uv * cells);
  float lx = smoothstep(thick, 0.0, min(g.x, 1.0 - g.x));
  float ly = smoothstep(thick, 0.0, min(g.y, 1.0 - g.y));
  return max(lx, ly);
}

vec3 pickColor(float id){
  if(id < 0.25) return u_c0;
  if(id < 0.5)  return u_c1;
  if(id < 0.75) return u_c2;
  return u_c3;
}

void main(){
  vec2 uv = v_uv;
  uv.y = 1.0 - uv.y;

  float t = u_t * 0.28;

  vec2 distort = vec2(
    fbm(uv * 3.2 + vec2(t * 0.7, t * 0.4)),
    fbm(uv * 3.2 + vec2(-t * 0.5, t * 0.9))
  );
  vec2 warped = uv + (distort - 0.5) * 0.25;

  float g1 = grid(warped + t * 0.04, 12.0, 0.04);
  float g2 = grid(warped * 0.5 + vec2(t * 0.02, -t * 0.03), 5.0, 0.05);

  float colId = hash(floor(warped * 12.0) + floor(t * 0.15));
  vec3 lineCol = pickColor(colId);

  float pulse = 0.5 + 0.5 * sin(t * 2.8 + uv.x * 6.0 + uv.y * 4.0 + fbm(uv * 4.0 + t) * 3.0);
  float glow  = max(g1, g2 * 0.7) * (0.55 + pulse * 0.45);

  vec3 bg  = u_bg;
  vec3 col = mix(bg, lineCol, glow * 0.58);

  float scan = 0.03 * sin((uv.y * u_res.y * 0.5) + t * 18.0);
  col += scan * lineCol * 0.09;

  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

function compileShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function buildProgram(gl: WebGL2RenderingContext): WebGLProgram | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERT);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    gl.deleteProgram(prog);
    return null;
  }
  return prog;
}

export function CyberGridBackground({ className }: LiveBalanceBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2');
    if (!gl) return;

    const prog = buildProgram(gl);
    if (!prog) return;

    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    const uT   = gl.getUniformLocation(prog, 'u_t');
    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uC0  = gl.getUniformLocation(prog, 'u_c0');
    const uC1  = gl.getUniformLocation(prog, 'u_c1');
    const uC2  = gl.getUniformLocation(prog, 'u_c2');
    const uC3  = gl.getUniformLocation(prog, 'u_c3');
    const uBg  = gl.getUniformLocation(prog, 'u_bg');

    const pal = resolveRuntimePalette();
    function norm(c: [number, number, number]): [number, number, number] {
      return [c[0] / 255, c[1] / 255, c[2] / 255];
    }
    const c0 = norm(mixRgb(pal.accent, pal.background, 0.1));
    const c1 = norm(mixRgb(pal.secondary, pal.background, 0.12));
    const c2 = norm(mixRgb(pal.accent, pal.secondary, 0.5));
    const c3 = norm(mixRgb(pal.foreground, pal.accent, 0.3));
    const bg = norm(pal.background);

    let raf = 0;

    function resize() {
      canvas!.width  = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }

    function frame(ts: number) {
      gl!.useProgram(prog);
      gl!.uniform1f(uT, ts / 1000);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform3fv(uC0, c0);
      gl!.uniform3fv(uC1, c1);
      gl!.uniform3fv(uC2, c2);
      gl!.uniform3fv(uC3, c3);
      gl!.uniform3fv(uBg, bg);
      gl!.bindVertexArray(vao);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      gl!.bindVertexArray(null);
      raf = requestAnimationFrame(frame);
    }

    const obs = new ResizeObserver(resize);
    obs.observe(canvas);
    resize();
    raf = requestAnimationFrame(frame);

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
