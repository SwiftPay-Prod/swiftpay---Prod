'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/utils/utils';
import type { LiveBalanceBackgroundProps } from './types';

interface GLProgram extends WebGLProgram {
  resolution: WebGLUniformLocation | null;
  time: WebGLUniformLocation | null;
  u_color: WebGLUniformLocation | null;
}

const fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
uniform vec3 u_color;

#define FC gl_FragCoord.xy
#define R resolution
#define T (time+660.)

float rnd(vec2 p){p=fract(p*vec2(12.9898,78.233));p+=dot(p,p+34.56);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(rnd(i),rnd(i+vec2(1,0)),u.x),mix(rnd(i+vec2(0,1)),rnd(i+1.),u.x),u.y);}
float fbm(vec2 p){float t=.0,a=1.;for(int i=0;i<5;i++){t+=a*noise(p);p*=mat2(1,-1.2,.2,1.2)*2.;a*=.5;}return t;}

void main(){
  vec2 uv=(FC-.5*R)/R.y;
  vec3 col=vec3(1);
  uv.x+=.25;
  uv*=vec2(2,1);

  float n=fbm(uv*.28-vec2(T*.01,0));
  n=noise(uv*3.+n*2.);

  col.r-=fbm(uv+vec2(0,T*.015)+n);
  col.g-=fbm(uv*1.003+vec2(0,T*.015)+n+.003);
  col.b-=fbm(uv*1.006+vec2(0,T*.015)+n+.006);

  col=mix(col, u_color, dot(col,vec3(.21,.71,.07)));

  col=mix(vec3(.08),col,min(time*.1,1.));
  col=clamp(col,.08,1.);
  O=vec4(col,1);
}`;

class Renderer {
  private readonly vertexSrc = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;

  private readonly vertices = [-1, 1, -1, -1, 1, 1, 1, -1];
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  private program: GLProgram | null = null;
  private vs: WebGLShader | null = null;
  private fs: WebGLShader | null = null;
  private buffer: WebGLBuffer | null = null;
  private color: [number, number, number] = [0.5, 0.5, 0.5];

  constructor(canvas: HTMLCanvasElement, fragmentSource: string) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
    this.setup(fragmentSource);
    this.init();
  }

  updateColor(newColor: [number, number, number]) {
    this.color = newColor;
  }

  updateScale() {
    const dpr = Math.max(1, window.devicePixelRatio);
    const { innerWidth: width, innerHeight: height } = window;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  private compile(shader: WebGLShader, source: string) {
    const gl = this.gl;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(`Shader compilation error: ${gl.getShaderInfoLog(shader)}`);
    }
  }

  reset() {
    const { gl, program, vs, fs } = this;
    if (!program) return;
    if (vs) {
      gl.detachShader(program, vs);
      gl.deleteShader(vs);
    }
    if (fs) {
      gl.detachShader(program, fs);
      gl.deleteShader(fs);
    }
    gl.deleteProgram(program);
    this.program = null;
  }

  private setup(fragmentSource: string) {
    const gl = this.gl;
    this.vs = gl.createShader(gl.VERTEX_SHADER);
    this.fs = gl.createShader(gl.FRAGMENT_SHADER);
    const program = gl.createProgram() as GLProgram | null;
    if (!this.vs || !this.fs || !program) return;
    this.compile(this.vs, this.vertexSrc);
    this.compile(this.fs, fragmentSource);
    
    gl.attachShader(program, this.vs);
    gl.attachShader(program, this.fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(`Program linking error: ${gl.getProgramInfoLog(program)}`);
    }
    
    const glProgram = program as GLProgram;
    glProgram.resolution = gl.getUniformLocation(program, 'resolution');
    glProgram.time = gl.getUniformLocation(program, 'time');
    glProgram.u_color = gl.getUniformLocation(program, 'u_color');
    this.program = glProgram;
  }

  private init() {
    const { gl, program } = this;
    if (!program) return;
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    Object.assign(program, {
      resolution: gl.getUniformLocation(program, 'resolution'),
      time: gl.getUniformLocation(program, 'time'),
      u_color: gl.getUniformLocation(program, 'u_color'),
    });
  }

  render(now = 0) {
    const { gl, program, buffer, canvas } = this;
    if (!program || !gl.isProgram(program)) return;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const glProgram = program as GLProgram;
    gl.uniform2f(glProgram.resolution, canvas.width, canvas.height);
    gl.uniform1f(glProgram.time, now * 1e-3);
    gl.uniform3fv(glProgram.u_color, this.color);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

function getCSSVariableAsRgb(variableName: string): [number, number, number] {
  if (typeof window === 'undefined') {
    return [0.5, 0.5, 0.5];
  }

  const computedStyle = getComputedStyle(document.documentElement);
  const colorValue = computedStyle.getPropertyValue(variableName).trim();

  if (!colorValue) {
    return [0.5, 0.5, 0.5];
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [0.5, 0.5, 0.5];

  ctx.fillStyle = colorValue;
  ctx.fillRect(0, 0, 1, 1);
  const imageDataObj = ctx.getImageData(0, 0, 1, 1);
  
  if (!imageDataObj?.data) {
    return [0.5, 0.5, 0.5];
  }

  const data = imageDataObj.data as Uint8ClampedArray;
  const r = Math.min(255, data[0] ?? 128) / 255;
  const g = Math.min(255, data[1] ?? 128) / 255;
  const b = Math.min(255, data[2] ?? 128) / 255;
  return [r, g, b];
}

export function SpookySmokeBackground({ className }: LiveBalanceBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const renderer = new Renderer(canvas, fragmentShaderSource);
    rendererRef.current = renderer;

    const accentColor = getCSSVariableAsRgb('--accent');
    renderer.updateColor(accentColor);

    const handleResize = () => renderer.updateScale();
    handleResize();
    window.addEventListener('resize', handleResize);

    let animationFrameId: number;
    const loop = (now: number) => {
      renderer.render(now);
      animationFrameId = requestAnimationFrame(loop);
    };
    loop(0);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.reset();
    };
  }, []);

  return (
    <div className={cn('absolute inset-0 overflow-hidden bg-background', className)}>
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
