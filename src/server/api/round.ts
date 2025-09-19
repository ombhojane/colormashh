import type { Request, Response } from 'express';

// Deterministic daily color based on YYYY-MM-DD -> simple hash -> HSL -> hex
const dateKey = (): string => new Date().toISOString().slice(0, 10);

const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const hslToHex = (h: number, s: number, l: number): string => {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => Math.round(255 * x).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
};

export const getTodayRound = (_req: Request, res: Response) => {
  const key = dateKey();
  const h = hashString(key) % 360;
  const s = 60;
  const l = 50;
  const targetHex = hslToHex(h, s, l);
  res.json({ targetHex });
};


