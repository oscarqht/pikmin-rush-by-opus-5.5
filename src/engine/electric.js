/* Bulborb Rush — Electric tower family (Anode Beetle line): chain lightning + Arachnode webs.
   Extends PTD.Game.prototype with simulation and drawing for the electric effects. */
(function () {
  'use strict';
  const PTD = window.PTD;
  const U = PTD.U;
  const G = PTD.Game.prototype;
  const TAU = Math.PI * 2;
  const sfx = (n) => PTD.Audio && PTD.Audio.play(n);

  const JUMP_R = 78; // how far a bolt can leap between Pikmin
  const FALLOFF = 0.82; // each jump keeps 82% of the damage

  /** fire a chain-lightning bolt from tower t at target tg */
  G.fireZap = function (t, tg, dmg) {
    const def = t.def;
    const fm = this.fam(t.family);
    const m = this.muzzle(t);
    const jumps = (def.chain || 2) + (fm.chain || 0);
    const stunChance = (def.stunChance || 0) + (fm.shock || 0);
    const hit = new Set();
    const pts = [[m.x, m.y]];
    let cur = tg;
    let d = dmg;
    for (let i = 0; i <= jumps && cur; i++) {
      hit.add(cur.uid);
      pts.push([cur.x, cur.y - (cur.flying ? 34 : 12)]);
      this.damage(cur, d, 'elec', t);
      if (!cur.dead && stunChance > 0 && !cur.def.boss && Math.random() < stunChance) {
        cur.stunT = Math.max(cur.stunT, 0.7);
        this.particle('spark', cur.x, cur.y - 20, '#fff59a');
      }
      for (let k = 0; k < 3; k++) this.particle('spark', cur.x + U.rand(-5, 5), cur.y - U.rand(6, 22) - (cur.flying ? 22 : 0), '#bff4ff');
      // next link: nearest unhit, non-immune enemy close to the current one
      let best = null, bd = JUMP_R;
      for (const e of this.enemies) {
        if (e.dead || e.carried || e.d < 0 || hit.has(e.uid) || e.def.elecImmune) continue;
        if (e.flying && !def.air) continue;
        const dd = U.dist(e.x, e.y, cur.x, cur.y);
        if (dd < bd) { bd = dd; best = e; }
      }
      cur = best;
      d *= FALLOFF;
    }
    this.effect({ kind: 'bolt', pts, t: 0, dur: 0.24, seed: Math.random() * 1000, big: t.tier >= 4 });
    sfx('zap');
  };

  /** Arachnode: string an electric web across the trail ahead of the lead Pikmin */
  G.webAbility = function (t) {
    const tg = this.acquire(t, this.towerRange(t), false);
    if (!tg) return false;
    const ahead = Math.min(tg.path.len - 20, tg.d + 46);
    const p = tg.path.posAt(ahead);
    t.face = p.x >= t.x ? 1 : -1;
    t.atkT = 0.001;
    const fm = this.fam(t.family);
    this.effect({ kind: 'web', x: p.x, y: p.y, r: 40, t: 0, dur: 6, dps: 16 * (1 + fm.dmg), src: t, rot: Math.random() * TAU });
    this.floater('Web!', p.x, p.y - 30, '#bff4ff', 13);
    sfx('zap');
    return true;
  };

  /** per-step web update (called from Game.updateEffects) */
  G.updateWeb = function (f, dt) {
    if (f.t >= f.dur) { f.done = true; return; }
    for (const e of this.enemies) {
      if (e.dead || e.carried || e.flying || e.d < 0) continue;
      const dx = e.x - f.x, dy = (e.y - f.y) / 0.6;
      if (dx * dx + dy * dy > f.r * f.r) continue;
      if (!e.def.slowImmune) {
        const cur = e.slowT > 0 ? e.slowF : 1;
        e.slowF = Math.min(cur, e.def.boss ? 0.75 : 0.45);
        e.slowT = Math.max(e.slowT, 0.25);
      }
      this.damage(e, f.dps * dt, 'elec', f.src, true);
      if (Math.random() < dt * 6) this.particle('spark', e.x + U.rand(-6, 6), e.y - U.rand(4, 16), '#bff4ff');
    }
  };

  /* ---------------- drawing ---------------- */
  function jagged(ctx, pts, seed, amp) {
    const r = U.rng(Math.floor(seed));
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
      const L = Math.hypot(bx - ax, by - ay) || 1;
      const nx = -(by - ay) / L, ny = (bx - ax) / L;
      const segs = Math.max(2, Math.round(L / 14));
      for (let k = 1; k < segs; k++) {
        const f = k / segs;
        const o = r.range(-amp, amp);
        ctx.lineTo(ax + (bx - ax) * f + nx * o, ay + (by - ay) * f + ny * o);
      }
      ctx.lineTo(bx, by);
    }
  }

  G.drawBoltFx = function (ctx, f) {
    const k = f.t / f.dur;
    const flick = Math.floor(f.t * 40);
    ctx.save();
    ctx.globalAlpha = 1 - k * 0.7;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.globalCompositeOperation = 'lighter';
    jagged(ctx, f.pts, f.seed + flick * 13, f.big ? 9 : 7);
    ctx.strokeStyle = 'rgba(90,200,255,0.55)'; ctx.lineWidth = f.big ? 9 : 7; ctx.stroke();
    ctx.strokeStyle = 'rgba(200,245,255,0.95)'; ctx.lineWidth = f.big ? 3.2 : 2.4; ctx.stroke();
    // secondary thin filament
    jagged(ctx, f.pts, f.seed + flick * 7 + 99, 10);
    ctx.strokeStyle = 'rgba(255,250,170,0.7)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 1; i < f.pts.length; i++) {
      PTD.Art.blit(ctx, PTD.Art.glow('#8fe6ff', 14), f.pts[i][0], f.pts[i][1], false, 1, 0.8 * (1 - k));
    }
    ctx.restore();
  };

  G.drawWebFx = function (ctx, f) {
    const fade = f.t < 0.25 ? f.t / 0.25 : f.t > f.dur - 0.6 ? Math.max(0, (f.dur - f.t) / 0.6) : 1;
    const R = f.r * (f.t < 0.25 ? U.easeOutBack(f.t / 0.25) : 1);
    const pulse = 0.7 + 0.3 * Math.sin(this.time * 14 + f.rot);
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(1, 0.6);
    ctx.globalAlpha = fade;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU);
    ctx.fillStyle = 'rgba(120,220,255,0.12)'; ctx.fill();
    ctx.lineCap = 'round';
    const spokes = 8;
    ctx.strokeStyle = `rgba(190,245,255,${0.85 * pulse})`;
    ctx.lineWidth = 1.6;
    for (let i = 0; i < spokes; i++) {
      const a = f.rot + (i / spokes) * TAU;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R); ctx.stroke();
    }
    for (const rk of [0.35, 0.62, 0.9]) {
      ctx.beginPath();
      for (let i = 0; i <= spokes; i++) {
        const a = f.rot + (i / spokes) * TAU;
        const rr = R * rk * (i % 2 ? 0.94 : 1);
        if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.stroke();
    }
    // crackle
    if (Math.random() < 0.5) {
      const a = Math.random() * TAU, rr = Math.random() * R;
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(255,255,190,0.9)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); ctx.lineTo(Math.cos(a + 0.4) * rr * 0.6, Math.sin(a + 0.4) * rr * 0.6); ctx.stroke();
    }
    ctx.restore();
  };
})();
