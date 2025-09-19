import type { Request, Response } from 'express';

// Convert hex to Lab via sRGB -> XYZ -> Lab
const hexToRgb = (hex: string) => {
  const v = hex.replace('#', '');
  const r = parseInt(v.slice(0, 2), 16) / 255;
  const g = parseInt(v.slice(2, 4), 16) / 255;
  const b = parseInt(v.slice(4, 6), 16) / 255;
  return { r, g, b };
};

const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

const rgbToXyz = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  const x = R * 0.4124 + G * 0.3576 + B * 0.1805;
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const z = R * 0.0193 + G * 0.1192 + B * 0.9505;
  return { x, y, z };
};

const xyzToLab = ({ x, y, z }: { x: number; y: number; z: number }) => {
  // D65 reference white
  const Xn = 0.95047;
  const Yn = 1.0;
  const Zn = 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x / Xn);
  const fy = f(y / Yn);
  const fz = f(z / Zn);
  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);
  return { L, a, b };
};

const deltaE76 = (lab1: { L: number; a: number; b: number }, lab2: { L: number; a: number; b: number }) => {
  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  const de = Math.sqrt(dL * dL + da * da + db * db);
  return de;
};

export const postPlay = (req: Request, res: Response) => {
  const { targetHex, userHex } = req.body as { targetHex?: string; userHex?: string };
  if (!targetHex || !userHex) {
    res.status(400).json({ message: 'targetHex and userHex are required' });
    return;
  }
  const targetLab = xyzToLab(rgbToXyz(hexToRgb(targetHex)));
  const userLab = xyzToLab(rgbToXyz(hexToRgb(userHex)));
  const de = deltaE76(targetLab, userLab);
  // Normalize to 0..100 score — approximate max distance ~100
  const score = Math.max(0, Math.min(100, Math.round(100 - de)));
  res.json({ score });
};


