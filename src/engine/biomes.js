/* Bulborb Rush — biome mechanics for the expansion levels.
   beach:    tide pools rise and fall; flooded trail slows Pikmin (Blues swim faster)
   tundra:   ice patches make Pikmin slide faster
   volcanic: lava vents erupt and burn anything standing on them (your creatures too)
   cave:     dark zones shorten the range of towers built inside them */
(function () {
  'use strict';
  const PTD = window.PTD;
  const U = PTD.U;
  const G = PTD.Game.prototype;
  const TAU = Math.PI * 2;
  const sfx = (n) => PTD.Audio && PTD.Audio.play(n);

  const VENT_ON = 2.2; // seconds a vent erupts
  const VENT_WARN = 1.4; // seconds of rumbling before an eruption

  /** Turn path-relative zone specs ({p, at, ...}) into world positions. Called by buildLevel. */
  PTD.resolveZones = function (lv, def) {
    const b = def.biome || {};
    const place = (z) => {
      const path = lv.paths[z.p || 0] || lv.paths[0];
      const pos = path.posAt(path.len * z.at);
      return Object.assign({}, z, { x: pos.x + (z.dx || 0), y: pos.y + (z.dy || 0) });
    };
    lv.zones = {
      tides: (b.tides || []).map(place),
      ice: (b.ice || []).map(place),
      vents: (b.vents || []).map((z, i) => Object.assign(place(z), { period: z.period || 9, offset: z.offset != null ? z.offset : i * 2.7 })),
      dark: (b.dark || []).map(place),
      tidePeriod: b.tidePeriod || 24,
    };
    /** true if (x,y) is inside a hazard that blocks build spots / decor (m = margin) */
    lv.inHazard = function (x, y, m) {
      const z = lv.zones;
      for (const t of z.tides) if (((x - t.x) / (t.rx + m)) ** 2 + ((y - t.y) / (t.ry + m)) ** 2 < 1) return true;
      for (const v of z.vents) if (((x - v.x) / (v.r + m)) ** 2 + ((y - v.y) / ((v.r + m) * 0.6)) ** 2 < 1) return true;
      for (const i of z.ice) if (((x - i.x) / (i.rx + m * 0.3)) ** 2 + ((y - i.y) / (i.ry + m * 0.3)) ** 2 < 1) return true;
      return false;
    };
  };

  const inEll = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1;

  /** 0 = low tide, 1 = high tide */
  G.tideLevel = function () {
    const per = this.lv.zones ? this.lv.zones.tidePeriod : 24;
    return 0.5 + 0.5 * Math.sin((this.time / per) * TAU - Math.PI / 2);
  };

  G.ventPhase = function (v) {
    const ph = (this.time + v.offset) % v.period;
    if (ph < VENT_ON) return { on: true, k: ph / VENT_ON };
    if (ph > v.period - VENT_WARN) return { warn: true, k: (ph - (v.period - VENT_WARN)) / VENT_WARN };
    return {};
  };

  G.inDark = function (x, y) {
    const z = this.lv.zones;
    if (!z || !z.dark.length) return false;
    for (const d of z.dark) if (inEll(x, y, d.x, d.y, d.r, d.r * 0.8)) return true;
    return false;
  };

  G.updateBiome = function (dt) {
    const z = this.lv.zones;
    if (!z) return;
    for (const e of this.enemies) e.terrainF = 1;
    // ---- tides ----
    if (z.tides.length) {
      const k = this.tideLevel();
      const sc = 0.3 + 0.7 * k;
      if (k > 0.85 && !this._highTide) { this._highTide = true; this.biomeBanner = { text: 'High tide! The trail floods.', t: 0 }; sfx('wave'); }
      if (k < 0.5) this._highTide = false;
      for (const e of this.enemies) {
        if (e.dead || e.flying || e.carried || e.d < 0) continue;
        for (const t of z.tides) {
          if (!inEll(e.x, e.y, t.x, t.y, t.rx * sc, t.ry * sc)) continue;
          if (e.type === 'blue') e.terrainF *= 1.2;
          else e.terrainF *= 0.55;
          e.burnT = 0;
          if (Math.random() < dt * 3) this.particle('splash', e.x, e.y);
          break;
        }
      }
    }
    // ---- ice ----
    for (const i of z.ice) {
      for (const e of this.enemies) {
        if (e.dead || e.flying || e.carried || e.d < 0) continue;
        if (inEll(e.x, e.y, i.x, i.y, i.rx, i.ry)) { e.terrainF *= 1.4; e.onIce = 0.2; }
      }
    }
    for (const e of this.enemies) if (e.onIce > 0) e.onIce -= dt;
    // ---- lava vents ----
    for (const v of z.vents) {
      const ph = this.ventPhase(v);
      if (ph.on && !v.active) {
        v.active = true;
        this.effect({ kind: 'eruption', x: v.x, y: v.y, r: v.r, t: 0, dur: VENT_ON });
        this.shake = Math.max(this.shake, 0.15);
        sfx('erupt');
      }
      if (!ph.on) v.active = false;
      if (ph.warn && Math.random() < dt * 10) this.particle('smoke', v.x + U.rand(-v.r, v.r) * 0.6, v.y - 4);
      if (!ph.on) continue;
      if (Math.random() < dt * 30) this.particle('ember', v.x + U.rand(-v.r, v.r) * 0.6, v.y - U.rand(0, 30));
      for (const e of this.enemies) {
        if (e.dead || e.flying || e.carried || e.d < 0) continue;
        if (!inEll(e.x, e.y, v.x, v.y, v.r, v.r * 0.6)) continue;
        this.damage(e, 34 * dt, 'fire', null, true);
        if (!e.dead && e.burnT <= 0) { e.burnT = 1; e.burnDps = 4; }
      }
      const burnUnit = (u) => {
        if (!u || u.dead || u.removed || !inEll(u.x, u.y, v.x, v.y, v.r, v.r * 0.6)) return;
        this.hurtUnit(u, 26 * dt, null);
        if (Math.random() < dt * 6) this.particle('ember', u.x, u.y - 14);
      };
      for (const u of this.units.slice()) burnUnit(u);
      burnUnit(this.hero);
    }
    if (this.biomeBanner) { this.biomeBanner.t += dt; if (this.biomeBanner.t > 3) this.biomeBanner = null; }
  };

  G.ambientBiome = function (dt) {
    const th = this.def.theme;
    if (th === 'tundra' && Math.random() < dt * 9) this.particle('snow', U.rand(-40, PTD.W + 20), -8);
    else if (th === 'volcanic' && Math.random() < dt * 5) this.particle('ash', U.rand(0, PTD.W), U.rand(200, PTD.H + 10));
    else if (th === 'cave') {
      if (this.particles.filter((p) => p.type === 'mote').length < 30 && Math.random() < dt * 4) this.particle('mote', U.rand(0, PTD.W), U.rand(90, PTD.H));
      if (Math.random() < dt * 0.8) this.particle('drop', U.rand(80, PTD.W - 80), U.rand(100, 300));
    } else if (th === 'beach' && Math.random() < dt * 0.3) this.particle('leafAmb', U.rand(-50, PTD.W), -10, '#f6efe0');
  };

  /* ======================= drawing ======================= */
  /** dynamic ground layer: tide water, vent glow, ice glints, darkness rims */
  G.drawBiomeGround = function (ctx) {
    const z = this.lv.zones;
    if (!z) return;
    const now = this.time;
    if (z.tides.length) {
      const k = this.tideLevel();
      const sc = 0.3 + 0.7 * k;
      for (const t of z.tides) {
        ctx.save();
        ctx.beginPath(); ctx.ellipse(t.x, t.y, t.rx * sc + 6, t.ry * sc + 4, 0, 0, TAU);
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
        ctx.beginPath(); ctx.ellipse(t.x, t.y, t.rx * sc, t.ry * sc, 0, 0, TAU);
        const wg = ctx.createRadialGradient(t.x - t.rx * 0.2 * sc, t.y - t.ry * 0.3 * sc, 4, t.x, t.y, t.rx * sc + 1);
        wg.addColorStop(0, 'rgba(150,225,245,0.85)'); wg.addColorStop(0.7, 'rgba(70,170,220,0.78)'); wg.addColorStop(1, 'rgba(40,120,180,0.75)');
        ctx.fillStyle = wg; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(37,21,11,0.6)'; ctx.stroke();
        ctx.clip();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.6;
        for (let i = 0; i < 4; i++) {
          const kk = (now * 0.3 + i / 4) % 1;
          const x = t.x + Math.sin(i * 5.3 + now * 0.5) * t.rx * 0.4 * sc, y = t.y + Math.cos(i * 2.1) * t.ry * 0.35 * sc;
          ctx.globalAlpha = Math.sin(kk * Math.PI) * 0.8;
          ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.quadraticCurveTo(x, y - 3, x + 12, y); ctx.stroke();
        }
        ctx.restore();
      }
    }
    for (const i of z.ice) {
      ctx.save();
      for (let n = 0; n < 3; n++) {
        const kk = (now * 0.5 + n / 3 + i.x * 0.01) % 1;
        const a = Math.sin(kk * Math.PI);
        const x = i.x + Math.sin(n * 4.1 + i.y) * i.rx * 0.6, y = i.y + Math.cos(n * 2.7 + i.x) * i.ry * 0.5;
        ctx.globalAlpha = a;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); PTD.Art.H.star(ctx, x, y, 4 * a + 1, 1, 4, 0); ctx.fill();
      }
      ctx.restore();
    }
    for (const v of z.vents) {
      const ph = this.ventPhase(v);
      const glow = ph.on ? 1 - ph.k * 0.4 : ph.warn ? ph.k * 0.6 * (0.6 + 0.4 * Math.sin(now * 20)) : 0.12;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = glow;
      ctx.beginPath(); ctx.ellipse(v.x, v.y, v.r, v.r * 0.6, 0, 0, TAU);
      const gg = ctx.createRadialGradient(v.x, v.y, 2, v.x, v.y, v.r);
      gg.addColorStop(0, 'rgba(255,230,120,0.95)'); gg.addColorStop(0.5, 'rgba(255,110,30,0.6)'); gg.addColorStop(1, 'rgba(200,40,0,0)');
      ctx.fillStyle = gg; ctx.fill();
      ctx.restore();
      if (ph.warn) {
        ctx.save();
        ctx.globalAlpha = 0.6 * ph.k;
        ctx.setLineDash([6, 5]); ctx.lineDashOffset = -now * 30;
        ctx.strokeStyle = '#ff7a2a'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.ellipse(v.x, v.y, v.r, v.r * 0.6, 0, 0, TAU); ctx.stroke();
        ctx.restore();
      }
    }
  };

  /** lava fountain drawn above sprites */
  G.drawEruptionFx = function (ctx, f) {
    const k = f.t / f.dur;
    const h = (k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8) * 70;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const w = f.r * 0.5;
    const gr = ctx.createLinearGradient(0, f.y - h, 0, f.y);
    gr.addColorStop(0, 'rgba(255,240,150,0)'); gr.addColorStop(0.3, 'rgba(255,170,40,0.7)'); gr.addColorStop(1, 'rgba(255,80,10,0.9)');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.moveTo(f.x - w, f.y);
    ctx.quadraticCurveTo(f.x - w * 0.4 + Math.sin(this.time * 18) * 4, f.y - h * 0.6, f.x, f.y - h);
    ctx.quadraticCurveTo(f.x + w * 0.4 + Math.cos(this.time * 16) * 4, f.y - h * 0.6, f.x + w, f.y);
    ctx.closePath(); ctx.fill();
    PTD.Art.blit(ctx, PTD.Art.glow('#ff8a2a', 50), f.x, f.y - h * 0.4, false, 1, 0.6 * (1 - k * 0.5));
    ctx.restore();
  };

  /** cave darkness: a dim layer with light pools; dark zones are darker still */
  G.drawCaveDark = function (ctx) {
    const z = this.lv.zones;
    const W = PTD.W, Hh = PTD.H, S = 0.5;
    let c = this._darkC;
    if (!c) { c = this._darkC = document.createElement('canvas'); c.width = W * S; c.height = Hh * S; }
    const g = c.getContext('2d');
    g.setTransform(S, 0, 0, S, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, W, Hh);
    g.fillStyle = 'rgba(8,6,24,0.5)';
    g.fillRect(0, 0, W, Hh);
    for (const d of z ? z.dark : []) {
      const gr = g.createRadialGradient(d.x, d.y, d.r * 0.3, d.x, d.y, d.r * 1.05);
      gr.addColorStop(0, 'rgba(4,2,14,0.45)'); gr.addColorStop(1, 'rgba(4,2,14,0)');
      g.fillStyle = gr;
      g.beginPath(); g.ellipse(d.x, d.y, d.r * 1.05, d.r * 0.84, 0, 0, TAU); g.fill();
    }
    g.globalCompositeOperation = 'destination-out';
    const light = (x, y, r, a) => {
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    };
    const h = this.hero;
    if (!h.dead) light(h.x, h.y - 20, 110, 0.85);
    for (const t of this.towers) light(t.x, t.y - 20, this.inDark(t.x, t.y) ? 55 : 85, 0.7);
    for (const d of this.lv.decor) if (d.k === 'crystal' || d.k === 'glowshroom') light(d.x, d.y - 12 * d.s, 60 * d.s, 0.55);
    for (const o of this.lv.onions) light(o.x, o.y - 30, 80, 0.6);
    for (const e of this.enemies) if (e.type === 'glow' || e.def.boss) light(e.x, e.y - 18, e.def.boss ? 90 : 36, 0.6);
    for (const f of this.effects) if (f.kind === 'bolt') for (const p of f.pts) light(p[0], p[1], 40, 0.7 * (1 - f.t / f.dur));
    for (const p of this.projectiles) if (p.kind === 'fireball') light(p.x, p.y, 40, 0.7);
    ctx.drawImage(c, 0, 0, W, Hh);
    // dark-zone rims so players can see where towers lose range
    ctx.save();
    ctx.setLineDash([3, 9]);
    ctx.lineDashOffset = this.time * 6;
    ctx.strokeStyle = 'rgba(190,160,255,0.35)';
    ctx.lineWidth = 2;
    for (const d of z ? z.dark : []) { ctx.beginPath(); ctx.ellipse(d.x, d.y, d.r, d.r * 0.8, 0, 0, TAU); ctx.stroke(); }
    ctx.restore();
    // glows on top of the darkness
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const d of this.lv.decor) if (d.k === 'crystal') PTD.Art.blit(ctx, PTD.Art.glow(d.col || '#7fd8ff', 30), d.x, d.y - 14 * d.s, false, d.s, 0.35 + 0.1 * Math.sin(this.time * 2 + d.x));
    for (const e of this.enemies) if (e.type === 'glow') PTD.Art.blit(ctx, PTD.Art.glow('#9dff6a', 26), e.x, e.y - 18, false, 1, 0.5);
    for (const p of this.particles) if (p.type === 'mote') PTD.Art.blit(ctx, PTD.Art.glow(p.col, 8), p.x, p.y, false, 1, Math.sin((p.life / p.max) * Math.PI) * 0.8);
    ctx.restore();
  };

  /** banner text for biome events */
  G.drawBiomeBanner = function (ctx) {
    const b = this.biomeBanner;
    if (!b || !this.banner) return;
    ctx.save();
    ctx.globalAlpha = b.t < 0.2 ? b.t / 0.2 : b.t > 2.6 ? Math.max(0, (3 - b.t) / 0.4) : 1;
    this.banner(ctx, b.text);
    ctx.restore();
  };
})();
