import { PTD, U } from './core';

let _mapCanvas: HTMLCanvasElement | null = null;
let _mapRes = 0;

export function paintMap(): HTMLCanvasElement {
  const Art = PTD.Art;
  const H = Art.H;
  const OUT = Art.OUT;
  const W = PTD.W, Hh = PTD.H, R = Art.RES;
  const c = Art.canvas(W * R, Hh * R);
  const g = c.getContext('2d')!;
  g.scale(R, R);
  g.lineJoin = 'round'; g.lineCap = 'round';
  const rng = U.rng(77);
  // sea parchment
  const bg = g.createRadialGradient(W / 2, Hh / 2, 100, W / 2, Hh / 2, 800);
  bg.addColorStop(0, '#cfe6e6'); bg.addColorStop(1, '#8fb9c4');
  g.fillStyle = bg; g.fillRect(0, 0, W, Hh);
  g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 2;
  for (let i = 0; i < 60; i++) {
    const x = rng() * W, y = rng() * Hh;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 8, y - 5, x + 16, y); g.quadraticCurveTo(x + 24, y + 5, x + 32, y); g.stroke();
  }
  // landmass
  const land = (ctx: CanvasRenderingContext2D, k: number) => H.wobble(ctx, W / 2 + 20, Hh / 2 + 20, 560 * k, 300 * k, U.rng(5), 22, 0.12);
  g.beginPath(); land(g, 1.04); g.fillStyle = '#e8d6a6'; g.fill();
  g.lineWidth = 3; g.strokeStyle = '#8a6a3c'; g.stroke();
  g.beginPath(); land(g, 0.98);
  const lg = g.createRadialGradient(W / 2, Hh / 2, 50, W / 2, Hh / 2, 600);
  lg.addColorStop(0, '#a8d26a'); lg.addColorStop(1, '#79b04a');
  g.fillStyle = lg; g.fill();
  g.lineWidth = 2.5; g.strokeStyle = OUT; g.stroke();
  g.save(); g.beginPath(); land(g, 0.98); g.clip();
  for (let i = 0; i < 300; i++) {
    g.fillStyle = U.rgba(rng() < 0.5 ? '#5f9a3a' : '#c6e486', 0.12);
    g.beginPath(); H.ell(g, rng() * W, rng() * Hh, rng.range(20, 60), rng.range(10, 30)); g.fill();
  }
  // autumn forest region
  for (let i = 0; i < 26; i++) {
    const x = 430 + rng.range(-120, 140), y = 300 + rng.range(-80, 60);
    tree(g, x, y, rng.range(0.7, 1.1), rng.pick(['#e4782b', '#d6452a', '#f2b33a', '#6aa53f']));
  }
  // lake
  g.beginPath(); H.wobble(g, 860, 520, 110, 55, U.rng(9), 12, 0.15);
  g.fillStyle = '#6fbfe6'; g.fill(); g.lineWidth = 2.5; g.strokeStyle = OUT; g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2;
  for (let i = 0; i < 6; i++) { const x = 800 + i * 22, y = 510 + (i % 2) * 14; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 6, y - 4, x + 12, y); g.stroke(); }
  // twilight hills (darker) top-right
  g.fillStyle = 'rgba(40,60,110,0.25)';
  g.beginPath(); H.ell(g, 1050, 250, 170, 110); g.fill();
  for (let i = 0; i < 4; i++) {
    const x = 1110 + i * 46, y = 150 + (i % 2) * 22;
    g.beginPath(); g.moveTo(x - 40, y + 30); g.lineTo(x, y - 30); g.lineTo(x + 40, y + 30); g.closePath();
    g.fillStyle = '#8c8fa6'; g.fill(); g.lineWidth = 2.2; g.strokeStyle = OUT; g.stroke();
    g.beginPath(); g.moveTo(x - 12, y - 12); g.lineTo(x, y - 30); g.lineTo(x + 12, y - 12); g.closePath(); g.fillStyle = '#ffffff'; g.fill();
  }
  // meadow flowers
  for (let i = 0; i < 40; i++) {
    const x = 250 + rng.range(-110, 110), y = 480 + rng.range(-60, 60);
    g.fillStyle = rng.pick(['#ffffff', '#ffe04a', '#ff8fb8']);
    g.beginPath(); H.circ(g, x, y, 2.4); g.fill();
  }
  // scattered trees
  for (let i = 0; i < 30; i++) {
    const x = rng.range(150, 1150), y = rng.range(150, 600);
    if (U.dist(x, y, 860, 520) < 140) continue;
    tree(g, x, y, rng.range(0.6, 0.9), '#4f9a3a');
  }
  g.restore();
  // onion landing site & giant objects
  Art.drawOnion(g, 120, 470, 0.5, '#e8392c', 0);
  Art.Props.bottleCap(g, 700, 610, 1.2);
  Art.Props.can(g, 600, 200, 1);
  // dotted trail between levels
  const pts = PTD.LEVELS.map((l: any) => l.mapPos);
  g.setLineDash([2, 10]);
  g.lineWidth = 6; g.strokeStyle = '#6b4424';
  g.beginPath(); g.moveTo(140, 470);
  pts.forEach((p: any, i: number) => {
    const prev = i ? pts[i - 1] : [140, 470];
    g.quadraticCurveTo((prev[0] + p[0]) / 2, Math.min(prev[1], p[1]) - 60, p[0], p[1]);
  });
  g.stroke();
  g.setLineDash([]);
  // compass
  g.save(); g.translate(1170, 600);
  g.beginPath(); H.circ(g, 0, 0, 40); g.fillStyle = 'rgba(255,246,220,0.85)'; g.fill(); g.lineWidth = 2.5; g.strokeStyle = '#6b4424'; g.stroke();
  for (let i = 0; i < 4; i++) {
    g.save(); g.rotate((i * Math.PI) / 2);
    g.beginPath(); g.moveTo(0, -34); g.lineTo(7, 0); g.lineTo(-7, 0); g.closePath();
    g.fillStyle = i === 0 ? '#c0392b' : '#6b4424'; g.fill();
    g.restore();
  }
  H.text(g, 'N', 0, -48, 14, '#6b4424', { stroke: false, shadow: false });
  g.restore();
  // title cartouche
  g.save();
  g.translate(W / 2, 64);
  g.beginPath(); H.rr(g, -210, -30, 420, 56, 12);
  g.fillStyle = 'rgba(255,246,220,0.92)'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#6b4424'; g.stroke();
  H.text(g, 'The Distant Planet', 0, -2, 30, '#7a3f12', { stroke: false, shadow: false });
  g.restore();
  // parchment edge vignette
  const vg = g.createRadialGradient(W / 2, Hh / 2, Hh * 0.45, W / 2, Hh / 2, W * 0.7);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(80,50,10,0.45)');
  g.fillStyle = vg; g.fillRect(0, 0, W, Hh);
  return c;

  function tree(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, col: string) {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 10 * s); ctx.lineWidth = 3 * s; ctx.strokeStyle = '#5a3a1e'; ctx.stroke();
    ctx.beginPath(); H.circ(ctx, x, y - 16 * s, 10 * s);
    ctx.fillStyle = H.vol(ctx, x, y - 16 * s, 10 * s, 10 * s, col, 0.3, -0.3); ctx.fill();
    ctx.lineWidth = 1.8; ctx.strokeStyle = OUT; ctx.stroke();
  }
}

