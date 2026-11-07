/* Bulborb Rush — expansion creature art: Anode Beetle line (Electric towers), Anode Dweevil,
   Arachnode, and the Rescue Corps pup Oatchi (invader). All procedural, facing right, origin = feet. */
(function () {
  'use strict';
  const PTD = window.PTD;
  const U = PTD.U;
  const Art = PTD.Art;
  const H = Art.H;
  const OUT = Art.OUT;
  const TAU = Math.PI * 2;

  /** glowing electrode ball */
  function electrode(g, x, y, r, col, charge) {
    const gl = g.createRadialGradient(x, y, 0.5, x, y, r * (2.4 + charge * 2));
    gl.addColorStop(0, U.rgba(col, 0.55 + charge * 0.4)); gl.addColorStop(1, U.rgba(col, 0));
    g.fillStyle = gl; g.beginPath(); H.circ(g, x, y, r * (2.4 + charge * 2)); g.fill();
    g.beginPath(); H.circ(g, x, y, r); H.fs(g, H.vol(g, x, y, r, r, col, 0.6, -0.2), 1.4);
  }

  /** small zig-zag spark between two points */
  function spark(g, x0, y0, x1, y1, a, seed) {
    if (a <= 0.05) return;
    const r = U.rng(seed);
    g.save();
    g.globalAlpha = a;
    g.beginPath(); g.moveTo(x0, y0);
    for (let i = 1; i < 5; i++) {
      const f = i / 5;
      g.lineTo(U.lerp(x0, x1, f) + r.range(-3, 3), U.lerp(y0, y1, f) + r.range(-3, 3));
    }
    g.lineTo(x1, y1);
    g.lineWidth = 3.2; g.strokeStyle = 'rgba(120,210,255,0.7)'; g.stroke();
    g.lineWidth = 1.3; g.strokeStyle = '#ffffff'; g.stroke();
    g.restore();
  }

  /* ============================== ANODE BEETLE ============================== */
  function drawAnodeBeetle(g, ph, atk, scale) {
    const t = ph * TAU;
    g.save();
    g.scale(scale, scale);
    const bob = Math.sin(t) * 0.7;
    const charge = atk > 0 ? Math.sin(atk * Math.PI) : 0.25 + 0.15 * Math.sin(t * 2);
    // legs (3 visible pairs)
    for (const [lx, col] of [[-14, '#2a2f3a'], [-2, '#2a2f3a'], [10, '#2a2f3a'], [-8, '#3c4352'], [4, '#3c4352'], [15, '#3c4352']]) {
      H.limb(g, [lx, -12 + bob, lx - 4, -6, lx - 1, 0], col, 2.6, 1.8);
    }
    g.save();
    g.translate(0, bob);
    // head
    g.beginPath(); H.ell(g, 20, -20, 9, 8); H.fs(g, H.vol(g, 20, -20, 9, 8, '#2e3542', 0.35, -0.3), 2);
    for (const [ex, ey] of [[24, -23], [27, -20]]) {
      g.beginPath(); H.circ(g, ex, ey, 1.8); g.fillStyle = '#ffe94a'; g.fill();
    }
    // mandibles
    g.beginPath(); g.moveTo(27, -16); g.quadraticCurveTo(32, -15, 31, -11); g.lineWidth = 2; g.strokeStyle = OUT; g.stroke();
    // shell
    const shell = (g) => {
      g.moveTo(-24, -10);
      g.bezierCurveTo(-26, -34, -10, -46, 2, -46);
      g.bezierCurveTo(16, -46, 22, -32, 18, -12);
      g.quadraticCurveTo(-4, -6, -24, -10);
      g.closePath();
    };
    g.beginPath(); shell(g); g.fillStyle = H.vol(g, -4, -30, 22, 20, '#6f88a8', 0.45, -0.45); g.fill();
    H.clipTo(g, shell, (g) => {
      // copper bands
      g.lineWidth = 4; g.strokeStyle = '#d99a4a';
      for (const k of [-12, 0]) { g.beginPath(); g.moveTo(k, -48); g.quadraticCurveTo(k + 6, -28, k + 2, -6); g.stroke(); }
      // lightning stripe
      g.beginPath(); g.moveTo(-18, -36); g.lineTo(-8, -30); g.lineTo(-12, -24); g.lineTo(4, -18); g.lineTo(-2, -14); g.lineTo(14, -10);
      g.lineWidth = 3.4; g.strokeStyle = OUT; g.stroke();
      g.lineWidth = 2; g.strokeStyle = U.mix('#ffe94a', '#ffffff', charge * 0.6); g.stroke();
      g.beginPath(); shell(g); g.lineWidth = 7; g.strokeStyle = 'rgba(10,20,40,0.25)'; g.stroke();
    });
    g.beginPath(); shell(g); g.lineWidth = 2.4; g.strokeStyle = OUT; g.stroke();
    H.shine(g, -10, -38, 7, 2.6, -0.5, 0.55);
    // antennae with electrodes
    const sw = Math.sin(t * 1.5) * 1.2;
    const tipA = [26 + sw, -50], tipB = [18 + sw * 0.6, -54];
    for (const [tx, ty] of [tipA, tipB]) {
      g.beginPath(); g.moveTo(21, -26); g.quadraticCurveTo(tx - 6, ty + 14, tx, ty);
      g.lineWidth = 2.6; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 1.2; g.strokeStyle = '#9aa8b8'; g.stroke();
    }
    electrode(g, tipA[0], tipA[1], 2.8, '#ff6a5a', charge);
    electrode(g, tipB[0], tipB[1], 2.8, '#6fd0ff', charge);
    spark(g, tipA[0], tipA[1], tipB[0], tipB[1], atk > 0 ? charge : 0, Math.floor(ph * 50 + atk * 30));
    g.restore();
    g.restore();
  }

  /* ============================== ANODE DWEEVIL ============================== */
  function drawAnodeDweevil(g, ph, atk, scale) {
    const t = ph * TAU;
    g.save();
    g.scale(scale, scale);
    const bob = Math.sin(t) * 0.8;
    const charge = atk > 0 ? Math.sin(atk * Math.PI) : 0.3 + 0.2 * Math.sin(t * 3);
    // spindly legs
    for (let i = 0; i < 4; i++) {
      const lx = -14 + i * 9, sw = Math.sin(t + i) * 1.5;
      H.limb(g, [lx * 0.6, -18 + bob, lx - 6 + sw, -26 + bob, lx - 3 + sw, 0], i % 2 ? '#4a3a52' : '#3a2c42', 2.2, 1.6);
    }
    g.save(); g.translate(0, bob);
    // body
    g.beginPath(); H.ell(g, 0, -20, 15, 9); H.fs(g, H.vol(g, 0, -20, 15, 9, '#5a4468', 0.4, -0.35), 2.2);
    g.beginPath(); H.ell(g, 14, -20, 6.5, 5.5); H.fs(g, H.vol(g, 14, -20, 6.5, 5.5, '#4a3858', 0.4, -0.35), 1.8);
    g.beginPath(); H.circ(g, 17, -22, 2); H.fs(g, '#fffbe8', 1);
    g.beginPath(); H.circ(g, 17.6, -22, 1); g.fillStyle = '#100805'; g.fill();
    // carried charged "treasure": a big battery-like cell
    g.save(); g.translate(0, -36); g.rotate(-0.12);
    g.beginPath(); H.rr(g, -13, -8, 26, 16, 4);
    H.fs(g, H.lin(g, 0, -8, 0, 8, [[0, '#4a4a4a'], [0.35, '#9a9a9a'], [1, '#1a1a1a']]), 2);
    g.beginPath(); g.rect(-2, -8, 15, 16); g.fillStyle = H.lin(g, 0, -8, 0, 8, [[0, '#2f6fb8'], [0.4, '#6fb8ff'], [1, '#1d3f72']]); g.fill();
    g.beginPath(); H.rr(g, -13, -8, 26, 16, 4); g.lineWidth = 2; g.strokeStyle = OUT; g.stroke();
    g.beginPath(); H.rr(g, 13, -3, 3.5, 6, 1); H.fs(g, '#d9d9d9', 1.2);
    g.beginPath(); g.moveTo(6, -6); g.lineTo(2, 1); g.lineTo(5.5, 1); g.lineTo(3.5, 6.5); g.lineTo(9, -1); g.lineTo(5.5, -1); g.closePath();
    H.fs(g, '#ffe94a', 1);
    g.restore();
    // arms holding it
    for (const ax of [-9, 9]) H.limb(g, [ax, -24, ax * 1.1, -30, ax * 1.1, -34], '#4a3a52', 2, 1.4);
    electrode(g, 8, -52, 3.2, '#ffe94a', charge);
    spark(g, 8, -52, 0, -44, atk > 0 ? charge : 0, Math.floor(ph * 40 + atk * 20));
    g.restore();
    g.restore();
  }

  /* ============================== ARACHNODE ============================== */
  function drawArachnode(g, ph, atk, scale) {
    const t = ph * TAU;
    g.save();
    g.scale(scale, scale);
    const bob = Math.sin(t) * 1.4;
    const by = -64 + bob;
    const charge = atk > 0 ? Math.sin(atk * Math.PI) : 0.3 + 0.2 * Math.sin(t * 2);
    // glinting web threads hanging from the body
    g.save();
    g.globalAlpha = 0.5 + charge * 0.4;
    g.strokeStyle = '#bff4ff'; g.lineWidth = 0.9;
    for (const dx of [-14, -4, 8]) { g.beginPath(); g.moveTo(dx * 0.4, by + 6); g.quadraticCurveTo(dx, by + 30, dx * 1.3, -4); g.stroke(); }
    g.restore();
    const leg = (hx, kx, ky, fx, col) => {
      // hip → knee (above the body) → ankle → foot, as straight segments so the joints line up
      const ky2 = ky + bob * 0.6, ax = kx + (fx - kx) * 0.55, ay = ky2 * 0.45;
      H.limb(g, [hx, by + 2, kx, ky2, ax, ay, fx, 0], col, 2.4, 1.8);
      g.beginPath(); H.circ(g, kx, ky2, 2); H.fs(g, col, 1.2);
      g.beginPath(); H.circ(g, ax, ay, 1.6); H.fs(g, col, 1);
    };
    // back legs
    leg(-4, -26, -86, -34, '#6a6e7c');
    leg(-2, -12, -92, -16, '#6a6e7c');
    leg(2, 12, -92, 14, '#6a6e7c');
    leg(4, 26, -86, 34, '#6a6e7c');
    // body
    g.beginPath(); H.ell(g, 0, by, 13, 11); H.fs(g, H.vol(g, 0, by, 13, 11, '#3a4a6a', 0.45, -0.4), 2.2);
    H.clipTo(g, (g) => H.ell(g, 0, by, 13, 11), (g) => {
      g.strokeStyle = U.mix('#6fd0ff', '#ffffff', charge * 0.5); g.lineWidth = 1.4;
      for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; g.beginPath(); g.moveTo(0, by); g.lineTo(Math.cos(a) * 14, by + Math.sin(a) * 12); g.stroke(); }
      g.beginPath(); H.ell(g, 0, by, 6, 5); g.stroke();
    });
    // eyes cluster
    for (const [ex, ey, r] of [[7, by - 3, 2.2], [10, by + 1, 1.8], [4, by + 2, 1.5]]) {
      g.beginPath(); H.circ(g, ex, ey, r); g.fillStyle = '#ff5a6a'; g.fill();
      g.beginPath(); H.circ(g, ex - r * 0.3, ey - r * 0.3, r * 0.35); g.fillStyle = '#fff'; g.fill();
    }
    electrode(g, 0, by - 12, 3, '#6fd0ff', charge);
    // front legs
    leg(-6, -36, -70, -42, '#8a8e9c');
    leg(6, 36, -70, 42, '#8a8e9c');
    H.shine(g, -5, by - 5, 4, 2, -0.5, 0.5);
    g.restore();
  }

  /* register tower creatures (sprite boxes: w, h, anchor) */
  Object.assign(Art.CRE, {
    anode: { w: 96, h: 84, ax: 44, ay: 72, draw: (g, ph, a, sc) => drawAnodeBeetle(g, ph, a, sc) },
    dweevil: { w: 96, h: 90, ax: 46, ay: 78, draw: (g, ph, a, sc) => drawAnodeDweevil(g, ph, a, sc) },
    arachnode: { w: 120, h: 112, ax: 60, ay: 104, draw: (g, ph, a, sc) => drawArachnode(g, ph, a, sc) },
  });

  /* ============================== OATCHI (invader) ============================== */
  function drawOatchiBody(g, t, walking, atk) {
    const bob = walking ? -Math.abs(Math.sin(t)) * 1.6 : Math.sin(t) * 0.4;
    const fur = '#f2c37e', dk = U.shade(fur, -0.3), belly = '#fff1d6';
    const sw = walking ? Math.sin(t) * 0.6 : 0;
    // back legs
    for (const [lx, a, col] of [[-10, -sw, dk], [8, sw, dk]]) {
      H.limb(g, [lx, -10 + bob, lx + Math.sin(a) * 5, -1], col, 4.2, 1.8);
    }
    // tail
    const tw = Math.sin(t * 3) * 0.4;
    g.save(); g.translate(-15, -18 + bob); g.rotate(-0.9 + tw);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-4, -8, 0, -12); g.lineWidth = 5.4; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 3.4; g.strokeStyle = fur; g.stroke();
    g.restore();
    // body
    g.beginPath(); H.ell(g, -1, -16 + bob, 16, 10); H.fs(g, H.vol(g, -1, -16 + bob, 16, 10, fur, 0.35, -0.3), 1.8);
    g.beginPath(); H.ell(g, 1, -11 + bob, 11, 4.5); g.fillStyle = belly; g.fill();
    // Rescue Corps collar
    g.beginPath(); H.ell(g, 9, -21 + bob, 3.2, 6.4, 0.3); H.fs(g, '#e8392c', 1.2);
    g.beginPath(); H.circ(g, 11, -17 + bob, 1.6); H.fs(g, '#ffd23a', 0.8);
    // front legs
    for (const [lx, a, col] of [[-6, sw, fur], [11, -sw, fur]]) {
      H.limb(g, [lx, -10 + bob, lx + Math.sin(a) * 5, -1], col, 4.2, 1.8);
      g.beginPath(); H.ell(g, lx + Math.sin(a) * 5 + 1, -1, 2.8, 1.6); H.fs(g, belly, 1);
    }
    // head
    const lunge = atk * 4;
    const hx = 14 + lunge, hy = -25 + bob;
    g.beginPath(); H.circ(g, hx, hy, 9.5); H.fs(g, H.vol(g, hx, hy, 9.5, 9.5, fur, 0.35, -0.3), 1.8);
    g.beginPath(); H.ell(g, hx + 7, hy + 3, 6, 4.4); H.fs(g, H.vol(g, hx + 7, hy + 3, 6, 4.4, belly, 0.3, -0.2), 1.4);
    g.beginPath(); H.ell(g, hx + 12, hy + 1.5, 2.4, 2); H.fs(g, '#2a1608', 1);
    g.beginPath(); g.moveTo(hx + 7, hy + 6); g.quadraticCurveTo(hx + 10, hy + 7.5 + atk * 2, hx + 12.5, hy + 5.5); g.lineWidth = 1; g.strokeStyle = OUT; g.stroke();
    if (atk > 0.2) { g.beginPath(); H.ell(g, hx + 10, hy + 8, 1.8, 1.2 + atk); H.fs(g, '#ff8fa0', 0.8); }
    g.beginPath(); H.ell(g, hx + 3.5, hy - 2.5, 1.3, 1.8); g.fillStyle = OUT; g.fill();
    g.beginPath(); H.circ(g, hx + 3.2, hy - 3.2, 0.5); g.fillStyle = '#fff'; g.fill();
    // floppy ear
    const ef = walking ? Math.sin(t + 1) * 0.25 : 0;
    g.save(); g.translate(hx - 3, hy - 6); g.rotate(-0.4 + ef);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-9, 2, -8, 12); g.quadraticCurveTo(-2, 10, 2, 2); H.fs(g, '#c98a4a', 1.4);
    g.restore();
    // antenna bulb (Rescue Corps tag)
    g.beginPath(); g.moveTo(hx, hy - 9); g.quadraticCurveTo(hx + 1, hy - 13, hx + 2, hy - 16); g.lineWidth = 2; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 0.8; g.strokeStyle = '#d8d8d8'; g.stroke();
    g.beginPath(); H.circ(g, hx + 2, hy - 17, 2); H.fs(g, '#ffb35a', 1);
    H.shine(g, -6, -22 + bob, 5, 2, -0.4, 0.4);
  }

  function drawOatchi(g, view, ph, pose) {
    const t = ph * TAU;
    if (pose === 'down') {
      g.save(); g.translate(0, -8); g.rotate(Math.PI * 0.92); g.translate(0, 8);
      drawOatchiBody(g, 0, false, 0);
      g.restore();
      return;
    }
    drawOatchiBody(g, t, pose === 'walk', pose === 'attack' ? Math.sin(ph * Math.PI) : 0);
  }

  Art.CAPT.oatchi = { custom: drawOatchi, scale: 1.15, sideOnly: true, suit: '#f2c37e', bulb: '#ffb35a' };
})();
