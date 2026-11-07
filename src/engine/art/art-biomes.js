/* Bulborb Rush — expansion biome art: palettes, props and painted hazard zones
   for the beach, tundra, volcanic and cave levels. */
(function () {
  'use strict';
  const PTD = window.PTD;
  const U = PTD.U;
  const Art = PTD.Art;
  const H = Art.H;
  const OUT = Art.OUT;
  const TAU = Math.PI * 2;
  const P = Art.Props;

  Object.assign(Art.THEMES, {
    beach: { g1: '#ecd59a', g2: '#d9bd7a', g3: '#f6e6b4', dirt: '#c9a46a', dirtEdge: '#8e7046', dirtLight: '#dcc08a', bush: '#5aa04a', bush2: '#6cb556', rock: '#b7aea0', water: '#4aa6d9', flowers: ['#ffffff', '#ffb3c8', '#ffe04a'], tuft: '#9bb04a', vignette: 'rgba(60,40,0,0.32)' },
    tundra: { g1: '#e6eef5', g2: '#c9d8e6', g3: '#f7fbff', dirt: '#a89a8a', dirtEdge: '#6b5d50', dirtLight: '#c9bcae', bush: '#dfe9f2', bush2: '#f4f8fc', rock: '#8e959e', water: '#7cc0e0', flowers: ['#ffffff', '#cfe8ff', '#a8d4ff'], tuft: '#9aa77a', vignette: 'rgba(20,40,70,0.35)' },
    volcanic: { g1: '#5b4a42', g2: '#46372f', g3: '#6e5a4e', dirt: '#8a6e58', dirtEdge: '#3a2a20', dirtLight: '#a88a6e', bush: '#5a6b3a', bush2: '#6e7d44', rock: '#4a4248', flowers: ['#ff9a2a', '#ffcf5a', '#ff5a1f'], tuft: '#7a6a3a', vignette: 'rgba(40,5,0,0.5)' },
    cave: { g1: '#4a4a5e', g2: '#3a3a4c', g3: '#5a5a70', dirt: '#7d6f62', dirtEdge: '#3a3028', dirtLight: '#9a8a78', bush: '#3d5a50', bush2: '#4a6e60', rock: '#6a6a7a', water: '#3a6a9a', flowers: ['#7fd8ff', '#c9a2ff', '#8bffcf'], tuft: '#5a7060', vignette: 'rgba(5,0,20,0.55)' },
  });

  /* ============================== BEACH ============================== */
  P.shell = function (g, x, y, s, rng) {
    const col = rng.pick(['#ffd9c8', '#fff1dc', '#f7c1d0', '#e9d3b4']);
    H.shadow(g, x + 2, y + 1, 9 * s, 3 * s, 0.22);
    g.save(); g.translate(x, y - 4 * s); g.rotate(rng.range(-0.5, 0.5));
    g.beginPath(); g.moveTo(0, 5 * s);
    g.bezierCurveTo(-10 * s, 0, -8 * s, -8 * s, 0, -8 * s);
    g.bezierCurveTo(8 * s, -8 * s, 10 * s, 0, 0, 5 * s);
    H.fs(g, H.vol(g, 0, -2 * s, 8 * s, 7 * s, col, 0.4, -0.25), 1.4);
    g.strokeStyle = U.shade(col, -0.3); g.lineWidth = 0.9;
    for (const a of [-0.9, -0.45, 0, 0.45, 0.9]) { g.beginPath(); g.moveTo(0, 4 * s); g.lineTo(Math.sin(a) * 8 * s, -Math.cos(a) * 7 * s); g.stroke(); }
    g.restore();
  };

  P.conch = function (g, x, y, s) {
    H.shadow(g, x + 4, y + 2, 26 * s, 7 * s, 0.3);
    g.save(); g.translate(x, y - 12 * s);
    g.beginPath();
    g.moveTo(-24 * s, 4 * s);
    g.bezierCurveTo(-20 * s, -14 * s, 6 * s, -18 * s, 20 * s, -6 * s);
    g.quadraticCurveTo(28 * s, 0, 22 * s, 8 * s);
    g.quadraticCurveTo(0, 16 * s, -24 * s, 4 * s);
    H.fs(g, H.vol(g, -2 * s, -2 * s, 22 * s, 12 * s, '#f6d6b8', 0.35, -0.3), 2.2);
    g.beginPath(); H.ell(g, 14 * s, 3 * s, 8 * s, 5 * s, -0.3);
    H.fs(g, H.vol(g, 14 * s, 3 * s, 8 * s, 5 * s, '#ff9fae', 0.3, -0.3), 1.6);
    g.strokeStyle = 'rgba(140,90,60,0.55)'; g.lineWidth = 1.4;
    for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(-12 * s + i * 7 * s, -2 * s, 6 * s, Math.PI * 0.9, Math.PI * 1.8); g.stroke(); }
    for (const [sx, sy] of [[-14, -8], [-4, -12], [6, -12]]) { g.beginPath(); g.moveTo(sx * s, sy * s); g.lineTo((sx + 2) * s, (sy - 6) * s); g.lineTo((sx + 4) * s, sy * s); H.fs(g, '#f0c49a', 1.2); }
    H.shine(g, -8 * s, -8 * s, 6 * s, 2 * s, -0.3, 0.45);
    g.restore();
  };

  P.starfish = function (g, x, y, s, rng) {
    const col = rng.pick(['#ff8a5a', '#ffb347', '#e8604a']);
    H.shadow(g, x + 2, y + 1, 9 * s, 3 * s, 0.22);
    g.save(); g.translate(x, y - 2 * s); g.scale(1, 0.62); g.rotate(rng() * TAU);
    g.beginPath(); H.star(g, 0, 0, 9 * s, 3.6 * s, 5);
    H.fs(g, H.vol(g, 0, 0, 9 * s, 9 * s, col, 0.35, -0.3), 1.4);
    g.fillStyle = 'rgba(255,240,210,0.8)';
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i / 5) * TAU; g.beginPath(); H.circ(g, Math.cos(a) * 4.5 * s, Math.sin(a) * 4.5 * s, 0.9 * s); g.fill(); }
    g.restore();
  };

  P.seaweed = function (g, x, y, s, rng) {
    for (let i = 0; i < 3; i++) {
      const dx = (i - 1) * 4 * s, L = rng.range(12, 20) * s;
      g.beginPath(); g.moveTo(x + dx, y);
      g.bezierCurveTo(x + dx - 5 * s, y - L * 0.4, x + dx + 5 * s, y - L * 0.7, x + dx + rng.range(-3, 3) * s, y - L);
      g.lineWidth = 4 * s; g.strokeStyle = OUT; g.stroke();
      g.lineWidth = 2.4 * s; g.strokeStyle = i % 2 ? '#5f9a3a' : '#3f7f4a'; g.stroke();
    }
  };

  P.driftwood = function (g, x, y, s) {
    H.shadow(g, x, y + 2, 36 * s, 7 * s, 0.28);
    g.save(); g.translate(x, y - 8 * s); g.rotate(-0.08);
    g.beginPath(); g.moveTo(-34 * s, -5 * s); g.quadraticCurveTo(0, -10 * s, 32 * s, -6 * s); g.lineTo(34 * s, 5 * s); g.quadraticCurveTo(0, 9 * s, -32 * s, 6 * s); g.closePath();
    H.fs(g, H.lin(g, 0, -8 * s, 0, 8 * s, [[0, '#e8dccb'], [0.5, '#bfae96'], [1, '#8a7a64']]), 2);
    g.strokeStyle = 'rgba(90,70,50,0.5)'; g.lineWidth = 1;
    for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-28 * s + i * 12 * s, -4 * s); g.quadraticCurveTo(-22 * s + i * 12 * s, 0, -26 * s + i * 12 * s, 5 * s); g.stroke(); }
    g.beginPath(); g.moveTo(10 * s, -7 * s); g.lineTo(18 * s, -16 * s); g.lineWidth = 4 * s; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 2.2 * s; g.strokeStyle = '#cbbba2'; g.stroke();
    g.restore();
  };

  /* ============================== TUNDRA ============================== */
  P.snowdrift = function (g, x, y, s, rng) {
    H.shadow(g, x + 4 * s, y + 2 * s, 26 * s, 7 * s, 0.18);
    g.beginPath(); H.wobble(g, x, y - 7 * s, 24 * s, 11 * s, rng, 9, 0.16);
    H.fs(g, H.vol(g, x, y - 9 * s, 24 * s, 12 * s, '#f4f8fc', 0.3, -0.18), 2);
    g.beginPath(); H.ell(g, x - 6 * s, y - 12 * s, 9 * s, 3 * s); g.fillStyle = 'rgba(255,255,255,0.9)'; g.fill();
    if (rng() < 0.4) { g.beginPath(); H.ell(g, x + 8 * s, y - 4 * s, 5 * s, 2.5 * s); g.fillStyle = 'rgba(150,180,210,0.45)'; g.fill(); }
  };

  P.icicle = function (g, x, y, s, rng) {
    H.shadow(g, x + 2, y + 1, 10 * s, 3 * s, 0.2);
    for (const [dx, hh, rot] of [[-4, 12, -0.25], [1, 18, 0.05], [6, 10, 0.35]]) {
      g.save(); g.translate(x + dx * s, y); g.rotate(rot + rng.range(-0.1, 0.1));
      g.beginPath(); g.moveTo(-2.6 * s, 0); g.lineTo(-2.6 * s, -hh * 0.7 * s); g.lineTo(0, -hh * s); g.lineTo(2.6 * s, -hh * 0.7 * s); g.lineTo(2.6 * s, 0); g.closePath();
      H.fs(g, H.lin(g, -2.6 * s, 0, 2.6 * s, 0, [[0, '#ffffff'], [0.5, '#bfe9ff'], [1, '#6fb8e0']]), 1.3);
      g.restore();
    }
  };

  P.pine = function (g, x, y, s) {
    H.shadow(g, x + 4, y + 2, 20 * s, 6 * s, 0.25);
    g.beginPath(); g.rect(x - 3 * s, y - 10 * s, 6 * s, 10 * s); H.fs(g, '#6b4424', 1.6);
    const tiers = [[-10, 20, 12], [-20, 16, 11], [-29, 11, 10]];
    for (const [ty, w, h] of tiers) {
      g.beginPath(); g.moveTo(x - w * s, y + ty * s); g.lineTo(x, y + (ty - h - 6) * s); g.lineTo(x + w * s, y + ty * s); g.quadraticCurveTo(x, y + (ty + 4) * s, x - w * s, y + ty * s);
      H.fs(g, H.vol(g, x, y + (ty - 6) * s, w * s, h * s, '#3f7a4f', 0.3, -0.35), 1.8);
      g.beginPath(); g.moveTo(x - w * 0.7 * s, y + (ty - 3) * s); g.quadraticCurveTo(x, y + (ty - h - 2) * s, x + w * 0.5 * s, y + (ty - 4) * s);
      g.lineWidth = 2.6 * s; g.strokeStyle = 'rgba(255,255,255,0.9)'; g.stroke();
    }
  };

  P.iceBlock = function (g, x, y, s) {
    H.shadow(g, x + 4, y + 2, 26 * s, 8 * s, 0.25);
    const w = 22 * s, h = 26 * s, d = 9 * s;
    g.beginPath(); g.moveTo(x - w, y - d); g.lineTo(x + w * 0.6, y - d * 1.4); g.lineTo(x + w, y); g.lineTo(x - w * 0.5, y + d * 0.6); g.closePath();
    g.beginPath(); g.moveTo(x - w, y - d); g.lineTo(x - w, y - d - h); g.lineTo(x + w * 0.6, y - d * 1.4 - h); g.lineTo(x + w, y - h); g.lineTo(x + w, y); g.lineTo(x - w * 0.5, y + d * 0.6); g.closePath();
    H.fs(g, H.lin(g, x - w, y - h, x + w, y, [[0, 'rgba(240,252,255,0.95)'], [0.5, 'rgba(170,220,245,0.9)'], [1, 'rgba(110,170,215,0.95)']]), 2.2);
    g.beginPath(); g.moveTo(x - w * 0.5, y + d * 0.6 - h); g.lineTo(x - w * 0.5, y + d * 0.6); g.lineWidth = 1.4; g.strokeStyle = 'rgba(37,21,11,0.5)'; g.stroke();
    g.beginPath(); g.moveTo(x - w, y - d - h); g.lineTo(x - w * 0.5, y + d * 0.6 - h); g.lineTo(x + w, y - h); g.stroke();
    // a frozen pellet inside
    g.beginPath(); H.circ(g, x + 2 * s, y - h * 0.45, 6 * s); g.fillStyle = 'rgba(232,57,44,0.55)'; g.fill();
    H.shine(g, x - w * 0.6, y - h * 0.8, 3 * s, 8 * s, 0.2, 0.6);
  };

  /* ============================== VOLCANIC ============================== */
  P.emberCrack = function (g, x, y, s, rng) {
    g.save(); g.translate(x, y); g.scale(1, 0.55);
    g.beginPath(); H.wobble(g, 0, 0, 14 * s, 12 * s, rng, 7, 0.25); g.fillStyle = 'rgba(30,15,10,0.55)'; g.fill();
    g.strokeStyle = '#ff8a2a'; g.lineWidth = 1.6 * s;
    for (let i = 0; i < 4; i++) {
      const a = rng() * TAU;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 6 * s, Math.sin(a) * 6 * s); g.lineTo(Math.cos(a + 0.3) * 12 * s, Math.sin(a + 0.3) * 12 * s); g.stroke();
    }
    g.beginPath(); H.circ(g, 0, 0, 2.5 * s); g.fillStyle = '#ffd25a'; g.fill();
    g.restore();
  };

  P.obsidian = function (g, x, y, s, rng) {
    H.shadow(g, x + 2, y + 1, 12 * s, 4 * s, 0.3);
    for (const [dx, hh, rot] of [[-5, 12, -0.3], [0, 18, 0], [6, 11, 0.4]]) {
      g.save(); g.translate(x + dx * s, y); g.rotate(rot + rng.range(-0.1, 0.1));
      g.beginPath(); g.moveTo(-3.4 * s, 0); g.lineTo(-2.4 * s, -hh * 0.8 * s); g.lineTo(0.4 * s, -hh * s); g.lineTo(3.4 * s, -hh * 0.6 * s); g.lineTo(3 * s, 0); g.closePath();
      H.fs(g, H.lin(g, -3 * s, 0, 3 * s, 0, [[0, '#4a3a5a'], [0.45, '#1c1424'], [1, '#2e2238']]), 1.3);
      g.beginPath(); g.moveTo(-1.6 * s, -2 * s); g.lineTo(-0.6 * s, -hh * 0.75 * s); g.lineWidth = 1; g.strokeStyle = 'rgba(200,170,255,0.6)'; g.stroke();
      g.restore();
    }
  };

  P.charStump = function (g, x, y, s) {
    H.shadow(g, x + 3, y + 2, 24 * s, 7 * s, 0.3);
    g.beginPath(); g.moveTo(-18 * s + x, y - 22 * s); g.lineTo(-22 * s + x, y); g.quadraticCurveTo(x, y + 9 * s, x + 22 * s, y); g.lineTo(x + 18 * s, y - 22 * s); g.closePath();
    H.fs(g, H.lin(g, x - 22 * s, 0, x + 22 * s, 0, [[0, '#1e1612'], [0.4, '#4a3a30'], [1, '#140e0a']]), 2.2);
    g.beginPath(); H.ell(g, x, y - 22 * s, 18 * s, 6.5 * s); H.fs(g, H.vol(g, x, y - 22 * s, 18 * s, 6 * s, '#3a2a22', 0.25, -0.2), 2);
    g.beginPath(); H.ell(g, x + 2 * s, y - 22 * s, 7 * s, 2.4 * s); g.fillStyle = '#ff7a2a'; g.fill();
    g.beginPath(); H.ell(g, x + 2 * s, y - 22 * s, 3 * s, 1.2 * s); g.fillStyle = '#ffe07a'; g.fill();
    g.strokeStyle = 'rgba(255,120,40,0.7)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(x - 10 * s, y - 16 * s); g.lineTo(x - 7 * s, y - 8 * s); g.lineTo(x - 11 * s, y - 2 * s); g.stroke();
  };

  /* ============================== CAVE ============================== */
  P.crystal = function (g, x, y, s, rng, T, d) {
    const col = (d && d.col) || '#7fd8ff';
    const gr = g.createRadialGradient(x, y - 12 * s, 1, x, y - 12 * s, 28 * s);
    gr.addColorStop(0, U.rgba(col, 0.35)); gr.addColorStop(1, U.rgba(col, 0));
    g.fillStyle = gr; g.beginPath(); H.circ(g, x, y - 12 * s, 28 * s); g.fill();
    H.shadow(g, x + 2, y + 1, 12 * s, 4 * s, 0.3);
    for (const [dx, hh, rot] of [[-6, 14, -0.4], [0, 22, -0.05], [6, 16, 0.3], [2, 9, 0.7]]) {
      g.save(); g.translate(x + dx * s, y); g.rotate(rot);
      g.beginPath(); g.moveTo(-3.2 * s, 0); g.lineTo(-3.2 * s, -hh * 0.72 * s); g.lineTo(0, -hh * s); g.lineTo(3.2 * s, -hh * 0.72 * s); g.lineTo(3.2 * s, 0); g.closePath();
      H.fs(g, H.lin(g, -3.2 * s, 0, 3.2 * s, 0, [[0, U.shade(col, 0.55)], [0.5, col], [1, U.shade(col, -0.35)]]), 1.4);
      g.beginPath(); g.moveTo(0, -1 * s); g.lineTo(0, -hh * 0.95 * s); g.lineWidth = 0.8; g.strokeStyle = 'rgba(255,255,255,0.6)'; g.stroke();
      g.restore();
    }
  };

  P.stalagmite = function (g, x, y, s, rng, T) {
    const col = (T && T.rock) || '#6a6a7a';
    H.shadow(g, x + 3, y + 1, 14 * s, 4 * s, 0.3);
    const h = rng.range(22, 34) * s, w = rng.range(8, 11) * s;
    g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x - w * 0.5, y - h * 0.5, x - 1 * s, y - h); g.quadraticCurveTo(x + 2 * s, y - h * 1.02, x + 2.5 * s, y - h * 0.9);
    g.quadraticCurveTo(x + w * 0.6, y - h * 0.4, x + w, y); g.quadraticCurveTo(x, y + 4 * s, x - w, y);
    H.fs(g, H.lin(g, x - w, 0, x + w, 0, [[0, U.shade(col, 0.25)], [0.5, col], [1, U.shade(col, -0.4)]]), 2);
    g.strokeStyle = 'rgba(20,20,30,0.35)'; g.lineWidth = 1;
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x - w * (1 - i * 0.2), y - h * i * 0.2); g.quadraticCurveTo(x, y - h * i * 0.2 + 2 * s, x + w * (1 - i * 0.2), y - h * i * 0.2); g.stroke(); }
  };

  /* ============================== WATER VARIANTS ============================== */
  Art.paintLava = function (g, w) {
    const path = (g) => H.wobble(g, w.x, w.y, w.rx, w.ry, U.rng(w.x * 3 + w.y), 14, 0.12);
    g.save();
    const glow = g.createRadialGradient(w.x, w.y, 4, w.x, w.y, Math.max(w.rx, w.ry) * 1.6);
    glow.addColorStop(0, 'rgba(255,120,30,0.35)'); glow.addColorStop(1, 'rgba(255,80,0,0)');
    g.fillStyle = glow; g.beginPath(); H.ell(g, w.x, w.y, w.rx * 1.6, w.ry * 1.6); g.fill();
    g.beginPath(); path(g);
    g.lineWidth = 14; g.strokeStyle = '#2a1a14'; g.stroke();
    const lg = g.createRadialGradient(w.x - w.rx * 0.2, w.y - w.ry * 0.2, 4, w.x, w.y, Math.max(w.rx, w.ry));
    lg.addColorStop(0, '#fff2a0'); lg.addColorStop(0.35, '#ffb43a'); lg.addColorStop(0.75, '#ff6a1a'); lg.addColorStop(1, '#b8280a');
    g.fillStyle = lg; g.fill();
    g.lineWidth = 2.5; g.strokeStyle = OUT; g.stroke();
    g.clip();
    const r = U.rng(w.x + w.y * 5);
    for (let i = 0; i < 9; i++) {
      const px = w.x + r.range(-w.rx, w.rx) * 0.8, py = w.y + r.range(-w.ry, w.ry) * 0.7;
      g.beginPath(); H.wobble(g, px, py, r.range(8, 16), r.range(4, 8), r, 6, 0.3);
      g.fillStyle = 'rgba(60,25,15,0.75)'; g.fill();
      g.lineWidth = 1.4; g.strokeStyle = 'rgba(255,220,120,0.6)'; g.stroke();
    }
    g.restore();
  };

  Art.paintIcePond = function (g, w) {
    const path = (g) => H.wobble(g, w.x, w.y, w.rx, w.ry, U.rng(w.x * 3 + w.y), 14, 0.12);
    g.save();
    g.beginPath(); path(g);
    g.lineWidth = 12; g.strokeStyle = 'rgba(255,255,255,0.8)'; g.stroke();
    const ig = g.createRadialGradient(w.x - w.rx * 0.3, w.y - w.ry * 0.3, 4, w.x, w.y, Math.max(w.rx, w.ry));
    ig.addColorStop(0, '#f2fbff'); ig.addColorStop(0.6, '#b8e2f4'); ig.addColorStop(1, '#7cc0e0');
    g.fillStyle = ig; g.fill();
    g.lineWidth = 2.2; g.strokeStyle = OUT; g.stroke();
    g.clip();
    g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 1.4;
    const r = U.rng(w.x * 11 + w.y);
    for (let i = 0; i < 6; i++) {
      let px = w.x + r.range(-w.rx, w.rx) * 0.6, py = w.y + r.range(-w.ry, w.ry) * 0.6;
      g.beginPath(); g.moveTo(px, py);
      for (let k = 0; k < 3; k++) { px += r.range(-18, 18); py += r.range(-8, 8); g.lineTo(px, py); }
      g.stroke();
    }
    H.shine(g, w.x - w.rx * 0.4, w.y - w.ry * 0.4, w.rx * 0.3, w.ry * 0.12, -0.2, 0.5);
    g.restore();
  };

  /* ============================== HAZARD ZONES (static) ============================== */
  Art.paintZones = function (g, lv) {
    const z = lv.zones;
    if (!z) return;
    // tide-pool beds: darker wet sand that the tide fills
    for (const t of z.tides) {
      g.save();
      g.beginPath(); H.ell(g, t.x, t.y, t.rx + 8, t.ry + 6);
      const wg = g.createRadialGradient(t.x, t.y, 4, t.x, t.y, t.rx + 8);
      wg.addColorStop(0, 'rgba(120,90,50,0.45)'); wg.addColorStop(0.8, 'rgba(140,110,70,0.3)'); wg.addColorStop(1, 'rgba(140,110,70,0)');
      g.fillStyle = wg; g.fill();
      g.setLineDash([4, 6]); g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,0.45)';
      g.beginPath(); H.ell(g, t.x, t.y, t.rx, t.ry); g.stroke();
      g.restore();
      const r = U.rng(t.x + t.y);
      for (let i = 0; i < 4; i++) P.shell(g, t.x + r.range(-t.rx, t.rx) * 0.7, t.y + r.range(-t.ry, t.ry) * 0.6, 0.6, r);
    }
    // ice patches on the trail
    for (const i of z.ice) {
      const r = U.rng(i.x * 5 + i.y);
      g.save();
      g.beginPath(); H.wobble(g, i.x, i.y, i.rx, i.ry, r, 12, 0.1);
      const ig = g.createRadialGradient(i.x - i.rx * 0.3, i.y - i.ry * 0.3, 4, i.x, i.y, i.rx);
      ig.addColorStop(0, 'rgba(250,255,255,0.95)'); ig.addColorStop(0.6, 'rgba(190,230,248,0.92)'); ig.addColorStop(1, 'rgba(130,190,225,0.9)');
      g.fillStyle = ig; g.fill();
      g.lineWidth = 2; g.strokeStyle = 'rgba(60,110,150,0.8)'; g.stroke();
      g.clip();
      g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 1.2;
      for (let k = 0; k < 5; k++) {
        let px = i.x + r.range(-i.rx, i.rx) * 0.6, py = i.y + r.range(-i.ry, i.ry) * 0.6;
        g.beginPath(); g.moveTo(px, py);
        for (let n = 0; n < 3; n++) { px += r.range(-14, 14); py += r.range(-6, 6); g.lineTo(px, py); }
        g.stroke();
      }
      for (let k = 0; k < 3; k++) {
        g.beginPath(); g.moveTo(i.x - i.rx * 0.6 + k * 18, i.y - i.ry * 0.5); g.lineTo(i.x - i.rx * 0.2 + k * 18, i.y - i.ry * 0.7);
        g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,0.7)'; g.stroke();
      }
      g.restore();
    }
    // lava vents: cracked craters in the trail
    for (const v of z.vents) {
      const r = U.rng(v.x * 7 + v.y);
      g.save();
      g.beginPath(); H.ell(g, v.x, v.y, v.r + 6, (v.r + 6) * 0.6);
      g.fillStyle = 'rgba(30,15,10,0.45)'; g.fill();
      g.beginPath(); H.wobble(g, v.x, v.y, v.r * 0.55, v.r * 0.33, r, 8, 0.2);
      const cg = g.createRadialGradient(v.x, v.y, 1, v.x, v.y, v.r * 0.55);
      cg.addColorStop(0, '#ffd25a'); cg.addColorStop(0.5, '#ff6a1a'); cg.addColorStop(1, '#5a1a0a');
      g.fillStyle = cg; g.fill();
      g.lineWidth = 2.2; g.strokeStyle = OUT; g.stroke();
      g.strokeStyle = '#ff8a2a'; g.lineWidth = 1.8;
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * TAU + r.range(-0.2, 0.2);
        g.beginPath(); g.moveTo(v.x + Math.cos(a) * v.r * 0.5, v.y + Math.sin(a) * v.r * 0.3);
        g.lineTo(v.x + Math.cos(a + 0.15) * v.r * 0.8, v.y + Math.sin(a + 0.15) * v.r * 0.48);
        g.lineTo(v.x + Math.cos(a) * v.r, v.y + Math.sin(a) * v.r * 0.6);
        g.stroke();
      }
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * TAU + r.range(0, 0.5);
        P.pebbles(g, v.x + Math.cos(a) * v.r * 1.05, v.y + Math.sin(a) * v.r * 0.65, 0.5, r, '#3a3036');
      }
      g.restore();
    }
  };
})();