export function renderMap(ctx: CanvasRenderingContext2D) {
  const Art = PTD.Art;
  if (!_mapCanvas || _mapRes !== Art.RES) {
    _mapCanvas = paintMap();
    _mapRes = Art.RES;
    _mapCanvas.addEventListener('contextlost', () => { _mapCanvas = null; });
  }
  ctx.drawImage(_mapCanvas, 0, 0, PTD.W, PTD.H);
  // marching pikmin on the trail (little animation)
  const t = performance.now() / 1000;
  for (let i = 0; i < 5; i++) {
    const k = ((t * 0.04 + i * 0.03) % 1);
    const pts = [[140, 470]].concat(PTD.LEVELS.map((l: any) => l.mapPos));
    const seg = Math.min(pts.length - 2, Math.floor(k * (pts.length - 1)));
    const f = k * (pts.length - 1) - seg;
    const a = pts[seg], b = pts[seg + 1];
    const cx = (a[0] + b[0]) / 2, cy = Math.min(a[1], b[1]) - 60;
    const x = (1 - f) * (1 - f) * a[0] + 2 * (1 - f) * f * cx + f * f * b[0];
    const y = (1 - f) * (1 - f) * a[1] + 2 * (1 - f) * f * cy + f * f * b[1];
    const s = Art.pikmin(['red', 'yellow', 'blue', 'purple', 'white'][i], 0, 'side', Math.floor(t * 10 + i) % 8, 'walk');
    Art.blit(ctx, s, x, y + 4, b[0] < a[0], 0.8);
  }
}

export function makeDemo(): any {
  const g = new PTD.Game(PTD.LEVELS[0], { difficulty: 'casual', seen: { red: 1, yellow: 1, blue: 1, winged: 1, olimar: 1, purple: 1, white: 1 } });
  g.demo = true;
  g.gold = 99999;
  g.initUI();
  const wasMuted = PTD.Audio.muted;
  PTD.Audio.muted = true;
  const picks = [['groink1', 1], ['den2', 3], ['hog2', 4], ['cannon1', 6], ['groink3', 8], ['snitch', 2], ['withering', 9]];
  for (const [id, i] of picks) {
    const s = g.spots[Number(i) % g.spots.length];
    if (!s || s.tower) continue;
    const fam = PTD.TOWERS[id].family;
    const base = { groink: 'groink1', den: 'den1', hog: 'hog1', cannon: 'cannon1' }[fam];
    g.build(s, base);
    let t = s.tower;
    const chain: string[] = [];
    let cur = id;
    while (cur !== base) {
      const prev = Object.keys(PTD.TOWERS).find((k) => PTD.TOWERS[k].next.includes(cur));
      chain.unshift(cur as string);
      cur = prev as string;
    }
    for (const c of chain) g.upgrade(t, c);
    t.buildT = 1;
  }
  g.lives = 9999;
  g.particles.length = 0;
  PTD.Audio.muted = wasMuted;
  return g;
}

