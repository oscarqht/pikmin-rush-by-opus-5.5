/* Headless balance simulation: node tools/sim.js [difficulty] [strategy]
   Loads the pure-logic modules with a stubbed window and plays each level with a simple bot. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const ctx = { window: {}, console, Math, performance: { now: () => Date.now() } };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['js/core.js', 'js/data.js', 'js/levels.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
ctx.PTD.Art = { PLAT_H: [0, 12, 18, 24, 26] };
vm.runInContext(fs.readFileSync(path.join(root, 'js/game.js'), 'utf8'), ctx, { filename: 'game.js' });
const PTD = ctx.PTD;

const diff = process.argv[2] || 'normal';
const strat = process.argv[3] || 'mixed';

function smartBot(g) {
  if (!g._plan) {
    // rank spots by path coverage
    const cov = (s) => g.lv.samples.filter((p) => Math.hypot(p[0] - s.x, (p[1] - s.y) / 0.8) < 150).length;
    g._plan = g.spots.slice().sort((a, b) => cov(b) - cov(a));
  }
  const order = ['groink1', 'den1', 'hog1', 'cannon1', 'groink1', 'hog1', 'den1', 'cannon1', 'groink1', 'hog1', 'groink1', 'cannon1', 'hog1', 'den1', 'groink1'];
  const elites = { groink3: 'manatlegs', den3: 'bulbear', hog3: 'withering', cannon3: 'decorated' };
  const nBuilt = g.towers.length;
  const want = Math.min(g._plan.length, 5 + Math.floor(g.waveIdx * 0.6));
  const upTier = g.towers.length ? Math.min(...g.towers.map((t) => t.tier)) : 0;
  if (g.towers.length >= 5 && upTier < 2 + Math.floor(g.waveIdx / 4)) { /* prefer upgrades */ }
  else
  if (nBuilt < want) {
    const id = order[nBuilt % order.length];
    const s = g._plan.find((x) => !x.tower);
    if (s && g.gold >= PTD.TOWERS[id].cost) g.build(s, id);
    return;
  }
  let best = null;
  for (const t of g.towers) {
    const n = elites[t.id] || t.def.next[0];
    if (!n) continue;
    const c = PTD.TOWERS[n].cost;
    if (!best || c < best.c) best = { t, n, c };
  }
  if (best && g.gold >= best.c) { g.upgrade(best.t, best.n); return; }
  // can't afford upgrade: build if more spots remain and gold idle
  const s = g._plan.find((x) => !x.tower);
  const id = order[nBuilt % order.length];
  if (s && g.gold >= PTD.TOWERS[id].cost + 40 && nBuilt < g._plan.length) g.build(s, id);
}

function bot(g) {
  if (strat === 'smart') return smartBot(g);
  // build plan: cycle families, prefer spots with best coverage order (spots already sorted by y — use index)
  const fams = strat === 'groink' ? ['groink1'] : ['groink1', 'den1', 'hog1', 'groink1', 'cannon1', 'hog1'];
  const empty = g.spots.filter((s) => !s.tower);
  // upgrade first if a tower can be upgraded cheaply
  const ups = [];
  for (const t of g.towers) for (const n of t.def.next) ups.push({ t, n, cost: PTD.TOWERS[n].cost });
  ups.sort((a, b) => a.cost - b.cost);
  if (empty.length && g.towers.length < 6 + g.waveIdx) {
    const id = fams[g.towers.length % fams.length];
    if (g.gold >= PTD.TOWERS[id].cost) {
      // pick the spot closest to the middle of the paths
      const s = empty[Math.floor(empty.length / 2)];
      g.build(s, id);
      return;
    }
  } else if (ups.length && g.gold >= ups[0].cost) {
    g.upgrade(ups[0].t, ups[0].n);
  }
}

const results = [];
PTD.LEVELS.forEach((lv, i) => {
  const g = new PTD.Game(lv, { difficulty: diff });
  let t = 0;
  const dt = 1 / 30;
  g.callWave();
  let snag = 0;
  while (!g.over && t < 1800) {
    bot(g);
    // use spells on the most advanced enemy
    if (g.spells.snagret.cd <= 0 && g.enemies.length > 6) {
      const e = g.enemies.reduce((a, b) => (b.d > a.d ? b : a));
      g.castSpell('snagret', e.x, e.y); snag++;
    }
    if (g.spells.reinforce.cd <= 0 && g.enemies.length > 3) {
      const e = g.enemies.reduce((a, b) => (b.d > a.d ? b : a));
      if (e.d > 0) g.castSpell('reinforce', e.x, e.y);
    }
    const wi = g.waveIdx;
    g.step(dt);
    t += dt;
    if (process.env.TRACE == i && g.waveIdx !== wi) console.log(`  wave ${g.waveIdx} start t=${Math.round(t)} lives=${g.lives} gold=${Math.round(g.gold)} towers=${g.towers.map((x) => x.id).join(',')} alive=${g.enemies.length}`);
  }
  results.push({ level: lv.name, result: g.result, lives: g.lives, wave: g.waveIdx + '/' + g.waveTotal, towers: g.towers.map((x) => x.id).join(','), gold: Math.round(g.gold), time: Math.round(t), heroLv: g.hero.level, spots: g.spots.length, kills: g.stats.kills });
});
console.table(results);
