/* Headless balance/smoke test: bundles the engine with esbuild, stubs the DOM, and lets a
   simple auto-player try every level. Usage: node tests/sim-levels.mjs [--meta] [--level id] */
import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const META = args.includes('--meta');
const ONLY = args.includes('--level') ? args[args.indexOf('--level') + 1] : null;
const DIFF = args.includes('--diff') ? args[args.indexOf('--diff') + 1] : 'normal';

// ---- minimal browser stubs ----
const noop = () => {};
const ctxStub = new Proxy({}, { get: (t, k) => (k in t ? t[k] : typeof k === 'string' && k.startsWith('create') ? () => ({ addColorStop: noop }) : noop), set: (t, k, v) => ((t[k] = v), true) });
const canvasStub = () => ({ width: 1, height: 1, getContext: () => ctxStub, addEventListener: noop });
const store = {};
globalThis.window = globalThis;
globalThis.document = { createElement: canvasStub };
globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); } };

const out = await build({
  entryPoints: [path.join(root, 'src/engine/index.ts')],
  bundle: true, write: false, format: 'esm', platform: 'neutral', logLevel: 'error',
});
const code = out.outputFiles[0].text;
await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
const PTD = globalThis.PTD;
PTD.Audio.play = noop;

let failures = 0;
const check = (cond, msg) => { if (!cond) { failures++; console.log('  ✗ ' + msg); } };

// ---- geometry checks ----
for (const def of PTD.LEVELS) {
  if (ONLY && def.id !== ONLY) continue;
  const lv = PTD.buildLevel(def);
  check(lv.spots.length === def.spots, `${def.id}: got ${lv.spots.length}/${def.spots} build spots`);
  for (const kind of ['tides', 'ice', 'vents', 'dark']) {
    for (const z of lv.zones[kind]) {
      check(z.x > 0 && z.x < PTD.W && z.y > 0 && z.y < PTD.H, `${def.id}: ${kind} zone off-screen at ${Math.round(z.x)},${Math.round(z.y)}`);
      if (kind !== 'dark') check(lv.distToPath(z.x, z.y) < 6, `${def.id}: ${kind} zone not on the trail`);
    }
  }
  for (const w of def.water || []) {
    check(lv.distToPath(w.x, w.y) > Math.min(w.rx, w.ry) + 30, `${def.id}: water at ${w.x},${w.y} touches the trail`);
  }
  for (const wv of def.waves) for (const g of wv) check(PTD.ENEMIES[g.type] && lv.paths[g.path], `${def.id}: bad wave group ${g.type}/${g.path}`);
}

// ---- auto-player ----
const FAMS = ['groink1', 'den1', 'hog1', 'cannon1', 'beetle1'];
function fullMods() {
  // a plausible 24-star build: rank 3 in four tracks (16 stars) + rank 4 in one (6) + 2 spare
  const save = PTD.Save.load();
  save.upgrades = { groink: 3, hog: 3, beetle: 4, cannon: 3, spells: 2 };
  save.stars = Object.fromEntries(PTD.LEVELS.map((l) => [l.id, 3]));
  return PTD.Progress.mods();
}

function play(def, opts) {
  const g = new PTD.Game(def, opts);
  g.initUI();
  const leaks = {};
  g.on('leak', (e) => { const k = e.type + (e.def.pik ? '.' + e.tier : ''); leaks[k] = (leaks[k] || 0) + e.def.lives; });
  let k = 0, tAct = 0;
  // order spots by how much trail they cover (closest to the trail middle first)
  const spots = g.spots.slice().sort((a, b) => g.lv.distToPath(a.x, a.y) - g.lv.distToPath(b.x, b.y));
  for (let i = 0; i < 20000 && !g.over; i++) {
    g.update(0.1);
    tAct += 0.1;
    if (tAct < 0.5) continue;
    tAct = 0;
    // spend gold: build on empty spots, then upgrade the lowest tier tower
    const empty = spots.find((s) => !s.tower);
    const want = FAMS[k % FAMS.length];
    if (empty && g.gold >= g.towerCost(want) && g.towers.length < 6 + g.waveIdx) { g.build(empty, want); k++; continue; }
    const up = g.towers.filter((t) => t.def.next.length).sort((a, b) => a.tier - b.tier)[0];
    if (up) { const nx = up.def.next[up.uid % up.def.next.length]; if (g.gold >= g.towerCost(nx)) { g.upgrade(up, nx); continue; } }
    if (empty && g.gold >= g.towerCost(want)) { g.build(empty, want); k++; }
    // cast spells at the lead enemy
    const lead = g.enemies.filter((e) => e.d > 0).sort((a, b) => b.d / b.path.len - a.d / a.path.len)[0];
    if (lead && g.spells.snagret.cd <= 0) g.castSpell('snagret', lead.x, lead.y);
    if (lead && g.spells.reinforce.cd <= 0) g.castSpell('reinforce', lead.x, lead.y);
    if (g.canCallWave() && !g.started) g.callWave();
  }
  return { win: g.result === 'win', lives: g.lives, wave: g.waveIdx, total: g.waveTotal, kills: g.stats.kills, heroLv: g.hero.level, heroXp: Math.round(g.hero.totalXp), time: Math.round(g.time), leaks, towers: g.towers.map((t) => t.id).join(',') };
}

const REAL = args.includes('--real');
/** stars a player would plausibly have before level i (≈2.4 per cleared level), spent cheapest-first */
function realMods(i) {
  const save = PTD.Save.load();
  save.stars = {};
  PTD.LEVELS.slice(0, i).forEach((l, k) => { save.stars[l.id] = k % 2 ? 2 : 3; });
  save.upgrades = {};
  const order = ['beetle', 'groink', 'hog', 'cannon', 'spells', 'den'];
  for (let n = 0; n < 40; n++) { const tr = order[n % order.length]; if (PTD.Progress.canBuy(tr)) PTD.Progress.buy(tr); }
  return PTD.Progress.mods();
}
const mods = META ? fullMods() : {};
console.log(`\nAuto-player (${DIFF}${REAL ? ', realistic progression' : META ? ', 24-star tree, hero lv 5' : ', no upgrades, hero lv 1'})`);
for (const [i, def] of PTD.LEVELS.entries()) {
  if (ONLY && def.id !== ONLY) continue;
  const opts = REAL
    ? { difficulty: DIFF, mods: realMods(i), heroXp: 4000 * i, heroSkills: { tongue: Math.min(3, i >> 1), quake: Math.min(3, (i + 1) >> 2), hide: Math.min(3, i >> 2) } }
    : { difficulty: DIFF, mods, heroXp: META ? 7000 : 0, heroSkills: META ? { tongue: 2, quake: 2, hide: 1 } : {} };
  const r = play(def, opts);
  console.log(`  ${def.id.padEnd(9)} ${r.win ? 'WIN ' : 'LOSE'} lives ${String(r.lives).padStart(2)}  wave ${r.wave}/${r.total}  kills ${r.kills}  hero lv ${r.heroLv} (${r.heroXp} xp)  ${r.time}s`);
  if (process.env.VERBOSE) console.log('    leaks', JSON.stringify(r.leaks));
}
if (failures) { console.log(`\n${failures} geometry/data check(s) failed`); process.exit(1); }
console.log('\nAll geometry/data checks passed');
