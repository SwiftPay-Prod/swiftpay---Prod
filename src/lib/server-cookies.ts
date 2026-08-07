"use server";

import { cookies } from "next/headers";

/**
 * Helpers tipados para ler/escrever/appagar cookies no servidor.
 * Centralizam o acesso a `cookies()` da camada Server da Next (App Router),
 * evitando duplicação e casting em session.ts/route handlers.
 */

type CookieOpts = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
  path?: string;
};

function buildOptions(opts: CookieOpts = {}): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  path: string;
} {
  return {
    httpOnly: opts.httpOnly ?? false,
    secure: opts.secure ?? process.env.NODE_ENV === "production",
    sameSite: opts.sameSite ?? "lax",
    path: opts.path ?? "/",
  };
}

export async function readCookie(name: string): Promise<string | null> {
  const store = await cookies();
  return store.get(name)?.value ?? null;
}

export async function setCookie(
  name: string,
  value: string,
  opts: CookieOpts = {}
): Promise<void> {
  const store = await cookies();
  store.set(name, value, buildOptions(opts));
}

export async function deleteCookie(name: string): Promise<void> {
  const store = await cookies();
  store.delete(name);
}

export async function readParsedCookie<T>(name: string): Promise<T | null> {
  const raw = await readCookie(name);
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as T;
  } catch {
    return null;
  }
}