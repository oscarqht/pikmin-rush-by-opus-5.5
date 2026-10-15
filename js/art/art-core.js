/* Bulborb Rush — procedural art core: sprite cache + painterly drawing helpers.
   All game graphics are generated at runtime with Canvas 2D vector drawing. */
(function () {
  'use strict';
  const PTD = window.PTD;
  const U = PTD.U;

  const Art = (PTD.Art = {
    RES: 2,
    cache: new Map(),
    OUT: '#25150b', // ink outline colour
  });

  Art.setRes = function (r) {
    r = U.clamp(Math.round(r * 2) / 2, 1, 3);
    if (r !== Art.RES) {
      Art.RES = r;
      Art.cache.clear();
    }
  };

  Art.canvas = function (w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return c;
  };

  /** Get (or lazily paint) a cached sprite. Anchor (ax, ay) is where (0,0) of the drawing lands. */
  Art.sprite = function (key, w, h, ax, ay, fn) {
    let s = Art.cache.get(key);
    if (!s) {
      const R = Art.RES;
      const c = Art.canvas(w * R, h * R);
      const g = c.getContext('2d');
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
  Art.flash = function (s) {
    const key = s.key + '|flash';
    let f = Art.cache.get(key);
    if (!f) {
      const c = Art.canvas(s.c.width, s.c.height);
      const g = c.getContext('2d');
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
  Art.tint = function (s, color, alpha) {
    const key = s.key + '|tint' + color + alpha;
    let f = Art.cache.get(key);
    if (!f) {
      const c = Art.canvas(s.c.width, s.c.height);
      const g = c.getContext('2d');
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

  Art.blit = function (ctx, s, x, y, flip, scale, alpha, rot) {
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
  const H = (Art.H = {});
  const OUT = Art.OUT;

  H.ell = (g, x, y, rx, ry, rot) => g.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, Math.PI * 2);
  H.circ = (g, x, y, r) => g.arc(x, y, Math.max(0.01, r), 0, Math.PI * 2);

  /** fill current path & outline it */
  H.fs = function (g, fill, lw, stroke) {
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
  H.vol = function (g, x, y, rx, ry, base, hi, lo) {
    const r = Math.max(rx, ry);
    const gr = g.createRadialGradient(x - rx * 0.35, y - ry * 0.45, r * 0.05, x - rx * 0.1, y - ry * 0.1, r * 1.25);
    gr.addColorStop(0, U.shade(base, hi == null ? 0.42 : hi));
    gr.addColorStop(0.45, base);
    gr.addColorStop(1, U.shade(base, lo == null ? -0.42 : lo));
    return gr;
  };

  H.lin = function (g, x0, y0, x1, y1, stops) {
    const gr = g.createLinearGradient(x0, y0, x1, y1);
    stops.forEach((s, i) => gr.addColorStop(s[0] != null && typeof s[0] === 'number' ? s[0] : i / (stops.length - 1), s[1] || s));
    return gr;
  };

  /** shaded ellipse "blob" with outline */
  H.blob = function (g, x, y, rx, ry, base, lw, rot, hi, lo) {
    g.beginPath();
    H.ell(g, x, y, rx, ry, rot);
    H.fs(g, H.vol(g, x, y, rx, ry, base, hi, lo), lw == null ? 2 : lw);
  };

  /** glossy specular highlight */
  H.shine = function (g, x, y, rx, ry, rot, a) {
    g.save();
    g.globalAlpha = a == null ? 0.7 : a;
    g.fillStyle = '#ffffff';
    g.beginPath();
    H.ell(g, x, y, rx, ry, rot || -0.5);
    g.fill();
    g.restore();
  };

  /** soft ground shadow */
  H.shadow = function (g, x, y, rx, ry, a) {
    g.save();
    g.fillStyle = `rgba(28,32,12,${a == null ? 0.3 : a})`;
    g.beginPath();
    H.ell(g, x, y, rx, ry);
    g.fill();
    g.restore();
  };

  /** thick limb line with ink outline */
  H.limb = function (g, pts, color, w, ow) {
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
  H.eye = function (g, x, y, rx, ry, pr, lookX, lookY, irisColor, lw) {
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
  H.clipTo = function (g, pathFn, fn) {
    g.save();
    g.beginPath();
    pathFn(g);
    g.clip();
    fn(g);
    g.restore();
  };

  /** five-point star path */
  H.star = function (g, x, y, r1, r2, n, rot) {
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
  H.rr = function (g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  };

  /** irregular blob path (for bushes, rocks, water) */
  H.wobble = function (g, x, y, rx, ry, rng, n, amt) {
    n = n || 10;
    amt = amt == null ? 0.18 : amt;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const k = 1 + (rng() * 2 - 1) * amt;
      pts.push([x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k]);
    }
    const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
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
  H.text = function (g, str, x, y, size, fill, opt) {
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
})();
