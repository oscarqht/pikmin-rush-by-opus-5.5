/* Bulborb Rush — core utilities & namespace */
(function () {
  'use strict';
  const PTD = (window.PTD = window.PTD || {});
  PTD.W = 1280;
  PTD.H = 720;

  const _shadeCache = new Map();
  function hexToRgb(hex) {
    if (hex[0] === '#') hex = hex.slice(1);
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    const n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  const U = (PTD.U = {
    TAU: Math.PI * 2,
    rand: (a, b) => a + Math.random() * (b - a),
    randi: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
    lerp: (a, b, t) => a + (b - a) * t,
    dist: (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay),
    dist2: (ax, ay, bx, by) => (bx - ax) * (bx - ax) + (by - ay) * (by - ay),
    easeOutBack: (t) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
    easeInCubic: (t) => t * t * t,
    easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    hexToRgb,
    /** deterministic RNG */
    rng(seed) {
      let a = seed >>> 0;
      const f = function () {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      f.range = (lo, hi) => lo + f() * (hi - lo);
      f.int = (lo, hi) => Math.floor(lo + f() * (hi - lo + 1));
      f.pick = (arr) => arr[Math.floor(f() * arr.length)];
      return f;
    },
    /** lighten (amt>0) or darken (amt<0) a hex colour → css rgb() */
    shade(hex, amt) {
      const k = hex + '|' + amt;
      let v = _shadeCache.get(k);
      if (v) return v;
      const [r, g, b] = hexToRgb(hex);
      const f = (c) => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt));
      v = `rgb(${f(r)},${f(g)},${f(b)})`;
      _shadeCache.set(k, v);
      return v;
    },
    rgba(hex, a) {
      const [r, g, b] = hexToRgb(hex);
      return `rgba(${r},${g},${b},${a})`;
    },
    mix(h1, h2, t) {
      const a = hexToRgb(h1), b = hexToRgb(h2);
      const m = (i) => Math.round(a[i] + (b[i] - a[i]) * t);
      return `rgb(${m(0)},${m(1)},${m(2)})`;
    },
    fmt: (n) => String(Math.floor(n)),
  });

  /** Simple key/value save in localStorage */
  PTD.Save = {
    KEY: 'bulborb-rush-save-v1',
    data: null,
    load() {
      try {
        this.data = JSON.parse(localStorage.getItem(this.KEY)) || null;
      } catch (e) {
        this.data = null;
      }
      if (!this.data) this.data = { stars: {}, muted: false, music: true };
      return this.data;
    },
    write() {
      try {
        localStorage.setItem(this.KEY, JSON.stringify(this.data));
      } catch (e) {}
    },
    stars(id) { return this.data.stars[id] || 0; },
    setStars(id, s) {
      if (s > (this.data.stars[id] || 0)) this.data.stars[id] = s;
      this.write();
    },
  };
  void U;
})();
