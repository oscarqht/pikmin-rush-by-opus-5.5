/* Bulborb Rush — procedural art core: sprite cache + painterly drawing helpers.
   All game graphics are generated at runtime with Canvas 2D vector drawing. */
import { PTD, U } from './core';

export const Art: any = (PTD.Art = {
  RES: 2,
  cache: new Map<string, any>(),
  OUT: '#25150b', // ink outline colour
});

Art.setRes = function (r: number) {
  r = U.clamp(Math.round(r * 2) / 2, 1, 3);
  if (r !== Art.RES) {
    Art.RES = r;
    Art.cache.clear();
  }
};

Art.canvas = function (w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
};

/** Get (or lazily paint) a cached sprite. Anchor (ax, ay) is where (0,0) of the drawing lands. */
Art.sprite = function (key: string, w: number, h: number, ax: number, ay: number, fn: (g: CanvasRenderingContext2D) => void) {
  let s = Art.cache.get(key);
  if (!s) {
    const R = Art.RES;
    const c = Art.canvas(w * R, h * R);
    const g = c.getContext('2d')!;
    g.scale(R, R);
    g.translate(ax, ay);
    g.lineJoin = 'round';
    g.lineCap = 'round';
    fn(g);
    s = { c, w, h, ax, ay, key };
    Art.cache.set(key, s);
    // if the browser evicts this canvas under memory pressure, repaint on next use
    c.addEventListener('contextlost', () => { if (Art.cache.get(key) === s) Art.cache.delete(key); });
  }
  return s;
};

/** White silhouette of a sprite (hit flash) */
Art.flash = function (s: any) {
  const key = s.key + '|flash';
  let f = Art.cache.get(key);
  if (!f) {
    const c = Art.canvas(s.c.width, s.c.height);
    const g = c.getContext('2d')!;
    g.drawImage(s.c, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.fillRect(0, 0, c.width, c.height);
    f = { c, w: s.w, h: s.h, ax: s.ax, ay: s.ay, key };
    Art.cache.set(key, f);
  }
  return f;
};

/** Tinted silhouette (frozen / poisoned look) */
Art.tint = function (s: any, color: string, alpha: number) {
  const key = s.key + '|tint' + color + alpha;
  let f = Art.cache.get(key);
  if (!f) {
    const c = Art.canvas(s.c.width, s.c.height);
    const g = c.getContext('2d')!;
    g.drawImage(s.c, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.globalAlpha = alpha;
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
    f = { c, w: s.w, h: s.h, ax: s.ax, ay: s.ay, key };
    Art.cache.set(key, f);
  }
  return f;
};

Art.blit = function (ctx: CanvasRenderingContext2D, s: any, x: number, y: number, flip?: boolean, scale?: number, alpha?: number, rot?: number) {
  if (!flip && !scale && !rot && alpha == null) {
    ctx.drawImage(s.c, x - s.ax, y - s.ay, s.w, s.h);
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  if (flip) ctx.scale(-1, 1);
  if (scale && scale !== 1) ctx.scale(scale, scale);
  if (alpha != null) ctx.globalAlpha *= alpha;
  ctx.drawImage(s.c, -s.ax, -s.ay, s.w, s.h);
  ctx.restore();
};

/* ===================== drawing helpers ===================== */
export const H: any = (Art.H = {});
export const OUT: string = Art.OUT;

H.ell = (g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rot?: number) => g.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, Math.PI * 2);
H.circ = (g: CanvasRenderingContext2D, x: number, y: number, r: number) => g.arc(x, y, Math.max(0.01, r), 0, Math.PI * 2);

/** fill current path & outline it */
H.fs = function (g: CanvasRenderingContext2D, fill?: any, lw?: number, stroke?: string) {
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (lw) {
    g.lineWidth = lw;
    g.strokeStyle = stroke || OUT;
    g.stroke();
  }
};

/** Painterly radial gradient for a volume: highlight upper-left, shadow lower-right */
H.vol = function (g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, base: string, hi?: number, lo?: number) {
  const r = Math.max(rx, ry);
  const gr = g.createRadialGradient(x - rx * 0.35, y - ry * 0.45, r * 0.05, x - rx * 0.1, y - ry * 0.1, r * 1.25);
  gr.addColorStop(0, U.shade(base, hi == null ? 0.42 : hi));
  gr.addColorStop(0.45, base);
  gr.addColorStop(1, U.shade(base, lo == null ? -0.42 : lo));
  return gr;
};

H.lin = function (g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, stops: any[]) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  stops.forEach((s: any, i: number) => gr.addColorStop(s[0] != null && typeof s[0] === 'number' ? s[0] : i / (stops.length - 1), s[1] || s));
  return gr;
};

/** shaded ellipse "blob" with outline */
H.blob = function (g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, base: string, lw?: number, rot?: number, hi?: number, lo?: number) {
  g.beginPath();
  H.ell(g, x, y, rx, ry, rot);
  H.fs(g, H.vol(g, x, y, rx, ry, base, hi, lo), lw == null ? 2 : lw);
};

/** glossy specular highlight */
H.shine = function (g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rot?: number, a?: number) {
  g.save();
  g.globalAlpha = a == null ? 0.7 : a;
  g.fillStyle = '#ffffff';
  g.beginPath();
  H.ell(g, x, y, rx, ry, rot || -0.5);
  g.fill();
  g.restore();
};

/** soft ground shadow */
H.shadow = function (g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, a?: number) {
  g.save();
  g.fillStyle = `rgba(28,32,12,${a == null ? 0.3 : a})`;
  g.beginPath();
  H.ell(g, x, y, rx, ry);
  g.fill();
  g.restore();
};

/** thick limb line with ink outline */
H.limb = function (g: CanvasRenderingContext2D, pts: number[], color: string, w: number, ow?: number) {
  g.beginPath();
  g.moveTo(pts[0], pts[1]);
  if (pts.length === 4) g.lineTo(pts[2], pts[3]);
  else if (pts.length === 6) g.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]);
  else for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  g.lineWidth = w + (ow == null ? 2 : ow);
  g.strokeStyle = OUT;
  g.stroke();
  g.lineWidth = w;
  g.strokeStyle = color;
  g.stroke();
};

