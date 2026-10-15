/* Bulborb Rush — core utilities & namespace */
export const PTD: any = ((window as any).PTD = (window as any).PTD || {});
PTD.W = 1280;
PTD.H = 720;

const _shadeCache = new Map();
function hexToRgb(hex: string) {
  if (hex[0] === '#') hex = hex.slice(1);
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const U = (PTD.U = {
  TAU: Math.PI * 2,
  rand: (a: number, b: number) => a + Math.random() * (b - a),
  randi: (a: number, b: number) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)],
  clamp: (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v),
  lerp: (a: number, b: number, t: number) => a + (b - a) * t,
  dist: (ax: number, ay: number, bx: number, by: number) => Math.hypot(bx - ax, by - ay),
  dist2: (ax: number, ay: number, bx: number, by: number) => (bx - ax) * (bx - ax) + (by - ay) * (by - ay),
  easeOutBack: (t: number) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInCubic: (t: number) => t * t * t,
  easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  hexToRgb,
  /** deterministic RNG */
  rng(seed: number) {
    let a = seed >>> 0;
    const f: any = function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.range = (lo: number, hi: number) => lo + f() * (hi - lo);
    f.int = (lo: number, hi: number) => Math.floor(lo + f() * (hi - lo + 1));
    f.pick = <T>(arr: T[]): T => arr[Math.floor(f() * arr.length)];
    return f;
  },
  /** lighten (amt>0) or darken (amt<0) a hex colour → css rgb() */
  shade(hex: string, amt: number) {
    const k = hex + '|' + amt;
    let v = _shadeCache.get(k);
    if (v) return v;
    const [r, g, b] = hexToRgb(hex);
    const f = (c: number) => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt));
    v = `rgb(${f(r)},${f(g)},${f(b)})`;
    _shadeCache.set(k, v);
    return v;
  },
  rgba(hex: string, a: number) {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  },
  mix(h1: string, h2: string, t: number) {
    const a = hexToRgb(h1), b = hexToRgb(h2);
    const m = (i: number) => Math.round(a[i] + (b[i] - a[i]) * t);
    return `rgb(${m(0)},${m(1)},${m(2)})`;
  },
  fmt: (n: number) => String(Math.floor(n)),
});

/** Simple key/value save in localStorage */
export const Save = (PTD.Save = {
  KEY: 'bulborb-rush-save-v1',
  data: null as any,
  load() {
    try {
      this.data = JSON.parse(localStorage.getItem(this.KEY) || '') || null;
    } catch (e) {
      this.data = null;
    }
    if (!this.data) this.data = { stars: {}, muted: false, music: true, seen: {} };
    return this.data;
  },
  write() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this.data));
    } catch (e) {}
  },
  stars(id: string) { return (this.data && this.data.stars && this.data.stars[id]) || 0; },
  setStars(id: string, s: number) {
    if (!this.data) this.load();
    if (s > (this.data.stars[id] || 0)) this.data.stars[id] = s;
    this.write();
  },
});
