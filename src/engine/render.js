/* Bulborb Rush — world renderer (extends PTD.Game.prototype). */
(function () {
  'use strict';
  const PTD = window.PTD;
  const U = PTD.U;
  const Art = PTD.Art;
  const H = Art.H;
  const OUT = Art.OUT;
  const TAU = Math.PI * 2;
  const G = PTD.Game.prototype;

  const UNIT_SHADOW = { dwarf: 13, dwarfOrange: 14, red: 17, bulbear: 20, reinf: 13, breadbug: 15, emperor: 24 };
  const UNIT_H = { dwarf: 28, dwarfOrange: 30, red: 34, bulbear: 40, reinf: 28, breadbug: 26, emperor: 48 };

  G.ensureBg = function () {
    if (!this.bg || this.bgRes !== Art.RES) {
      this.bg = Art.paintLevel(this.lv, Art.RES);
      this.bgRes = Art.RES;
      this.bg.addEventListener('contextlost', () => { this.bg = null; });
    }
  };

  G.render = function (ctx) {
    this.ensureBg();
    const W = PTD.W, Hh = PTD.H;
    const ui = this.ui || {};
    ctx.save();
    if (this.shake > 0) {
      const s = this.shake * 6;
      ctx.translate(U.rand(-s, s), U.rand(-s, s));
    }
    ctx.drawImage(this.bg, 0, 0, W, Hh);
    const now = this.time;

    // water shimmer for pool
    if (this.lv.water && this.lv.water.length) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.5;
      for (const w of this.lv.water) {
        for (let i = 0; i < 5; i++) {
          const k = (now * 0.15 + i / 5) % 1;
          const x = w.x + Math.sin(i * 7.1) * w.rx * 0.5, y = w.y + Math.cos(i * 3.3) * w.ry * 0.4;
          ctx.globalAlpha = Math.sin(k * Math.PI) * 0.6;
          ctx.beginPath(); ctx.ellipse(x, y, 6 + k * 18, (6 + k * 18) * 0.4, 0, 0, TAU); ctx.stroke();
        }
      }
      ctx.restore();
    }

    // decals
    for (const d of this.decals) {
      const a = 1 - d.t / d.dur;
      ctx.save();
      ctx.globalAlpha = Math.min(1, a * 1.5) * 0.55;
      ctx.translate(d.x, d.y);
      if (d.kind === 'crater') {
        ctx.fillStyle = '#4a321c'; ctx.beginPath(); ctx.ellipse(0, 0, 16, 7, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,240,210,0.4)'; ctx.beginPath(); ctx.ellipse(-2, -2, 10, 3.5, 0, 0, TAU); ctx.fill();
      } else if (d.kind === 'splat') {
        ctx.fillStyle = '#3d6f8a'; ctx.beginPath(); ctx.ellipse(0, 0, 26, 11, 0, 0, TAU); ctx.fill();
      } else {
        ctx.strokeStyle = '#3a2412'; ctx.lineWidth = 2; ctx.rotate(d.rot);
        ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-4, 2); ctx.lineTo(3, -2); ctx.lineTo(12, 1); ctx.moveTo(-4, 2); ctx.lineTo(-6, 7); ctx.stroke();
      }
      ctx.restore();
    }

    // build spots
    for (const s of this.spots) {
      if (s.tower) continue;
      const hov = ui.hoverSpot === s || (ui.menu && ui.menu.spot === s);
      Art.blit(ctx, Art.buildSpot(hov), s.x, s.y);
    }

    // range preview
    this.renderRanges(ctx);

    // ground effects
    for (const f of this.effects) {
      if (f.kind === 'ring' && f.ground) this.drawRing(ctx, f);
      else if (f.kind === 'quake') this.drawQuake(ctx, f);
      else if (f.kind === 'flag') this.drawFlagFx(ctx, f);
      else if (f.kind === 'snagret' && f.t < 0.4) {
        ctx.save(); ctx.globalAlpha = 0.6 * (1 - f.t / 0.4);
        ctx.strokeStyle = '#ffdf8a'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.ellipse(f.x, f.y, PTD.SPELLS.snagret.radius, PTD.SPELLS.snagret.radius * 0.8, 0, 0, TAU); ctx.stroke();
        ctx.restore();
      }
    }

    // shadows
    ctx.save();
    ctx.fillStyle = 'rgba(25,30,10,0.28)';
    ctx.beginPath();
    for (const e of this.enemies) {
      if (e.d < -5 || e.carried) continue;
      const r = e.def.pik ? (e.flying ? 5 : 7) : 10 * Art.CAPT[e.type].scale;
      ctx.moveTo(e.x + r, e.y); ctx.ellipse(e.x, e.y, r, r * 0.42, 0, 0, TAU);
    }
    for (const u of this.units) {
      if (u.dead || u.removed) continue;
      const r = UNIT_SHADOW[u.kind] || 12;
      ctx.moveTo(u.x + r, u.y); ctx.ellipse(u.x, u.y, r, r * 0.4, 0, 0, TAU);
    }
    const h = this.hero;
    if (!h.dead) { ctx.moveTo(h.x + 24, h.y); ctx.ellipse(h.x, h.y, 24, 9, 0, 0, TAU); }
    ctx.fill();
    ctx.restore();

    // hero selection ring
    if (ui.selected === h && !h.dead) {
      ctx.save();
      ctx.strokeStyle = '#ffe36a'; ctx.lineWidth = 3;
      ctx.globalAlpha = 0.7 + Math.sin(now * 6) * 0.3;
      ctx.beginPath(); ctx.ellipse(h.x, h.y, 30, 12, 0, 0, TAU); ctx.stroke();
      ctx.restore();
    }

    // ------------- y-sorted sprites -------------
    const list = this._drawList || (this._drawList = []);
    list.length = 0;
    for (const o of this.lv.onions) list.push({ y: o.y, o, k: 0 });
    for (const t of this.towers) list.push({ y: t.y, o: t, k: 1 });
    for (const e of this.enemies) if (e.d > -8) list.push({ y: e.y + (e.flying ? 6 : 0), o: e, k: 2 });
    for (const u of this.units) if (!u.dead && !u.removed) list.push({ y: u.y, o: u, k: 3 });
    if (!h.dead) list.push({ y: h.y, o: h, k: 4 });
    for (const f of this.effects) {
      if (f.kind === 'snagret') list.push({ y: f.y + 1, o: f, k: 5 });
      else if (f.kind === 'wolly') list.push({ y: f.gy != null ? f.gy + 2 : f.sy, o: f, k: 6 });
      else if (f.kind === 'snatch') list.push({ y: f.y + 60, o: f, k: 7 });
      else if (f.kind === 'roll') list.push({ y: f.y, o: f, k: 8 });
      else if (f.kind === 'ko') list.push({ y: f.y, o: f, k: 9 });
    }
    list.sort((a, b) => a.y - b.y);
    for (const it of list) {
      switch (it.k) {
        case 0: Art.drawOnion(ctx, it.o.x, it.o.y, 0.62, it.o.col, now); break;
        case 1: this.drawTower(ctx, it.o); break;
        case 2: this.drawEnemy(ctx, it.o); break;
        case 3: this.drawUnit(ctx, it.o); break;
        case 4: this.drawUnit(ctx, it.o); break;
        case 5: this.drawSnagretFx(ctx, it.o); break;
        case 6: this.drawWollyFx(ctx, it.o); break;
        case 7: this.drawSnatchFx(ctx, it.o); break;
        case 8: this.drawRollFx(ctx, it.o); break;
        case 9: this.drawKo(ctx, it.o); break;
      }
    }

    // projectiles
    for (const p of this.projectiles) this.drawProjectile(ctx, p);

    // air effects
    for (const f of this.effects) {
      if (f.kind === 'ring' && !f.ground) this.drawRing(ctx, f);
      else if (f.kind === 'ghost') this.drawGhost(ctx, f);
      else if (f.kind === 'gust') this.drawGust(ctx, f);
    }

    this.drawParticles(ctx);

    // night
    if (this.def.night) this.drawNight(ctx);

    // health bars
    for (const e of this.enemies) {
      if (e.d < 0 || (e.hp >= e.maxHp && !e.def.captain)) continue;
      const big = !e.def.pik;
      const w = big ? 30 * Math.min(1.6, Art.CAPT[e.type].scale) : 18;
      const hh = big ? 50 * Art.CAPT[e.type].scale : 40;
      this.hpBar(ctx, e.x, e.y - hh - (e.flying ? 22 : 0), w, e.hp / e.maxHp, e.slowT > 0 ? '#7fd8ff' : '#7ee04a');
    }
    for (const u of this.units) {
      if (u.dead || u.removed || u.hp >= u.maxHp) continue;
      this.hpBar(ctx, u.x, u.y - (UNIT_H[u.kind] || 30) - 4, 18, u.hp / u.maxHp, '#ffd23a');
    }
    if (!h.dead && h.hp < h.maxHp) this.hpBar(ctx, h.x, h.y - 56, 34, h.hp / h.maxHp, '#ffd23a');

    // floaters
    for (const f of this.floaters) {
      const a = f.t < 0.15 ? f.t / 0.15 : 1 - Math.max(0, (f.t - f.dur * 0.6) / (f.dur * 0.4));
      const sc = f.t < 0.15 ? U.easeOutBack(f.t / 0.15) : 1;
      ctx.save();
      ctx.globalAlpha = U.clamp(a, 0, 1);
      H.text(ctx, f.text, f.x, f.y, f.size * sc, f.col, { lw: Math.max(3, f.size * 0.28) });
      ctx.restore();
    }
    ctx.restore();
  };

  G.hpBar = function (ctx, x, y, w, k, col) {
    k = U.clamp(k, 0, 1);
    ctx.fillStyle = '#2a1608';
    ctx.fillRect(x - w / 2 - 1.5, y - 1.5, w + 3, 6);
    ctx.fillStyle = '#b32a1e';
    ctx.fillRect(x - w / 2, y, w, 3);
    ctx.fillStyle = col;
    ctx.fillRect(x - w / 2, y, w * k, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x - w / 2, y, w * k, 1);
  };

  G.renderRanges = function (ctx) {
    const ui = this.ui || {};
    let t = null, range = 0, col = 'rgba(255,255,255,';
    if (ui.menu && ui.menu.tower) {
      t = ui.menu.tower;
      range = t.def.range;
      if (ui.hoverItem && ui.hoverItem.preview) range = PTD.TOWERS[ui.hoverItem.preview].range;
    } else if (ui.menu && ui.menu.spot && ui.hoverItem && ui.hoverItem.preview) {
      t = ui.menu.spot;
      range = PTD.TOWERS[ui.hoverItem.preview].range;
    }
    if (ui.mode === 'rally' && ui.menu && ui.menu.tower) { t = ui.menu.tower; range = t.def.range; col = 'rgba(255,230,120,'; }
    if (!t || !range) return;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(t.x, t.y, range, range * 0.8, 0, 0, TAU);
    ctx.fillStyle = col + '0.12)';
    ctx.fill();
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = -this.time * 20;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = col + '0.75)';
    ctx.stroke();
    ctx.restore();
    // rally flag
    const tw = ui.menu && ui.menu.tower;
    if (tw && tw.family === 'den' && tw.rally) {
      Art.blit(ctx, Art.icon('rally', 26), tw.rally.x + 4, tw.rally.y - 12);
    }
  };

  /* ---------------- towers ---------------- */
  G.drawTower = function (ctx, t) {
    const def = t.def;
    const pop = t.buildT < 0.35 ? U.easeOutBack(t.buildT / 0.35) : 1;
    const ui = this.ui || {};
    const sel = ui.menu && ui.menu.tower === t;
    ctx.save();
    ctx.translate(t.x, t.y);
    if (pop !== 1) ctx.scale(0.6 + 0.4 * pop, 0.4 + 0.6 * pop);
    if (def.family === 'den') {
      const elite = def.tier === 4 ? t.id : '';
      const s = Art.denBase(Math.min(3, def.tier), elite);
      Art.blit(ctx, s, 0, 0);
      if (sel || ui.hoverTower === t) {
        ctx.globalAlpha = 0.25; ctx.globalCompositeOperation = 'lighter';
        Art.blit(ctx, s, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      }
      ctx.restore();
      return;
    }
    const plat = Art.platform(def.family, def.tier);
    Art.blit(ctx, plat, 0, 0);
    if (sel || ui.hoverTower === t) {
      ctx.globalAlpha = 0.22; ctx.globalCompositeOperation = 'lighter';
      Art.blit(ctx, plat, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
    const ph = Art.PLAT_H[def.tier];
    if (def.creature === 'wolly') {
      // lily pond on top of the platform
      ctx.save();
      ctx.beginPath(); ctx.ellipse(0, -ph, 24, 9, 0, 0, TAU);
      const wg = ctx.createRadialGradient(-6, -ph - 3, 2, 0, -ph, 26);
      wg.addColorStop(0, '#8fd6f5'); wg.addColorStop(1, '#2f7fae');
      ctx.fillStyle = wg; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.2;
      const k = (this.time * 0.6) % 1;
      ctx.beginPath(); ctx.ellipse(4, -ph + 1, 4 + k * 12, (4 + k * 12) * 0.4, 0, 0, TAU); ctx.globalAlpha = 1 - k; ctx.stroke();
      ctx.restore();
    }
    if (!t.away) {
      let pose = 'idle', frame;
      if (t.atkT > 0) { pose = 'attack'; frame = Math.min(5, Math.floor(t.atkT * 6)); }
      else frame = Math.floor((t.anim * 5) % 8);
      const s = Art.creature(def.creature, def.scale, pose, frame);
      Art.blit(ctx, s, 0, -ph + (def.creature === 'wolly' ? 4 : 0), t.face < 0);
    }
    ctx.restore();
  };

  /* ---------------- enemies ---------------- */
  G.enemySprite = function (e) {
    let vx = e.dx, vy = e.dy;
    if (e.faceX != null) { vx = e.faceX; vy = 0; }
    let view = 'side';
    if (e.faceX == null && Math.abs(vy) > Math.abs(vx) * 1.25) view = vy < 0 ? 'back' : 'front';
    let pose = 'walk', frame;
    if (e.atkAnim > 0) { pose = 'attack'; frame = Math.min(5, Math.floor((1 - e.atkAnim) * 6)); }
    else if (e.blocker || e.stunT > 0 || e.carried) { pose = 'idle'; frame = 0; }
    else frame = Math.floor(e.walk * 8) % 8;
    if (e.flying && pose === 'idle') { pose = 'walk'; frame = Math.floor(this.time * 10) % 8; }
    const s = e.def.pik ? Art.pikmin(e.type, e.tier, view, frame, pose) : Art.captain(e.type, view, frame, pose);
    return { s, flip: view === 'side' && vx < 0 };
  };

  G.drawEnemy = function (ctx, e) {
    const { s, flip } = this.enemySprite(e);
    let spr = s;
    if (e.flashT > 0) spr = Art.flash(s);
    else if (e.slowT > 0) spr = Art.tint(s, '#7fd8ff', 0.28);
    else if (e.burnT > 0) spr = Art.tint(s, '#ff7a2a', 0.22);
    let y = e.y;
    if (e.flying) y -= 22 + Math.sin(this.time * 5 + e.uid) * 2;
    let alpha = null;
    const rem = e.path.len - e.d;
    if (rem < 30) alpha = Math.max(0, rem / 30);
    if (e.d < 10) alpha = Math.max(0, (e.d + 8) / 18);
    Art.blit(ctx, spr, e.x, y, flip, 1, alpha);
    if (e.buffT > 0) {
      ctx.save(); ctx.globalAlpha = 0.6;
      Art.blit(ctx, Art.glow('#ffe066', 14), e.x, y - 30);
      ctx.restore();
    }
    if (e.stunT > 0 && !e.carried) this.drawStars(ctx, e.x, y - (e.def.pik ? 42 : 50 * Art.CAPT[e.type].scale), e.def.pik ? 8 : 12);
    const ui = this.ui;
    if (ui && ui.selected === e) {
      ctx.save(); ctx.strokeStyle = '#ff6a5a'; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.ellipse(e.x, e.y, 14, 6, 0, 0, TAU); ctx.stroke(); ctx.restore();
    }
  };

  G.drawStars = function (ctx, x, y, r) {
    for (let i = 0; i < 3; i++) {
      const a = this.time * 5 + (i / 3) * TAU;
      ctx.save();
      ctx.translate(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.35);
      ctx.beginPath(); H.star(ctx, 0, 0, 3.6, 1.6);
      ctx.fillStyle = '#ffe066'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = OUT; ctx.stroke();
      ctx.restore();
    }
  };

  /* ---------------- units ---------------- */
  G.drawUnit = function (ctx, u) {
    let pose, frame;
    const tongue = u.isHero && u.tongueAnim > 0;
    if (tongue) { pose = 'attack'; frame = Math.min(5, Math.floor((1 - u.tongueAnim) * 6)); }
    else if (u.atkAnim > 0) { pose = 'attack'; frame = Math.min(5, Math.floor((1 - u.atkAnim) * 6)); }
    else if (u.moving) { pose = 'walk'; frame = Math.floor(u.walk * 4) % 8; }
    else { pose = 'idle'; frame = Math.floor((this.time * 4 + (u.uid % 8)) % 8); }
    let s = u.kind === 'breadbug' ? Art.breadbug(frame, pose, 0.8) : Art.bulborb(u.kind, frame, pose);
    if (u.flashT > 0) s = Art.flash(s);
    let alpha = null;
    if (u.ttl != null && u.ttl < 2.5) alpha = 0.5 + 0.5 * Math.abs(Math.sin(this.time * 10));
    Art.blit(ctx, s, u.x, u.y, u.face < 0, 1, alpha);
    if (u.stunT > 0) this.drawStars(ctx, u.x, u.y - (UNIT_H[u.kind] || 30), 9);
    if (u.isHero) {
      // level badge
      ctx.save();
      ctx.translate(u.x - 20, u.y - 50);
      ctx.beginPath(); H.circ(ctx, 0, 0, 7); ctx.fillStyle = '#6a3fa0'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke();
      H.text(ctx, String(u.level), 0, 0.5, 9, '#ffe066', { shadow: false, lw: 2 });
      ctx.restore();
    }
  };

  /* ---------------- projectiles ---------------- */
  G.drawProjectile = function (ctx, p) {
    switch (p.kind) {
      case 'pebble': {
        ctx.beginPath(); H.circ(ctx, p.x, p.y, 3.2);
        ctx.fillStyle = '#b8b2a6'; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = OUT; ctx.stroke();
        ctx.beginPath(); H.circ(ctx, p.x - 1, p.y - 1, 1); ctx.fillStyle = '#fff'; ctx.fill();
        break;
      }
      case 'bullet': {
        const a = p.ang || 0;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a);
        ctx.fillStyle = 'rgba(255,230,120,0.5)'; ctx.fillRect(-12, -1.5, 12, 3);
        ctx.beginPath(); ctx.ellipse(0, 0, 3.5, 1.8, 0, 0, TAU); ctx.fillStyle = '#ffe36a'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = OUT; ctx.stroke();
        ctx.restore();
        break;
      }
      case 'spit': {
        ctx.beginPath(); H.circ(ctx, p.x, p.y, 4.5);
        ctx.fillStyle = '#8a6ad6'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = OUT; ctx.stroke();
        ctx.beginPath(); H.circ(ctx, p.x - 1.2, p.y - 1.4, 1.4); ctx.fillStyle = '#e9e0ff'; ctx.fill();
        break;
      }
      case 'fireball': {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        Art.blit(ctx, Art.glow('#ff8a2a', 18), p.x, p.y);
        ctx.restore();
        ctx.beginPath(); H.circ(ctx, p.x, p.y, 5); ctx.fillStyle = '#ffd54a'; ctx.fill();
        ctx.beginPath(); H.circ(ctx, p.x, p.y, 2.6); ctx.fillStyle = '#fffbe0'; ctx.fill();
        break;
      }
      case 'frost': {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        Art.blit(ctx, Art.glow('#8fdcff', 16), p.x, p.y);
        ctx.restore();
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(this.time * 8);
        ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(3, 0); ctx.lineTo(0, 6); ctx.lineTo(-3, 0); ctx.closePath();
        ctx.fillStyle = '#e8fbff'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = '#3a7fb0'; ctx.stroke();
        ctx.restore();
        break;
      }
      case 'wind': {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(this.time * 14);
        ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2.2;
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, 0, 4 + i * 2.6, i * 2, i * 2 + 2.2); ctx.stroke(); }
        ctx.restore();
        break;
      }
      case 'boulder': {
        const k = Math.min(1, p.t / p.dur);
        const sh = 0.5 + 0.5 * (1 - Math.sin(k * Math.PI));
        ctx.save(); ctx.fillStyle = 'rgba(25,30,10,0.3)';
        ctx.beginPath(); ctx.ellipse(p.x, p.gy, 10 * sh * p.size * 1.4, 4 * sh * p.size * 1.4, 0, 0, TAU); ctx.fill(); ctx.restore();
        Art.blit(ctx, Art.boulder(1), p.x, p.y, false, p.size * 1.3, null, p.rot);
        break;
      }
    }
  };

  /* ---------------- effects ---------------- */
  G.drawRing = function (ctx, f) {
    const k = f.t / f.dur;
    const r = U.lerp(f.r0, f.r1, U.easeOutCubic(k));
    ctx.save();
    ctx.globalAlpha = (1 - k) * 0.85;
    ctx.strokeStyle = f.col; ctx.lineWidth = 3 + (1 - k) * 3;
    ctx.beginPath(); ctx.ellipse(f.x, f.y, r, r * 0.55, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  };

  G.drawQuake = function (ctx, f) {
    const k = f.t / f.dur;
    ctx.save();
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = '#6b4424'; ctx.lineWidth = 4;
    const r = 20 + k * 70;
    ctx.beginPath(); ctx.ellipse(f.x, f.y, r, r * 0.5, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#3a2412'; ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU;
      ctx.beginPath(); ctx.moveTo(f.x + Math.cos(a) * 14, f.y + Math.sin(a) * 6);
      ctx.lineTo(f.x + Math.cos(a + 0.2) * 40, f.y + Math.sin(a + 0.2) * 18);
      ctx.lineTo(f.x + Math.cos(a) * 64, f.y + Math.sin(a) * 28);
      ctx.stroke();
    }
    ctx.restore();
  };

  G.drawFlagFx = function (ctx, f) {
    const k = f.t / f.dur;
    ctx.save();
    ctx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
    ctx.strokeStyle = '#ffe36a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(f.x, f.y, 12 + k * 14, (12 + k * 14) * 0.45, 0, 0, TAU); ctx.stroke();
    Art.blit(ctx, Art.icon('rally', 24), f.x + 4, f.y - 12 - (1 - Math.min(1, k * 4)) * 12);
    ctx.restore();
  };

  G.drawGust = function (ctx, f) {
    const k = f.t / f.dur;
    ctx.save();
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + k * 4;
      const r = 20 + k * 70;
      ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * r * 0.3, f.y + Math.sin(a) * r * 0.15, r * 0.5, a, a + 1.4); ctx.stroke();
    }
    ctx.restore();
  };

  G.drawGhost = function (ctx, f) {
    const k = f.t / f.dur;
    const y = f.y - 20 - k * 60;
    const x = f.x + Math.sin(f.t * 5) * 5;
    Art.blit(ctx, Art.ghost(f.type), x, y, false, 0.9 + Math.sin(f.t * 12) * 0.05, (1 - k) * 0.9);
  };

  G.drawKo = function (ctx, f) {
    const a = f.t > f.dur - 0.6 ? (f.dur - f.t) / 0.6 : 1;
    const s = Art.captain(f.type, 'side', 0, 'down');
    Art.blit(ctx, s, f.x, f.y, f.flip, 1, a);
    if (a > 0.3) this.drawStars(ctx, f.x + (f.flip ? 10 : -10), f.y - 14, 12);
  };

  G.drawSnagretFx = function (ctx, f) {
    const t = f.t;
    let rise = t < 0.35 ? U.easeOutBack(t / 0.35) : t > 1.3 ? Math.max(0, 1 - (t - 1.3) / 0.35) : 1;
    let peck = 0;
    for (const pt of [0.5, 0.82, 1.14]) peck = Math.max(peck, 1 - Math.abs(t - pt) / 0.13);
    peck = Math.max(0, peck);
    const pi = t < 0.66 ? 0 : t < 0.98 ? 1 : 2;
    const dir = pi === 1 ? -f.dir : f.dir;
    Art.drawSnagret(ctx, f.x, f.y, rise, peck, dir);
  };

  G.drawWollyFx = function (ctx, f) {
    if (f.x == null) return;
    const def = PTD.TOWERS.wolly;
    // shadow
    ctx.save(); ctx.fillStyle = 'rgba(25,30,10,0.3)';
    ctx.beginPath(); ctx.ellipse(f.x, f.gy, 18, 7, 0, 0, TAU); ctx.fill(); ctx.restore();
    let squash = 0, air = true;
    if (f.landed && !f.returning) { squash = f.t < 0.15 ? 1 : 1 - (f.t - 0.15) / 0.2; air = false; }
    else if (f.k != null) squash = f.k < 0.5 ? -0.6 : -0.2;
    ctx.save();
    ctx.translate(f.x, f.y);
    const face = f.returning ? -f.face : f.face;
    if (face < 0) ctx.scale(-1, 1);
    Art.drawWollywog(ctx, 0, squash, def.scale, air);
    ctx.restore();
  };

  G.drawSnatchFx = function (ctx, f) {
    const sc = PTD.TOWERS.snitch.scale;
    ctx.save();
    ctx.translate(f.x, f.y + 42 * sc);
    if ((f.face || 1) < 0) ctx.scale(-1, 1);
    Art.drawSnitchbug(ctx, (this.time * 1.5) % 1, f.phase === 0 ? 0.6 : 0.2, sc, f.phase === 1 || f.phase === 2);
    ctx.restore();
  };

  G.drawRollFx = function (ctx, f) {
    ctx.save(); ctx.fillStyle = 'rgba(25,30,10,0.3)';
    ctx.beginPath(); ctx.ellipse(f.x, f.y + 2, 20, 7, 0, 0, TAU); ctx.fill(); ctx.restore();
    Art.blit(ctx, Art.boulder(2), f.x, f.y - 18, false, 1.25, null, f.rot);
  };

  /* ---------------- particles ---------------- */
  G.drawParticles = function (ctx) {
    for (const p of this.particles) {
      const k = p.life / p.max;
      const a = 1 - k;
      switch (p.type) {
        case 'dust': case 'smoke': case 'wisp':
          ctx.globalAlpha = a * (p.type === 'wisp' ? 0.5 : 0.55);
          ctx.fillStyle = p.col;
          ctx.beginPath(); H.circ(ctx, p.x, p.y, p.size); ctx.fill();
          break;
        case 'poison':
          ctx.globalAlpha = a * 0.6; ctx.fillStyle = p.col;
          ctx.beginPath(); H.circ(ctx, p.x, p.y, p.size); ctx.fill();
          break;
        case 'dirt': case 'rock':
          ctx.globalAlpha = Math.min(1, a * 2);
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = p.col; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
          break;
        case 'spark': case 'flash':
          ctx.globalAlpha = a;
          ctx.fillStyle = p.col;
          ctx.beginPath(); H.circ(ctx, p.x, p.y, p.size * (p.type === 'flash' ? 1 : a + 0.3)); ctx.fill();
          break;
        case 'ember':
          ctx.globalAlpha = a;
          ctx.fillStyle = p.col;
          ctx.beginPath(); H.circ(ctx, p.x, p.y, p.size * (0.4 + a * 0.6)); ctx.fill();
          break;
        case 'frost':
          ctx.globalAlpha = a;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = p.col;
          ctx.beginPath(); ctx.moveTo(0, -p.size); ctx.lineTo(p.size * 0.5, 0); ctx.lineTo(0, p.size); ctx.lineTo(-p.size * 0.5, 0); ctx.fill();
          ctx.restore();
          break;
        case 'coin':
          ctx.globalAlpha = Math.min(1, a * 2);
          Art.blit(ctx, Art.icon('poko', 12), p.x, p.y);
          break;
        case 'juice': case 'splash':
          ctx.globalAlpha = a; ctx.fillStyle = p.col;
          ctx.beginPath(); H.circ(ctx, p.x, p.y, p.size); ctx.fill();
          break;
        case 'heal':
          ctx.globalAlpha = a; ctx.fillStyle = p.col;
          ctx.fillRect(p.x - 1.2, p.y - 4, 2.4, 8); ctx.fillRect(p.x - 4, p.y - 1.2, 8, 2.4);
          break;
        case 'petal': case 'leafAmb':
          ctx.globalAlpha = p.type === 'leafAmb' ? Math.min(1, a * 3) * 0.85 : a;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = p.col;
          ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, TAU); ctx.fill();
          if (p.type === 'leafAmb') { ctx.lineWidth = 0.8; ctx.strokeStyle = 'rgba(60,30,0,0.5)'; ctx.stroke(); }
          ctx.restore();
          break;
        case 'firefly':
          break; // drawn in night pass
      }
    }
    ctx.globalAlpha = 1;
  };

  G.drawNight = function (ctx) {
    const W = PTD.W, Hh = PTD.H;
    ctx.save();
    ctx.fillStyle = 'rgba(16,22,70,0.32)';
    ctx.fillRect(-20, -20, W + 40, Hh + 40);
    ctx.globalCompositeOperation = 'lighter';
    for (const e of this.enemies) {
      if (e.type === 'glow') Art.blit(ctx, Art.glow('#9dff6a', 30), e.x, e.y - 18, false, 1, 0.55);
    }
    for (const o of this.lv.onions) Art.blit(ctx, Art.glow(o.col, 60), o.x, o.y - 30, false, 1, 0.35);
    for (const d of this.lv.decor) if (d.k === 'glowshroom') Art.blit(ctx, Art.glow('#5fd6f0', 34), d.x, d.y - 14 * d.s, false, 1, 0.35 + Math.sin(this.time * 2 + d.x) * 0.1);
    for (const p of this.particles) {
      if (p.type !== 'firefly') continue;
      const k = p.life / p.max;
      const a = Math.sin(k * Math.PI) * (0.6 + 0.4 * Math.sin(p.life * 8 + p.rot));
      Art.blit(ctx, Art.glow('#eaff7a', 10), p.x, p.y, false, 1, a);
    }
    for (const p of this.projectiles) if (p.kind === 'fireball') Art.blit(ctx, Art.glow('#ff8a2a', 40), p.x, p.y, false, 1, 0.5);
    ctx.restore();
  };
})();
