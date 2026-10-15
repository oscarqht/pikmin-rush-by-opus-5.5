/* Bulborb Rush — world art: terrain painter, props, tower platforms, onion, icons, portraits. */
(function () {
  'use strict';
  const PTD = window.PTD;
  const U = PTD.U;
  const Art = PTD.Art;
  const H = Art.H;
  const OUT = Art.OUT;
  const TAU = Math.PI * 2;

  /* ============================== THEMES ============================== */
  const THEMES = (Art.THEMES = {
    meadow: { g1: '#8ccb54', g2: '#6db043', g3: '#a6dc68', dirt: '#cfa166', dirtEdge: '#7c5730', dirtLight: '#e2be84', bush: '#4f9e3a', bush2: '#62b548', rock: '#a59f94', flowers: ['#ffffff', '#ffe04a', '#ff8fb8', '#b6a2ff'] },
    forest: { g1: '#74ad44', g2: '#558f32', g3: '#8dc257', dirt: '#b98a56', dirtEdge: '#664527', dirtLight: '#d0a46c', bush: '#3e8030', bush2: '#4f9a3a', rock: '#968f86', flowers: ['#ffd25a', '#ff9f43', '#ffffff'], leaves: ['#e4782b', '#d6452a', '#f2b33a', '#b8572a'] },
    pool: { g1: '#86c95e', g2: '#67ad4b', g3: '#a2da78', dirt: '#dcbc84', dirtEdge: '#8e7046', dirtLight: '#eed5a2', bush: '#46a050', bush2: '#5cb85a', rock: '#a3a8ad', water: '#4aa6d9', flowers: ['#ffffff', '#ff8fd0', '#ffe04a'] },
    twilight: { g1: '#5e9a62', g2: '#467d51', g3: '#74b276', dirt: '#b39672', dirtEdge: '#5a4430', dirtLight: '#c9ad86', bush: '#2f6b4c', bush2: '#3d8160', rock: '#8a8f9c', flowers: ['#b9e0ff', '#ffffff', '#d4b8ff'] },
  });

  /* ============================== PROPS ============================== */
  const P = (Art.Props = {});

  P.tuft = function (g, x, y, s, rng, col) {
    const n = 4 + Math.floor(rng() * 4);
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / (n - 1) - 0.5) * 1.6 + rng.range(-0.15, 0.15);
      const L = s * rng.range(7, 13);
      g.beginPath();
      g.moveTo(x + (i - n / 2) * 1.2, y);
      g.quadraticCurveTo(x + Math.cos(a) * L * 0.4, y + Math.sin(a) * L * 0.6, x + Math.cos(a) * L, y + Math.sin(a) * L);
      g.lineWidth = 1.6 * s;
      g.strokeStyle = i % 2 ? col : U.shade(col, -0.2);
      g.stroke();
    }
  };

  P.bush = function (g, x, y, s, rng, base, base2) {
    const blobs = [];
    const n = 4 + Math.floor(rng() * 4);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI + rng.range(-0.2, 0.2);
      blobs.push([x - Math.cos(a) * 18 * s * rng.range(0.6, 1.1), y - 8 * s - Math.sin(a) * 14 * s * rng.range(0.5, 1), s * rng.range(10, 15)]);
    }
    blobs.push([x, y - 8 * s, 14 * s]);
    blobs.sort((a, b) => a[1] - b[1]);
    H.shadow(g, x + 4 * s, y + 2 * s, 26 * s, 8 * s, 0.25);
    g.beginPath();
    for (const [bx, by, r] of blobs) { g.moveTo(bx + r, by); H.circ(g, bx, by, r); }
    g.lineWidth = 4.5 * Math.min(1.2, s); g.strokeStyle = OUT; g.stroke();
    for (const [bx, by, r] of blobs) {
      g.beginPath(); H.circ(g, bx, by, r);
      g.fillStyle = H.vol(g, bx, by, r, r, rng() < 0.5 ? base : base2, 0.32, -0.35); g.fill();
    }
    // leaf texture
    g.strokeStyle = 'rgba(255,255,220,0.35)'; g.lineWidth = 1.2;
    for (const [bx, by, r] of blobs) {
      for (let k = 0; k < 3; k++) {
        const a = rng.range(-2.6, -0.6), rr = r * rng.range(0.3, 0.75);
        g.beginPath(); g.arc(bx + Math.cos(a) * rr, by + Math.sin(a) * rr, r * 0.25, Math.PI * 1.1, Math.PI * 1.7); g.stroke();
      }
    }
    if (rng() < 0.35) {
      for (let k = 0; k < 4; k++) {
        const b = blobs[Math.floor(rng() * blobs.length)];
        g.beginPath(); H.circ(g, b[0] + rng.range(-b[2], b[2]) * 0.6, b[1] + rng.range(-b[2], b[2]) * 0.6, 2.2 * s);
        H.fs(g, rng() < 0.5 ? '#e8414a' : '#ffffff', 1);
      }
    }
  };

  P.rock = function (g, x, y, s, rng, col) {
    H.shadow(g, x + 3 * s, y + 1, 18 * s, 6 * s, 0.28);
    const rx = 16 * s * rng.range(0.8, 1.2), ry = 11 * s * rng.range(0.8, 1.1);
    const path = (g) => H.wobble(g, x, y - ry * 0.7, rx, ry, rng, 8, 0.16);
    g.beginPath(); path(g);
    H.fs(g, H.vol(g, x, y - ry * 0.7, rx, ry, col, 0.38, -0.42), 2.2);
    g.beginPath(); g.moveTo(x - rx * 0.5, y - ry * 1.2); g.quadraticCurveTo(x - rx * 0.1, y - ry * 1.55, x + rx * 0.4, y - ry * 1.25);
    g.lineWidth = 2 * s; g.strokeStyle = 'rgba(255,255,255,0.35)'; g.stroke();
    g.beginPath(); g.moveTo(x + rx * 0.2, y - ry * 0.2); g.lineTo(x + rx * 0.45, y - ry * 0.7); g.lineTo(x + rx * 0.35, y - ry);
    g.lineWidth = 1; g.strokeStyle = 'rgba(40,30,20,0.5)'; g.stroke();
    if (rng() < 0.5) {
      g.beginPath(); H.ell(g, x - rx * 0.2, y - ry * 1.45, rx * 0.5, ry * 0.25);
      g.fillStyle = 'rgba(110,170,60,0.85)'; g.fill();
    }
  };

  P.pebbles = function (g, x, y, s, rng, col) {
    for (let i = 0; i < 4; i++) {
      const px = x + rng.range(-12, 12) * s, py = y + rng.range(-5, 5) * s, r = rng.range(2, 4.5) * s;
      g.beginPath(); H.ell(g, px, py, r, r * 0.7);
      H.fs(g, H.vol(g, px, py, r, r * 0.7, U.shade(col, rng.range(-0.15, 0.15))), 1.1);
    }
  };

  P.clover = function (g, x, y, s, rng) {
    H.shadow(g, x + 2, y, 14 * s, 4 * s, 0.2);
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 2 * s, y - 8 * s, x, y - 14 * s);
    g.lineWidth = 2.4 * s; g.strokeStyle = '#3c7d2a'; g.stroke();
    const cx = x, cy = y - 15 * s;
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i / 3) * TAU + rng.range(-0.1, 0.1);
      g.save(); g.translate(cx, cy); g.rotate(a + Math.PI / 2); g.scale(1, 0.62);
      g.beginPath();
      g.moveTo(0, 0);
      g.bezierCurveTo(-12 * s, -4 * s, -10 * s, -16 * s, -2 * s, -13 * s);
      g.quadraticCurveTo(0, -12 * s, 0, -10 * s);
      g.quadraticCurveTo(0, -12 * s, 2 * s, -13 * s);
      g.bezierCurveTo(10 * s, -16 * s, 12 * s, -4 * s, 0, 0);
      H.fs(g, H.vol(g, 0, -8 * s, 9 * s, 8 * s, '#58b443', 0.3, -0.3), 1.8);
      g.beginPath(); g.moveTo(-5 * s, -9 * s); g.lineTo(0, -5 * s); g.lineTo(5 * s, -9 * s);
      g.lineWidth = 1.6 * s; g.strokeStyle = 'rgba(230,255,200,0.6)'; g.stroke();
      g.restore();
    }
  };

  P.daisy = function (g, x, y, s, rng, col) {
    const h = rng.range(14, 24) * s;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 3 * s, y - h * 0.5, x + rng.range(-2, 2), y - h);
    g.lineWidth = 2.2 * s; g.strokeStyle = OUT; g.stroke();
    g.lineWidth = 1.2 * s; g.strokeStyle = '#4c9a34'; g.stroke();
    g.beginPath(); H.ell(g, x + 4 * s, y - h * 0.35, 4 * s, 1.6 * s, -0.5); H.fs(g, '#5fb546', 1);
    const fx = x, fy = y - h;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      g.beginPath(); H.ell(g, fx + Math.cos(a) * 4.4 * s, fy + Math.sin(a) * 2.9 * s, 3.2 * s, 1.6 * s, a);
      H.fs(g, col, 0.9);
    }
    g.beginPath(); H.ell(g, fx, fy, 2.6 * s, 2 * s); H.fs(g, '#ffc928', 0.9);
  };

  P.mushroom = function (g, x, y, s, rng, cap, spots) {
    H.shadow(g, x + 2, y, 12 * s, 4 * s, 0.25);
    g.beginPath(); g.moveTo(x - 4 * s, y); g.quadraticCurveTo(x - 5 * s, y - 10 * s, x - 3 * s, y - 14 * s);
    g.lineTo(x + 3 * s, y - 14 * s); g.quadraticCurveTo(x + 5 * s, y - 10 * s, x + 4 * s, y); g.closePath();
    H.fs(g, H.vol(g, x, y - 7 * s, 5 * s, 8 * s, '#f6ead2', 0.3, -0.3), 1.6);
    g.beginPath(); g.moveTo(x - 13 * s, y - 12 * s);
    g.bezierCurveTo(x - 13 * s, y - 28 * s, x + 13 * s, y - 28 * s, x + 13 * s, y - 12 * s);
    g.quadraticCurveTo(x, y - 9 * s, x - 13 * s, y - 12 * s);
    H.fs(g, H.vol(g, x, y - 18 * s, 13 * s, 9 * s, cap, 0.4, -0.35), 2);
    if (spots) {
      for (const [dx, dy, r] of [[-6, -18, 2.2], [3, -21, 2.6], [8, -15, 1.6], [-1, -14.5, 1.4]]) {
        g.beginPath(); H.ell(g, x + dx * s, y + dy * s, r * s, r * 0.8 * s); g.fillStyle = '#fff8ea'; g.fill();
      }
    }
    H.shine(g, x - 5 * s, y - 21 * s, 3.5 * s, 1.5 * s, -0.4, 0.4);
  };

  P.glowShroom = function (g, x, y, s, rng) {
    const gr = g.createRadialGradient(x, y - 14 * s, 1, x, y - 14 * s, 30 * s);
    gr.addColorStop(0, 'rgba(120,230,255,0.45)'); gr.addColorStop(1, 'rgba(120,230,255,0)');
    g.fillStyle = gr; g.beginPath(); H.circ(g, x, y - 14 * s, 30 * s); g.fill();
    P.mushroom(g, x, y, s, rng, '#5fd6f0', true);
  };

  P.pelletPosy = function (g, x, y, s, rng) {
    const h = 34 * s;
    H.shadow(g, x + 3, y, 12 * s, 4 * s, 0.25);
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - 4 * s, y - h * 0.5, x, y - h);
    g.lineWidth = 4 * s; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 2.4 * s; g.strokeStyle = '#4a9a32'; g.stroke();
    for (const sx of [-1, 1]) {
      g.beginPath(); g.moveTo(x - 1 * s, y - h * 0.3);
      g.quadraticCurveTo(x + sx * 12 * s, y - h * 0.45, x + sx * 14 * s, y - h * 0.25);
      g.quadraticCurveTo(x + sx * 6 * s, y - h * 0.2, x - 1 * s, y - h * 0.3);
      H.fs(g, '#5bb844', 1.4);
    }
    const col = rng.pick(['#e8392c', '#f9d227', '#2f6fe4']);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      g.beginPath(); H.ell(g, x + Math.cos(a) * 9 * s, y - h + Math.sin(a) * 6 * s, 6 * s, 4 * s, a);
      H.fs(g, H.vol(g, x, y - h, 6 * s, 4 * s, '#ffffff', 0.2, -0.2), 1.4);
    }
    g.beginPath(); H.ell(g, x, y - h, 7.5 * s, 6 * s); H.fs(g, H.vol(g, x, y - h, 7.5 * s, 6 * s, col, 0.45, -0.3), 1.8);
    H.text(g, '1', x, y - h + 0.5 * s, 8 * s, '#fff', { shadow: false, lw: 2 * s });
  };

  P.bottleCap = function (g, x, y, s) {
    H.shadow(g, x + 3, y + 1, 20 * s, 6 * s, 0.3);
    const rx = 17 * s, ry = 7 * s, h = 7 * s;
    g.beginPath(); g.moveTo(x - rx, y - h); g.lineTo(x - rx, y);
    g.ellipse(x, y, rx, ry, 0, Math.PI, 0, true);
    g.lineTo(x + rx, y - h); g.closePath();
    H.fs(g, H.lin(g, x - rx, 0, x + rx, 0, [[0, '#9b1d1d'], [0.4, '#e64545'], [1, '#7a1414']]), 2);
    g.strokeStyle = 'rgba(60,0,0,0.5)'; g.lineWidth = 1;
    for (let i = 1; i < 12; i++) {
      const a = Math.PI - (i / 12) * Math.PI;
      const cx = x + Math.cos(a) * rx, cy = y + Math.sin(a) * ry;
      g.beginPath(); g.moveTo(cx, cy - h); g.lineTo(cx, cy); g.stroke();
    }
    g.beginPath(); H.ell(g, x, y - h, rx, ry); H.fs(g, H.vol(g, x, y - h, rx, ry, '#e8413a', 0.4, -0.2), 2);
    g.beginPath(); H.ell(g, x, y - h, rx * 0.7, ry * 0.65); g.lineWidth = 1.4; g.strokeStyle = 'rgba(255,255,255,0.5)'; g.stroke();
    H.text(g, '\u2605', x, y - h, 8 * s, '#ffe9a8', { shadow: false, stroke: false });
  };

  P.can = function (g, x, y, s, rng) {
    H.shadow(g, x, y + 2, 34 * s, 8 * s, 0.3);
    const L = 30 * s, R = 12 * s;
    g.save(); g.translate(x, y - R);
    g.beginPath(); g.moveTo(-L, -R); g.lineTo(L, -R); g.lineTo(L, R); g.lineTo(-L, R); g.closePath();
    H.fs(g, H.lin(g, 0, -R, 0, R, [[0, '#4c8fd8'], [0.35, '#9fd0ff'], [0.6, '#2f6fb8'], [1, '#1d3f72']]), 2);
    g.beginPath(); g.rect(-L * 0.4, -R, L * 0.5, R * 2); g.fillStyle = 'rgba(255,255,255,0.85)'; g.fill();
    g.beginPath(); g.rect(-L * 0.32, -R * 0.5, L * 0.34, R); g.fillStyle = '#e8392c'; g.fill();
    g.beginPath(); g.moveTo(-L, -R); g.lineTo(L, -R); g.lineTo(L, R); g.lineTo(-L, R); g.closePath(); g.lineWidth = 2; g.strokeStyle = OUT; g.stroke();
    g.beginPath(); H.ell(g, L, 0, 5 * s, R); H.fs(g, H.lin(g, 0, -R, 0, R, [[0, '#f2f4f7'], [1, '#8e959e']]), 2);
    g.beginPath(); H.ell(g, L + 0.5 * s, 0, 3 * s, R * 0.7); g.lineWidth = 1; g.strokeStyle = '#6b737c'; g.stroke();
    g.restore();
  };

  P.battery = function (g, x, y, s) {
    H.shadow(g, x, y + 2, 26 * s, 6 * s, 0.3);
    const L = 22 * s, R = 8 * s;
    g.save(); g.translate(x, y - R);
    g.beginPath(); H.rr(g, -L, -R, L * 2, R * 2, 3 * s);
    H.fs(g, H.lin(g, 0, -R, 0, R, [[0, '#3a3a3a'], [0.35, '#8a8a8a'], [1, '#121212']]), 2);
    g.beginPath(); g.rect(L * 0.2, -R, L * 0.8, R * 2); g.fillStyle = H.lin(g, 0, -R, 0, R, [[0, '#c67b2a'], [0.35, '#ffcb6b'], [1, '#7a4510']]); g.fill();
    g.beginPath(); H.rr(g, -L, -R, L * 2, R * 2, 3 * s); g.lineWidth = 2; g.strokeStyle = OUT; g.stroke();
    g.beginPath(); H.rr(g, L - 1, -R * 0.4, 4 * s, R * 0.8, 1.5); H.fs(g, '#d9d9d9', 1.4);
    H.text(g, '+', L * 0.6, 0, 9 * s, '#2a1608', { shadow: false, stroke: false });
    g.restore();
  };

  P.leaf = function (g, x, y, s, rng, col) {
    g.save(); g.translate(x, y); g.rotate(rng.range(-0.8, 0.8)); g.scale(s, s * 0.7);
    g.beginPath(); g.moveTo(-16, 0); g.quadraticCurveTo(-4, -12, 16, 0); g.quadraticCurveTo(-4, 12, -16, 0);
    H.fs(g, H.vol(g, 0, 0, 16, 8, col, 0.25, -0.3), 1.8);
    g.beginPath(); g.moveTo(-16, 0); g.lineTo(14, 0);
    for (const k of [-8, -2, 4]) { g.moveTo(k, 0); g.lineTo(k + 5, -5); g.moveTo(k, 0); g.lineTo(k + 5, 5); }
    g.lineWidth = 0.9; g.strokeStyle = 'rgba(90,30,0,0.45)'; g.stroke();
    g.restore();
  };

  P.fern = function (g, x, y, s, rng, col) {
    for (let f = 0; f < 4; f++) {
      const dir = f % 2 ? 1 : -1;
      const L = rng.range(22, 32) * s;
      const ang = -Math.PI / 2 + dir * rng.range(0.3, 0.9);
      const ex = x + Math.cos(ang) * L, ey = y + Math.sin(ang) * L;
      const cx = x + Math.cos(ang - dir * 0.4) * L * 0.6, cy = y + Math.sin(ang - dir * 0.4) * L * 0.6 - 4 * s;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(cx, cy, ex, ey);
      g.lineWidth = 3 * s; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 1.6 * s; g.strokeStyle = U.shade(col, -0.2); g.stroke();
      for (let i = 1; i < 8; i++) {
        const t = i / 8;
        const px = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * cx + t * t * ex;
        const py = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * cy + t * t * ey;
        const ll = (1 - t) * 7 * s + 2 * s;
        for (const sd of [-1, 1]) {
          g.beginPath(); H.ell(g, px + sd * ll * 0.5, py - ll * 0.2, ll * 0.55, ll * 0.25, sd * 0.6 + ang + Math.PI / 2);
          H.fs(g, col, 0.9);
        }
      }
    }
  };

  P.log = function (g, x, y, s) {
    H.shadow(g, x, y + 2, 40 * s, 9 * s, 0.3);
    const L = 34 * s, R = 11 * s;
    g.save(); g.translate(x, y - R);
    g.beginPath(); g.moveTo(-L, -R); g.lineTo(L, -R); g.lineTo(L, R); g.lineTo(-L, R); g.closePath();
    H.fs(g, H.lin(g, 0, -R, 0, R, [[0, '#9a6a3c'], [0.5, '#7a4e2a'], [1, '#4f3018']]), 2.2);
    g.strokeStyle = 'rgba(40,20,5,0.5)'; g.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-L + 6 + i * 13 * s, -R + 3); g.lineTo(-L + 14 + i * 13 * s, R - 3); g.stroke(); }
    g.beginPath(); H.ell(g, -L * 0.2, -R, L * 0.6, 3 * s); g.fillStyle = 'rgba(110,170,60,0.9)'; g.fill();
    g.beginPath(); H.ell(g, L, 0, 6 * s, R); H.fs(g, '#d9b07a', 2);
    g.beginPath(); H.ell(g, L, 0, 3.6 * s, R * 0.6); g.lineWidth = 1; g.strokeStyle = '#9a6a3c'; g.stroke();
    g.beginPath(); H.ell(g, L, 0, 1.4 * s, R * 0.25); g.stroke();
    g.restore();
  };

  P.acorn = function (g, x, y, s) {
    H.shadow(g, x + 2, y, 9 * s, 3 * s, 0.25);
    g.beginPath(); H.ell(g, x, y - 8 * s, 7 * s, 9 * s); H.fs(g, H.vol(g, x, y - 8 * s, 7 * s, 9 * s, '#c47a35'), 1.8);
    g.beginPath(); g.moveTo(x - 8 * s, y - 12 * s); g.quadraticCurveTo(x, y - 24 * s, x + 8 * s, y - 12 * s); g.closePath();
    H.fs(g, H.vol(g, x, y - 14 * s, 8 * s, 5 * s, '#7a5a35'), 1.8);
    g.beginPath(); g.moveTo(x, y - 19 * s); g.lineTo(x + 2 * s, y - 23 * s); g.lineWidth = 2 * s; g.strokeStyle = OUT; g.stroke();
  };

  P.reeds = function (g, x, y, s, rng) {
    for (let i = 0; i < 5; i++) {
      const bx = x + (i - 2) * 4 * s, L = rng.range(26, 40) * s, bend = rng.range(-6, 6) * s;
      g.beginPath(); g.moveTo(bx, y); g.quadraticCurveTo(bx + bend * 0.3, y - L * 0.6, bx + bend, y - L);
      g.lineWidth = 2.6 * s; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 1.4 * s; g.strokeStyle = '#6aa848'; g.stroke();
      if (i % 2 === 0) {
        g.beginPath(); H.ell(g, bx + bend * 0.8, y - L * 0.85, 2.4 * s, 6 * s, bend * 0.02); H.fs(g, '#7a4a26', 1.2);
      }
    }
  };

  P.lilypad = function (g, x, y, s, rng) {
    g.beginPath(); g.moveTo(x, y);
    g.ellipse(x, y, 13 * s, 7 * s, 0, 0.25, TAU - 0.25); g.closePath();
    H.fs(g, H.vol(g, x, y, 13 * s, 7 * s, '#58b048', 0.3, -0.3), 1.6);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - 9 * s, y - 3 * s); g.moveTo(x, y); g.lineTo(x - 6 * s, y + 4 * s);
    g.lineWidth = 0.8; g.strokeStyle = 'rgba(30,80,20,0.5)'; g.stroke();
    if (rng() < 0.35) {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        g.beginPath(); H.ell(g, x - 2 * s + Math.cos(a) * 3 * s, y - 3 * s + Math.sin(a) * 2 * s, 3 * s, 1.6 * s, a);
        H.fs(g, '#ffb3d9', 0.8);
      }
      g.beginPath(); H.circ(g, x - 2 * s, y - 3 * s, 1.5 * s); g.fillStyle = '#ffe04a'; g.fill();
    }
  };

  P.stump = function (g, x, y, s) {
    H.shadow(g, x + 3, y + 2, 26 * s, 8 * s, 0.3);
    const rx = 20 * s, ry = 7 * s, h = 16 * s;
    g.beginPath(); g.moveTo(x - rx, y - h); g.lineTo(x - rx - 3 * s, y); g.quadraticCurveTo(x, y + ry * 1.4, x + rx + 3 * s, y); g.lineTo(x + rx, y - h); g.closePath();
    H.fs(g, H.lin(g, x - rx, 0, x + rx, 0, [[0, '#5b3a1e'], [0.4, '#8a5d34'], [1, '#4a2e16']]), 2);
    g.beginPath(); H.ell(g, x, y - h, rx, ry); H.fs(g, '#d8ae76', 2);
    for (const k of [0.65, 0.35]) { g.beginPath(); H.ell(g, x, y - h, rx * k, ry * k); g.lineWidth = 1; g.strokeStyle = '#a77a48'; g.stroke(); }
  };

  /* ============================== THE ONION ============================== */
  Art.drawOnion = function (g, x, y, s, col, t) {
    t = t || 0;
    g.save(); g.translate(x, y); g.scale(s, s);
    // beam
    const bg = g.createLinearGradient(0, -30, 0, 0);
    bg.addColorStop(0, U.rgba(col, 0.0)); bg.addColorStop(1, U.rgba(col, 0.25 + Math.sin(t * 2) * 0.08));
    g.fillStyle = bg; g.beginPath(); g.moveTo(-6, -30); g.lineTo(6, -30); g.lineTo(16, 0); g.lineTo(-16, 0); g.closePath(); g.fill();
    H.shadow(g, 0, 0, 40, 10, 0.3);
    // legs
    for (const [lx, fx, c] of [[-14, -34, U.shade('#c8c8d0', -0.2)], [14, 34, '#c8c8d0'], [0, 3, '#dcdce4']]) {
      H.limb(g, [lx, -40, (lx + fx) / 2, -24, fx, 0], c, 3.6, 2.2);
      g.beginPath(); H.ell(g, fx, -0.5, 4.5, 2); H.fs(g, '#a0a0aa', 1.4);
    }
    // bulb
    const bulb = (g) => {
      g.moveTo(0, -96);
      g.bezierCurveTo(10, -82, 36, -74, 34, -54);
      g.bezierCurveTo(32, -36, 14, -30, 0, -30);
      g.bezierCurveTo(-14, -30, -32, -36, -34, -54);
      g.bezierCurveTo(-36, -74, -10, -82, 0, -96);
      g.closePath();
    };
    g.beginPath(); bulb(g); g.fillStyle = H.vol(g, -4, -58, 34, 30, col, 0.45, -0.45); g.fill();
    H.clipTo(g, bulb, (g) => {
      g.strokeStyle = 'rgba(40,10,0,0.25)'; g.lineWidth = 1.6;
      for (const k of [-22, -10, 2, 14, 26]) { g.beginPath(); g.moveTo(0, -96); g.quadraticCurveTo(k * 1.5, -58, k * 0.6, -30); g.stroke(); }
      g.beginPath(); H.ell(g, 0, -34, 30, 8); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fill();
    });
    g.beginPath(); bulb(g); g.lineWidth = 2.6; g.strokeStyle = OUT; g.stroke();
    H.shine(g, -14, -66, 7, 12, 0.35, 0.45);
    // hatch light
    g.beginPath(); H.ell(g, 0, -31, 9, 3); H.fs(g, '#fff6c8', 1.4);
    // flower propeller top
    g.save(); g.translate(0, -98);
    g.beginPath(); g.moveTo(0, 2); g.lineTo(0, -10); g.lineWidth = 3.4; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 2; g.strokeStyle = '#4a9a32'; g.stroke();
    const spin = t * 3;
    for (let i = 0; i < 3; i++) {
      const a = spin + (i / 3) * TAU;
      g.save(); g.translate(0, -11); g.scale(1, 0.4); g.rotate(a);
      g.beginPath(); H.ell(g, 9, 0, 9, 4); H.fs(g, '#fffdf2', 1.6);
      g.restore();
    }
    g.beginPath(); H.ell(g, 0, -11, 3, 2); H.fs(g, '#ffd23a', 1.2);
    g.restore();
    g.restore();
  };

  /* ============================== EXIT BURROW ============================== */
  Art.drawBurrow = function (g, x, y, s, theme) {
    const T = THEMES[theme];
    g.save(); g.translate(x, y); g.scale(s, s);
    H.shadow(g, 0, 6, 70, 18, 0.3);
    // mound
    g.beginPath(); g.moveTo(-70, 10); g.bezierCurveTo(-68, -40, -30, -66, 4, -66); g.bezierCurveTo(40, -66, 74, -40, 72, 10); g.quadraticCurveTo(0, 22, -70, 10);
    H.fs(g, H.vol(g, 0, -30, 70, 40, '#7d5a36', 0.3, -0.4), 2.6);
    // grass cap
    g.beginPath(); g.moveTo(-62, -18); g.bezierCurveTo(-56, -52, -24, -70, 4, -68); g.bezierCurveTo(36, -68, 62, -50, 66, -18);
    g.bezierCurveTo(40, -32, -30, -34, -62, -18);
    H.fs(g, H.vol(g, 0, -50, 60, 20, T.g2, 0.3, -0.3), 2.4);
    // roots
    for (const [a, b, c, d] of [[-50, -10, -30, -40], [44, -6, 30, -42], [-16, -50, 10, -56]]) {
      g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo((a + c) / 2 - 10, (b + d) / 2 - 10, c, d);
      g.lineWidth = 7; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 4.6; g.strokeStyle = '#a77a48'; g.stroke();
    }
    // hole
    g.beginPath(); g.moveTo(-34, 10); g.bezierCurveTo(-36, -30, 36, -30, 34, 10); g.closePath();
    const hg = g.createRadialGradient(0, -2, 2, 0, -2, 36);
    hg.addColorStop(0, '#000000'); hg.addColorStop(0.7, '#1a0d05'); hg.addColorStop(1, '#3d2410');
    H.fs(g, hg, 2.6);
    // glowing eyes in the dark
    for (const [ex, ey] of [[-9, -8], [9, -8]]) {
      g.beginPath(); H.circ(g, ex, ey, 3.2); g.fillStyle = '#fffbe0'; g.fill();
      g.beginPath(); H.circ(g, ex + 0.8, ey, 1.6); g.fillStyle = '#100805'; g.fill();
    }
    g.restore();
  };

  /* ============================== BUILD SPOT & PLATFORMS ============================== */
  Art.buildSpot = function (hover) {
    return Art.sprite('spot|' + (hover ? 1 : 0), 84, 56, 42, 30, (g) => {
      H.shadow(g, 0, 3, 34, 15, 0.25);
      g.beginPath(); H.ell(g, 0, 0, 30, 15);
      H.fs(g, H.vol(g, 0, 0, 30, 15, hover ? '#c99a62' : '#ad8150', 0.25, -0.3), 2.2);
      // tilled rows
      g.save(); g.beginPath(); H.ell(g, 0, 0, 27, 13); g.clip();
      g.strokeStyle = 'rgba(70,40,15,0.35)'; g.lineWidth = 1.6;
      for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(-30, i * 4.5 + 2); g.quadraticCurveTo(0, i * 4.5 - 2, 30, i * 4.5 + 2); g.stroke(); }
      g.restore();
      // pebble ring
      const r = U.rng(5);
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * TAU;
        const px = Math.cos(a) * 30, py = Math.sin(a) * 15;
        g.beginPath(); H.ell(g, px, py, r.range(3, 4.5), r.range(2.2, 3));
        H.fs(g, H.vol(g, px, py, 4, 3, '#b8b2a6', 0.4, -0.3), 1.2);
      }
      // little stake with leaf flag
      g.beginPath(); g.moveTo(-18, -8); g.lineTo(-18, -30); g.lineWidth = 3.4; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 1.8; g.strokeStyle = '#a7743e'; g.stroke();
      g.beginPath(); g.moveTo(-18, -29); g.quadraticCurveTo(-8, -32, -4, -25); g.quadraticCurveTo(-11, -24, -18, -22);
      H.fs(g, hover ? '#8de06a' : '#5cc443', 1.4);
      if (hover) {
        g.beginPath(); H.ell(g, 0, 0, 33, 17); g.lineWidth = 2.5; g.strokeStyle = 'rgba(255,255,200,0.9)'; g.stroke();
      }
    });
  };

  const FAMCOL = (Art.FAMCOL = { groink: '#f0902a', den: '#d8322a', hog: '#9d4fd6', cannon: '#3fae4f' });

  function banner(g, x, y, col, h) {
    g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - h); g.lineWidth = 3.4; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 1.8; g.strokeStyle = '#c9a36a'; g.stroke();
    g.beginPath(); H.circ(g, x, y - h - 1.5, 2); H.fs(g, '#ffd54a', 1);
    g.beginPath(); g.moveTo(x, y - h + 2); g.lineTo(x + 13, y - h + 4); g.lineTo(x + 9, y - h + 8.5); g.lineTo(x + 13, y - h + 13); g.lineTo(x, y - h + 12); g.closePath();
    H.fs(g, H.vol(g, x + 6, y - h + 7, 7, 6, col, 0.3, -0.3), 1.5);
  }

  /** platform height (where the creature stands) per tier */
  Art.PLAT_H = [0, 12, 18, 24, 26];

  Art.platform = function (fam, tier) {
    return Art.sprite(`plat|${fam}|${tier}`, 110, 100, 55, 70, (g) => {
      const col = FAMCOL[fam];
      H.shadow(g, 3, 4, 38, 14, 0.32);
      if (tier === 1) {
        g.beginPath(); g.moveTo(-31, 0); g.bezierCurveTo(-31, -10, -20, -15, 0, -15); g.bezierCurveTo(20, -15, 31, -10, 31, 0);
        g.bezierCurveTo(31, 8, -31, 8, -31, 0);
        H.fs(g, H.vol(g, 0, -4, 31, 12, '#8d5f30', 0.25, -0.35), 2.2);
        g.beginPath(); H.ell(g, 0, -11, 25, 8.5); H.fs(g, H.vol(g, 0, -11, 25, 8, '#73b84a', 0.3, -0.3), 2);
        const r = U.rng(3);
        for (let i = 0; i < 7; i++) P.tuft(g, -22 + i * 7.5, -8 + Math.sin(i) * 2, 0.6, r, '#5aa53a');
        P.pebbles(g, -16, 2, 0.7, r, '#a59f94');
        P.pebbles(g, 18, 3, 0.6, r, '#a59f94');
        banner(g, 22, -6, col, 22);
      } else if (tier === 2) {
        // stump
        g.beginPath(); g.moveTo(-26, -18); g.lineTo(-30, 0); g.quadraticCurveTo(0, 13, 30, 0); g.lineTo(26, -18); g.closePath();
        H.fs(g, H.lin(g, -30, 0, 30, 0, [[0, '#5b3a1e'], [0.35, '#94653a'], [0.7, '#6d4624'], [1, '#43290f']]), 2.4);
        g.strokeStyle = 'rgba(30,15,0,0.45)'; g.lineWidth = 1.3;
        for (const x of [-18, -8, 4, 15]) { g.beginPath(); g.moveTo(x, -14); g.quadraticCurveTo(x + 2, -6, x - 1, 4); g.stroke(); }
        // roots
        for (const [a, b] of [[-28, -36], [26, 36], [-6, -10]]) {
          g.beginPath(); g.moveTo(a, -2); g.quadraticCurveTo((a + b) / 2, 2, b, 6);
          g.lineWidth = 6; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 3.8; g.strokeStyle = '#7a4e2a'; g.stroke();
        }
        g.beginPath(); H.ell(g, 0, -18, 26, 9.5); H.fs(g, H.vol(g, 0, -18, 26, 9, '#ddb07a', 0.3, -0.2), 2.2);
        for (const k of [0.72, 0.45, 0.2]) { g.beginPath(); H.ell(g, 1, -18, 26 * k, 9.5 * k); g.lineWidth = 1; g.strokeStyle = '#a77a48'; g.stroke(); }
        g.beginPath(); H.ell(g, -12, -21, 8, 2.4); g.fillStyle = 'rgba(100,170,60,0.85)'; g.fill();
        banner(g, 24, -14, col, 26);
      } else {
        // stone tower base (tier 3 / elite 4)
        const elite = tier >= 4;
        const h = elite ? 26 : 24;
        const rx = 29, ry = 11;
        const side = (g) => { g.moveTo(-rx, -h); g.lineTo(-rx - 2, 0); g.quadraticCurveTo(0, ry * 1.5, rx + 2, 0); g.lineTo(rx, -h); g.closePath(); };
        g.beginPath(); side(g); g.fillStyle = H.lin(g, -rx, 0, rx, 0, [[0, '#6e6a63'], [0.35, '#b2aca0'], [1, '#4f4b45']]); g.fill();
        H.clipTo(g, side, (g) => {
          const r = U.rng(11);
          g.strokeStyle = 'rgba(30,25,20,0.55)'; g.lineWidth = 1.3;
          for (let row = 0; row < 3; row++) {
            const yy = -h + row * (h / 3) + h / 3;
            g.beginPath(); g.moveTo(-rx - 2, yy + 2); g.quadraticCurveTo(0, yy + ry * 1.2, rx + 2, yy + 2); g.stroke();
            for (let i = 0; i < 6; i++) {
              const xx = -rx + (i + (row % 2) * 0.5) * (rx * 2 / 6) + r.range(-2, 2);
              g.beginPath(); g.moveTo(xx, yy - h / 3 + 3 + Math.abs(xx) * 0.0); g.lineTo(xx, yy + 2 + (1 - Math.abs(xx) / rx) * 8); g.stroke();
            }
          }
          g.beginPath(); H.ell(g, -10, -h + 8, 8, 3); g.fillStyle = 'rgba(255,255,255,0.15)'; g.fill();
        });
        g.beginPath(); side(g); g.lineWidth = 2.4; g.strokeStyle = OUT; g.stroke();
        if (elite) {
          g.beginPath(); g.moveTo(-rx - 2, -3); g.quadraticCurveTo(0, ry * 1.5 - 3, rx + 2, -3);
          g.lineWidth = 5; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 3; g.strokeStyle = '#e9b93c'; g.stroke();
        }
        g.beginPath(); H.ell(g, 0, -h, rx + 1, ry); H.fs(g, H.vol(g, 0, -h, rx, ry, '#6db443', 0.3, -0.3), 2.2);
        const r2 = U.rng(13);
        for (let i = 0; i < 8; i++) P.tuft(g, -24 + i * 7, -h + 7 + Math.sin(i * 1.7) * 2, 0.55, r2, '#4f9a32');
        banner(g, -24, -h + 4, col, 30);
        banner(g, 24, -h + 4, col, 30);
        if (elite) {
          // crystals
          for (const [cx, cy, sc] of [[-30, 4, 1], [32, 2, 0.8]]) {
            g.save(); g.translate(cx, cy); g.scale(sc, sc);
            for (const [dx, hh, rot] of [[-3, 14, -0.2], [2, 18, 0.1], [6, 10, 0.4]]) {
              g.save(); g.translate(dx, 0); g.rotate(rot);
              g.beginPath(); g.moveTo(-2.5, 0); g.lineTo(-2.5, -hh * 0.75); g.lineTo(0, -hh); g.lineTo(2.5, -hh * 0.75); g.lineTo(2.5, 0); g.closePath();
              H.fs(g, H.lin(g, -2.5, 0, 2.5, 0, [[0, U.shade(col, 0.5)], [1, U.shade(col, -0.1)]]), 1.4);
              g.restore();
            }
            g.restore();
          }
        }
      }
    });
  };

  /** Den (barracks) bases */
  Art.denBase = function (tier, elite) {
    return Art.sprite(`den|${tier}|${elite || ''}`, 120, 110, 60, 76, (g) => {
      const col = FAMCOL.den;
      H.shadow(g, 3, 4, 40, 14, 0.32);
      if (tier <= 2) {
        const big = tier === 2;
        const w = big ? 36 : 31, h = big ? 34 : 26;
        g.beginPath(); g.moveTo(-w, 2); g.bezierCurveTo(-w, -h * 0.9, -w * 0.4, -h * 1.2, 2, -h * 1.15); g.bezierCurveTo(w * 0.5, -h * 1.1, w, -h * 0.8, w, 2);
        g.quadraticCurveTo(0, 12, -w, 2);
        H.fs(g, H.vol(g, 0, -h * 0.5, w, h, '#8a5d33', 0.3, -0.38), 2.4);
        g.beginPath(); g.moveTo(-w + 4, -h * 0.55); g.bezierCurveTo(-w * 0.8, -h * 1.15, w * 0.6, -h * 1.3, w - 3, -h * 0.55);
        g.bezierCurveTo(w * 0.4, -h * 0.75, -w * 0.4, -h * 0.75, -w + 4, -h * 0.55);
        H.fs(g, H.vol(g, 0, -h * 0.9, w, h * 0.4, '#6db443', 0.3, -0.3), 2.2);
        const r = U.rng(21 + tier);
        for (let i = 0; i < 6; i++) P.tuft(g, -w + 8 + i * (w * 2 - 16) / 5, -h * 0.62 - Math.sin((i / 5) * Math.PI) * h * 0.35, 0.6, r, '#4f9a32');
        // hole
        g.beginPath(); g.moveTo(-13, 4); g.bezierCurveTo(-14, -18, 14, -18, 13, 4); g.closePath();
        const hg = g.createRadialGradient(0, -2, 1, 0, -2, 16);
        hg.addColorStop(0, '#050200'); hg.addColorStop(1, '#3a210d');
        H.fs(g, hg, 2.2);
        if (big) {
          g.beginPath(); g.moveTo(-18, 4); g.quadraticCurveTo(-20, -26, 2, -24); g.quadraticCurveTo(22, -24, 18, 4);
          g.lineWidth = 7; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 4.6; g.strokeStyle = '#9a6a3c'; g.stroke();
          P.mushroom(g, 26, 2, 0.55, r, '#e8483a', true);
          P.mushroom(g, -27, 4, 0.45, r, '#d9a24a', false);
        }
        for (const [ex, ey] of [[-4, -6], [4, -6]]) { g.beginPath(); H.circ(g, ex, ey, 1.6); g.fillStyle = '#fff6c8'; g.fill(); }
        banner(g, w - 8, -h * 0.55, col, 24);
      } else {
        // hollow log den
        const L = 34, R = 18;
        g.save(); g.translate(-4, -R);
        g.beginPath(); g.moveTo(-L, -R); g.lineTo(L, -R); g.lineTo(L, R); g.lineTo(-L, R); g.closePath();
        H.fs(g, H.lin(g, 0, -R, 0, R, [[0, '#a7764a'], [0.45, '#7d5030'], [1, '#4a2c14']]), 2.4);
        g.strokeStyle = 'rgba(40,20,5,0.5)'; g.lineWidth = 1.4;
        for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-L + 5 + i * 11, -R + 4); g.quadraticCurveTo(-L + 9 + i * 11, 0, -L + 6 + i * 11, R - 3); g.stroke(); }
        g.beginPath(); H.ell(g, -6, -R + 1, 26, 5); H.fs(g, H.vol(g, -6, -R, 26, 5, '#6db443', 0.3, -0.2), 1.6);
        // opening at front-right
        g.beginPath(); H.ell(g, L, 0, 10, R); H.fs(g, '#d1a46c', 2.4);
        g.beginPath(); H.ell(g, L + 1, 1, 6.5, R - 4); g.fillStyle = '#120802'; g.fill();
        for (const [ex, ey] of [[L - 1, -2], [L + 3, -2]]) { g.beginPath(); H.circ(g, ex, ey, 1.5); g.fillStyle = '#fff6c8'; g.fill(); }
        g.restore();
        const r = U.rng(31);
        if (elite === 'bulbear') {
          // claw marks + red emblem banner
          g.strokeStyle = 'rgba(30,10,0,0.7)'; g.lineWidth = 1.6;
          for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-22 + i * 4, -30); g.lineTo(-16 + i * 4, -10); g.stroke(); }
          banner(g, -30, -6, '#eaa83c', 34);
          banner(g, 18, -34, col, 22);
          P.rock(g, -36, 6, 0.55, r, '#a59f94');
        } else if (elite === 'breadbug') {
          // twig nest on top with treasure
          g.save(); g.translate(-8, -38);
          g.strokeStyle = '#6b4424'; g.lineWidth = 2;
          for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI; g.beginPath(); g.moveTo(-16 + i * 2.6, 0); g.lineTo(-16 + i * 2.6 + Math.cos(a) * 8, -5 + Math.sin(a) * 3); g.stroke(); }
          g.beginPath(); H.ell(g, 0, 0, 17, 5); g.lineWidth = 3; g.strokeStyle = '#8a5d33'; g.stroke();
          P.bottleCap(g, 2, 1, 0.45);
          g.restore();
          for (let i = 0; i < 6; i++) { g.beginPath(); H.ell(g, r.range(-36, 30), r.range(0, 8), 2, 1.4); H.fs(g, '#e2b673', 0.8); }
          banner(g, 26, -32, '#d4934a', 24);
        } else {
          banner(g, 20, -34, col, 22);
          P.mushroom(g, -36, 6, 0.5, r, '#e8483a', true);
        }
      }
    });
  };

  /* ============================== PROJECTILES ============================== */
  Art.glow = function (col, r) {
    return Art.sprite(`glow|${col}|${r}`, r * 2, r * 2, r, r, (g) => {
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
      gr.addColorStop(0, U.rgba(col, 0.9)); gr.addColorStop(0.35, U.rgba(col, 0.45)); gr.addColorStop(1, U.rgba(col, 0));
      g.fillStyle = gr; g.beginPath(); H.circ(g, 0, 0, r); g.fill();
    });
  };
  Art.boulder = function (sc) {
    return Art.sprite('boulder|' + sc, 30 * sc, 30 * sc, 15 * sc, 15 * sc, (g) => {
      g.scale(sc, sc);
      const r = U.rng(9);
      g.beginPath(); H.wobble(g, 0, 0, 10, 9, r, 7, 0.15);
      H.fs(g, H.vol(g, 0, 0, 10, 9, '#9c968c', 0.4, -0.4), 2);
      g.beginPath(); g.moveTo(-3, -2); g.lineTo(2, 1); g.lineTo(1, 5); g.lineWidth = 1; g.strokeStyle = 'rgba(40,30,20,0.5)'; g.stroke();
      H.shine(g, -3, -4, 3, 1.4, -0.5, 0.5);
    });
  };

  /* ============================== ICONS ============================== */
  Art.icon = function (name, size) {
    return Art.sprite(`icon|${name}|${size}`, size, size, size / 2, size / 2, (g) => {
      const s = size / 32;
      g.scale(s, s);
      g.lineJoin = 'round';
      switch (name) {
        case 'heart':
          g.beginPath(); g.moveTo(0, 11); g.bezierCurveTo(-18, -2, -10, -16, 0, -7); g.bezierCurveTo(10, -16, 18, -2, 0, 11);
          H.fs(g, H.vol(g, 0, -2, 12, 11, '#ff4a5a', 0.45, -0.35), 2.6);
          H.shine(g, -6, -6, 3, 1.8, -0.6, 0.7);
          break;
        case 'poko':
          g.beginPath(); H.circ(g, 0, 0, 12); H.fs(g, H.vol(g, 0, 0, 12, 12, '#ffcf3a', 0.5, -0.35), 2.6);
          g.beginPath(); H.circ(g, 0, 0, 8); g.lineWidth = 1.6; g.strokeStyle = '#b07a0a'; g.stroke();
          H.text(g, 'P', 0, 0.5, 11, '#fff3b0', { shadow: false, lw: 2.4, strokeColor: '#9a6400' });
          break;
        case 'wave':
          // little onion icon
          g.beginPath(); g.moveTo(0, -13); g.bezierCurveTo(5, -7, 13, -6, 12, 2); g.bezierCurveTo(11, 9, 5, 10, 0, 10); g.bezierCurveTo(-5, 10, -11, 9, -12, 2); g.bezierCurveTo(-13, -6, -5, -7, 0, -13);
          H.fs(g, H.vol(g, 0, 0, 12, 12, '#e8392c', 0.45, -0.35), 2.4);
          g.beginPath(); g.moveTo(-6, 10); g.lineTo(-9, 15); g.moveTo(6, 10); g.lineTo(9, 15); g.lineWidth = 2.2; g.strokeStyle = OUT; g.stroke();
          H.shine(g, -5, -3, 2, 3.5, 0.4, 0.5);
          break;
        case 'pause':
          for (const x of [-5, 5]) { g.beginPath(); H.rr(g, x - 3, -9, 6, 18, 2); H.fs(g, '#fff6e0', 2.4); }
          break;
        case 'play':
          g.beginPath(); g.moveTo(-6, -10); g.lineTo(10, 0); g.lineTo(-6, 10); g.closePath(); H.fs(g, '#fff6e0', 2.4);
          break;
        case 'speed1': case 'speed2':
          H.text(g, name === 'speed2' ? 'x2' : 'x1', 0, 1, 17, name === 'speed2' ? '#ffe36a' : '#fff6e0', { lw: 4 });
          break;
        case 'sound': case 'mute':
          g.beginPath(); g.moveTo(-11, -4); g.lineTo(-5, -4); g.lineTo(2, -10); g.lineTo(2, 10); g.lineTo(-5, 4); g.lineTo(-11, 4); g.closePath(); H.fs(g, '#fff6e0', 2.2);
          if (name === 'sound') {
            g.beginPath(); g.arc(3, 0, 6, -0.9, 0.9); g.moveTo(3 + Math.cos(-0.9) * 10, Math.sin(-0.9) * 10); g.arc(3, 0, 10, -0.9, 0.9);
            g.lineWidth = 2.4; g.strokeStyle = '#fff6e0'; g.stroke();
          } else {
            g.beginPath(); g.moveTo(6, -6); g.lineTo(13, 6); g.moveTo(13, -6); g.lineTo(6, 6); g.lineWidth = 3; g.strokeStyle = '#ff6a5a'; g.stroke();
          }
          break;
        case 'upgrade':
          g.beginPath(); g.moveTo(0, -12); g.lineTo(11, 0); g.lineTo(5, 0); g.lineTo(5, 11); g.lineTo(-5, 11); g.lineTo(-5, 0); g.lineTo(-11, 0); g.closePath();
          H.fs(g, H.vol(g, 0, 0, 11, 12, '#7ee04a', 0.4, -0.3), 2.4);
          break;
        case 'sell':
          g.beginPath(); H.circ(g, 0, 0, 11); H.fs(g, H.vol(g, 0, 0, 11, 11, '#ffcf3a', 0.5, -0.35), 2.4);
          H.text(g, '$', 0, 1, 14, '#9a6400', { shadow: false, stroke: false });
          break;
        case 'rally':
          g.beginPath(); g.moveTo(-6, 13); g.lineTo(-6, -12); g.lineWidth = 4; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 2; g.strokeStyle = '#d9b07a'; g.stroke();
          g.beginPath(); g.moveTo(-5, -12); g.lineTo(11, -7); g.lineTo(-5, -1); g.closePath(); H.fs(g, '#e8392c', 2);
          break;
        case 'lock':
          g.beginPath(); g.arc(0, -3, 6, Math.PI, 0); g.lineWidth = 5; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 2.6; g.strokeStyle = '#c9c9c9'; g.stroke();
          g.beginPath(); H.rr(g, -9, -3, 18, 14, 3); H.fs(g, H.vol(g, 0, 4, 9, 7, '#e9b93c', 0.4, -0.3), 2.2);
          break;
        case 'star': case 'starEmpty':
          g.beginPath(); H.star(g, 0, 1, 13, 6);
          H.fs(g, name === 'star' ? H.vol(g, 0, 0, 13, 13, '#ffd23a', 0.5, -0.3) : '#6b5a48', 2.4);
          if (name === 'star') H.shine(g, -4, -4, 2.5, 1.5, -0.6, 0.7);
          break;
        case 'check':
          g.beginPath(); g.moveTo(-10, 0); g.lineTo(-3, 8); g.lineTo(11, -9);
          g.lineWidth = 7; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 4; g.strokeStyle = '#8be05a'; g.stroke();
          break;
        case 'sword':
          g.save(); g.rotate(-0.78);
          g.beginPath(); g.moveTo(-2.5, -14); g.lineTo(0, -17); g.lineTo(2.5, -14); g.lineTo(2.5, 5); g.lineTo(-2.5, 5); g.closePath(); H.fs(g, '#e6ecf2', 1.8);
          g.beginPath(); H.rr(g, -7, 5, 14, 3, 1); H.fs(g, '#c99a3a', 1.6);
          g.beginPath(); H.rr(g, -2, 8, 4, 7, 1); H.fs(g, '#7a4a26', 1.6);
          g.restore();
          break;
        case 'shield':
          g.beginPath(); g.moveTo(0, -13); g.lineTo(11, -8); g.quadraticCurveTo(10, 8, 0, 14); g.quadraticCurveTo(-10, 8, -11, -8); g.closePath();
          H.fs(g, H.vol(g, 0, 0, 11, 13, '#6a8fd6', 0.4, -0.3), 2.2);
          break;
        case 'range':
          g.beginPath(); H.ell(g, 0, 2, 12, 8); g.lineWidth = 2.4; g.strokeStyle = '#fff6e0'; g.setLineDash([3, 3]); g.stroke(); g.setLineDash([]);
          g.beginPath(); H.circ(g, 0, 2, 3); H.fs(g, '#ff6a5a', 1.6);
          break;
        case 'clock':
          g.beginPath(); H.circ(g, 0, 0, 11); H.fs(g, '#fff6e0', 2.2);
          g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -7); g.moveTo(0, 0); g.lineTo(5, 2); g.lineWidth = 2; g.strokeStyle = OUT; g.stroke();
          break;
        case 'skull':
          g.beginPath(); H.ell(g, 0, -2, 11, 10); H.fs(g, '#f6efe0', 2.2);
          g.beginPath(); H.rr(g, -6, 5, 12, 7, 2); H.fs(g, '#f6efe0', 2.2);
          g.beginPath(); H.ell(g, -4.5, -2, 3, 3.4); H.ell(g, 4.5, -2, 3, 3.4); g.fillStyle = OUT; g.fill();
          break;
      }
    });
  };

  /* ============================== PORTRAITS ============================== */
  /** Round portrait of a unit for menus. kind is a portrait key. */
  Art.portrait = function (kind, size, opt) {
    opt = opt || {};
    const key = `por|${kind}|${size}|${opt.gray ? 1 : 0}|${opt.ring || ''}`;
    return Art.sprite(key, size, size, size / 2, size / 2, (g) => {
      const r = size / 2 - 2;
      g.beginPath(); H.circ(g, 0, 0, r);
      const bg = g.createRadialGradient(0, -r * 0.3, r * 0.1, 0, 0, r);
      bg.addColorStop(0, '#fff3cf'); bg.addColorStop(1, '#d8b47a');
      g.fillStyle = bg; g.fill();
      g.save(); g.beginPath(); H.circ(g, 0, 0, r - 1); g.clip();
      // ground
      g.beginPath(); H.ell(g, 0, r * 0.75, r * 1.1, r * 0.45); g.fillStyle = '#8fcf5a'; g.fill();
      Art.drawPortraitSubject(g, kind, r);
      g.restore();
      if (opt.gray) {
        g.save(); g.globalCompositeOperation = 'saturation'; g.fillStyle = '#888'; g.beginPath(); H.circ(g, 0, 0, r); g.fill(); g.restore();
        g.save(); g.fillStyle = 'rgba(40,30,20,0.35)'; g.beginPath(); H.circ(g, 0, 0, r); g.fill(); g.restore();
      }
      g.beginPath(); H.circ(g, 0, 0, r);
      g.lineWidth = Math.max(3, size * 0.07); g.strokeStyle = OUT; g.stroke();
      g.lineWidth = Math.max(1.5, size * 0.035); g.strokeStyle = opt.ring || '#c08a3e'; g.stroke();
    });
  };

  /** Subject drawing for portraits. r = portrait radius. */
  Art.drawPortraitSubject = function (g, kind, r) {
    const k = r / 30; // design scale (r = 30 nominal)
    g.save();
    const [cat, id] = kind.split(':');
    if (cat === 'pik') {
      const [type, tier] = id.split('.');
      g.translate(0, r * 0.82); g.scale(k * 1.45, k * 1.45);
      Art.drawPikmin(g, type, +tier || 2, 'front', 0, 'idle');
    } else if (cat === 'cap') {
      const s = Art.CAPT[id].scale;
      g.translate(0, r * 1.25); g.scale(k * 1.15 / Math.sqrt(s), k * 1.15 / Math.sqrt(s));
      Art.drawCaptain(g, id, 'front', 0, 'idle');
    } else if (cat === 'cre') {
      const C = Art.CRE[id];
      const fit = { groink: 1.05, manatlegs: 0.62, snitch: 0.85, fiery: 1.05, withering: 1.05, puffy: 0.8, larva: 1.0, decorated: 0.85, wolly: 1.05 }[id] || 1;
      g.translate(-r * 0.12, r * 0.72 + (id === 'snitch' ? r * 0.55 : id === 'puffy' ? r * 0.4 : id === 'manatlegs' ? r * 0.25 : 0)); g.scale(k * fit, k * fit);
      C.draw(g, 0, 0, 1);
    } else if (cat === 'borb') {
      const K = Art.BORB[id];
      const fit = 0.72 / K.scale;
      g.translate(-r * 0.22, r * 0.78); g.scale(k * fit, k * fit);
      Art.drawBulborb(g, K, 0, 0, false, 0);
    } else if (cat === 'bread') {
      g.translate(-r * 0.05, r * 0.55); g.scale(k * 1.3, k * 1.3);
      Art.drawBreadbug(g, 0, false, 0, 1);
    } else if (cat === 'spell') {
      if (id === 'snagret') {
        g.translate(-r * 0.2, r * 0.9); g.scale(k * 0.62, k * 0.62);
        Art.drawSnagret(g, 0, 0, 1, 0.15, 1);
      } else {
        g.translate(-r * 0.22, r * 0.78); g.scale(k * 1.6, k * 1.6);
        Art.drawBulborb(g, Art.BORB.reinf, 0, 0, false, 0);
      }
    }
    g.restore();
  };

  /* ============================== TERRAIN PAINTER ============================== */
  /**
   * Paint a level's static background. lv: built level with paths, spots, water, theme.
   * Returns canvas (logical 1280x720 at RES).
   */
  Art.paintLevel = function (lv, res) {
    const W = PTD.W, Hh = PTD.H;
    res = res || Art.RES;
    const c = Art.canvas(W * res, Hh * res);
    const g = c.getContext('2d');
    g.scale(res, res);
    g.lineJoin = 'round'; g.lineCap = 'round';
    const T = THEMES[lv.theme];
    const rng = U.rng(lv.seed || 1234);

    // base
    const bg = g.createRadialGradient(W / 2, Hh * 0.45, 100, W / 2, Hh / 2, 900);
    bg.addColorStop(0, T.g3); bg.addColorStop(0.5, T.g1); bg.addColorStop(1, T.g2);
    g.fillStyle = bg; g.fillRect(0, 0, W, Hh);
    // blotches
    for (let i = 0; i < 520; i++) {
      const x = rng() * W, y = rng() * Hh, r = rng.range(20, 90);
      g.fillStyle = U.rgba(rng() < 0.5 ? (T.g2.length === 7 ? T.g2 : '#000') : T.g3, rng.range(0.05, 0.14));
      g.beginPath(); H.ell(g, x, y, r, r * 0.6); g.fill();
    }
    // fine grass strokes
    for (let i = 0; i < 4200; i++) {
      const x = rng() * W, y = rng() * Hh;
      const L = rng.range(3, 7);
      g.strokeStyle = rng() < 0.5 ? U.rgba(T.g2, 0.5) : U.rgba(T.g3, 0.55);
      g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + rng.range(-1.5, 1.5), y - L); g.stroke();
    }
    // tiny flowers
    for (let i = 0; i < 160; i++) {
      const x = rng() * W, y = rng() * Hh;
      if (lv.distToPath(x, y) < 40) continue;
      g.fillStyle = rng.pick(T.flowers);
      for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; g.beginPath(); H.circ(g, x + Math.cos(a) * 1.8, y + Math.sin(a) * 1.3, 1.3); g.fill(); }
      g.fillStyle = '#ffcc33'; g.beginPath(); H.circ(g, x, y, 0.9); g.fill();
    }

    // water bodies
    for (const w of lv.water || []) {
      const wr = U.rng(w.x * 7 + w.y);
      const path = (g) => H.wobble(g, w.x, w.y, w.rx, w.ry, U.rng(w.x * 3 + w.y), 14, 0.12);
      g.save();
      g.beginPath(); path(g);
      g.lineWidth = 16; g.strokeStyle = U.rgba('#6b5232', 0.35); g.stroke();
      g.lineWidth = 7; g.strokeStyle = '#8a7350'; g.stroke();
      const wg = g.createRadialGradient(w.x - w.rx * 0.2, w.y - w.ry * 0.3, 10, w.x, w.y, Math.max(w.rx, w.ry));
      wg.addColorStop(0, '#7cc8ef'); wg.addColorStop(0.6, T.water || '#4aa6d9'); wg.addColorStop(1, '#2d6f9f');
      g.fillStyle = wg; g.fill();
      g.lineWidth = 2.5; g.strokeStyle = OUT; g.stroke();
      g.clip();
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2;
      for (let i = 0; i < 14; i++) {
        const x = w.x + wr.range(-w.rx, w.rx) * 0.8, y = w.y + wr.range(-w.ry, w.ry) * 0.8;
        g.beginPath(); g.moveTo(x - 10, y); g.quadraticCurveTo(x, y - 3, x + 10, y); g.stroke();
      }
      g.restore();
      for (let i = 0; i < Math.round(w.rx / 18); i++) {
        const a = wr() * TAU;
        P.lilypad(g, w.x + Math.cos(a) * w.rx * wr.range(0.2, 0.7), w.y + Math.sin(a) * w.ry * wr.range(0.2, 0.7), wr.range(0.8, 1.3), wr);
      }
      for (let i = 0; i < 4; i++) {
        const a = wr() * TAU;
        P.reeds(g, w.x + Math.cos(a) * w.rx * 0.98, w.y + Math.sin(a) * w.ry * 0.98 + 4, wr.range(0.7, 1), wr);
      }
    }

    // ---------- the path ----------
    const strokeAll = (w, col) => {
      g.lineWidth = w; g.strokeStyle = col;
      for (const p of lv.paths) {
        g.beginPath();
        const pts = p.pts;
        g.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i += 2) g.lineTo(pts[i][0], pts[i][1]);
        g.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
        g.stroke();
      }
    };
    strokeAll(84, U.rgba('#2a2a10', 0.12));
    strokeAll(72, U.rgba(T.dirtEdge, 0.55));
    strokeAll(64, T.dirtEdge);
    strokeAll(57, T.dirt);
    strokeAll(30, U.rgba(T.dirtLight, 0.55));
    strokeAll(12, U.rgba(T.dirtLight, 0.35));
    // path texture
    const all = [];
    for (const p of lv.paths) for (let i = 0; i < p.pts.length; i += 3) all.push(p.pts[i]);
    for (let i = 0; i < all.length * 0.9; i++) {
      const p = all[Math.floor(rng() * all.length)];
      const x = p[0] + rng.range(-24, 24), y = p[1] + rng.range(-24, 24);
      if (lv.distToPath(x, y) > 25) continue;
      const r = rng.range(1.2, 3.4);
      g.beginPath(); H.ell(g, x, y, r, r * 0.7);
      g.fillStyle = rng() < 0.5 ? U.rgba(T.dirtEdge, 0.45) : U.rgba('#ffffff', 0.18); g.fill();
    }
    for (let i = 0; i < all.length * 0.12; i++) {
      const p = all[Math.floor(rng() * all.length)];
      const x = p[0] + rng.range(-22, 22), y = p[1] + rng.range(-20, 20);
      if (lv.distToPath(x, y) > 24) continue;
      P.pebbles(g, x, y, 0.45, rng, T.rock);
    }
    // footprints (tiny pikmin trails)
    g.fillStyle = U.rgba(T.dirtEdge, 0.25);
    for (const p of lv.paths) {
      for (let i = 0; i < p.pts.length - 6; i += 7) {
        const a = p.pts[i], b = p.pts[i + 3];
        const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
        const nx = -dy / L, ny = dx / L;
        const off = (i % 14 === 0 ? 1 : -1) * 4 + Math.sin(i * 0.37) * 10;
        g.beginPath(); H.ell(g, a[0] + nx * off, a[1] + ny * off, 1.6, 1.1, Math.atan2(dy, dx)); g.fill();
      }
    }
    // grass overhang on path edges
    for (const p of lv.paths) {
      for (let i = 0; i < p.pts.length - 2; i += 5) {
        const a = p.pts[i], b = p.pts[i + 2];
        const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
        const nx = -dy / L, ny = dx / L;
        for (const sd of [-1, 1]) {
          const x = a[0] + nx * sd * rng.range(29, 34), y = a[1] + ny * sd * rng.range(29, 34);
          if (lv.distToPath(x, y) < 27) continue;
          if (rng() < 0.6) P.tuft(g, x, y + 3, rng.range(0.55, 0.9), rng, rng() < 0.5 ? T.g2 : T.g1);
        }
      }
    }

    // ---------- decorations (sorted by y) ----------
    const items = (lv.decor || []).slice().sort((a, b) => a.y - b.y);
    for (const d of items) {
      const r = U.rng(Math.floor(d.x * 31 + d.y * 17));
      switch (d.k) {
        case 'bush': P.bush(g, d.x, d.y, d.s, r, T.bush, T.bush2); break;
        case 'rock': P.rock(g, d.x, d.y, d.s, r, T.rock); break;
        case 'pebbles': P.pebbles(g, d.x, d.y, d.s, r, T.rock); break;
        case 'clover': P.clover(g, d.x, d.y, d.s, r); break;
        case 'daisy': P.daisy(g, d.x, d.y, d.s, r, r.pick(T.flowers)); break;
        case 'mushroom': P.mushroom(g, d.x, d.y, d.s, r, r.pick(['#e8483a', '#d9a24a', '#b0603a']), r() < 0.6); break;
        case 'glowshroom': P.glowShroom(g, d.x, d.y, d.s, r); break;
        case 'posy': P.pelletPosy(g, d.x, d.y, d.s, r); break;
        case 'cap': P.bottleCap(g, d.x, d.y, d.s); break;
        case 'can': P.can(g, d.x, d.y, d.s, r); break;
        case 'battery': P.battery(g, d.x, d.y, d.s); break;
        case 'leaf': P.leaf(g, d.x, d.y, d.s, r, r.pick(T.leaves || ['#e4782b'])); break;
        case 'fern': P.fern(g, d.x, d.y, d.s, r, T.bush2); break;
        case 'log': P.log(g, d.x, d.y, d.s); break;
        case 'stump': P.stump(g, d.x, d.y, d.s); break;
        case 'acorn': P.acorn(g, d.x, d.y, d.s); break;
        case 'reeds': P.reeds(g, d.x, d.y, d.s, r); break;
        case 'tuft': P.tuft(g, d.x, d.y, d.s, r, T.g2); break;
      }
    }

    // exit burrows
    for (const p of lv.paths) {
      if (p.drawExit) Art.drawBurrow(g, p.exit[0], p.exit[1] + 14, 0.9, lv.theme);
    }

    // vignette
    const vg = g.createRadialGradient(W / 2, Hh / 2, Hh * 0.45, W / 2, Hh / 2, W * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,20,0,0.38)');
    g.fillStyle = vg; g.fillRect(0, 0, W, Hh);
    return c;
  };
})();