/** cartoon eye: white, pupil, glint. look = pupil offset direction */
H.eye = function (g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, pr: number, lookX?: number, lookY?: number, irisColor?: string, lw?: number) {
  g.beginPath();
  H.ell(g, x, y, rx, ry);
  H.fs(g, '#fffdf5', lw == null ? 1 : lw);
  const px = x + (lookX || 0) * (rx - pr * 0.8);
  const py = y + (lookY || 0) * (ry - pr * 0.8);
  if (irisColor) {
    g.beginPath();
    H.circ(g, px, py, pr * 1.35);
    g.fillStyle = irisColor;
    g.fill();
  }
  g.beginPath();
  H.circ(g, px, py, pr);
  g.fillStyle = '#120a06';
  g.fill();
  g.beginPath();
  H.circ(g, px - pr * 0.35, py - pr * 0.4, pr * 0.38);
  g.fillStyle = '#ffffff';
  g.fill();
};

/** clip to current path and run fn */
H.clipTo = function (g: CanvasRenderingContext2D, pathFn: (g: CanvasRenderingContext2D) => void, fn: (g: CanvasRenderingContext2D) => void) {
  g.save();
  g.beginPath();
  pathFn(g);
  g.clip();
  fn(g);
  g.restore();
};

/** five-point star path */
H.star = function (g: CanvasRenderingContext2D, x: number, y: number, r1: number, r2: number, n?: number, rot?: number) {
  n = n || 5;
  rot = rot == null ? -Math.PI / 2 : rot;
  g.moveTo(x + Math.cos(rot) * r1, y + Math.sin(rot) * r1);
  for (let i = 1; i < n * 2; i++) {
    const r = i % 2 ? r2 : r1;
    const a = rot + (i * Math.PI) / n;
    g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  g.closePath();
};

/** rounded rect path */
H.rr = function (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2);
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
};

/** irregular blob path (for bushes, rocks, water) */
H.wobble = function (g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rng: any, n?: number, amt?: number) {
  n = n || 10;
  amt = amt == null ? 0.18 : amt;
  const pts: number[][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (rng() * 2 - 1) * amt;
    pts.push([x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k]);
  }
  const mid = (p: number[], q: number[]) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  let m = mid(pts[n - 1], pts[0]);
  g.moveTo(m[0], m[1]);
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % n];
    m = mid(p, q);
    g.quadraticCurveTo(p[0], p[1], m[0], m[1]);
  }
  g.closePath();
};

/** Draw text with chunky outline (UI) */
H.text = function (g: CanvasRenderingContext2D, str: string, x: number, y: number, size: number, fill?: string, opt?: any) {
  opt = opt || {};
  g.save();
  g.font = `${opt.weight || ''} ${size}px ${opt.font || "'Lilita One', 'Trebuchet MS', sans-serif"}`;
  g.textAlign = opt.align || 'center';
  g.textBaseline = opt.base || 'middle';
  if (opt.shadow !== false) {
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillText(str, x, y + Math.max(1, size * 0.08));
  }
  if (opt.stroke !== false) {
    g.lineWidth = opt.lw || Math.max(2, size * 0.18);
    g.strokeStyle = opt.strokeColor || '#2a1608';
    g.lineJoin = 'round';
    g.strokeText(str, x, y);
  }
  g.fillStyle = fill || '#fff';
  g.fillText(str, x, y);
  g.restore();
};