export function updateDemo(g: any, dt: number, demoT: number) {
  if (!g) return;
  const mute = PTD.Audio.muted;
  PTD.Audio.muted = true; // demo is silent
  if (g.spawners.length === 0 && g.enemies.length < 30) {
    const types = ['red', 'yellow', 'blue', 'red', 'winged', 'purple', 'white'];
    const t = types[Math.floor(demoT / 4) % types.length];
    g.spawners.push({ type: t, tier: Math.floor(Math.random() * 3), path: 0, count: 6, gap: 0.8, t: 0, spawned: 0 });
    if (Math.random() < 0.15) g.spawners.push({ type: U.pick(['olimar', 'louie', 'alph', 'brittany']), tier: 0, path: 0, count: 1, gap: 1, t: -3, spawned: 0 });
  }
  g.started = true;
  g.nextWaveT = 1;
  g.waveIdx = 0;
  g.lives = 9999;
  g.over = false;
  g.update(dt);
  PTD.Audio.muted = mute;
}

export function drawAlmanacPreview(cv: HTMLCanvasElement, en: any, t: number) {
  const TAU = Math.PI * 2;
  const Art = PTD.Art;
  const g = cv.getContext('2d');
  if (!g) return;
  g.setTransform(2, 0, 0, 2, 0, 0);
  g.clearRect(0, 0, 220, 180);
  g.lineJoin = 'round'; g.lineCap = 'round';
  // backdrop
  const bg = g.createRadialGradient(110, 80, 10, 110, 90, 140);
  bg.addColorStop(0, '#fff6dc'); bg.addColorStop(1, '#e8cf98');
  g.fillStyle = bg; g.fillRect(0, 0, 220, 180);
  g.fillStyle = '#9ad35e'; g.beginPath(); g.ellipse(110, 160, 120, 34, 0, 0, TAU); g.fill();
  g.fillStyle = 'rgba(25,30,10,0.25)'; g.beginPath(); g.ellipse(110, 150, 50, 12, 0, 0, TAU); g.fill();
  const ph = (t * 0.8) % 1;
  const atk = (t % 3) > 2.4 ? ((t % 3) - 2.4) / 0.6 : 0;
  g.save();
  g.translate(110, 150);
  const [cat, id] = en.por.split(':');
  if (cat === 'cre') {
    const fit: Record<string, number> = { manatlegs: 1.35, snitch: 1.5, puffy: 1.5, decorated: 1.6, groink: 1.9, fiery: 1.9, withering: 1.9, larva: 1.9, wolly: 1.9 };
    const f = fit[id] || 1.7;
    g.scale(f, f);
    if (id === 'snitch') g.translate(0, 30);
    Art.drawCreatureAt(g, id, 1, ph, atk);
  } else if (cat === 'borb') {
    const K = Art.BORB[id];
    const fit = 1.3 / K.scale * 0.95;
    g.scale(fit, fit);
    Art.drawBulborb(g, K, ph, atk > 0 ? Math.sin(atk * Math.PI) : 0, false, id === 'emperor' && atk > 0 ? Math.sin(atk * Math.PI) : 0);
  } else if (cat === 'bread') {
    g.scale(2.6, 2.6);
    Art.drawBreadbug(g, ph, true, 0, 1);
  } else if (cat === 'pik') {
    const [type] = id.split('.');
    g.scale(2.6, 2.6);
    const tier = Math.floor(t / 2) % 3;
    Art.drawPikmin(g, type, tier, Math.floor(t / 2.5) % 2 ? 'front' : 'side', ph, 'walk');
  } else if (cat === 'cap') {
    const s = Art.CAPT[id].scale;
    g.scale(2.2 / Math.sqrt(s), 2.2 / Math.sqrt(s));
    Art.drawCaptain(g, id, Math.floor(t / 2.5) % 2 ? 'front' : 'side', ph, 'walk');
  } else if (cat === 'spell') {
    if (id === 'snagret') {
      const k = (t % 2.5) / 2.5;
      Art.drawSnagret(g, 0, 0, Math.min(1, k * 4), Math.max(0, Math.sin(k * Math.PI * 4)) * 0.8, 1);
    } else {
      g.scale(2.6, 2.6);
      Art.drawBulborb(g, Art.BORB.reinf, ph, 0, true, 0);
    }
  }
  g.restore();
}
