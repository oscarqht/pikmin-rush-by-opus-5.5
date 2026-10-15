/* Bulborb Rush — in-game HUD, ring menus, tooltips and input (extends PTD.Game.prototype). */
(function () {
  'use strict';
  const PTD = window.PTD;
  const U = PTD.U;
  const Art = PTD.Art;
  const H = Art.H;
  const OUT = Art.OUT;
  const TAU = Math.PI * 2;
  const G = PTD.Game.prototype;
  const TW = PTD.TOWERS;
  const FONT = "'Nunito', 'Trebuchet MS', sans-serif";
  const TITLE = "'Lilita One', 'Trebuchet MS', sans-serif";
  const sfx = (n) => PTD.Audio && PTD.Audio.play(n);

  /* ---------------- UI primitives ---------------- */
  const UI = (PTD.UIDraw = {});
  UI.plank = function (ctx, x, y, w, h, opt) {
    opt = opt || {};
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); H.rr(ctx, x + 2, y + 4, w, h, 10); ctx.fill();
    ctx.beginPath(); H.rr(ctx, x, y, w, h, 10);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, opt.c1 || '#b97b42'); g.addColorStop(0.5, opt.c2 || '#9a6234'); g.addColorStop(1, opt.c3 || '#7a4a24');
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(60,30,10,0.25)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < h / 7; i++) {
      ctx.beginPath(); ctx.moveTo(x, y + 5 + i * 7); ctx.bezierCurveTo(x + w * 0.3, y + 3 + i * 7, x + w * 0.6, y + 8 + i * 7, x + w, y + 5 + i * 7); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,230,180,0.35)'; ctx.lineWidth = 2;
    ctx.beginPath(); H.rr(ctx, x + 3, y + 3, w - 6, h - 6, 8); ctx.stroke();
    ctx.restore();
    ctx.lineWidth = 3; ctx.strokeStyle = '#3a2210'; ctx.stroke();
    if (!opt.noNails) {
      for (const [nx, ny] of [[x + 9, y + 9], [x + w - 9, y + 9], [x + 9, y + h - 9], [x + w - 9, y + h - 9]]) {
        ctx.beginPath(); H.circ(ctx, nx, ny, 2.4); ctx.fillStyle = '#d9c3a0'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = '#3a2210'; ctx.stroke();
      }
    }
    ctx.restore();
  };

  UI.parchment = function (ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); H.rr(ctx, x + 3, y + 5, w, h, 8); ctx.fill();
    ctx.beginPath(); H.rr(ctx, x, y, w, h, 8);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#fff6dc'); g.addColorStop(1, '#efd8a6');
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#7a4a24'; ctx.stroke();
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(122,74,36,0.4)';
    ctx.beginPath(); H.rr(ctx, x + 4, y + 4, w - 8, h - 8, 5); ctx.stroke();
    ctx.restore();
  };

  UI.roundBtn = function (ctx, x, y, r, hover, opt) {
    opt = opt || {};
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); H.circ(ctx, x + 1, y + 3, r); ctx.fill();
    ctx.beginPath(); H.circ(ctx, x, y, r);
    const base = opt.col || '#a86d3a';
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, U.shade(base, hover ? 0.45 : 0.3)); g.addColorStop(1, U.shade(base, hover ? -0.05 : -0.25));
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#2e1a0c'; ctx.stroke();
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,230,180,0.4)';
    ctx.beginPath(); H.circ(ctx, x, y, r - 3.5); ctx.stroke();
    ctx.restore();
  };

  UI.wrap = function (ctx, text, maxW) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    }
    if (line) lines.push(line);
    return lines;
  };

  UI.priceTag = function (ctx, x, y, cost, ok) {
    ctx.save();
    ctx.font = `14px ${TITLE}`;
    const w = ctx.measureText(String(cost)).width + 22;
    ctx.beginPath(); H.rr(ctx, x - w / 2, y - 9, w, 18, 9);
    ctx.fillStyle = ok ? '#3a2210' : '#4a2a2a'; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = ok ? '#e9b93c' : '#8a4a4a'; ctx.stroke();
    Art.blit(ctx, Art.icon('poko', 14), x - w / 2 + 9, y);
    H.text(ctx, String(cost), x + 7, y + 0.5, 13, ok ? '#ffe36a' : '#c99', { shadow: false, lw: 3 });
    ctx.restore();
  };

  /* ---------------- portraits per tower def ---------------- */
  PTD.towerPortrait = function (id) {
    const d = TW[id];
    if (d.family === 'den') {
      if (d.soldier === 'breadbug') return 'bread:breadbug';
      return 'borb:' + d.soldier;
    }
    return 'cre:' + d.creature;
  };
  PTD.enemyPortrait = function (type, tier) {
    const d = PTD.ENEMIES[type];
    return d.pik ? `pik:${type}.${tier == null ? 2 : tier}` : 'cap:' + type;
  };

  PTD.towerStats = function (id) {
    const d = TW[id];
    if (d.family === 'den') return [`${d.count} × ${d.hp} HP`, `Bite ${d.dmg[0]}-${d.dmg[1]}`, `Armour ${Math.round(d.armor * 100)}%`];
    const out = [];
    const dmg = `${d.dmg[0]}-${d.dmg[1]}`;
    out.push(d.burst ? `${dmg} ×${d.burst}` : `Damage ${dmg}`);
    out.push(`Every ${d.rate}s`);
    out.push(`Range ${d.range}`);
    if (d.splash) out.push(`Splash ${d.splash}`);
    out.push(d.dtype === 'phys' ? 'Physical' : d.dtype === 'fire' ? 'Fire' : 'Magic');
    if (!d.air) out.push('Ground only');
    return out;
  };

  /* ================= HUD rendering ================= */
  G.initUI = function () {
    this.ui = {
      mx: -100, my: -100, buttons: [], menu: null, selected: null, mode: null,
      hoverItem: null, hoverSpot: null, hoverTower: null, tip: null, newEnemy: null, confirm: null,
    };
    this.on('newEnemy', (type) => { this.ui.newEnemy = { type, t: 0, start: performance.now() }; });
  };

  G.renderHUD = function (ctx) {
    const ui = this.ui;
    ui.buttons = [];
    ui.tip = null;
    const mx = ui.mx, my = ui.my;
    const hov = (x, y, r) => U.dist(mx, my, x, y) <= r;
    const hovR = (x, y, w, h) => mx >= x && mx <= x + w && my >= y && my <= y + h;

    // ---- wave call flags ----
    if (this.canCallWave()) {
      const groups = this.waveGroups(this.waveIdx);
      const paths = [...new Set(groups.map((g) => g.path))];
      for (const pi of paths) {
        const p = this.lv.paths[pi];
        const pos = p.posAt(p.entryD + 26);
        const x = U.clamp(pos.x, 44, PTD.W - 44), y = U.clamp(pos.y, 120, PTD.H - 44);
        const pulse = 1 + Math.sin(this.time * 6 + performance.now() / 300) * 0.06;
        const r = 24 * pulse;
        const h = hov(x, y, 26);
        UI.roundBtn(ctx, x, y, r, h, { col: this.started ? '#4f8f3a' : '#d9822a' });
        if (this.started && this.nextWaveT > 0) {
          const k = this.nextWaveT / this.nextWaveMax;
          ctx.save();
          ctx.beginPath(); ctx.arc(x, y, r + 4, -Math.PI / 2, -Math.PI / 2 + TAU * k);
          ctx.lineWidth = 4; ctx.strokeStyle = '#ffe36a'; ctx.stroke();
          ctx.restore();
        }
        Art.blit(ctx, Art.icon('wave', 30), x, y - 1);
        if (!this.started) {
          ctx.save();
          const bob = Math.sin(performance.now() / 200) * 4;
          // arrow pointing at the flag
          ctx.translate(x, y - 46 + bob);
          ctx.beginPath(); ctx.moveTo(-9, -8); ctx.lineTo(9, -8); ctx.lineTo(9, 2); ctx.lineTo(15, 2); ctx.lineTo(0, 14); ctx.lineTo(-15, 2); ctx.lineTo(-9, 2); ctx.closePath();
          ctx.fillStyle = '#ffe36a'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = OUT; ctx.stroke();
          ctx.restore();
        }
        ui.buttons.push({ x, y, r: 28, onClick: () => this.callWave() });
        if (h) {
          const lines = [];
          for (const gr of groups.filter((g) => g.path === pi)) {
            const d = PTD.ENEMIES[gr.type];
            lines.push(`${gr.count} × ${d.pik ? PTD.TIER.names[gr.tier] + ' ' : ''}${d.name}`);
          }
          ui.tip = {
            x, y: y + 34, title: this.started ? `Call wave ${this.waveIdx + 1} early` : `Start wave 1`,
            lines: lines.concat(this.started && this.nextWaveT > 0 ? [`Bonus: +${Math.round(this.nextWaveT * 2)} pokos`] : ['Click to send the Pikmin in!']),
            icons: groups.filter((g) => g.path === pi).map((g) => PTD.enemyPortrait(g.type, g.tier)),
          };
        }
      }
    }

    // ---- top-left resources ----
    UI.plank(ctx, 10, 8, 262, 46);
    Art.blit(ctx, Art.icon('heart', 30), 36, 31);
    H.text(ctx, String(this.lives), 70, 32, 24, this.lives <= 5 ? '#ff7a6a' : '#ffffff', { align: 'left' });
    Art.blit(ctx, Art.icon('poko', 30), 132, 31);
    H.text(ctx, String(Math.floor(this.gold)), 152, 32, 24, '#ffe36a', { align: 'left' });
    UI.plank(ctx, 10, 58, 180, 34, { noNails: true });
    Art.blit(ctx, Art.icon('wave', 24), 32, 75);
    H.text(ctx, `WAVE ${Math.min(this.waveIdx, this.waveTotal)}/${this.waveTotal}`, 52, 76, 18, '#ffffff', { align: 'left' });

    // ---- top-right buttons ----
    const btns = [
      { x: 1238, icon: this.paused ? 'play' : 'pause', fn: () => PTD.Screens.pause(), tip: 'Pause (Space)' },
      { x: 1188, icon: this.speed === 2 ? 'speed2' : 'speed1', fn: () => { this.speed = this.speed === 2 ? 1 : 2; sfx('click'); }, tip: 'Game speed (F)' },
      { x: 1138, icon: PTD.Audio.muted ? 'mute' : 'sound', fn: () => { PTD.Screens.toggleMute(); }, tip: 'Sound (M)' },
    ];
    for (const b of btns) {
      const h = hov(b.x, 38, 22);
      UI.roundBtn(ctx, b.x, 38, 22, h);
      Art.blit(ctx, Art.icon(b.icon, 26), b.x, 38);
      ui.buttons.push({ x: b.x, y: 38, r: 22, onClick: b.fn });
    }

    // ---- boss bar ----
    if (this.boss && !this.boss.dead) {
      const b = this.boss;
      const w = 420, x = PTD.W / 2 - w / 2, y = 16;
      UI.plank(ctx, x - 50, y - 6, w + 64, 40, { noNails: true, c1: '#6a3fa0', c2: '#4f2c7a', c3: '#3a1f5a' });
      Art.blit(ctx, Art.portrait('cap:president', 44), x - 22, y + 14);
      ctx.fillStyle = '#2a1608'; ctx.fillRect(x + 8, y + 12, w - 10, 14);
      ctx.fillStyle = '#b32a1e'; ctx.fillRect(x + 10, y + 14, w - 14, 10);
      ctx.fillStyle = '#ffd23a'; ctx.fillRect(x + 10, y + 14, (w - 14) * Math.max(0, b.hp / b.maxHp), 10);
      H.text(ctx, 'THE PRESIDENT', x + w / 2, y + 4, 14, '#ffe36a', { lw: 3 });
    }

    // ---- hero portrait ----
    const h = this.hero;
    {
      const x = 54, y = 664, r = 38;
      const sel = ui.selected === h;
      const hv = hov(x, y, r);
      ctx.save();
      ctx.beginPath(); H.circ(ctx, x, y, r + 6); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
      ctx.restore();
      Art.blit(ctx, Art.portrait('borb:emperor', r * 2, { gray: h.dead, ring: sel ? '#ffe36a' : null }), x, y);
      // hp ring
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, r + 3, Math.PI * 0.5, Math.PI * 0.5 + TAU * (h.dead ? 0 : h.hp / h.maxHp));
      ctx.lineWidth = 5; ctx.strokeStyle = '#7ee04a'; ctx.stroke();
      ctx.restore();
      if (h.dead) H.text(ctx, String(Math.ceil(h.respawnT)), x, y, 26, '#ffffff');
      ctx.beginPath(); H.circ(ctx, x + 28, y + 26, 11); ctx.fillStyle = '#6a3fa0'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = OUT; ctx.stroke();
      H.text(ctx, String(h.level), x + 28, y + 26.5, 14, '#ffe36a', { lw: 3 });
      if (hv || sel) {
        ctx.save(); ctx.globalAlpha = 0.25; ctx.beginPath(); H.circ(ctx, x, y, r); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
      }
      ui.buttons.push({ x, y, r, onClick: () => { if (!h.dead) { ui.selected = ui.selected === h ? null : h; ui.menu = null; ui.mode = null; sfx('click'); } } });
      if (hv) ui.tip = { x: x + 40, y: y - 150, title: `${PTD.HERO.name}  ·  Lv ${h.level}`, lines: [PTD.HERO.desc, `HP ${Math.ceil(h.hp)}/${h.maxHp} · Bite ${Math.round(h.dmg[0] * h.dmgMul)}-${Math.round(h.dmg[1] * h.dmgMul)}`], anchor: 'bl' };
    }

    // ---- spells ----
    const spells = [
      { id: 'snagret', x: 136, icon: 'spell:snagret', key: '1' },
      { id: 'reinforce', x: 206, icon: 'spell:reinforce', key: '2' },
    ];
    for (const s of spells) {
      const y = 676, r = 30;
      const sp = this.spells[s.id];
      const ready = sp.cd <= 0;
      const active = ui.mode === s.id;
      const hv = hov(s.x, y, r);
      ctx.save(); ctx.beginPath(); H.circ(ctx, s.x, y, r + 4); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill(); ctx.restore();
      Art.blit(ctx, Art.portrait(s.icon, r * 2, { gray: !ready, ring: active ? '#ffe36a' : '#7ad0ff' }), s.x, y);
      if (!ready) {
        ctx.save();
        ctx.beginPath(); ctx.moveTo(s.x, y); ctx.arc(s.x, y, r - 2, -Math.PI / 2, -Math.PI / 2 + TAU * (sp.cd / sp.max)); ctx.closePath();
        ctx.fillStyle = 'rgba(20,10,30,0.45)'; ctx.fill();
        ctx.restore();
        H.text(ctx, String(Math.ceil(sp.cd)), s.x, y, 20, '#ffffff');
      } else if (active || hv) {
        ctx.save(); ctx.globalAlpha = 0.3 + 0.2 * Math.sin(this.time * 8); ctx.beginPath(); H.circ(ctx, s.x, y, r); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
      }
      ctx.beginPath(); H.circ(ctx, s.x + 21, y - 21, 9); ctx.fillStyle = '#2e1a0c'; ctx.fill();
      H.text(ctx, s.key, s.x + 21, y - 20.5, 11, '#fff', { shadow: false, lw: 2 });
      ui.buttons.push({ x: s.x, y, r, onClick: () => this.toggleSpell(s.id) });
      if (hv) {
        const S = PTD.SPELLS[s.id];
        ui.tip = { x: s.x + 30, y: y - 120, title: S.name, lines: [S.desc, `Cooldown ${S.cd}s`], anchor: 'bl' };
      }
    }

    // ---- selection info panel ----
    this.renderInfoPanel(ctx);

    // ---- ring menu ----
    if (ui.menu) this.renderRing(ctx);

    // ---- targeting cursors ----
    if (ui.mode === 'snagret' || ui.mode === 'reinforce') {
      const valid = ui.mode === 'snagret' || this.lv.distToPath(mx, my) <= 50;
      ctx.save();
      const r = ui.mode === 'snagret' ? PTD.SPELLS.snagret.radius : 26;
      ctx.beginPath(); ctx.ellipse(mx, my, r, r * 0.8, 0, 0, TAU);
      ctx.fillStyle = valid ? 'rgba(255,230,120,0.18)' : 'rgba(255,80,80,0.18)'; ctx.fill();
      ctx.setLineDash([7, 5]); ctx.lineDashOffset = -this.time * 30;
      ctx.lineWidth = 2.5; ctx.strokeStyle = valid ? '#ffe36a' : '#ff6a5a'; ctx.stroke();
      ctx.restore();
      this.banner(ctx, ui.mode === 'snagret' ? 'Click to summon the Snagret!' : 'Click on the trail to send reinforcements');
    } else if (ui.mode === 'rally') {
      const t = ui.menu && ui.menu.tower;
      const valid = t && this.lv.distToPath(mx, my) <= 40 && ((mx - t.x) ** 2 + ((my - t.y) / 0.8) ** 2) <= t.def.range ** 2;
      Art.blit(ctx, Art.icon('rally', 28), mx + 4, my - 12, false, 1, valid ? 1 : 0.45);
      this.banner(ctx, 'Click on the trail inside the range to set the rally point');
    } else if (ui.selected === h && !h.dead) {
      this.banner(ctx, 'Click anywhere to move the Emperor');
    }

    // ---- new enemy card ----
    if (ui.newEnemy) {
      const ne = ui.newEnemy;
      if (!this.paused) ne.t = (performance.now() - ne.start) / 1000; else ne.start = performance.now() - ne.t * 1000;
      const dur = 8;
      if (ne.t > dur) ui.newEnemy = null;
      else {
        const k = ne.t < 0.4 ? U.easeOutBack(ne.t / 0.4) : ne.t > dur - 0.4 ? 1 - (ne.t - (dur - 0.4)) / 0.4 : 1;
        const x = -260 + 272 * k, y = 110;
        const d = PTD.ENEMIES[ne.type];
        UI.parchment(ctx, x, y, 250, 92);
        Art.blit(ctx, Art.portrait(PTD.enemyPortrait(ne.type, 0), 64), x + 42, y + 46);
        H.text(ctx, 'NEW ENEMY!', x + 80, y + 18, 14, '#d9822a', { align: 'left', lw: 3 });
        H.text(ctx, d.name, x + 80, y + 38, 17, '#5a3214', { align: 'left', stroke: false, shadow: false });
        ctx.save(); ctx.font = `700 12px ${FONT}`; ctx.fillStyle = '#5a3a1a'; ctx.textBaseline = 'top';
        UI.wrap(ctx, d.tip, 160).slice(0, 3).forEach((l, i) => ctx.fillText(l, x + 80, y + 50 + i * 14));
        ctx.restore();
        ui.buttons.push({ rect: [x, y, 250, 92], onClick: () => { ui.newEnemy = null; } });
      }
    }

    // ---- tooltip ----
    if (ui.tip) this.renderTip(ctx, ui.tip);
    void hovR;
  };

  G.banner = function (ctx, text) {
    ctx.save();
    ctx.font = `16px ${TITLE}`;
    const w = ctx.measureText(text).width + 40;
    UI.plank(ctx, PTD.W / 2 - w / 2, 100, w, 34, { noNails: true });
    H.text(ctx, text, PTD.W / 2, 117, 16, '#fff6e0', { lw: 3 });
    ctx.restore();
  };

  G.renderTip = function (ctx, tip) {
    ctx.save();
    const W = 260;
    ctx.font = `700 13px ${FONT}`;
    const lines = [];
    for (const l of tip.lines) lines.push(...UI.wrap(ctx, l, W - 24));
    const iconsH = tip.icons && tip.icons.length ? 40 : 0;
    const h = 40 + lines.length * 16 + iconsH + (tip.stats ? 22 : 0);
    let x = tip.x - W / 2, y = tip.y;
    if (tip.anchor === 'bl') { x = tip.x; y = tip.y - h + 120; }
    x = U.clamp(x, 8, PTD.W - W - 8);
    y = U.clamp(y, 8, PTD.H - h - 8);
    UI.parchment(ctx, x, y, W, h);
    H.text(ctx, tip.title, x + 12, y + 18, 17, '#7a3f12', { align: 'left', stroke: false, shadow: false });
    ctx.font = `700 13px ${FONT}`;
    ctx.fillStyle = '#4a3018'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 32 + i * 16));
    let yy = y + 34 + lines.length * 16;
    if (tip.stats) {
      ctx.font = `800 12px ${FONT}`;
      let sx = x + 12;
      for (const s of tip.stats) {
        const w = ctx.measureText(s).width + 12;
        if (sx + w > x + W - 8) break;
        ctx.fillStyle = 'rgba(122,74,36,0.15)'; ctx.beginPath(); H.rr(ctx, sx, yy, w, 18, 6); ctx.fill();
        ctx.fillStyle = '#6a3a14'; ctx.fillText(s, sx + 6, yy + 3);
        sx += w + 4;
      }
      yy += 22;
    }
    if (iconsH) {
      tip.icons.forEach((ic, i) => Art.blit(ctx, Art.portrait(ic, 34), x + 28 + i * 38, yy + 18));
    }
    ctx.restore();
  };

  /* ---------------- info panel ---------------- */
  G.renderInfoPanel = function (ctx) {
    const sel = this.ui.selected;
    if (!sel) return;
    if (sel.dead && !sel.isHero) { this.ui.selected = null; return; }
    let por, name, stats = [];
    if (sel.isHero) {
      por = 'borb:emperor'; name = `${PTD.HERO.name} (Lv ${sel.level})`;
      stats = [`HP ${Math.ceil(sel.hp)}/${sel.maxHp}`, `Bite ${Math.round(sel.dmg[0] * sel.dmgMul)}-${Math.round(sel.dmg[1] * sel.dmgMul)}`, `Armour ${Math.round(sel.armor * 100)}%`];
    } else if (sel.def && sel.path) {
      const d = sel.def;
      por = PTD.enemyPortrait(sel.type, sel.tier);
      name = (d.pik ? PTD.TIER.names[sel.tier] + ' ' : '') + d.name;
      stats = [`HP ${Math.ceil(sel.hp)}/${sel.maxHp}`, `Armour ${Math.round((d.armor || 0) * 100)}%`, `Magic res ${Math.round((d.mres || 0) * 100)}%`, `Lives ${d.lives}`];
      if (d.flying) stats.push('Flying');
    } else return;
    const w = 470, x = PTD.W / 2 - w / 2, y = PTD.H - 62;
    UI.plank(ctx, x, y, w, 54, { noNails: true });
    Art.blit(ctx, Art.portrait(por, 46), x + 30, y + 27);
    H.text(ctx, name, x + 62, y + 17, 17, '#fff6e0', { align: 'left', lw: 3 });
    ctx.save();
    ctx.font = `800 13px ${FONT}`; ctx.fillStyle = '#ffe9c0'; ctx.textBaseline = 'middle';
    let sx = x + 62;
    for (const s of stats) { ctx.fillText(s, sx, y + 39); sx += ctx.measureText(s).width + 16; }
    ctx.restore();
  };

  /* ---------------- ring menu ---------------- */
  G.ringItems = function () {
    const m = this.ui.menu;
    const items = [];
    const R = 58;
    const at = (deg) => ({ x: m.cx + Math.cos((deg * Math.PI) / 180) * R, y: m.cy + Math.sin((deg * Math.PI) / 180) * R * 0.92 });
    if (m.spot && !m.tower) {
      const angs = [-135, -45, 135, 45];
      PTD.BUILD_LIST.forEach((id, i) => {
        const d = TW[id];
        const p = at(angs[i]);
        items.push({
          ...p, kind: 'build', id, cost: d.cost, ok: this.gold >= d.cost, portrait: PTD.towerPortrait(id), preview: id,
          tip: { title: d.name, lines: [d.desc], stats: PTD.towerStats(id) },
          act: () => { if (this.build(m.spot, id)) this.closeMenu(); },
        });
      });
    } else if (m.tower) {
      const t = m.tower;
      const nx = t.def.next;
      if (nx.length === 1) {
        const d = TW[nx[0]];
        items.push({
          ...at(-90), kind: 'upgrade', id: nx[0], cost: d.cost, ok: this.gold >= d.cost, icon: 'upgrade', preview: nx[0],
          tip: { title: 'Upgrade: ' + d.name, lines: [d.desc], stats: PTD.towerStats(nx[0]) },
          act: () => { if (this.upgrade(t, nx[0])) this.closeMenu(); },
        });
      } else if (nx.length === 2) {
        [-128, -52].forEach((deg, i) => {
          const d = TW[nx[i]];
          items.push({
            ...at(deg), kind: 'upgrade', id: nx[i], cost: d.cost, ok: this.gold >= d.cost, portrait: PTD.towerPortrait(nx[i]), preview: nx[i], elite: true,
            tip: { title: d.name, lines: [d.desc], stats: PTD.towerStats(nx[i]) },
            act: () => { if (this.upgrade(t, nx[i])) this.closeMenu(); },
          });
        });
      } else {
        items.push({ ...at(-90), kind: 'max', icon: 'star', ok: true, tip: { title: t.def.name, lines: ['Fully evolved!', t.def.desc], stats: PTD.towerStats(t.id) }, act: () => {} });
      }
      const sv = this.sellValue(t);
      items.push({
        ...at(90), kind: 'sell', icon: 'sell', cost: sv, ok: true, refund: true,
        tip: { title: 'Sell', lines: [`Release the creature for ${sv} pokos.`] },
        act: () => { this.sell(t); this.closeMenu(); },
      });
      if (t.family === 'den') {
        items.push({
          ...at(28), kind: 'rally', icon: 'rally', ok: true,
          tip: { title: 'Rally point', lines: ['Choose where the den\'s creatures stand guard.'] },
          act: () => { this.ui.mode = 'rally'; sfx('click'); },
        });
      }
    }
    return items;
  };

  G.renderRing = function (ctx) {
    const ui = this.ui;
    const m = ui.menu;
    const k = Math.min(1, (performance.now() - m.opened) / 160);
    const e = U.easeOutBack(k);
    ctx.save();
    // ring
    ctx.beginPath(); ctx.ellipse(m.cx, m.cy, 58 * e, 53 * e, 0, 0, TAU);
    ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(40,24,10,0.55)'; ctx.stroke();
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,236,190,0.75)'; ctx.stroke();
    const items = this.ringItems();
    ui.hoverItem = null;
    for (const it of items) {
      const x = U.lerp(m.cx, it.x, e), y = U.lerp(m.cy, it.y, e);
      const hv = U.dist(ui.mx, ui.my, x, y) <= 24;
      if (hv) ui.hoverItem = it;
      const conf = ui.confirm === it.id + it.kind;
      if (it.portrait) {
        ctx.save();
        ctx.beginPath(); H.circ(ctx, x, y + 3, 25); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
        ctx.restore();
        Art.blit(ctx, Art.portrait(it.portrait, 50, { gray: !it.ok, ring: it.elite ? '#e9b93c' : hv ? '#ffe36a' : null }), x, y, false, hv ? 1.08 : 1);
      } else {
        UI.roundBtn(ctx, x, y, 22, hv, { col: it.kind === 'sell' ? '#a86d3a' : it.kind === 'upgrade' ? (it.ok ? '#4f9a3a' : '#6a6a6a') : it.kind === 'max' ? '#8a5ac8' : '#3f7fb0' });
        Art.blit(ctx, Art.icon(it.icon, 26), x, y);
      }
      if (conf) Art.blit(ctx, Art.icon('check', 26), x + 16, y - 16);
      if (it.cost != null && it.kind !== 'max') UI.priceTag(ctx, x, y + 27, it.cost, it.ok);
      if (hv) {
        ui.tip = Object.assign({ x: m.cx, y: m.cy + (m.cy > PTD.H / 2 ? -230 : 90) }, it.tip);
      }
    }
    ctx.restore();
  };

  G.openMenu = function (spot) {
    const ui = this.ui;
    const cx = U.clamp(spot.x, 90, PTD.W - 90);
    const cy = U.clamp(spot.y - 12, 92, PTD.H - 96);
    ui.menu = { spot, tower: spot.tower, cx, cy, opened: performance.now() };
    ui.selected = null;
    ui.mode = null;
    ui.confirm = null;
    sfx('click');
  };

  G.closeMenu = function () {
    this.ui.menu = null;
    this.ui.mode = null;
    this.ui.confirm = null;
    this.ui.hoverItem = null;
  };

  G.toggleSpell = function (id) {
    const ui = this.ui;
    if (this.spells[id].cd > 0) { sfx('deny'); return; }
    ui.mode = ui.mode === id ? null : id;
    ui.menu = null;
    ui.selected = null;
    sfx('click');
  };

  /* ================= INPUT ================= */
  G.pointerMove = function (x, y) {
    const ui = this.ui;
    ui.mx = x; ui.my = y;
    ui.hoverSpot = null;
    ui.hoverTower = null;
    if (ui.mode) return 'crosshair';
    for (const b of ui.buttons) if (this.hitBtn(b, x, y)) return 'pointer';
    if (ui.menu && ui.hoverItem) return 'pointer';
    const s = this.spotAt(x, y);
    if (s) {
      if (s.tower) ui.hoverTower = s.tower; else ui.hoverSpot = s;
      return 'pointer';
    }
    if (this.heroAt(x, y)) return 'pointer';
    if (this.enemyAt(x, y)) return 'pointer';
    return ui.selected === this.hero ? 'crosshair' : 'default';
  };

  G.hitBtn = function (b, x, y) {
    if (b.rect) return x >= b.rect[0] && x <= b.rect[0] + b.rect[2] && y >= b.rect[1] && y <= b.rect[1] + b.rect[3];
    return U.dist(x, y, b.x, b.y) <= b.r;
  };

  G.spotAt = function (x, y) {
    let best = null, bd = 1e9;
    for (const s of this.spots) {
      const dx = (x - s.x) / 36, dy = (y - (s.y - (s.tower ? 22 : 4))) / (s.tower ? 40 : 22);
      const d = dx * dx + dy * dy;
      if (d < 1 && d < bd) { bd = d; best = s; }
    }
    return best;
  };

  G.heroAt = function (x, y) {
    const h = this.hero;
    if (h.dead) return null;
    return U.dist(x, y, h.x, h.y - 20) < 30 ? h : null;
  };

  G.enemyAt = function (x, y) {
    let best = null, bd = 1e9;
    for (const e of this.enemies) {
      if (e.dead || e.d < 0) continue;
      const ey = e.y - (e.flying ? 36 : 16);
      const r = e.def.pik ? 16 : 24;
      const d = U.dist(x, y, e.x, ey);
      if (d < r && d < bd) { bd = d; best = e; }
    }
    return best;
  };

  G.pointerDown = function (x, y, touch) {
    const ui = this.ui;
    ui.mx = x; ui.my = y;
    if (this.over) return;
    // 1. HUD buttons (topmost last)
    for (let i = ui.buttons.length - 1; i >= 0; i--) {
      if (this.hitBtn(ui.buttons[i], x, y)) { ui.buttons[i].onClick(); return; }
    }
    // 2. ring menu
    if (ui.menu && !ui.mode) {
      const items = this.ringItems();
      for (const it of items) {
        if (U.dist(x, y, it.x, it.y) <= 25) {
          if (!it.ok) { sfx('deny'); return; }
          const key = it.id + it.kind;
          if (touch && it.kind !== 'rally' && ui.confirm !== key) { ui.confirm = key; ui.hoverItem = it; sfx('click'); return; }
          it.act();
          return;
        }
      }
      const s = this.spotAt(x, y);
      const prev = ui.menu.spot;
      this.closeMenu();
      if (s && s !== prev) this.openMenu(s);
      return;
    }
    // 3. modes
    if (ui.mode === 'snagret' || ui.mode === 'reinforce') {
      if (this.castSpell(ui.mode, x, y)) ui.mode = null;
      return;
    }
    if (ui.mode === 'rally') {
      const t = ui.menu && ui.menu.tower;
      if (t && this.setRally(t, x, y)) this.closeMenu();
      else sfx('deny');
      return;
    }
    // 4. world
    const s = this.spotAt(x, y);
    if (s) { this.openMenu(s); return; }
    const h = this.heroAt(x, y);
    if (h) { ui.selected = ui.selected === h ? null : h; sfx('click'); return; }
    if (ui.selected === this.hero) {
      this.moveHero(x, y);
      ui.selected = null;
      return;
    }
    const e = this.enemyAt(x, y);
    if (e) { ui.selected = e; sfx('click'); return; }
    ui.selected = null;
  };

  G.keyDown = function (key) {
    const ui = this.ui;
    switch (key) {
      case '1': this.toggleSpell('snagret'); break;
      case '2': this.toggleSpell('reinforce'); break;
      case 'h': case 'H':
        if (!this.hero.dead) { ui.selected = ui.selected === this.hero ? null : this.hero; ui.menu = null; ui.mode = null; }
        break;
      case 'f': case 'F': this.speed = this.speed === 2 ? 1 : 2; break;
      case 'n': case 'N': this.callWave(); break;
      case 'Escape': this.closeMenu(); ui.selected = null; break;
    }
  };
})();
