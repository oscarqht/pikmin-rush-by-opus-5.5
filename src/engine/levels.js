/* Bulborb Rush — level definitions and geometry. */
(function () {
  'use strict';
  const PTD = window.PTD;
  const U = PTD.U;
  const STEP = 4;

  /* ---------------- path geometry ---------------- */
  function catmull(ctrl, segs) {
    const out = [];
    const P = [ctrl[0]].concat(ctrl, [ctrl[ctrl.length - 1]]);
    for (let i = 1; i < P.length - 2; i++) {
      const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
      for (let k = 0; k < segs; k++) {
        const t = k / segs, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    out.push(ctrl[ctrl.length - 1].slice());
    return out;
  }

  function resample(pts, step) {
    const out = [pts[0].slice()];
    let carry = 0;
    for (let i = 1; i < pts.length; i++) {
      let ax = pts[i - 1][0], ay = pts[i - 1][1];
      const bx = pts[i][0], by = pts[i][1];
      let seg = Math.hypot(bx - ax, by - ay);
      while (carry + seg >= step) {
        const need = step - carry;
        const t = need / seg;
        ax = ax + (bx - ax) * t;
        ay = ay + (by - ay) * t;
        out.push([ax, ay]);
        seg = Math.hypot(bx - ax, by - ay);
        carry = 0;
      }
      carry += seg;
    }
    const last = pts[pts.length - 1];
    const lp = out[out.length - 1];
    if (Math.hypot(last[0] - lp[0], last[1] - lp[1]) > 0.5) out.push(last.slice());
    return out;
  }

  class Path {
    constructor(ctrl, idx) {
      this.idx = idx;
      this.ctrl = ctrl;
      this.pts = resample(catmull(ctrl, 24), STEP);
      const n = this.pts.length;
      const a = this.pts[n - 2], b = this.pts[n - 1];
      this.lastSeg = Math.max(0.001, Math.hypot(b[0] - a[0], b[1] - a[1]));
      this.len = (n - 2) * STEP + this.lastSeg;
      this.exit = ctrl[ctrl.length - 1];
      // first on-screen point = entrance marker
      this.entryD = 0;
      for (let i = 0; i < n; i++) {
        const p = this.pts[i];
        if (p[0] > 34 && p[0] < PTD.W - 34 && p[1] > 34 && p[1] < PTD.H - 34) { this.entryD = i * STEP; break; }
      }
    }
    posAt(d, out) {
      out = out || {};
      const pts = this.pts, n = pts.length;
      if (d <= 0) d = 0;
      let i = Math.floor(d / STEP);
      if (i >= n - 1) i = n - 2;
      const segLen = i === n - 2 ? this.lastSeg : STEP;
      const f = Math.min(1, (d - i * STEP) / segLen);
      const a = pts[i], b = pts[i + 1];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const L = Math.hypot(dx, dy) || 1;
      out.x = a[0] + dx * f;
      out.y = a[1] + dy * f;
      out.dx = dx / L;
      out.dy = dy / L;
      return out;
    }
    /** nearest d on this path to point */
    nearest(x, y) {
      let best = 1e9, bi = 0;
      for (let i = 0; i < this.pts.length; i += 2) {
        const p = this.pts[i];
        const dd = (p[0] - x) * (p[0] - x) + (p[1] - y) * (p[1] - y);
        if (dd < best) { best = dd; bi = i; }
      }
      return { d: bi * STEP, dist: Math.sqrt(best) };
    }
  }
  PTD.Path = Path;

  /* ---------------- wave helper ---------------- */
  // g(type, count, gap, delay, path, tier)
  const g = (type, count, gap, delay, path, tier) => ({ type, count, gap: gap || 1, delay: delay || 0, path: path || 0, tier: tier || 0 });

  /* ---------------- LEVEL DEFINITIONS ---------------- */
  const LEVELS = (PTD.LEVELS = [
    {
      id: 'grove',
      name: 'Tranquil Grove',
      subtitle: 'Where it all begins',
      desc: 'A sunny clearing near the Bulborb burrows. The first Onion has landed and a curious column of Pikmin is marching in. Show them who lives here!',
      theme: 'meadow',
      seed: 101,
      gold: 260,
      hpMul: 1,
      spots: 11,
      mapPos: [250, 470],
      paths: [
        [[-60, 330], [90, 330], [200, 250], [330, 210], [460, 270], [500, 400], [430, 520], [520, 610], [690, 600], [780, 480], [730, 350], [800, 230], [950, 180], [1080, 250], [1100, 380], [1020, 470], [1090, 560], [1225, 560]],
      ],
      water: [],
      waves: [
        [g('red', 6, 1.6)],
        [g('red', 8, 1.3), g('yellow', 4, 1.2, 8)],
        [g('yellow', 8, 1.0), g('blue', 6, 1.3, 6)],
        [g('red', 10, 0.9, 0, 0, 1), g('blue', 6, 1.2, 5)],
        [g('winged', 6, 1.4), g('red', 10, 0.9, 4), g('yellow', 6, 0.9, 10, 0, 1)],
        [g('blue', 10, 0.9, 0, 0, 1), g('yellow', 10, 0.7, 6, 0, 1)],
        [g('red', 8, 0.9, 0, 0, 2), g('winged', 8, 1.1, 4), g('blue', 8, 0.8, 10, 0, 1)],
        [g('yellow', 14, 0.6, 0, 0, 1), g('red', 10, 0.8, 6, 0, 2), g('winged', 6, 1, 10, 0, 1)],
        [g('winged', 10, 0.9, 0, 0, 1), g('red', 12, 0.7, 4, 0, 2), g('blue', 10, 0.7, 10, 0, 2)],
        [g('red', 12, 0.6, 0, 0, 1), g('yellow', 12, 0.5, 5, 0, 2), g('olimar', 1, 1, 9), g('blue', 14, 0.6, 12, 0, 2), g('winged', 8, 0.8, 16, 0, 2)],
      ],
    },
    {
      id: 'wood',
      name: 'Awakening Wood',
      subtitle: 'Two trails, one burrow',
      desc: 'Autumn leaves blanket the forest floor. Two Onions have landed, and heavy Purple Pikmin and poisonous Whites have joined the march.',
      theme: 'forest',
      seed: 202,
      gold: 320,
      hpMul: 1.05,
      spots: 13,
      mapPos: [520, 330],
      paths: [
        [[-60, 170], [100, 175], [230, 240], [360, 230], [470, 300], [560, 380], [680, 330], [800, 250], [930, 240], [1010, 330], [960, 440], [1040, 540], [1160, 520], [1225, 430]],
        [[-60, 560], [110, 555], [240, 480], [370, 500], [480, 450], [560, 380], [680, 330], [800, 250], [930, 240], [1010, 330], [960, 440], [1040, 540], [1160, 520], [1225, 430]],
      ],
      water: [],
      waves: [
        [g('red', 8, 1.2, 0, 0), g('yellow', 6, 1.2, 4, 1)],
        [g('blue', 8, 1.0, 0, 0), g('red', 8, 1.0, 2, 1)],
        [g('purple', 3, 2.5, 0, 0), g('yellow', 8, 0.9, 4, 1, 1)],
        [g('winged', 8, 1.0, 0, 0), g('red', 10, 0.8, 3, 1, 1)],
        [g('white', 10, 0.6, 0, 0), g('blue', 10, 0.8, 5, 1, 1)],
        [g('purple', 4, 2, 0, 1), g('yellow', 12, 0.7, 2, 0, 1), g('white', 8, 0.6, 10, 1)],
        [g('red', 10, 0.8, 0, 0, 2), g('blue', 10, 0.8, 0, 1, 2), g('winged', 8, 1, 10, 0, 1)],
        [g('louie', 1, 1, 0, 0), g('white', 12, 0.5, 3, 1, 1), g('purple', 4, 2, 8, 0)],
        [g('winged', 12, 0.8, 0, 1, 1), g('yellow', 14, 0.6, 4, 0, 2), g('purple', 4, 2, 12, 1, 1)],
        [g('red', 16, 0.5, 0, 0, 2), g('blue', 16, 0.5, 0, 1, 2), g('louie', 1, 1, 10, 1)],
        [g('purple', 6, 1.6, 0, 0, 1), g('white', 14, 0.5, 3, 1, 2), g('winged', 10, 0.8, 8, 0, 2)],
        [g('red', 14, 0.5, 0, 0, 2), g('yellow', 14, 0.5, 0, 1, 2), g('olimar', 1, 1, 6, 0), g('louie', 1, 1, 6, 1), g('purple', 4, 2, 12, 0, 2), g('white', 12, 0.4, 16, 1, 2)],
      ],
    },
    {
      id: 'pool',
      name: 'Perplexing Pool',
      subtitle: 'Rock, ice and Koppaites',
      desc: 'Sparkling ponds and sandy trails. The Koppaite explorers have arrived with Rock and Ice Pikmin in tow.',
      theme: 'pool',
      seed: 303,
      gold: 450,
      hpMul: 1.0,
      spots: 14,
      mapPos: [820, 470],
      paths: [
        [[520, -60], [520, 80], [430, 170], [300, 170], [200, 250], [230, 370], [360, 420], [270, 510], [160, 520], [60, 470]],
        [[1340, 300], [1180, 300], [1080, 210], [940, 200], [860, 300], [910, 420], [790, 510], [620, 490], [480, 450], [360, 420], [270, 510], [160, 520], [60, 470]],
      ],
      water: [
        { x: 655, y: 300, rx: 120, ry: 70 },
        { x: 1080, y: 600, rx: 130, ry: 60 },
        { x: 420, y: 640, rx: 110, ry: 45 },
      ],
      waves: [
        [g('blue', 10, 1, 0, 0), g('red', 10, 1, 3, 1)],
        [g('rock', 5, 1.6, 0, 0), g('yellow', 10, 0.8, 2, 1, 1)],
        [g('winged', 10, 0.9, 0, 1, 1), g('blue', 12, 0.7, 4, 0, 1)],
        [g('ice', 10, 0.9, 0, 0), g('purple', 4, 2, 4, 1)],
        [g('rock', 6, 1.4, 0, 1, 1), g('white', 12, 0.5, 3, 0, 1), g('ice', 8, 0.8, 8, 1)],
        [g('alph', 1, 1, 0, 0), g('red', 14, 0.6, 2, 1, 1), g('winged', 10, 0.8, 8, 0, 1)],
        [g('purple', 6, 1.6, 0, 0, 1), g('ice', 12, 0.6, 4, 1, 1), g('yellow', 12, 0.6, 10, 0, 2)],
        [g('rock', 8, 1.2, 0, 1, 2), g('blue', 14, 0.5, 4, 0, 2), g('white', 10, 0.5, 10, 1, 2)],
        [g('brittany', 1, 1, 0, 1), g('ice', 14, 0.5, 1, 1, 1), g('red', 14, 0.5, 4, 0, 2), g('purple', 4, 2, 10, 0, 1)],
        [g('winged', 14, 0.7, 0, 0, 2), g('rock', 8, 1.2, 4, 1, 2), g('alph', 1, 1, 10, 1)],
        [g('louie', 1, 1, 0, 0), g('olimar', 1, 1, 0, 1), g('yellow', 16, 0.4, 3, 0, 2), g('blue', 16, 0.4, 3, 1, 2)],
        [g('charlie', 1, 1, 0, 0), g('purple', 6, 1.4, 2, 1, 2), g('ice', 14, 0.5, 6, 0, 2), g('white', 12, 0.4, 10, 1, 2)],
        [g('rock', 12, 0.9, 0, 0, 2), g('winged', 14, 0.6, 3, 1, 2), g('brittany', 1, 1, 8, 0), g('red', 18, 0.4, 12, 1, 2)],
        [g('alph', 1, 1, 0, 0), g('brittany', 1, 1, 0, 1), g('purple', 8, 1.2, 4, 1, 2), g('ice', 16, 0.4, 6, 0, 2), g('charlie', 1, 1, 10, 0), g('white', 16, 0.4, 12, 1, 2), g('rock', 10, 0.9, 16, 0, 2)],
      ],
    },
    {
      id: 'hollow',
      name: 'Twilight Hollow',
      subtitle: 'The President arrives',
      desc: 'Night falls over the Wistful Wild. Glow Pikmin light the way for the biggest invasion yet, led by the President of Hocotate Freight himself.',
      theme: 'twilight',
      seed: 404,
      gold: 540,
      hpMul: 1.04,
      spots: 15,
      night: true,
      mapPos: [1060, 260],
      paths: [
        [[-60, 260], [110, 260], [230, 180], [380, 170], [480, 260], [440, 380], [540, 470], [700, 460], [800, 560], [960, 610], [1090, 540], [1230, 590]],
        [[1000, -60], [1000, 90], [900, 170], [760, 180], [680, 280], [740, 370], [700, 460], [800, 560], [960, 610], [1090, 540], [1230, 590]],
      ],
      water: [{ x: 230, y: 470, rx: 100, ry: 55 }],
      waves: [
        [g('glow', 10, 1, 0, 0), g('red', 10, 0.9, 3, 1, 1)],
        [g('purple', 4, 2, 0, 0, 1), g('yellow', 12, 0.7, 2, 1, 1), g('glow', 8, 0.9, 6, 0)],
        [g('winged', 12, 0.8, 0, 1, 1), g('white', 14, 0.5, 4, 0, 1)],
        [g('rock', 8, 1.2, 0, 0, 1), g('ice', 12, 0.6, 3, 1, 1), g('louie', 1, 1, 8, 0)],
        [g('glow', 14, 0.6, 0, 1, 1), g('blue', 14, 0.6, 3, 0, 2), g('alph', 1, 1, 10, 1)],
        [g('olimar', 1, 1, 0, 0), g('brittany', 1, 1, 0, 1), g('red', 16, 0.5, 2, 0, 2), g('yellow', 16, 0.5, 2, 1, 2)],
        [g('purple', 6, 1.5, 0, 0, 2), g('rock', 8, 1.1, 3, 1, 2), g('winged', 12, 0.6, 8, 0, 2)],
        [g('charlie', 1, 1, 0, 1), g('glow', 14, 0.5, 2, 0, 2), g('white', 14, 0.4, 6, 1, 2), g('ice', 12, 0.5, 10, 0, 2)],
        [g('alph', 1, 1, 0, 0), g('louie', 1, 1, 0, 1), g('blue', 16, 0.45, 2, 0, 2), g('red', 16, 0.45, 2, 1, 2), g('purple', 4, 2, 10, 0, 2)],
        [g('winged', 14, 0.55, 0, 0, 1), g('winged', 14, 0.55, 4, 1, 1), g('yellow', 12, 0.5, 8, 0, 2)],
        [g('rock', 12, 0.8, 0, 0, 2), g('purple', 8, 1.2, 0, 1, 2), g('brittany', 1, 1, 6, 0), g('charlie', 1, 1, 10, 1)],
        [g('glow', 20, 0.35, 0, 0, 2), g('ice', 20, 0.35, 0, 1, 2), g('olimar', 1, 1, 8, 0), g('alph', 1, 1, 8, 1)],
        [g('purple', 10, 1, 0, 0, 2), g('rock', 12, 0.8, 0, 1, 2), g('white', 20, 0.3, 6, 0, 2), g('yellow', 20, 0.3, 6, 1, 2)],
        [g('charlie', 1, 1, 0, 0), g('charlie', 1, 1, 4, 1), g('glow', 20, 0.4, 2, 0, 2), g('red', 20, 0.4, 2, 1, 2), g('brittany', 1, 1, 8, 0), g('louie', 1, 1, 8, 1)],
        [g('red', 20, 0.4, 0, 0, 2), g('blue', 20, 0.4, 0, 1, 2), g('olimar', 1, 1, 0, 1), g('president', 1, 1, 4, 0), g('louie', 1, 1, 3, 1), g('winged', 14, 0.6, 10, 0, 2), g('purple', 8, 1.2, 14, 1, 2), g('glow', 20, 0.4, 18, 0, 2)],
      ],
    },
  ]);

  /* ---------------- build a playable level instance ---------------- */
  const HUD_ZONES = [
    [0, 0, 300, 104],
    [1100, 0, 1280, 76],
    [0, 600, 280, 720],
  ];
  const inZone = (x, y, m) => HUD_ZONES.some(([a, b, c, d]) => x > a - m && x < c + m && y > b - m && y < d + m);

  PTD.buildLevel = function (def) {
    const lv = Object.assign({}, def);
    lv.paths = def.paths.map((ctrl, i) => new Path(ctrl, i));
    // exits: draw burrow once per unique exit point
    const exitsSeen = [];
    for (const p of lv.paths) {
      const k = p.exit.join(',');
      p.drawExit = !exitsSeen.includes(k);
      if (p.drawExit) exitsSeen.push(k);
    }
    // sample cloud for distance tests
    const samples = [];
    for (const p of lv.paths) for (let i = 0; i < p.pts.length; i += 2) samples.push(p.pts[i]);
    lv.samples = samples;
    lv.distToPath = function (x, y) {
      let best = 1e12;
      for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        const dx = s[0] - x, dy = s[1] - y;
        const dd = dx * dx + dy * dy;
        if (dd < best) best = dd;
      }
      return Math.sqrt(best);
    };
    const inWater = (x, y, m) =>
      (lv.water || []).some((w) => ((x - w.x) / (w.rx + m)) ** 2 + ((y - w.y) / (w.ry + m)) ** 2 < 1);

    // onions next to each unique entrance
    lv.onions = [];
    const entrySeen = [];
    const ONION_COLS = ['#e8392c', '#f9c927', '#2f6fe4'];
    lv.paths.forEach((p, i) => {
      const k = p.ctrl[0].join(',');
      if (entrySeen.includes(k)) return;
      entrySeen.push(k);
      const e = p.posAt(p.entryD + 40);
      const nx = -e.dy, ny = e.dx;
      let best = null;
      for (const sd of [1, -1]) {
        for (const off of [92, 110, 130]) {
          const x = U.clamp(e.x + nx * sd * off, 50, PTD.W - 50), y = U.clamp(e.y + ny * sd * off, 120, PTD.H - 30);
          if (lv.distToPath(x, y) > 70 && !inZone(x, y - 40, 10)) { best = [x, y]; break; }
        }
        if (best) break;
      }
      if (!best) best = [U.clamp(e.x + nx * 100, 50, PTD.W - 50), U.clamp(e.y + ny * 100, 120, PTD.H - 30)];
      lv.onions.push({ x: best[0], y: best[1], col: ONION_COLS[i % 3], path: i });
    });

    // ---- build spots: greedy coverage ----
    const cands = [];
    for (let y = 110; y <= PTD.H - 40; y += 14) {
      for (let x = 50; x <= PTD.W - 50; x += 14) {
        if (inZone(x, y, 14)) continue;
        const d = lv.distToPath(x, y);
        if (d < 64 || d > 96) continue;
        if (inWater(x, y, 30)) continue;
        if (lv.onions.some((o) => U.dist(o.x, o.y, x, y) < 80)) continue;
        if (lv.paths.some((p) => U.dist(p.exit[0], p.exit[1], x, y) < 95)) continue;
        cands.push({ x, y, cover: null });
      }
    }
    const R = 150;
    for (const c of cands) {
      c.cover = [];
      for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        const dx = s[0] - c.x, dy = (s[1] - c.y) / 0.8;
        if (dx * dx + dy * dy < R * R) c.cover.push(i);
      }
    }
    const covered = new Float32Array(samples.length);
    const spots = [];
    for (let k = 0; k < def.spots; k++) {
      let best = null, bs = -1;
      for (const c of cands) {
        if (spots.some((s) => U.dist(s.x, s.y, c.x, c.y) < 96)) continue;
        let sc = 0;
        for (const i of c.cover) sc += 1 / (1 + covered[i] * 1.6);
        if (sc > bs) { bs = sc; best = c; }
      }
      if (!best) break;
      spots.push({ x: best.x, y: best.y });
      for (const i of best.cover) covered[i] += 1;
    }
    spots.sort((a, b) => a.y - b.y);
    lv.spots = spots;

    // ---- decorations ----
    const rng = U.rng(def.seed * 7 + 3);
    const decor = [];
    const R_OF = { bush: 26, rock: 16, pebbles: 10, clover: 12, daisy: 7, mushroom: 12, glowshroom: 12, posy: 14, cap: 18, can: 34, battery: 24, leaf: 14, fern: 22, log: 36, stump: 22, acorn: 8, reeds: 10, tuft: 5 };
    const WEIGHTS = {
      meadow: { bush: 5, rock: 3, pebbles: 3, clover: 5, daisy: 6, mushroom: 2, posy: 1.4, cap: 0.4, battery: 0.3, tuft: 7, stump: 0.5 },
      forest: { bush: 6, rock: 2, fern: 5, mushroom: 4, leaf: 7, acorn: 3, log: 0.6, stump: 1, tuft: 5, daisy: 2, pebbles: 2 },
      pool: { bush: 4, rock: 4, pebbles: 4, reeds: 2, clover: 4, daisy: 5, tuft: 6, cap: 0.4, can: 0.3, mushroom: 1, posy: 0.8 },
      twilight: { bush: 5, rock: 3, fern: 4, glowshroom: 4, mushroom: 2, daisy: 3, tuft: 5, stump: 0.7, pebbles: 2 },
    }[def.theme];
    const kinds = Object.keys(WEIGHTS);
    const tot = kinds.reduce((a, k) => a + WEIGHTS[k], 0);
    const pickKind = () => {
      let r = rng() * tot;
      for (const k of kinds) { r -= WEIGHTS[k]; if (r <= 0) return k; }
      return kinds[0];
    };
    const ok = (x, y, rad) => {
      if (x < -10 || x > PTD.W + 10 || y < 0 || y > PTD.H + 10) return false;
      if (lv.distToPath(x, y) < 36 + rad) return false;
      if (spots.some((s) => U.dist(s.x, s.y, x, y) < 46 + rad)) return false;
      if (inWater(x, y, rad + 8)) return false;
      if (lv.onions.some((o) => U.dist(o.x, o.y - 40, x, y) < 60 + rad)) return false;
      if (lv.paths.some((p) => U.dist(p.exit[0], p.exit[1], x, y) < 80 + rad)) return false;
      if (decor.some((d) => U.dist(d.x, d.y, x, y) < (R_OF[d.k] * d.s + rad) * 0.75)) return false;
      return true;
    };
    // framing bushes along the borders
    const border = [];
    for (let x = 20; x < PTD.W; x += 52) { border.push([x, 26]); border.push([x, PTD.H - 6]); }
    for (let y = 60; y < PTD.H; y += 52) { border.push([12, y]); border.push([PTD.W - 12, y]); }
    for (const [bx, by] of border) {
      const s = rng.range(1.1, 1.6);
      const x = bx + rng.range(-10, 10), y = by + rng.range(-6, 6);
      if (ok(x, y, 26 * s * 0.6)) decor.push({ k: def.theme === 'forest' && rng() < 0.3 ? 'fern' : 'bush', x, y, s });
    }
    // big props first
    const bigs = { meadow: ['cap', 'posy', 'battery', 'stump'], forest: ['log', 'stump', 'acorn', 'log'], pool: ['cap', 'can', 'posy'], twilight: ['can', 'battery', 'stump'] }[def.theme];
    for (const k of bigs) {
      for (let tries = 0; tries < 300; tries++) {
        const x = rng.range(80, PTD.W - 80), y = rng.range(140, PTD.H - 60);
        const s = rng.range(0.9, 1.2);
        if (ok(x, y, R_OF[k] * s)) { decor.push({ k, x, y, s }); break; }
      }
    }
    for (let i = 0; i < 1400 && decor.length < 190; i++) {
      const k = pickKind();
      const s = k === 'tuft' ? rng.range(0.8, 1.4) : rng.range(0.7, 1.25);
      const x = rng.range(0, PTD.W), y = rng.range(20, PTD.H);
      if (ok(x, y, R_OF[k] * s)) decor.push({ k, x, y, s });
    }
    lv.decor = decor;

    // hero start: a point along path 0, 55% of the way
    const hp = lv.paths[0].posAt(lv.paths[0].len * 0.55);
    lv.heroStart = { x: hp.x, y: hp.y };
    return lv;
  };
})();
