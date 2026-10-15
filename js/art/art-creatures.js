/* Bulborb Rush — native creature art (the player's towers, soldiers, hero & spells). */
(function () {
  'use strict';
  const PTD = window.PTD;
  const U = PTD.U;
  const Art = PTD.Art;
  const H = Art.H;
  const OUT = Art.OUT;
  const TAU = Math.PI * 2;

  /* ============================== BULBORB FAMILY ============================== */
  const BORB = (Art.BORB = {
    dwarf: { body: '#e2382d', spot: '#fff4e2', belly: '#f4dcb6', leg: '#efcf9f', scale: 0.45, dwarf: true },
    dwarfOrange: { body: '#f28a1e', spot: '#fff1d2', belly: '#f6e0b8', leg: '#efcf9f', scale: 0.48, dwarf: true, face: '#c9601a' },
    red: { body: '#d9302a', spot: '#fff4e2', belly: '#f3d8ae', leg: '#ecc996', scale: 0.56 },
    bulbear: { body: '#eaa83c', spot: '#6b3416', belly: '#f8e6bf', leg: '#e7c48c', scale: 0.66, spotBig: true },
    hairy: { body: '#eef3fb', spot: '#b9c8de', belly: '#ffffff', leg: '#d9e2ee', scale: 0.58, fur: true },
    emperor: { body: '#efe1c2', spot: '#7a5a3a', belly: '#fff7e6', leg: '#e2cfa8', scale: 0.78, speckle: true, face: '#a0704a' },
    reinf: { body: '#2f8f5a', spot: '#e4ffd8', belly: '#e9f5d2', leg: '#d8e9b8', scale: 0.44, dwarf: true },
  });

  function bulborbBody(g) {
    // bean-shaped: rounded rear, big blunt head that is mostly mouth
    g.moveTo(-29, -24);
    g.bezierCurveTo(-32, -42, -20, -52, -4, -54);
    g.bezierCurveTo(16, -57, 34, -48, 36, -32);
    g.bezierCurveTo(37, -20, 30, -11, 16, -10);
    g.bezierCurveTo(2, -9, -16, -11, -24, -15);
    g.bezierCurveTo(-28, -17, -29, -21, -29, -24);
    g.closePath();
  }

  /**
   * Draw a bulborb-type creature facing right. Origin = feet.
   * ph: walk/idle phase 0..1, mouth: 0..1 open, moving: bool, tongue: 0..1
   */
  function drawBulborb(g, K, ph, mouth, moving, tongue) {
    const t = ph * TAU;
    const s = K.scale;
    g.save();
    g.scale(s, s);
    const bob = moving ? -Math.abs(Math.sin(t)) * 2.2 : Math.sin(t) * 0.8;
    const sw = moving ? Math.sin(t) * 0.45 : 0;
    // legs
    const legs = [
      [-9, -sw, U.shade(K.leg, -0.25)],
      [7, sw, K.leg],
    ];
    for (const [lx, a, col] of legs) {
      const fx = lx + Math.sin(a) * 9, fy = -Math.max(0, Math.cos(a + Math.PI / 2) * 0) ;
      H.limb(g, [lx, -18 + bob, fx, fy - 3], col, 8.5, 3);
      g.beginPath(); H.ell(g, fx + 2, fy - 1.8, 6.5, 3.4); H.fs(g, H.vol(g, fx + 2, fy - 2, 6, 3, col), 2.2);
      for (let i = 0; i < 3; i++) { g.beginPath(); H.circ(g, fx + 4.5 + i * 2.2 - 2, fy - 0.6, 1.4); H.fs(g, U.shade(col, 0.2), 1); }
    }
    g.save();
    g.translate(0, bob);
    // body base
    g.beginPath(); bulborbBody(g);
    g.fillStyle = H.vol(g, -4, -38, 34, 24, K.body, 0.35, -0.38); g.fill();
    // belly / jaw (below mouth line)
    H.clipTo(g, bulborbBody, (g) => {
      // rear underside shadow
      g.beginPath(); H.ell(g, -16, -12, 20, 9);
      g.fillStyle = 'rgba(40,5,0,0.22)'; g.fill();
      // lower jaw (only under the mouth, front half)
      g.beginPath();
      g.moveTo(-9, -24);
      g.bezierCurveTo(4, -28, 22, -29, 40, -31);
      g.lineTo(40, 0); g.lineTo(-2, 0);
      g.bezierCurveTo(-8, -10, -10, -18, -9, -24);
      g.closePath();
      g.fillStyle = H.lin(g, 0, -28, 0, -10, [[0, K.belly], [1, U.shade(K.belly, -0.25)]]);
      g.fill();
      if (K.face) {
        g.beginPath(); H.ell(g, 26, -40, 13, 12);
        g.fillStyle = U.rgba(K.face.replace('#', '').length ? K.face : '#000000', 0.55); g.fill();
      }
      // spots
      const spots = K.spotBig
        ? [[-18, -36, 6.5], [-6, -46, 5], [-24, -25, 4], [5, -50, 3.4], [-12, -29, 3], [14, -47, 2.5]]
        : [[-18, -36, 6.4], [-5, -47, 5.4], [-24, -24, 3.8], [6, -51, 3.4], [-12, -28, 3.2], [-15, -48, 2.8], [16, -49, 2.2]];
      if (K.speckle) {
        const r = U.rng(42);
        for (let i = 0; i < 26; i++) {
          g.beginPath(); H.ell(g, r.range(-28, 24), r.range(-54, -28), r.range(1, 3), r.range(0.8, 2.2), r.range(0, 3));
          g.fillStyle = U.rgba(K.spot.length === 7 ? K.spot : '#8a6a4a', 0.7); g.fill();
        }
      } else {
        for (const [x, y, r] of spots) {
          g.beginPath(); H.ell(g, x, y, r, r * 0.86);
          g.fillStyle = H.vol(g, x, y, r, r, K.spot, 0.3, -0.18); g.fill();
        }
      }
      // shading rim
      g.beginPath(); bulborbBody(g);
      g.lineWidth = 9; g.strokeStyle = 'rgba(40,10,0,0.13)'; g.stroke();
    });
    // fur
    if (K.fur) {
      g.save();
      const fr = U.rng(7);
      for (let i = 0; i < 46; i++) {
        const a = Math.PI * 0.95 + (i / 46) * Math.PI * 1.1;
        const cx = -2 + Math.cos(a) * 31, cy = -33 + Math.sin(a) * 21;
        g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * fr.range(3, 6), cy + Math.sin(a) * fr.range(3, 6));
        g.lineWidth = 2.2; g.strokeStyle = '#ffffff'; g.stroke();
      }
      g.restore();
    }
    // outline
    g.beginPath(); bulborbBody(g);
    g.lineWidth = 2.6; g.strokeStyle = OUT; g.stroke();
    H.shine(g, -10, -49, 9, 3.2, -0.25, 0.35);
    // mouth
    const mo = mouth || 0;
    if (mo > 0.05) {
      g.beginPath();
      g.moveTo(-4, -24.5);
      g.quadraticCurveTo(14, -30 - mo * 12, 34, -32 - mo * 15);
      g.quadraticCurveTo(28, -24 + mo * 2, 30, -22 + mo * 3);
      g.quadraticCurveTo(12, -21, -4, -24.5);
      H.fs(g, '#5a0d0a', 2);
      g.beginPath(); H.ell(g, 16, -23.5, 8, 2.2, -0.05); g.fillStyle = '#e8606b'; g.fill();
      // teeth
      g.fillStyle = '#fffaf0';
      for (let i = 0; i < 5; i++) {
        const tx = 4 + i * 6, ty = -27.5 - mo * (tx / 34) * 13;
        g.beginPath(); g.moveTo(tx - 1.6, ty); g.lineTo(tx, ty + 3.4); g.lineTo(tx + 1.6, ty); g.fill();
      }
    } else {
      // the famous wide grin
      g.beginPath();
      g.moveTo(-11, -21); g.quadraticCurveTo(-11, -25.5, -6, -25);
      g.bezierCurveTo(6, -27, 22, -29, 36.5, -31);
      g.lineWidth = 3; g.strokeStyle = OUT; g.stroke();
      g.beginPath(); g.moveTo(-6, -25); g.bezierCurveTo(6, -26.5, 22, -28, 36, -30);
      g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,0.35)'; g.stroke();
    }
    if (tongue > 0) {
      const L = tongue * 46;
      g.beginPath(); g.moveTo(26, -25); g.quadraticCurveTo(30 + L * 0.5, -32, 30 + L, -22);
      g.lineWidth = 7; g.strokeStyle = OUT; g.stroke();
      g.lineWidth = 4.6; g.strokeStyle = '#ef7d95'; g.stroke();
      g.beginPath(); H.circ(g, 30 + L, -22, 4.2); H.fs(g, '#f590a6', 1.8);
    }
    // eye stalks
    const sc = K.dwarf ? 1.3 : 1;
    const eyes = [[16, -53, U.shade(K.body, -0.2)], [25, -50, K.body]];
    for (const [ex, ey, col] of eyes) {
      H.limb(g, [ex, ey + 4, ex + 1, ey - 5 * sc], col, 4 * sc, 2.2);
      g.beginPath(); H.circ(g, ex + 1, ey - 7 * sc, 4.8 * sc);
      H.fs(g, H.vol(g, ex + 1, ey - 7 * sc, 4.8 * sc, 4.8 * sc, '#fffdf2', 0.3, -0.15), 2);
      g.beginPath(); H.circ(g, ex + 2.4, ey - 6.6 * sc, 2.6 * sc); g.fillStyle = '#140a06'; g.fill();
      g.beginPath(); H.circ(g, ex + 1.5, ey - 7.8 * sc, 1 * sc); g.fillStyle = '#fff'; g.fill();
    }
    g.restore();
    g.restore();
  }
  Art.drawBulborb = drawBulborb;

  Art.bulborb = function (kind, frame, pose) {
    const K = BORB[kind];
    const s = K.scale;
    const n = pose === 'attack' ? 6 : 8;
    const key = `borb|${kind}|${pose}|${frame}`;
    const w = 130 * s, h = 100 * s;
    return Art.sprite(key, w, h, w * 0.46, h * 0.86, (g) => {
      const ph = frame / n;
      if (pose === 'attack') drawBulborb(g, K, 0, Math.sin(ph * Math.PI), false, kind === 'emperor' ? Math.max(0, Math.sin(ph * Math.PI) * 1.1 - 0.1) : 0);
      else drawBulborb(g, K, ph, 0, pose === 'walk', 0);
    });
  };

  /* ============================== BREADBUG ============================== */
  function drawBreadbug(g, ph, moving, mouth, scale) {
    const t = ph * TAU;
    g.save();
    g.scale(scale, scale);
    const bob = moving ? -Math.abs(Math.sin(t)) * 1.6 : Math.sin(t) * 0.5;
    const sw = moving ? Math.sin(t) * 0.6 : 0;
    // legs
    for (const [lx, a, col] of [[-6, -sw, '#a96a35'], [7, sw, '#c58448']]) {
      const fx = lx + Math.sin(a) * 6;
      H.limb(g, [lx, -8 + bob, fx, -1.5], col, 4, 2.4);
      g.beginPath(); g.moveTo(fx - 1, -1); g.lineTo(fx + 3.5, 0.5); g.moveTo(fx - 1, -1); g.lineTo(fx + 1.5, 1.4);
      g.lineWidth = 1.6; g.strokeStyle = OUT; g.stroke();
    }
    g.save();
    g.translate(0, bob);
    // croissant tail
    g.beginPath();
    g.moveTo(-17, -12); g.quadraticCurveTo(-27, -14, -26, -6); g.quadraticCurveTo(-23, -9, -17, -7);
    H.fs(g, H.vol(g, -22, -10, 5, 4, '#cf8a43'), 1.8);
    g.beginPath(); g.moveTo(-21, -12); g.lineTo(-22, -7.5); g.lineWidth = 1; g.strokeStyle = '#8a4f20'; g.stroke();
    // body bun
    const body = (g) => {
      g.moveTo(-20, -9);
      g.bezierCurveTo(-22, -26, -8, -31, 2, -31);
      g.bezierCurveTo(14, -31, 24, -22, 22, -11);
      g.bezierCurveTo(20, -4, 10, -3, 0, -3);
      g.bezierCurveTo(-12, -3, -19, -4, -20, -9);
      g.closePath();
    };
    g.beginPath(); body(g);
    g.fillStyle = H.lin(g, 0, -31, 0, -3, [[0, '#9c541f'], [0.45, '#d4934a'], [0.75, '#efcb8a'], [1, '#e2b673']]);
    g.fill();
    H.clipTo(g, body, (g) => {
      // three fatty bumps
      for (const [x, y, r] of [[-11, -25, 7], [-1, -29, 7.5], [9, -27, 6.6]]) {
        g.beginPath(); H.ell(g, x, y, r, r * 0.62);
        g.fillStyle = H.vol(g, x, y, r, r * 0.6, '#b8692b', 0.35, -0.3); g.fill();
        g.beginPath(); H.ell(g, x, y + r * 0.55, r * 0.95, 1.4);
        g.fillStyle = 'rgba(90,40,10,0.35)'; g.fill();
      }
      // scoring marks
      g.strokeStyle = 'rgba(255,236,190,0.75)'; g.lineWidth = 1.4;
      for (const x of [-11, -1, 9]) { g.beginPath(); g.moveTo(x - 3, -24.5 - (x === -1 ? 3 : 0)); g.lineTo(x + 3, -27 - (x === -1 ? 3 : 0)); g.stroke(); }
      g.beginPath(); body(g); g.lineWidth = 6; g.strokeStyle = 'rgba(70,30,0,0.15)'; g.stroke();
    });
    g.beginPath(); body(g); g.lineWidth = 2.2; g.strokeStyle = OUT; g.stroke();
    // brow fold over eyes
    g.beginPath(); g.moveTo(10, -20); g.quadraticCurveTo(17, -25, 23, -17.5); g.quadraticCurveTo(17, -19, 10, -20);
    H.fs(g, '#8a4a1d', 1.6);
    // eyes
    g.beginPath(); H.circ(g, 15.5, -16.6, 1.6); H.circ(g, 19.5, -16, 1.4); g.fillStyle = '#120804'; g.fill();
    g.beginPath(); H.circ(g, 15.1, -17.1, 0.5); g.fillStyle = '#fff'; g.fill();
    // snout & mouth
    g.beginPath(); H.ell(g, 22.5, -12.5, 3.4, 2.8); H.fs(g, H.vol(g, 22, -13, 3, 3, '#c98b5a'), 1.6);
    g.beginPath(); H.circ(g, 24.4, -13.2, 0.7); g.fillStyle = OUT; g.fill();
    if (mouth > 0.05) {
      g.beginPath(); H.ell(g, 19.5, -8.5, 3.2, 1.6 + mouth * 2); H.fs(g, '#5a1a0a', 1.4);
    } else {
      g.beginPath(); g.moveTo(16.5, -9); g.quadraticCurveTo(19.5, -7, 22, -9.5); g.lineWidth = 1.2; g.strokeStyle = OUT; g.stroke();
    }
    H.shine(g, -5, -27, 5, 1.8, -0.15, 0.4);
    g.restore();
    g.restore();
  }
  Art.drawBreadbug = drawBreadbug;
  Art.breadbug = function (frame, pose, scale) {
    scale = scale || 0.8;
    const n = pose === 'attack' ? 6 : 8;
    const key = `bread|${pose}|${frame}|${scale}`;
    return Art.sprite(key, 64 * scale, 46 * scale, 32 * scale, 40 * scale, (g) => {
      const ph = frame / n;
      if (pose === 'attack') drawBreadbug(g, 0, false, Math.sin(ph * Math.PI), scale);
      else drawBreadbug(g, ph, pose === 'walk', 0, scale);
    });
  };

  /* ============================== GATLING GROINK ============================== */
  function drawGroink(g, ph, atk, scale) {
    const t = ph * TAU;
    g.save();
    g.scale(scale, scale);
    const bob = Math.sin(t) * 0.8 + atk * 1.5;
    // legs
    for (const [lx, fx, col] of [[-5, -8, '#c85e1b'], [6, 7, '#f07a24']]) {
      H.limb(g, [lx, -20 + bob, lx - 1, -10, fx, -2], col, 3, 2);
      g.beginPath(); g.moveTo(fx - 3, 0); g.lineTo(fx, -3); g.lineTo(fx + 6, 0.5); g.quadraticCurveTo(fx + 1, 1.8, fx - 3, 0);
      H.fs(g, U.shade(col, 0.15), 1.4);
    }
    g.save();
    g.translate(0, bob);
    // tail fin
    const tf = Math.sin(t * 2) * 0.12;
    g.save(); g.translate(-18, -33); g.rotate(tf);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-10, -18, -17, -16); g.quadraticCurveTo(-11, -4, -18, 10); g.quadraticCurveTo(-8, 8, 0, 4);
    H.fs(g, H.vol(g, -10, -2, 9, 12, '#f59a3e'), 1.8);
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.4;
    for (const k of [-0.6, 0, 0.6]) { g.beginPath(); g.moveTo(-2, 1); g.lineTo(-15, k * 18); g.stroke(); }
    g.restore();
    // exhaust pipes
    for (const [px, py, rot] of [[-9, -44, -0.5], [-1, -47, -0.3]]) {
      g.save(); g.translate(px, py); g.rotate(rot);
      g.beginPath(); H.rr(g, -3.2, -9, 6.4, 11, 2.5); H.fs(g, H.vol(g, 0, -4, 3.5, 6, '#e58b6c'), 1.6);
      g.beginPath(); H.ell(g, 0, -9, 3.1, 1.5); H.fs(g, '#3a1b10', 1.2);
      g.restore();
    }
    // body
    const body = (g) => H.ell(g, 0, -31, 21, 15.5);
    g.beginPath(); body(g); g.fillStyle = H.vol(g, -2, -33, 21, 15, '#f07a24', 0.35, -0.35); g.fill();
    H.clipTo(g, body, (g) => {
      // scales
      g.strokeStyle = 'rgba(150,50,0,0.35)'; g.lineWidth = 0.9;
      for (let row = 0; row < 4; row++) for (let i = 0; i < 6; i++) {
        const x = -16 + i * 5.2 + (row % 2) * 2.6, y = -42 + row * 4.5;
        g.beginPath(); g.arc(x, y, 2.6, 0.2, Math.PI - 0.2); g.stroke();
      }
      g.beginPath(); H.ell(g, 6, -21, 18, 9.5); g.fillStyle = H.lin(g, 0, -30, 0, -12, [[0, '#fffaf0'], [1, '#e8d6c0']]); g.fill();
      g.beginPath(); body(g); g.lineWidth = 6; g.strokeStyle = 'rgba(80,20,0,0.15)'; g.stroke();
    });
    g.beginPath(); body(g); g.lineWidth = 2.4; g.strokeStyle = OUT; g.stroke();
    // windshield
    g.beginPath(); H.rr(g, 4, -45, 13, 10, 4);
    H.fs(g, H.lin(g, 4, -45, 17, -35, [[0, '#e6f7ff'], [0.5, '#8fd0f4'], [1, '#4b9ccc']]), 1.8);
    g.beginPath(); g.moveTo(6.5, -42.5); g.lineTo(10, -42.5); g.lineWidth = 1.4; g.strokeStyle = 'rgba(255,255,255,0.9)'; g.stroke();
    // headlight eyes
    for (const [ex, ey, r] of [[12, -31.5, 3.2], [18.5, -32, 4.2]]) {
      const gl = g.createRadialGradient(ex, ey, 0.5, ex, ey, r * 2.3);
      gl.addColorStop(0, 'rgba(255,250,180,0.55)'); gl.addColorStop(1, 'rgba(255,250,180,0)');
      g.fillStyle = gl; g.beginPath(); H.circ(g, ex, ey, r * 2.3); g.fill();
      g.beginPath(); H.circ(g, ex, ey, r); H.fs(g, H.vol(g, ex, ey, r, r, '#fff4a6', 0.6, -0.2), 1.6);
      g.beginPath(); H.circ(g, ex + 0.8, ey, r * 0.42); g.fillStyle = '#1a0d06'; g.fill();
    }
    // mouth plate + cannon
    g.beginPath(); H.rr(g, 9, -27, 12, 7, 2.5); H.fs(g, H.vol(g, 15, -24, 6, 4, '#d4651c'), 1.6);
    const rec = atk * 4;
    g.beginPath(); H.rr(g, 16 - rec, -26, 15, 6, 2);
    H.fs(g, H.lin(g, 0, -26, 0, -20, [[0, '#9aa3ad'], [0.4, '#e3e8ee'], [1, '#4b535c']]), 1.6);
    g.beginPath(); H.rr(g, 29 - rec, -27, 4, 8, 1.5); H.fs(g, '#5b636d', 1.4);
    g.beginPath(); H.ell(g, 33 - rec, -23, 1, 2.4); g.fillStyle = '#111'; g.fill();
    g.restore();
    g.restore();
  }

  /* ============================== MAN-AT-LEGS ============================== */
  function drawManAtLegs(g, ph, atk, scale) {
    const t = ph * TAU;
    g.save();
    g.scale(scale, scale);
    const bob = Math.sin(t) * 1.2;
    const bodyY = -50 + bob;
    const leg = (hx, kx, ky, fx, col) => {
      H.limb(g, [hx, bodyY + 2, kx, ky + bob * 0.5, fx, 0], col, 3.6, 2.2);
      g.beginPath(); H.circ(g, kx, ky + bob * 0.5, 2.6); H.fs(g, col, 1.4);
      g.beginPath(); H.ell(g, fx, -0.5, 2.6, 1.6); H.fs(g, U.shade(col, -0.2), 1.2);
    };
    // back legs
    leg(-6, -24, -72, -30, '#8c7f72');
    leg(6, 26, -72, 32, '#8c7f72');
    // gun underneath (behind body front edge)
    const spin = ph * 4 + atk * 3;
    g.save(); g.translate(4, bodyY + 10);
    g.beginPath(); H.rr(g, -2, -5, 30, 10, 3);
    H.fs(g, H.lin(g, 0, -5, 0, 5, [[0, '#6c757e'], [0.4, '#c9d1d9'], [1, '#2e343a']]), 1.8);
    g.strokeStyle = 'rgba(20,20,20,0.6)'; g.lineWidth = 1;
    for (let i = 0; i < 3; i++) { const yy = -5 + ((i / 3 + spin) % 1) * 10; g.beginPath(); g.moveTo(4, yy); g.lineTo(28, yy); g.stroke(); }
    g.beginPath(); H.rr(g, 26, -6.5, 5, 13, 2); H.fs(g, '#3b4248', 1.6);
    g.restore();
    // body shell
    const body = (g) => {
      g.moveTo(-22, bodyY + 4);
      g.bezierCurveTo(-24, bodyY - 14, -6, bodyY - 18, 6, bodyY - 17);
      g.bezierCurveTo(20, bodyY - 16, 26, bodyY - 6, 24, bodyY + 4);
      g.bezierCurveTo(18, bodyY + 11, -16, bodyY + 11, -22, bodyY + 4);
      g.closePath();
    };
    g.beginPath(); body(g); g.fillStyle = H.vol(g, 0, bodyY - 4, 24, 14, '#a8613a', 0.35, -0.4); g.fill();
    H.clipTo(g, body, (g) => {
      g.strokeStyle = 'rgba(60,20,0,0.5)'; g.lineWidth = 1.4;
      for (const x of [-12, -2, 8]) { g.beginPath(); g.moveTo(x, bodyY - 20); g.quadraticCurveTo(x + 3, bodyY - 4, x, bodyY + 12); g.stroke(); }
      g.beginPath(); H.ell(g, 0, bodyY + 8, 26, 6); g.fillStyle = 'rgba(255,220,180,0.35)'; g.fill();
    });
    g.beginPath(); body(g); g.lineWidth = 2.4; g.strokeStyle = OUT; g.stroke();
    // face plate
    g.beginPath(); H.rr(g, 13, bodyY - 9, 11, 9, 3); H.fs(g, '#2a2420', 1.6);
    g.beginPath(); H.circ(g, 17, bodyY - 5, 1.5); H.circ(g, 21, bodyY - 5, 1.5); g.fillStyle = '#ff3b2b'; g.fill();
    // antennae spikes
    for (const x of [-10, 0, 10]) { g.beginPath(); g.moveTo(x - 2, bodyY - 16); g.lineTo(x, bodyY - 22); g.lineTo(x + 2, bodyY - 16); H.fs(g, '#d9c3a5', 1.2); }
    H.shine(g, -8, bodyY - 11, 7, 2.4, -0.2, 0.35);
    // front legs
    leg(-10, -30, -62, -38, '#b5a898');
    leg(12, 34, -62, 40, '#b5a898');
    g.restore();
  }

  /* ============================== SNITCHBUG ============================== */
  function drawSnitchbug(g, ph, atk, scale, carrying) {
    const t = ph * TAU;
    g.save();
    g.scale(scale, scale);
    const bob = Math.sin(t) * 2.5;
    g.translate(0, bob);
    const flap = Math.sin(ph * TAU * 4);
    // wings (back)
    g.save(); g.globalAlpha = 0.6;
    g.save(); g.translate(-2, -46); g.rotate(-1.2 - flap * 0.5);
    g.beginPath(); H.ell(g, 0, -12, 6, 14); H.fs(g, '#e9f4ff', 1.2, '#4a5a7a'); g.restore();
    g.restore();
    // abdomen
    g.beginPath(); H.ell(g, -14, -38, 12, 7.5, 0.25);
    g.fillStyle = H.vol(g, -14, -38, 12, 8, '#7d5cc4'); g.fill();
    H.clipTo(g, (g) => H.ell(g, -14, -38, 12, 7.5, 0.25), (g) => {
      g.fillStyle = '#f3c84b';
      for (const x of [-20, -13, -6]) { g.beginPath(); g.ellipse(x, -38 + (x + 13) * 0.25, 1.8, 9, 0.25, 0, TAU); g.fill(); }
    });
    g.beginPath(); H.ell(g, -14, -38, 12, 7.5, 0.25); g.lineWidth = 2; g.strokeStyle = OUT; g.stroke();
    // arms (long, grabbing)
    const reach = carrying ? 0.2 : atk;
    for (const [sx, col] of [[-1, '#c7b8e8'], [1, '#e9e0ff']]) {
      const ax = 2 + sx, ay = -38;
      const hx = ax + 6 + reach * 6, hy = ay + 14 - reach * 2;
      H.limb(g, [ax, ay, ax + 6, ay + 6, hx, hy], col, 2.2, 1.8);
      g.beginPath(); H.circ(g, hx, hy, 2.4); H.fs(g, col, 1.2);
    }
    // thorax
    g.beginPath(); H.ell(g, 0, -42, 8, 7); H.fs(g, H.vol(g, 0, -42, 8, 7, '#6a49b0'), 2);
    // head
    g.beginPath(); H.ell(g, 10, -48, 7.5, 6.5); H.fs(g, H.vol(g, 10, -48, 7, 6, '#8b6ad6'), 2);
    g.beginPath(); H.ell(g, 12, -50, 3.6, 3.8); H.fs(g, H.vol(g, 12, -50, 3.6, 3.6, '#ff5a6e', 0.5, -0.3), 1.4);
    g.beginPath(); H.circ(g, 11, -51, 1); g.fillStyle = '#fff'; g.fill();
    g.beginPath(); g.moveTo(16, -46); g.lineTo(22, -44 + atk * 2); g.lineTo(16, -43); H.fs(g, '#f3c84b', 1.3);
    // antennae
    g.beginPath(); g.moveTo(8, -54); g.quadraticCurveTo(6, -62, 12, -64); g.moveTo(11, -54); g.quadraticCurveTo(13, -61, 18, -61);
    g.lineWidth = 1.2; g.strokeStyle = OUT; g.stroke();
    // front wing
    g.save(); g.globalAlpha = 0.72;
    g.translate(-1, -46); g.rotate(-0.8 - flap * 0.6);
    g.beginPath(); H.ell(g, 0, -13, 6.5, 15); H.fs(g, '#f4faff', 1.2, '#4a5a7a');
    g.beginPath(); g.moveTo(0, -1); g.lineTo(0, -25); g.moveTo(0, -12); g.lineTo(4, -20); g.lineWidth = 0.7; g.strokeStyle = 'rgba(70,90,130,0.6)'; g.stroke();
    g.restore();
    g.restore();
  }
  Art.drawSnitchbug = drawSnitchbug;

  /* ============================== BLOWHOGS ============================== */
  const HOG = (Art.HOG = {
    fiery: { body: '#e8562a', band: '#f9c77b', snout: '#ff3b22', leg: '#b8401d' },
    withering: { body: '#6b6fbd', band: '#cdd3ff', snout: '#a7b8ff', leg: '#4e5296' },
    puffy: { body: '#b68ae2', band: '#ead8ff', snout: '#d2a8ff', leg: '#8a5fc0' },
  });

  function drawBlowhog(g, kind, ph, inflate, blow, scale) {
    const K = HOG[kind];
    const t = ph * TAU;
    g.save();
    g.scale(scale, scale);
    const bob = Math.sin(t) * 0.8;
    const inf = 1 + inflate * 0.16;
    // legs
    for (const [lx, col] of [[-16, K.leg], [-4, K.leg], [-12, U.shade(K.leg, 0.25)], [2, U.shade(K.leg, 0.25)]]) {
      H.limb(g, [lx, -14 + bob, lx + 0.5, -2], col, 5.5, 2.2);
      g.beginPath(); H.ell(g, lx + 1.2, -1.5, 3.8, 2); H.fs(g, U.shade(col, -0.15), 1.4);
    }
    g.save();
    g.translate(-6, -26 + bob);
    g.scale(inf, inf);
    // body
    const body = (g) => {
      g.moveTo(-20, 2);
      g.bezierCurveTo(-22, -14, -8, -18, 4, -16);
      g.bezierCurveTo(12, -14, 16, -10, 18, -6);
      g.bezierCurveTo(19, 4, 14, 12, 2, 12);
      g.bezierCurveTo(-12, 12, -19, 10, -20, 2);
      g.closePath();
    };
    g.beginPath(); body(g); g.fillStyle = H.vol(g, -2, -2, 20, 14, K.body, 0.35, -0.38); g.fill();
    H.clipTo(g, body, (g) => {
      g.strokeStyle = U.rgba(K.band.length === 7 ? K.band : '#ffffff', 0.7);
      g.lineWidth = 3.2;
      for (const x of [-12, -5, 2]) { g.beginPath(); g.moveTo(x - 3, -20); g.quadraticCurveTo(x + 2, -2, x - 2, 14); g.stroke(); }
      g.beginPath(); H.ell(g, 0, 10, 20, 5); g.fillStyle = U.rgba(K.band, 0.5); g.fill();
    });
    g.beginPath(); body(g); g.lineWidth = 2.4; g.strokeStyle = OUT; g.stroke();
    // dorsal bumps
    for (const x of [-12, -4]) { g.beginPath(); g.moveTo(x - 3, -16); g.quadraticCurveTo(x, -21, x + 3, -16.5); H.fs(g, U.shade(K.body, -0.1), 1.6); }
    H.shine(g, -8, -11, 6, 2.2, -0.2, 0.4);
    g.restore();
    // snout tube
    const sx = 6, sy = -28 + bob;
    const sl = 18 + blow * 4;
    g.beginPath();
    g.moveTo(sx, sy - 8);
    g.quadraticCurveTo(sx + sl * 0.6, sy - 6.5, sx + sl, sy - 6.5 - blow * 1.5);
    g.lineTo(sx + sl, sy + 4.5 + blow * 1.5);
    g.quadraticCurveTo(sx + sl * 0.6, sy + 5.5, sx, sy + 8);
    g.closePath();
    H.fs(g, H.vol(g, sx + sl / 2, sy - 2, sl / 2, 7, K.body, 0.3, -0.3), 2.2);
    for (const k of [0.35, 0.65]) { g.beginPath(); g.moveTo(sx + sl * k, sy - 7); g.lineTo(sx + sl * k, sy + 5.5); g.lineWidth = 1; g.strokeStyle = 'rgba(40,10,0,0.3)'; g.stroke(); }
    // mouth ring
    g.beginPath(); H.ell(g, sx + sl + 0.5, sy - 1, 3.4, 6.5 + blow * 1.5);
    H.fs(g, H.vol(g, sx + sl, sy - 1, 3.4, 6.5, K.snout, 0.35, -0.3), 2);
    g.beginPath(); H.ell(g, sx + sl + 1.4, sy - 1, 1.6, 3.8 + blow * 1.5); g.fillStyle = '#2a0a06'; g.fill();
    // eye
    g.beginPath(); H.ell(g, 5, -38 + bob, 2.6, 3); H.fs(g, '#fffbe8', 1.4);
    g.beginPath(); H.circ(g, 5.8, -37.6 + bob, 1.5); g.fillStyle = '#100805'; g.fill();
    g.beginPath(); g.moveTo(1.5, -42 + bob); g.quadraticCurveTo(5, -44 + bob - inflate, 9, -41.5 + bob); g.lineWidth = 1.8; g.strokeStyle = OUT; g.stroke();
    g.restore();
  }

  function drawPuffyBlowhog(g, ph, inflate, blow, scale) {
    const K = HOG.puffy;
    const t = ph * TAU;
    g.save();
    g.scale(scale, scale);
    const bob = Math.sin(t) * 3;
    g.translate(0, -18 + bob);
    const inf = 1 + inflate * 0.12;
    // propeller tail
    const spin = ph * TAU * 3;
    g.save(); g.translate(-25, -26);
    for (let i = 0; i < 2; i++) {
      g.save(); g.rotate(spin + i * Math.PI); g.scale(1, 0.45 + 0.4 * Math.abs(Math.cos(spin)));
      g.beginPath(); H.ell(g, 0, -7, 3, 7); H.fs(g, '#7fcf5a', 1.2);
      g.restore();
    }
    g.beginPath(); H.circ(g, 0, 0, 2.2); H.fs(g, '#5a3a8a', 1.2);
    g.restore();
    // dangling legs
    for (const lx of [-10, -2, 6]) { H.limb(g, [lx, -12, lx + Math.sin(t + lx) * 1.5, -4], K.leg, 3.4, 1.8); }
    g.save(); g.translate(-2, -28); g.scale(inf, inf);
    const body = (g) => H.ell(g, 0, 0, 24, 18.5);
    g.beginPath(); body(g); g.fillStyle = H.vol(g, 0, 0, 24, 18, K.body, 0.4, -0.35); g.fill();
    H.clipTo(g, body, (g) => {
      g.fillStyle = 'rgba(110,60,170,0.45)';
      for (const [x, y, r] of [[-12, -8, 5], [2, -12, 4], [-4, 2, 3.5], [10, -2, 3], [-16, 4, 3]]) { g.beginPath(); H.circ(g, x, y, r); g.fill(); }
      g.beginPath(); H.ell(g, 2, 14, 22, 8); g.fillStyle = K.band; g.fill();
    });
    g.beginPath(); body(g); g.lineWidth = 2.4; g.strokeStyle = OUT; g.stroke();
    H.shine(g, -8, -11, 8, 3, -0.3, 0.5);
    g.restore();
    // snout
    const sl = 12 + blow * 4;
    g.beginPath();
    g.moveTo(18, -33); g.quadraticCurveTo(18 + sl * 0.6, -32, 18 + sl, -32.5 - blow);
    g.lineTo(18 + sl, -22.5 + blow); g.quadraticCurveTo(18 + sl * 0.6, -23, 18, -22); g.closePath();
    H.fs(g, H.vol(g, 24, -28, 8, 6, K.body, 0.3, -0.3), 2);
    g.beginPath(); H.ell(g, 18.5 + sl, -27.5, 3, 5.5 + blow); H.fs(g, K.snout, 1.8);
    g.beginPath(); H.ell(g, 19.5 + sl, -27.5, 1.4, 3.2 + blow); g.fillStyle = '#2a0a26'; g.fill();
    g.beginPath(); H.ell(g, 12, -38, 2.6, 3); H.fs(g, '#fffbe8', 1.4);
    g.beginPath(); H.circ(g, 12.8, -37.6, 1.5); g.fillStyle = '#100805'; g.fill();
    g.restore();
  }

  /* ============================== CANNON BEETLES ============================== */
  function drawCannonLarva(g, ph, atk, scale) {
    const t = ph * TAU;
    g.save();
    g.scale(scale, scale);
    const breathe = Math.sin(t) * 0.8;
    const push = atk < 0.5 ? -atk * 6 : (1 - atk) * 8;
    const col = '#6fb33f';
    // tiny legs
    for (const lx of [-16, -6, 4, 12]) { H.limb(g, [lx, -6, lx + 1, -1], '#4e8a2a', 3, 1.8); }
    // segments back to front
    const segs = [[-20, -15, 12, 11], [-7, -19, 14, 14.5 + breathe * 0.4], [9 + push * 0.4, -22, 14.5, 16 + breathe * 0.5]];
    segs.forEach(([x, y, rx, ry], i) => {
      g.beginPath(); H.ell(g, x, y, rx, ry);
      H.fs(g, H.vol(g, x, y, rx, ry, U.shade(col, i * 0.05 - 0.05)), 2.2);
      g.beginPath(); g.arc(x - rx * 0.9, y, ry * 0.95, -1.1, 1.1); g.lineWidth = 1.4; g.strokeStyle = 'rgba(30,60,10,0.45)'; g.stroke();
    });
    // eyeball decoy pattern on middle
    g.beginPath(); H.circ(g, -8, -21, 5.4); H.fs(g, '#fffbe8', 1.6);
    g.beginPath(); H.circ(g, -7.4, -20.6, 2.8); g.fillStyle = '#d33b2b'; g.fill();
    g.beginPath(); H.circ(g, -7.4, -20.6, 1.5); g.fillStyle = '#100805'; g.fill();
    // head details
    const hx = 9 + push * 0.4;
    g.beginPath(); H.ell(g, hx - 1, -37, 3.4, 1.6); H.fs(g, '#244a10', 1.4); // blowhole
    g.beginPath(); H.ell(g, hx + 4, -31, 2.3, 2.6); H.fs(g, '#fffbe8', 1.2);
    g.beginPath(); H.circ(g, hx + 4.8, -30.8, 1.3); g.fillStyle = '#100805'; g.fill();
    // cannon mouth
    const mr = 6.5 + Math.max(0, push) * 0.3;
    g.beginPath(); H.ell(g, hx + 13 + push * 0.3, -20, 5, mr + 1.5); H.fs(g, H.vol(g, hx + 13, -20, 5, mr, '#a9d86f', 0.35, -0.25), 2);
    g.beginPath(); H.ell(g, hx + 14.5 + push * 0.3, -20, 3, mr - 1.5); g.fillStyle = '#1e2a10'; g.fill();
    H.shine(g, -10, -31, 6, 2, -0.2, 0.35);
    g.restore();
  }

  function drawDecoratedBeetle(g, ph, atk, scale) {
    const t = ph * TAU;
    g.save();
    g.scale(scale, scale);
    const breathe = Math.sin(t) * 0.6;
    const push = atk < 0.5 ? -atk * 5 : (1 - atk) * 7;
    // legs
    for (const [lx, col] of [[-18, '#3b3b44'], [-4, '#3b3b44'], [10, '#3b3b44'], [-12, '#55555f'], [4, '#55555f']]) {
      H.limb(g, [lx, -10, lx - 3, -5, lx + 1, -1], col, 3, 2);
    }
    // head + cannon
    const hx = 18 + push * 0.4;
    g.beginPath(); H.ell(g, hx, -20, 11, 11); H.fs(g, H.vol(g, hx, -20, 11, 11, '#4a5560'), 2.2);
    g.beginPath(); H.ell(g, hx + 9, -20, 5.5, 8.5); H.fs(g, H.vol(g, hx + 9, -20, 5.5, 8.5, '#d4b04a', 0.4, -0.3), 2);
    g.beginPath(); H.ell(g, hx + 10.6, -20, 3.4, 6); g.fillStyle = '#16120c'; g.fill();
    g.beginPath(); H.ell(g, hx + 1, -27, 2.2, 2.4); H.fs(g, '#fff4b8', 1.2);
    g.beginPath(); H.circ(g, hx + 1.6, -26.8, 1.2); g.fillStyle = '#100805'; g.fill();
    // shell
    const shell = (g) => {
      g.moveTo(-28, -9);
      g.bezierCurveTo(-30, -36, -14, -50 - breathe, 0, -50 - breathe);
      g.bezierCurveTo(14, -50 - breathe, 20, -34, 16, -9);
      g.quadraticCurveTo(-6, -4, -28, -9);
      g.closePath();
    };
    g.beginPath(); shell(g); g.fillStyle = H.vol(g, -6, -30, 24, 22, '#2c8b8f', 0.4, -0.4); g.fill();
    H.clipTo(g, shell, (g) => {
      // ornate gold swirls & gems
      g.strokeStyle = '#f2cf5b'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(-6, -50); g.lineTo(-6, -6); g.stroke();
      for (const s of [-1, 1]) {
        g.beginPath(); g.moveTo(-6, -38); g.bezierCurveTo(-6 + s * 10, -44, -6 + s * 18, -34, -6 + s * 12, -26);
        g.bezierCurveTo(-6 + s * 7, -22, -6 + s * 4, -28, -6 + s * 8, -30); g.stroke();
        g.beginPath(); g.moveTo(-6, -20); g.bezierCurveTo(-6 + s * 12, -24, -6 + s * 18, -16, -6 + s * 14, -10); g.stroke();
      }
      for (const [x, y] of [[-6, -44], [-17, -30], [5, -30], [-6, -26], [-14, -14], [2, -14]]) {
        g.beginPath(); H.circ(g, x, y, 2.4); H.fs(g, H.vol(g, x, y, 2.4, 2.4, '#ff6fae', 0.6, -0.3), 1);
      }
      g.beginPath(); shell(g); g.lineWidth = 7; g.strokeStyle = 'rgba(0,30,40,0.25)'; g.stroke();
    });
    g.beginPath(); shell(g); g.lineWidth = 2.6; g.strokeStyle = OUT; g.stroke();
    g.beginPath(); H.ell(g, -6, -50, 3.2, 1.6); H.fs(g, '#13262a', 1.2);
    H.shine(g, -14, -40, 6, 2.4, -0.6, 0.45);
    g.restore();
  }

  /* ============================== WOLLYWOG ============================== */
  function drawWollywog(g, ph, squash, scale, airborne) {
    const t = ph * TAU;
    g.save();
    g.scale(scale, scale);
    const sq = squash || 0; // -1 stretch .. 1 squash
    const breathe = Math.sin(t) * 0.6;
    g.scale(1 + sq * 0.12, 1 - sq * 0.14);
    const col = '#f4cf33';
    // back leg
    if (airborne) {
      H.limb(g, [-10, -12, -22, -4, -26, 4], U.shade(col, -0.2), 6, 2.2);
    } else {
      g.beginPath(); H.ell(g, -11, -10, 10, 8, -0.3); H.fs(g, H.vol(g, -11, -10, 10, 8, U.shade(col, -0.08)), 2.2);
      g.beginPath(); H.ell(g, -5, -1.5, 8, 2.6); H.fs(g, U.shade(col, -0.15), 1.6);
    }
    // body
    const body = (g) => {
      g.moveTo(-20, -8);
      g.bezierCurveTo(-22, -26, -6, -34, 8, -32);
      g.bezierCurveTo(22, -30, 26, -18, 24, -10);
      g.bezierCurveTo(22, -3, 10, -2, 0, -2);
      g.bezierCurveTo(-12, -2, -19, -3, -20, -8);
      g.closePath();
    };
    g.beginPath(); body(g); g.fillStyle = H.vol(g, 0, -18, 22, 16, col, 0.4, -0.35); g.fill();
    H.clipTo(g, body, (g) => {
      g.beginPath(); H.ell(g, 6, -4, 20, 8); g.fillStyle = '#fff4c8'; g.fill();
      g.fillStyle = 'rgba(224,128,24,0.75)';
      for (const [x, y, r] of [[-12, -20, 3.4], [-4, -27, 3], [-15, -12, 2.4], [4, -24, 2], [-8, -16, 2]]) { g.beginPath(); H.circ(g, x, y, r); g.fill(); }
    });
    g.beginPath(); body(g); g.lineWidth = 2.4; g.strokeStyle = OUT; g.stroke();
    // mouth
    g.beginPath(); g.moveTo(6, -12); g.quadraticCurveTo(16, -9, 24, -13); g.lineWidth = 1.8; g.strokeStyle = OUT; g.stroke();
    // front leg
    H.limb(g, [10, -8, 14, -2 + (airborne ? -2 : 0)], U.shade(col, -0.1), 4, 2);
    // eyes
    for (const [ex, ey] of [[6, -33 + breathe], [14, -31 + breathe]]) {
      g.beginPath(); H.circ(g, ex, ey, 5); H.fs(g, H.vol(g, ex, ey, 5, 5, col), 2);
      g.beginPath(); H.circ(g, ex + 0.8, ey - 0.6, 3.4); H.fs(g, '#fffbe6', 1.2);
      g.beginPath(); H.ell(g, ex + 1.3, ey - 0.6, 2.2, 1.1); g.fillStyle = '#100805'; g.fill();
    }
    H.shine(g, -6, -25, 6, 2, -0.4, 0.45);
    g.restore();
  }
  Art.drawWollywog = drawWollywog;

  /* ============================== BURROWING SNAGRET (spell) ============================== */
  Art.drawSnagret = function (g, x, y, rise, peck, dir) {
    // rise 0..1 neck height; peck 0..1 head strike
    if (rise <= 0.01) return;
    g.save();
    g.translate(x, y);
    // dirt hole
    g.beginPath(); H.ell(g, 0, 2, 22, 8); g.fillStyle = '#3b2412'; g.fill();
    g.lineWidth = 2; g.strokeStyle = OUT; g.stroke();
    const hgt = 70 * rise;
    const hx = dir * (6 + peck * 26), hy = -hgt + peck * 52;
    // neck
    g.beginPath();
    g.moveTo(-6, 4);
    g.bezierCurveTo(-8, -hgt * 0.4, hx - dir * 18, hy + 10, hx, hy);
    g.lineWidth = 16; g.strokeStyle = OUT; g.stroke();
    g.lineWidth = 12.5; g.strokeStyle = '#b7aecf'; g.stroke();
    g.lineWidth = 4; g.strokeStyle = 'rgba(255,255,255,0.35)'; g.stroke();
    // scale bands
    g.save(); g.setLineDash([2, 5]); g.lineWidth = 12; g.strokeStyle = 'rgba(80,60,120,0.35)'; g.stroke(); g.restore();
    // head
    g.save(); g.translate(hx, hy); g.scale(dir, 1); g.rotate(peck * 0.9);
    g.beginPath(); H.ell(g, 0, 0, 11, 9); H.fs(g, H.vol(g, 0, 0, 11, 9, '#e7e2f2'), 2.2);
    // crest
    g.beginPath(); g.moveTo(-6, -7); g.quadraticCurveTo(-16, -18, -18, -8); g.quadraticCurveTo(-12, -6, -8, -2); H.fs(g, '#6a8fd6', 1.6);
    // beak
    g.beginPath(); g.moveTo(8, -4); g.lineTo(30, 1); g.lineTo(8, 5); g.closePath(); H.fs(g, H.lin(g, 8, 0, 30, 0, [[0, '#ff8a3a'], [1, '#c43b12']]), 1.8);
    g.beginPath(); g.moveTo(9, 0.6); g.lineTo(28, 1); g.lineWidth = 1; g.strokeStyle = OUT; g.stroke();
    // eye stripe & eye
    g.beginPath(); H.ell(g, 2, -2.5, 6, 2.6); g.fillStyle = '#2b2b48'; g.fill();
    g.beginPath(); H.circ(g, 3, -2.8, 2.2); g.fillStyle = '#ffd23a'; g.fill();
    g.beginPath(); H.circ(g, 3.4, -2.8, 1.1); g.fillStyle = '#100805'; g.fill();
    g.restore();
    g.restore();
  };

  /* ============================== TOWER CREATURE FRAMES ============================== */
  // creature: 'groink','manatlegs','snitch','fiery','withering','puffy','larva','decorated','wolly'
  const CRE = {
    groink: { w: 90, h: 70, ax: 40, ay: 62, draw: (g, ph, a, sc) => drawGroink(g, ph, a, sc) },
    manatlegs: { w: 110, h: 96, ax: 55, ay: 90, draw: (g, ph, a, sc) => drawManAtLegs(g, ph, a, sc) },
    snitch: { w: 90, h: 96, ax: 42, ay: 88, draw: (g, ph, a, sc) => drawSnitchbug(g, ph, a, sc, false) },
    fiery: { w: 90, h: 64, ax: 42, ay: 58, draw: (g, ph, a, sc) => drawBlowhog(g, 'fiery', ph, a < 0.5 ? a * 2 : 2 - a * 2, a > 0.5 ? (a - 0.5) * 2 : 0, sc) },
    withering: { w: 90, h: 64, ax: 42, ay: 58, draw: (g, ph, a, sc) => drawBlowhog(g, 'withering', ph, a < 0.5 ? a * 2 : 2 - a * 2, a > 0.5 ? (a - 0.5) * 2 : 0, sc) },
    puffy: { w: 100, h: 96, ax: 48, ay: 88, draw: (g, ph, a, sc) => drawPuffyBlowhog(g, ph, a < 0.5 ? a * 2 : 2 - a * 2, a > 0.5 ? (a - 0.5) * 2 : 0, sc) },
    larva: { w: 90, h: 66, ax: 44, ay: 58, draw: (g, ph, a, sc) => drawCannonLarva(g, ph, a, sc) },
    decorated: { w: 100, h: 76, ax: 46, ay: 66, draw: (g, ph, a, sc) => drawDecoratedBeetle(g, ph, a, sc) },
    wolly: { w: 80, h: 64, ax: 38, ay: 56, draw: (g, ph, a, sc) => drawWollywog(g, ph, a, sc, false) },
  };
  Art.CRE = CRE;

  /** frame: idle frames 0..7 (pose 'idle') or attack frames 0..5 (pose 'attack') */
  Art.creature = function (kind, scale, pose, frame) {
    const C = CRE[kind];
    const key = `cre|${kind}|${scale}|${pose}|${frame}`;
    return Art.sprite(key, C.w * scale, C.h * scale, C.ax * scale, C.ay * scale, (g) => {
      if (pose === 'attack') C.draw(g, 0, frame / 5, scale);
      else C.draw(g, frame / 8, 0, scale);
    });
  };

  /* standalone drawing for portraits/almanac */
  Art.drawCreatureAt = function (g, kind, scale, ph, a) {
    CRE[kind].draw(g, ph || 0, a || 0, scale);
  };
})();
