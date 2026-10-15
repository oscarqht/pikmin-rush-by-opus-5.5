/* Bulborb Rush — enemy art: Pikmin and captains (all procedural). */
(function () {
  'use strict';
  const PTD = window.PTD;
  const U = PTD.U;
  const Art = PTD.Art;
  const H = Art.H;
  const OUT = Art.OUT;
  const TAU = Math.PI * 2;

  const LEAF = '#5cc443';
  const STEM = '#3f8a2c';

  const PIK = (Art.PIK = {
    red: { body: '#e8392c', nose: true, flower: '#ffffff', bud: '#fff3f8' },
    yellow: { body: '#f9d227', ears: true, flower: '#ffffff', bud: '#fffbe8' },
    blue: { body: '#2f6fe4', mouth: true, flower: '#ffffff', bud: '#eef4ff' },
    purple: { body: '#7b3fc6', hair: true, fat: true, flower: '#ff8fcf', bud: '#ffb3dd' },
    white: { body: '#f2eef6', small: true, iris: '#d4202a', flower: '#c58ef3', bud: '#e5c9ff', spikes: true },
    rock: { body: '#8e93a3', rock: true, flower: '#ffffff', bud: '#f0f0f0' },
    winged: { body: '#f68bc4', wings: true, flower: '#ffffff', bud: '#fff0f8' },
    ice: { body: '#8fe0f7', ice: true, flower: '#e4f9ff', bud: '#d0f3ff' },
    glow: { body: '#a6ff5e', glow: true, flower: '#f6ffc8', bud: '#eaffb0' },
  });

  /* ---------- the sprout on top: leaf / bud / flower ---------- */
  function sprout(g, x, y, tier, K, sway) {
    const tx = x - 1.6 + sway, ty = y - 8.5;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + 0.8 + sway * 0.3, y - 4.5, tx, ty);
    g.lineWidth = 2.6;
    g.strokeStyle = OUT;
    g.stroke();
    g.lineWidth = 1.2;
    g.strokeStyle = STEM;
    g.stroke();
    if (tier === 0) {
      // leaf
      g.save();
      g.translate(tx, ty);
      g.rotate(-0.55 + sway * 0.08);
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(3.2, -4.4, 0.2, -9.4);
      g.quadraticCurveTo(-3.2, -4.4, 0, 0);
      H.fs(g, H.vol(g, 0, -5, 3, 5, LEAF, 0.35, -0.35), 1.1);
      g.beginPath();
      g.moveTo(0, -0.5);
      g.lineTo(0.1, -8);
      g.lineWidth = 0.6;
      g.strokeStyle = '#2f7a22';
      g.stroke();
      g.restore();
    } else if (tier === 1) {
      // bud
      g.save();
      g.translate(tx, ty);
      g.beginPath();
      g.moveTo(0, 0.5);
      g.bezierCurveTo(3.2, -1, 2.4, -5.4, 0, -6.6);
      g.bezierCurveTo(-2.4, -5.4, -3.2, -1, 0, 0.5);
      H.fs(g, H.vol(g, 0, -3, 2.6, 3.5, K.bud, 0.3, -0.3), 1.1);
      g.beginPath();
      g.moveTo(-2.2, -0.6);
      g.quadraticCurveTo(0, 1.2, 2.2, -0.6);
      g.lineTo(0, -2.4);
      g.closePath();
      H.fs(g, LEAF, 0.8);
      g.restore();
    } else {
      // flower
      g.save();
      g.translate(tx, ty - 2.2);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU - Math.PI / 2 + sway * 0.05;
        g.beginPath();
        H.ell(g, Math.cos(a) * 2.9, Math.sin(a) * 2.9, 2.4, 1.6, a);
        H.fs(g, K.flower, 0.9);
      }
      g.beginPath();
      H.circ(g, 0, 0, 1.7);
      H.fs(g, '#ffd23a', 0.8);
      g.restore();
    }
  }

  /**
   * Draw a Pikmin. Origin = feet. Faces right in 'side' view.
   * view: 'side' | 'front' | 'back'; ph: 0..1 anim phase; pose: 'walk' | 'attack' | 'idle'
   */
  function drawPikmin(g, kind, tier, view, ph, pose) {
    const K = PIK[kind];
    const c = K.body;
    const dk = U.shade(c, -0.38);
    const sc = K.small ? 0.9 : K.fat ? 1.08 : 1;
    const t = ph * TAU;
    const walking = pose === 'walk';
    const atk = pose === 'attack' ? Math.sin(ph * Math.PI) : 0;
    const flying = !!K.wings;
    const bob = walking ? -Math.abs(Math.sin(t)) * 1.3 : 0;
    const sway = Math.sin(t + 1.2) * 1.4 + (walking ? -0.8 : 0) - atk * 1.5;
    g.save();
    g.scale(sc, sc);
    if (flying) g.translate(0, Math.sin(t) * 1.2);

    // glow aura
    if (K.glow) {
      const gr = g.createRadialGradient(0, -18, 2, 0, -18, 22);
      gr.addColorStop(0, 'rgba(200,255,140,0.55)');
      gr.addColorStop(1, 'rgba(200,255,140,0)');
      g.fillStyle = gr;
      g.beginPath();
      H.circ(g, 0, -18, 22);
      g.fill();
    }

    const hipY = -7.5 + bob;
    const legSwing = walking ? Math.sin(t) * 0.6 : 0;
    const lean = pose === 'attack' ? atk * 0.3 : walking ? 0.08 : 0;

    // wings (behind)
    if (flying) {
      const flap = Math.sin(ph * TAU * 3) * 0.5;
      g.save();
      g.globalAlpha = 0.75;
      for (const s of view === 'side' ? [-1] : [-1, 1]) {
        g.save();
        g.translate(view === 'side' ? -2.5 : s * 3, -16 + bob);
        g.rotate(view === 'side' ? -0.9 + flap : s * (0.9 + flap));
        g.beginPath();
        H.ell(g, 0, -6, 3.2, 7);
        H.fs(g, 'rgba(255,240,255,0.85)', 0.9, 'rgba(120,60,100,0.8)');
        g.beginPath();
        g.moveTo(0, -1);
        g.lineTo(0, -11);
        g.lineWidth = 0.5;
        g.strokeStyle = 'rgba(160,80,130,0.7)';
        g.stroke();
        g.restore();
      }
      g.restore();
    }

    if (view === 'side') {
      // back leg & arm
      const legLen = 7.8;
      const l1 = flying ? 0.35 : legSwing, l2 = flying ? 0.15 : -legSwing;
      H.limb(g, [-0.5, hipY, -0.5 + Math.sin(l2) * legLen, hipY + Math.cos(l2) * legLen], dk, 1.8, 1.6);
      const armBack = walking ? -Math.sin(t) * 0.7 : 0.3;
      H.limb(g, [-1, -14 + bob, -1 + Math.sin(armBack) * 6, -14 + bob + Math.cos(armBack) * 6], dk, 1.6, 1.6);
      // body
      g.save();
      g.translate(0, -12 + bob);
      g.rotate(lean);
      if (K.rock) {
        g.beginPath();
        g.moveTo(-4, -4); g.lineTo(3.5, -5); g.lineTo(5, 2); g.lineTo(1, 5.5); g.lineTo(-4.5, 3.5);
        g.closePath();
        H.fs(g, H.vol(g, 0, 0, 5, 5, c), 1.3);
      } else {
        g.beginPath();
        H.ell(g, 0, 0, K.fat ? 4.6 : 3.8, 5.3);
        H.fs(g, H.vol(g, 0, 0, 4, 5.3, c), 1.3);
      }
      g.restore();
      // front leg
      H.limb(g, [0.5, hipY, 0.5 + Math.sin(l1) * legLen, hipY + Math.cos(l1) * legLen], c, 1.8, 1.6);
      // head
      const hx = 1.4 + lean * 9, hy = -21.5 + bob;
      g.save();
      g.translate(hx, hy);
      g.rotate(lean * 0.6);
      if (K.ears) {
        g.beginPath();
        g.moveTo(-3, -3); g.quadraticCurveTo(-10.5, -9, -11, -2.5); g.quadraticCurveTo(-7, -1.5, -3.5, 1);
        g.closePath();
        H.fs(g, H.vol(g, -7, -4, 5, 4, c), 1.2);
      }
      if (K.rock) {
        g.beginPath();
        g.moveTo(-6, -2); g.lineTo(-3.5, -7.5); g.lineTo(3.5, -7.8); g.lineTo(7.2, -1.5); g.lineTo(5.5, 5.5); g.lineTo(-1, 7); g.lineTo(-6.5, 3.5);
        g.closePath();
        H.fs(g, H.vol(g, 0, 0, 7, 7, c), 1.4);
        g.beginPath(); g.moveTo(-3.5, -7.5); g.lineTo(-1, -2); g.lineTo(7.2, -1.5); g.lineWidth = 0.6; g.strokeStyle = U.shade(c, -0.3); g.stroke();
        g.beginPath(); g.moveTo(-1, -2); g.lineTo(-1, 7); g.stroke();
      } else {
        g.beginPath();
        if (K.spikes) {
          g.moveTo(-6, 1);
          g.quadraticCurveTo(-6.5, -6, -2.5, -7.5);
          g.lineTo(-1.5, -9.5); g.lineTo(0, -7.6); g.lineTo(2, -9.2); g.lineTo(2.8, -7.2);
          g.quadraticCurveTo(6.8, -5, 6.5, 1);
          g.quadraticCurveTo(5.8, 6.8, 0, 6.8);
          g.quadraticCurveTo(-5.8, 6.8, -6, 1);
        } else {
          H.ell(g, 0, 0, K.fat ? 7.4 : 6.4, 7);
        }
        H.fs(g, H.vol(g, 0, 0, 6.5, 7, c), 1.4);
      }
      if (K.ice) {
        g.save(); g.globalAlpha = 0.6; g.fillStyle = '#ffffff';
        g.beginPath(); g.moveTo(-4, -4); g.lineTo(-1, -6); g.lineTo(-2, -1); g.closePath(); g.fill();
        g.beginPath(); g.moveTo(2, 3); g.lineTo(4.5, 1); g.lineTo(4, 5); g.closePath(); g.fill();
        g.restore();
      }
      if (K.hair) {
        g.beginPath();
        g.moveTo(-1.5, -6.6); g.lineTo(-3.3, -9.6);
        g.moveTo(0.4, -7); g.lineTo(0.1, -10.2);
        g.moveTo(2, -6.6); g.lineTo(3.8, -9.4);
        g.lineWidth = 0.9; g.strokeStyle = U.shade(c, -0.5); g.stroke();
      }
      // eyes
      const irisC = K.iris;
      H.eye(g, 1.2, -1.4, 1.55, 2.2, 0.95, 0.45, 0.1, irisC, 0.8);
      H.eye(g, 4.2, -1.2, 1.9, 2.5, 1.1, 0.5, 0.1, irisC, 0.8);
      if (K.nose) {
        g.beginPath();
        g.moveTo(5.6, 0.2); g.quadraticCurveTo(10, 1.4, 6.0, 3.2);
        H.fs(g, c, 1.1);
      }
      if (K.mouth) {
        g.beginPath();
        g.moveTo(3.8, 3.4); g.quadraticCurveTo(5.4, 4.6, 6.3, 3.0);
        g.lineWidth = 0.9; g.strokeStyle = OUT; g.stroke();
      }
      if (!K.rock) H.shine(g, -2.2, -3.8, 2, 1.2, -0.6, 0.45);
      g.restore();
      // front arm
      let armA;
      if (pose === 'attack') armA = U.lerp(-2.6, 0.9, ph);
      else armA = walking ? Math.sin(t) * 0.7 : -0.25;
      H.limb(g, [1.2, -14 + bob, 1.2 + Math.sin(armA + 0.2) * 6.2, -14 + bob + Math.cos(armA + 0.2) * 6.2], c, 1.7, 1.6);
      g.beginPath();
      H.circ(g, 1.2 + Math.sin(armA + 0.2) * 6.4, -14 + bob + Math.cos(armA + 0.2) * 6.4, 1.2);
      H.fs(g, c, 0.8);
      sprout(g, hx - 0.3, hy - (K.spikes ? 8.6 : 6.8), tier, K, sway);
    } else {
      // FRONT / BACK view (symmetric)
      const front = view === 'front';
      const lA = walking ? Math.sin(t) * 2.2 : 0;
      for (const s of [-1, 1]) {
        const lift = walking ? Math.max(0, Math.sin(t) * s) * 1.6 : 0;
        H.limb(g, [s * 1.6, hipY, s * 2.2, -lift], s < 0 ? c : dk, 1.8, 1.6);
      }
      g.beginPath();
      H.ell(g, 0, -12 + bob, K.fat ? 4.8 : 4, 5.3);
      H.fs(g, H.vol(g, 0, -12, 4, 5.3, c), 1.3);
      for (const s of [-1, 1]) {
        const swing = walking ? Math.sin(t) * s * 0.5 : 0;
        const ra = pose === 'attack' ? U.lerp(-2.4, 0.4, ph) : 0;
        const a = s * (0.35 + swing * 0.2) + (s > 0 ? ra * 0.4 : 0);
        H.limb(g, [s * 3.4, -14.5 + bob, s * 3.4 + Math.sin(a) * 6, -14.5 + bob + Math.cos(a) * 6 - lA * 0], c, 1.6, 1.6);
      }
      const hy = -21.5 + bob;
      if (K.ears) {
        for (const s of [-1, 1]) {
          g.beginPath();
          g.moveTo(s * 4, hy - 3); g.quadraticCurveTo(s * 13, hy - 8, s * 12, hy - 1); g.quadraticCurveTo(s * 8, hy + 0.5, s * 4.5, hy + 1.5);
          g.closePath();
          H.fs(g, H.vol(g, s * 8, hy - 3, 5, 4, c), 1.2);
        }
      }
      g.beginPath();
      if (K.rock) {
        g.moveTo(-6.5, hy - 1); g.lineTo(-4, hy - 7.5); g.lineTo(4, hy - 7.5); g.lineTo(6.8, hy - 1); g.lineTo(5, hy + 6); g.lineTo(-5, hy + 6.5);
        g.closePath();
      } else H.ell(g, 0, hy, K.fat ? 7.4 : 6.5, 7);
      H.fs(g, H.vol(g, 0, hy, 6.5, 7, c), 1.4);
      if (K.hair) {
        g.beginPath();
        g.moveTo(-1.8, hy - 6.5); g.lineTo(-3, hy - 9.6);
        g.moveTo(0, hy - 7); g.lineTo(0, hy - 10.3);
        g.moveTo(1.8, hy - 6.5); g.lineTo(3, hy - 9.6);
        g.lineWidth = 0.9; g.strokeStyle = U.shade(c, -0.5); g.stroke();
      }
      if (front) {
        H.eye(g, -2.5, hy - 1.2, 1.9, 2.5, 1.05, 0, 0.2, K.iris, 0.8);
        H.eye(g, 2.5, hy - 1.2, 1.9, 2.5, 1.05, 0, 0.2, K.iris, 0.8);
        if (K.nose) {
          g.beginPath(); g.moveTo(-1, hy + 1.8); g.lineTo(0, hy + 4.5); g.lineTo(1, hy + 1.8);
          H.fs(g, U.shade(c, -0.1), 0.9);
        }
        if (K.mouth) {
          g.beginPath(); g.moveTo(-1.6, hy + 3.4); g.quadraticCurveTo(0, hy + 4.8, 1.6, hy + 3.4);
          g.lineWidth = 0.9; g.strokeStyle = OUT; g.stroke();
        }
        if (!K.rock) H.shine(g, -3.2, hy - 4.4, 1.8, 1.1, -0.6, 0.45);
      } else {
        H.shine(g, -2.4, hy - 3, 2, 1.2, -0.6, 0.25);
      }
      sprout(g, 0, hy - (K.rock ? 7.2 : 6.8), tier, K, sway * 0.7);
    }
    g.restore();
  }

  const VIEW_SIZE = { w: 46, h: 58, ax: 23, ay: 50 };
  /** cached frame for pikmin */
  Art.pikmin = function (kind, tier, view, frame, pose) {
    const key = `pik|${kind}|${tier}|${view}|${frame}|${pose}`;
    const n = pose === 'attack' ? 6 : 8;
    return Art.sprite(key, VIEW_SIZE.w, VIEW_SIZE.h, VIEW_SIZE.ax, VIEW_SIZE.ay, (g) =>
      drawPikmin(g, kind, tier, view, frame / n, pose)
    );
  };
  Art.drawPikmin = drawPikmin;

  /* =================== CAPTAINS =================== */
  const CAPT = (Art.CAPT = {
    olimar: { suit: '#f3e6ad', trim: '#d93a2b', pack: '#d93a2b', glove: '#d93a2b', skin: '#f6cfa4', bulb: '#ff4b3a', nose: 'big', hair: '#8a5a2b', ears: true, scale: 1 },
    louie: { suit: '#3f63b9', trim: '#e9ecf6', pack: '#2e4a8f', glove: '#e9ecf6', skin: '#f2c49a', bulb: '#58a6ff', nose: 'round', hair: '#6b4a2a', chubby: true, scale: 1 },
    president: { suit: '#6b3fa3', trim: '#f2c94c', pack: '#4f2c7a', glove: '#f2c94c', skin: '#f2c8a0', bulb: '#ffd54a', nose: 'round', mustache: '#e9e9e9', bald: true, chubby: true, scale: 1.55 },
    alph: { suit: '#3fa2dc', trim: '#ffffff', pack: '#2b77a6', glove: '#2b77a6', skin: '#f9e1c7', bulb: '#6fd0ff', koppa: true, hairC: '#3570e6', scale: 1.02 },
    brittany: { suit: '#ef7fb3', trim: '#ffffff', pack: '#c45690', glove: '#c45690', skin: '#fbe2cc', bulb: '#ff9bd0', koppa: true, hairC: '#f05ca8', bob: true, scale: 1 },
    charlie: { suit: '#4c9a49', trim: '#f2d04c', pack: '#356f33', glove: '#2f4f2f', skin: '#f2cfae', bulb: '#ffe066', koppa: true, hairC: '#6b4426', mustache: '#6b4426', star: true, burly: true, scale: 1.22 },
  });

  function drawCaptain(g, kind, view, ph, pose) {
    const K = CAPT[kind];
    const t = ph * TAU;
    const walking = pose === 'walk';
    const atk = pose === 'attack' ? Math.sin(ph * Math.PI) : 0;
    const bob = walking ? -Math.abs(Math.sin(t)) * 1.4 : 0;
    const s = K.scale;
    g.save();
    g.scale(s, s);
    const bw = K.burly ? 10 : K.chubby ? 9.5 : 8.2; // body half-width
    const dkS = U.shade(K.suit, -0.35);
    const hipY = -9 + bob;
    if (pose === 'down') {
      // knocked out — lying on back
      g.save();
      g.rotate(-Math.PI / 2 * 0.95);
      g.translate(6, 4);
      drawCaptainUpright(g, K, 'side', 0, 'idle', 0, 0, true);
      g.restore();
      g.restore();
      return;
    }
    drawCaptainUpright(g, K, view, t, pose, bob, atk, false, walking, bw, dkS, hipY);
    g.restore();
  }

  function drawCaptainUpright(g, K, view, t, pose, bob, atk, ko, walking, bw, dkS, hipY) {
    bw = bw || (K.burly ? 10 : K.chubby ? 9.5 : 8.2);
    dkS = dkS || U.shade(K.suit, -0.35);
    hipY = hipY == null ? -9 : hipY;
    const side = view === 'side';
    const front = view === 'front';
    const legSwing = walking ? Math.sin(t) * 0.55 : 0;

    if (side) {
      // backpack
      g.beginPath();
      H.rr(g, -bw - 4.5, -24 + bob, 7, 12, 2.5);
      H.fs(g, H.vol(g, -bw - 1, -18 + bob, 4, 6, K.pack), 1.4);
      // back leg
      H.limb(g, [-1.5, hipY, -1.5 + Math.sin(-legSwing) * 8, hipY + Math.cos(-legSwing) * 8.5], dkS, 3.6, 1.8);
      // body
      g.beginPath();
      g.moveTo(-bw + 1, -22 + bob);
      g.quadraticCurveTo(-bw - 1, -8 + bob, -bw + 2, -6 + bob);
      g.quadraticCurveTo(0, -3 + bob, bw - 1.5, -6 + bob);
      g.quadraticCurveTo(bw + 1.5, -15 + bob, bw - 1, -22 + bob);
      g.quadraticCurveTo(0, -26 + bob, -bw + 1, -22 + bob);
      H.fs(g, H.vol(g, 0, -15 + bob, bw, 9, K.suit), 1.6);
      // suit stripe
      g.beginPath();
      g.moveTo(1.5, -23 + bob); g.lineTo(2.5, -6 + bob);
      g.lineWidth = 1.6; g.strokeStyle = K.trim; g.stroke();
      if (K.star) {
        g.beginPath(); H.star(g, 5, -17 + bob, 2.8, 1.2); H.fs(g, '#ffd54a', 0.8);
      }
      // belt
      g.beginPath(); g.moveTo(-bw + 0.5, -9.5 + bob); g.quadraticCurveTo(0, -7.2 + bob, bw - 0.5, -9.5 + bob);
      g.lineWidth = 1.4; g.strokeStyle = dkS; g.stroke();
      // front leg
      H.limb(g, [1.5, hipY, 1.5 + Math.sin(legSwing) * 8, hipY + Math.cos(legSwing) * 8.5], K.suit, 3.6, 1.8);
      g.beginPath(); H.ell(g, 1.5 + Math.sin(legSwing) * 8 + 1.2, hipY + Math.cos(legSwing) * 8.5, 2.9, 1.7);
      H.fs(g, '#5a3b22', 1.1);
    } else {
      // legs
      for (const sx of [-1, 1]) {
        const lift = walking ? Math.max(0, Math.sin(t) * sx) * 2.2 : 0;
        H.limb(g, [sx * 3.2, hipY, sx * 3.6, -lift - 1], sx < 0 ? K.suit : dkS, 3.6, 1.8);
        g.beginPath(); H.ell(g, sx * 3.8, -lift - 0.5, 2.6, 1.6); H.fs(g, '#5a3b22', 1.1);
      }
      if (!front) {
        g.beginPath(); H.rr(g, -6, -24 + bob, 12, 13, 3);
      }
      g.beginPath();
      g.moveTo(-bw + 1, -22 + bob);
      g.quadraticCurveTo(-bw - 1.5, -8 + bob, -bw + 2, -6 + bob);
      g.quadraticCurveTo(0, -3 + bob, bw - 2, -6 + bob);
      g.quadraticCurveTo(bw + 1.5, -8 + bob, bw - 1, -22 + bob);
      g.quadraticCurveTo(0, -26 + bob, -bw + 1, -22 + bob);
      H.fs(g, H.vol(g, 0, -15 + bob, bw, 9, K.suit), 1.6);
      if (front) {
        g.beginPath(); g.moveTo(0, -23 + bob); g.lineTo(0, -6 + bob);
        g.lineWidth = 1.6; g.strokeStyle = K.trim; g.stroke();
        if (K.star) { g.beginPath(); H.star(g, 3.8, -17 + bob, 2.8, 1.2); H.fs(g, '#ffd54a', 0.8); }
        g.beginPath(); H.circ(g, -3.5, -16 + bob, 1.3); H.fs(g, K.trim, 0.7);
      } else {
        g.beginPath(); H.rr(g, -5.5, -24 + bob, 11, 12, 3);
        H.fs(g, H.vol(g, 0, -18 + bob, 6, 6, K.pack), 1.4);
      }
      g.beginPath(); g.moveTo(-bw + 0.5, -9.5 + bob); g.quadraticCurveTo(0, -7.2 + bob, bw - 0.5, -9.5 + bob);
      g.lineWidth = 1.4; g.strokeStyle = dkS; g.stroke();
    }

    // arms
    const armSw = walking ? Math.sin(t) * 0.6 : 0;
    const armAtk = pose === 'attack' ? U.lerp(-2.8, 0.6, (Math.sin((t / TAU) * Math.PI - Math.PI / 2) + 1) / 2) : null;
    if (side) {
      const a = armAtk != null ? armAtk : -armSw;
      const ax = 2, ay = -20 + bob;
      H.limb(g, [ax, ay, ax + Math.sin(a + 0.25) * 8, ay + Math.cos(a + 0.25) * 8], K.suit, 3.2, 1.8);
      g.beginPath(); H.circ(g, ax + Math.sin(a + 0.25) * 8.5, ay + Math.cos(a + 0.25) * 8.5, 2.2); H.fs(g, K.glove, 1.2);
    } else {
      for (const sx of [-1, 1]) {
        let a = sx * 0.35 + (walking ? Math.sin(t) * sx * 0.25 : 0);
        if (armAtk != null && sx > 0) a = armAtk * 0.7;
        const ax = sx * (bw - 1), ay = -20 + bob;
        H.limb(g, [ax, ay, ax + Math.sin(a) * 8, ay + Math.cos(a) * 8], K.suit, 3.2, 1.8);
        g.beginPath(); H.circ(g, ax + Math.sin(a) * 8.5, ay + Math.cos(a) * 8.5, 2.2); H.fs(g, K.glove, 1.2);
      }
    }

    // HEAD inside helmet
    const hy = -33 + bob;
    const hx = side ? 1.5 : 0;
    const hr = K.koppa ? 8.2 : 8.6;
    // head
    g.save();
    g.translate(hx, hy);
    if (K.koppa) {
      // Koppaite: taller head, big eyes, hair
      g.beginPath(); H.ell(g, 0, 0.5, 5.6, 6.6); H.fs(g, H.vol(g, 0, 0, 5.6, 6.6, K.skin, 0.25, -0.25), 1.2);
      if (front || side) {
        // hair
        g.beginPath();
        if (K.bob) {
          g.moveTo(-6.3, 4); g.quadraticCurveTo(-7.5, -7, 0, -7); g.quadraticCurveTo(7.5, -7, 6.3, 4);
          g.quadraticCurveTo(4, -2, side ? 2 : 0, -3); g.quadraticCurveTo(-3, -3, -6.3, 4);
        } else if (K.mustache) {
          g.moveTo(-5.6, -1); g.quadraticCurveTo(-5, -7.4, 0, -7.2); g.quadraticCurveTo(5, -7.4, 5.6, -1);
          g.quadraticCurveTo(2, -4, -5.6, -1);
        } else {
          g.moveTo(-5.8, 0); g.lineTo(-6.5, -6); g.lineTo(-3, -5.4); g.lineTo(-2.5, -9); g.lineTo(0.5, -5.8); g.lineTo(3, -8.8); g.lineTo(3.6, -5.4); g.lineTo(6.6, -5.6); g.lineTo(5.6, 0);
          g.quadraticCurveTo(1, -3.8, -5.8, 0);
        }
        H.fs(g, K.hairC, 1);
        const ex = side ? 2 : 0;
        if (side) {
          H.eye(g, ex + 0.6, 0.6, 1.4, 2, 0.9, 0.4, 0.1, '#3a3a6a', 0.7);
          H.eye(g, ex + 3.4, 0.8, 1.5, 2.1, 0.95, 0.4, 0.1, '#3a3a6a', 0.7);
        } else {
          H.eye(g, -2.2, 0.8, 1.5, 2.1, 0.95, 0, 0.2, '#3a3a6a', 0.7);
          H.eye(g, 2.2, 0.8, 1.5, 2.1, 0.95, 0, 0.2, '#3a3a6a', 0.7);
        }
        if (K.mustache) {
          g.beginPath(); H.ell(g, ex + 0.8, 4, 3.4, 1.3); H.fs(g, K.mustache, 0.8);
        } else {
          g.beginPath(); g.moveTo(ex - 0.8, 4.4); g.quadraticCurveTo(ex + 0.8, 5.4, ex + 2.2, 4.2); g.lineWidth = 0.7; g.strokeStyle = OUT; g.stroke();
        }
      } else {
        g.beginPath(); H.ell(g, 0, -1.5, 6, 5.5); H.fs(g, K.hairC, 1);
      }
    } else {
      // Hocotatian: round head, big nose
      g.beginPath(); H.ell(g, 0, 0.6, 6.2, 6.2); H.fs(g, H.vol(g, 0, 0, 6, 6, K.skin, 0.25, -0.25), 1.2);
      if (K.ears && (front || side)) {
        const ears = side ? [-1] : [-1, 1];
        for (const sx of ears) {
          g.beginPath(); g.moveTo(sx * 5, -1); g.lineTo(sx * 9.5, -4.5); g.lineTo(sx * 5.8, 2.6); g.closePath();
          H.fs(g, K.skin, 1);
        }
      }
      if (!K.bald) {
        g.beginPath();
        if (front || side) {
          g.moveTo(-5.6, -2); g.quadraticCurveTo(-4, -7.2, 1, -6.4); g.quadraticCurveTo(-2, -4.4, -5.6, -2);
        } else H.ell(g, 0, -1.5, 5.8, 5);
        H.fs(g, K.hair, 0.9);
      }
      if (front || side) {
        const ex = side ? 2.5 : 0;
        if (side) {
          g.beginPath(); H.ell(g, ex + 0.2, -0.6, 1, 1.5); g.fillStyle = OUT; g.fill();
          g.beginPath(); H.ell(g, ex + 2.8, -0.6, 1.05, 1.6); g.fillStyle = OUT; g.fill();
        } else {
          for (const sx of [-1, 1]) { g.beginPath(); H.ell(g, sx * 2.2, -0.8, 1.05, 1.6); g.fillStyle = OUT; g.fill(); }
        }
        // nose
        const nx = side ? ex + 4.6 : 0, ny = side ? 2.2 : 2.6;
        g.beginPath();
        if (K.nose === 'big') H.ell(g, nx, ny, side ? 3.4 : 2.8, 2.6);
        else H.ell(g, nx, ny, 2.2, 2);
        H.fs(g, H.vol(g, nx, ny, 3, 2.5, '#f19a7e', 0.3, -0.3), 1);
        if (K.mustache) {
          g.beginPath(); H.ell(g, nx - (side ? 1 : 0) - 2.6, ny + 2.3, 3, 1.3, 0.2); H.fs(g, K.mustache, 0.8);
          g.beginPath(); H.ell(g, nx - (side ? 1 : 0) + 2.6, ny + 2.3, 3, 1.3, -0.2); H.fs(g, K.mustache, 0.8);
        }
      }
    }
    g.restore();

    // helmet glass dome
    g.beginPath(); H.circ(g, hx, hy, hr + 2.2);
    const gl = g.createRadialGradient(hx - 3, hy - 4, 1, hx, hy, hr + 3);
    gl.addColorStop(0, 'rgba(255,255,255,0.32)');
    gl.addColorStop(0.7, 'rgba(190,230,255,0.14)');
    gl.addColorStop(1, 'rgba(120,180,230,0.38)');
    g.fillStyle = gl; g.fill();
    g.lineWidth = 1.5; g.strokeStyle = 'rgba(37,21,11,0.85)'; g.stroke();
    // collar ring
    g.beginPath(); H.ell(g, hx * 0.5, hy + hr + 0.8, hr * 0.85, 2.4); H.fs(g, H.vol(g, 0, hy + hr, hr, 2.4, K.trim, 0.3, -0.3), 1.2);
    H.shine(g, hx - 4.2, hy - 5.2, 3.2, 1.6, -0.7, 0.75);
    H.shine(g, hx + 5.2, hy + 2.5, 0.9, 1.5, 0.4, 0.4);
    // antenna + bulb
    if (!K.koppa) {
      const sw = Math.sin(t * 1 + 0.6) * (walking ? 1.4 : 0.4);
      g.beginPath(); g.moveTo(hx, hy - hr - 1.8); g.quadraticCurveTo(hx + sw * 0.5, hy - hr - 5, hx + sw, hy - hr - 8.5);
      g.lineWidth = 2.2; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 0.9; g.strokeStyle = '#d8d8d8'; g.stroke();
      const bg = g.createRadialGradient(hx + sw, hy - hr - 10, 0.2, hx + sw, hy - hr - 10, 5);
      bg.addColorStop(0, U.rgba(K.bulb, 0.6)); bg.addColorStop(1, U.rgba(K.bulb, 0));
      g.fillStyle = bg; g.beginPath(); H.circ(g, hx + sw, hy - hr - 10, 5); g.fill();
      g.beginPath(); H.circ(g, hx + sw, hy - hr - 10, 2.3); H.fs(g, H.vol(g, hx + sw, hy - hr - 10, 2.3, 2.3, K.bulb, 0.6, -0.2), 1);
    } else {
      // headlamp
      g.beginPath(); H.ell(g, hx + (side ? 4 : 0), hy - hr - 1, 2.6, 1.8); H.fs(g, K.bulb, 1);
    }
  }

  const CAPT_SIZE = { w: 64, h: 92, ax: 32, ay: 82 };
  Art.captain = function (kind, view, frame, pose) {
    const K = CAPT[kind];
    const sc = K.scale;
    const w = CAPT_SIZE.w * sc, h = CAPT_SIZE.h * sc;
    const key = `cap|${kind}|${view}|${frame}|${pose}`;
    const n = pose === 'attack' ? 6 : 8;
    return Art.sprite(key, w, h, w / 2, CAPT_SIZE.ay * sc, (g) => drawCaptain(g, kind, view, frame / n, pose));
  };
  Art.drawCaptain = drawCaptain;

  /* Pikmin ghost — the classic death spirit */
  Art.ghost = function (kind) {
    return Art.sprite('ghost|' + kind, 30, 40, 15, 30, (g) => {
      const K = PIK[kind] || PIK.red;
      g.globalAlpha = 0.85;
      // wings
      for (const s of [-1, 1]) {
        g.beginPath(); H.ell(g, s * 7, -14, 5, 2.6, s * -0.5); H.fs(g, 'rgba(255,255,255,0.85)', 0.8, 'rgba(120,120,160,0.6)');
      }
      g.beginPath();
      g.moveTo(-4.5, -4); g.quadraticCurveTo(-6.5, -18, 0, -19.5); g.quadraticCurveTo(6.5, -18, 4.5, -4);
      g.quadraticCurveTo(2.5, 0, 1, -2); g.quadraticCurveTo(-1, 1, -2.5, -2); g.quadraticCurveTo(-3.5, 0, -4.5, -4);
      const gr = g.createLinearGradient(0, -20, 0, 0);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, U.rgba(K.body, 0.55));
      H.fs(g, gr, 0.9, 'rgba(90,90,130,0.7)');
      g.beginPath(); H.ell(g, -1.8, -13, 0.9, 1.3); H.ell(g, 1.8, -13, 0.9, 1.3); g.fillStyle = '#3a3a5a'; g.fill();
      // halo-ish leaf
      g.beginPath(); g.moveTo(0, -19.5); g.lineTo(0, -24); g.lineWidth = 1; g.strokeStyle = 'rgba(80,140,80,0.7)'; g.stroke();
      g.beginPath(); H.ell(g, -1.6, -25.5, 2.4, 1.3, -0.6); H.fs(g, 'rgba(160,230,140,0.85)', 0.6, 'rgba(60,100,60,0.6)');
    });
  };
})();
