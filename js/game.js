/* Bulborb Rush — core game simulation (no rendering here). */
(function () {
  'use strict';
  const PTD = window.PTD;
  const U = PTD.U;
  const E = PTD.ENEMIES;
  const T = PTD.TOWERS;
  const TIER = PTD.TIER;
  const sfx = (n) => PTD.Audio && PTD.Audio.play(n);

  const DIFF = { casual: { hp: 0.75, gold: 1.1 }, normal: { hp: 1, gold: 1 }, veteran: { hp: 1.3, gold: 0.95 } };
  PTD.DIFF = DIFF;

  /* muzzle offsets in creature-local coords (facing right) — multiplied by scale */
  const MUZZLE = {
    groink: [32, -23], manatlegs: [36, -40], snitch: [22, -44], fiery: [30, -29], withering: [30, -29],
    puffy: [34, -46], larva: [26, -20], decorated: [32, -20], wolly: [10, -24],
  };

  let UID = 1;

  class Game {
    constructor(def, opts) {
      opts = opts || {};
      this.def = def;
      this.lv = PTD.buildLevel(def);
      this.diff = DIFF[opts.difficulty || 'normal'];
      this.difficulty = opts.difficulty || 'normal';
      this.hpMul = (def.hpMul || 1) * this.diff.hp;
      this.lives = 20;
      this.gold = def.gold;
      this.time = 0;
      this.speed = 1;
      this.paused = false;
      this.over = false;
      this.result = null;
      this.enemies = [];
      this.towers = [];
      this.units = []; // soldiers + reinforcements (hero separate)
      this.projectiles = [];
      this.effects = [];
      this.particles = [];
      this.floaters = [];
      this.decals = [];
      this.spawners = [];
      this.waveIdx = 0; // number of waves started
      this.waveTotal = def.waves.length;
      this.nextWaveT = -1; // countdown until auto-start (-1 = waiting for player)
      this.nextWaveMax = 1;
      this.started = false;
      this.listeners = {};
      this.seenTypes = opts.seen || {};
      this.shake = 0;
      this.stats = { kills: 0, built: 0 };
      this.spots = this.lv.spots.map((s, i) => ({ id: i, x: s.x, y: s.y, tower: null }));
      this.spells = {
        snagret: { cd: 0, max: PTD.SPELLS.snagret.cd },
        reinforce: { cd: 0, max: PTD.SPELLS.reinforce.cd },
      };
      this.hero = this.makeHero();
      this.boss = null;
    }

    on(ev, fn) { (this.listeners[ev] = this.listeners[ev] || []).push(fn); }
    emit(ev, data) { (this.listeners[ev] || []).forEach((f) => f(data)); }

    /* ======================= WAVES ======================= */
    waveGroups(i) { return this.def.waves[i] || []; }

    canCallWave() { return !this.over && this.waveIdx < this.waveTotal && (this.nextWaveT >= 0 || !this.started); }

    callWave() {
      if (!this.canCallWave()) return;
      if (this.started && this.nextWaveT > 0) {
        const bonus = Math.round(this.nextWaveT * 2);
        if (bonus > 0) {
          this.gold += bonus;
          const wp = this.lv.paths[this.waveGroups(this.waveIdx)[0].path] || this.lv.paths[0];
          const e = wp.posAt(wp.entryD + 20);
          this.floater('+' + bonus, e.x, e.y - 30, '#ffe066', 18);
          sfx('coin');
        }
        for (const k in this.spells) this.spells[k].cd = Math.max(0, this.spells[k].cd - this.nextWaveT * 0.5);
      }
      this.started = true;
      const groups = this.waveGroups(this.waveIdx);
      for (const gr of groups) this.spawners.push(Object.assign({ t: -gr.delay, spawned: 0 }, gr));
      // new enemy notifications
      for (const gr of groups) {
        if (!this.seenTypes[gr.type]) {
          this.seenTypes[gr.type] = true;
          this.emit('newEnemy', gr.type);
        }
      }
      this.waveIdx++;
      this.nextWaveT = -1;
      sfx('wave');
      this.emit('wave', this.waveIdx);
    }

    updateWaves(dt) {
      for (const s of this.spawners) {
        s.t += dt;
        while (s.spawned < s.count && s.t >= s.spawned * s.gap) {
          this.spawnEnemy(s.type, s.tier, s.path);
          s.spawned++;
        }
      }
      this.spawners = this.spawners.filter((s) => s.spawned < s.count);
      // once the current wave finished spawning, start the countdown for the next
      if (this.started && this.spawners.length === 0 && this.nextWaveT < 0 && this.waveIdx < this.waveTotal) {
        this.nextWaveT = this.nextWaveMax = 16;
      }
      if (this.nextWaveT > 0) {
        this.nextWaveT -= dt;
        if (this.nextWaveT <= 0) {
          this.nextWaveT = 0;
          this.callWave();
        }
      }
      if (!this.over && this.started && this.waveIdx >= this.waveTotal && this.spawners.length === 0 && this.enemies.length === 0) {
        this.finish(true);
      }
    }

    /* ======================= ENEMIES ======================= */
    spawnEnemy(type, tier, pathIdx, atD, nearX, nearY) {
      const d = E[type];
      const path = this.lv.paths[pathIdx] || this.lv.paths[0];
      tier = d.pik ? tier || 0 : 0;
      const hp = Math.round(d.hp * (d.pik ? TIER.hp[tier] : 1) * this.hpMul);
      const e = {
        uid: UID++,
        type, def: d, tier,
        path, d: atD != null ? atD : -U.rand(0, 20),
        lane: U.rand(-1, 1) * (d.captain ? 6 : 13),
        hp, maxHp: hp,
        baseSpeed: d.speed * (d.pik ? TIER.speed[tier] : 1) * U.rand(0.94, 1.06),
        x: 0, y: 0, dx: 1, dy: 0,
        flying: !!d.flying,
        blocker: null, engagers: 0,
        cd: U.rand(0, d.rate), atkAnim: 0,
        slowT: 0, slowF: 1, burnT: 0, burnDps: 0, stunT: 0, buffT: 0,
        flashT: 0, walk: Math.random(),
        abilityT: U.rand(3, 6), snacked: false,
        dead: false, carried: false, alpha: 1,
      };
      if (nearX != null) e.lane = U.clamp(e.lane, -6, 6);
      this.placeEnemy(e);
      this.enemies.push(e);
      if (d.boss) {
        this.boss = e;
        sfx('bossroar');
        this.shake = 0.6;
        this.emit('boss', e);
      }
      return e;
    }

    placeEnemy(e) {
      const p = e.path.posAt(Math.max(0, e.d), this._tmp || (this._tmp = {}));
      e.x = p.x - p.dy * e.lane;
      e.y = p.y + p.dx * e.lane;
      e.dx = p.dx; e.dy = p.dy;
    }

    /** predicted position after t seconds */
    predict(e, t) {
      if (e.blocker || e.stunT > 0 || e.carried) return { x: e.x, y: e.y };
      const p = e.path.posAt(Math.max(0, e.d + this.enemySpeed(e) * t));
      return { x: p.x - p.dy * e.lane, y: p.y + p.dx * e.lane };
    }

    enemySpeed(e) {
      let s = e.baseSpeed;
      if (e.slowT > 0) s *= e.slowF;
      if (e.buffT > 0) s *= 1.4;
      return s;
    }

    updateEnemies(dt) {
      for (const e of this.enemies) {
        if (e.dead || e.carried) continue;
        e.flashT -= dt;
        if (e.atkAnim > 0) e.atkAnim = Math.max(0, e.atkAnim - dt / 0.4);
        if (e.slowT > 0) e.slowT -= dt;
        if (e.buffT > 0) e.buffT -= dt;
        if (e.burnT > 0) {
          e.burnT -= dt;
          this.damage(e, e.burnDps * dt, 'fire', null, true);
          if (Math.random() < dt * 8) this.particle('ember', e.x + U.rand(-5, 5), e.y - U.rand(8, 22) - (e.flying ? 22 : 0));
          if (e.dead) continue;
        }
        this.updateCaptain(e, dt);
        if (e.dead) continue;
        if (e.stunT > 0) { e.stunT -= dt; continue; }
        // blocked → fight
        if (e.blocker && !e.flying) {
          const b = e.blocker;
          if (b.dead || b.hp <= 0 || b.target !== e) { e.blocker = null; }
          else {
            e.cd -= dt;
            e.faceX = b.x - e.x; e.faceY = b.y - e.y;
            if (e.cd <= 0) {
              e.cd = e.def.rate;
              e.atkAnim = 1;
              this.hurtUnit(b, U.rand(e.def.dmg[0], e.def.dmg[1]), e);
              if (e.def.stunHit && Math.random() < 0.25) b.stunT = 0.8;
            }
            continue;
          }
        }
        e.faceX = null;
        const spd = this.enemySpeed(e);
        e.d += spd * dt;
        e.walk += dt * spd / 24;
        this.placeEnemy(e);
        if (e.d >= e.path.len) {
          this.leak(e);
        }
      }
      this.enemies = this.enemies.filter((e) => !e.dead);
      if (this.boss && this.boss.dead) this.boss = null;
    }

    updateCaptain(e, dt) {
      const ab = e.def.ability;
      if (!ab || e.d < 0) return;
      e.abilityT -= dt;
      if (ab === 'whistle' && e.abilityT <= 0) {
        e.abilityT = 6.5;
        let n = 0;
        for (const o of this.enemies) {
          if (o.def.pik && U.dist(o.x, o.y, e.x, e.y) < 120) { o.buffT = 3; o.slowT = 0; n++; }
        }
        this.effect({ kind: 'ring', x: e.x, y: e.y, r0: 10, r1: 120, dur: 0.7, col: '#ffe066' });
        this.floater('Whistle!', e.x, e.y - 52, '#ffe066', 13);
        sfx('whistle');
      } else if (ab === 'snack' && !e.snacked && e.hp < e.maxHp * 0.5) {
        e.snacked = true;
        e.stunT = 1.4;
        e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.35);
        this.floater('Munch!', e.x, e.y - 52, '#9be15d', 14);
        for (let i = 0; i < 10; i++) this.particle('juice', e.x, e.y - 30, '#ff9f43');
        sfx('heal');
      } else if (ab === 'pluck' && e.abilityT <= 0) {
        e.abilityT = 7;
        for (let i = 0; i < 2; i++) {
          const ne = this.spawnEnemy(U.pick(['red', 'yellow', 'blue']), 0, e.path.idx, Math.max(0, e.d - 14 - i * 10));
          ne.stunT = 0.6;
          for (let k = 0; k < 5; k++) this.particle('dust', ne.x, ne.y);
        }
        this.floater('Pluck!', e.x, e.y - 52, '#9be15d', 13);
      } else if (ab === 'heal' && e.abilityT <= 0) {
        e.abilityT = 6;
        for (const o of this.enemies) {
          if (o !== e && !o.def.boss && U.dist(o.x, o.y, e.x, e.y) < 110) {
            o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.3);
            this.particle('heal', o.x, o.y - 20);
          }
        }
        e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.08);
        this.effect({ kind: 'ring', x: e.x, y: e.y, r0: 10, r1: 110, dur: 0.8, col: '#ff8fcf' });
        sfx('heal');
      } else if (ab === 'summon' && e.abilityT <= 0) {
        e.abilityT = 9;
        const kinds = ['red', 'yellow', 'blue', 'purple', 'white'];
        for (let i = 0; i < 5; i++) {
          const ne = this.spawnEnemy(U.pick(kinds), 1, e.path.idx, Math.max(0, e.d - 20 - i * 9));
          ne.stunT = 0.5;
        }
        this.shake = 0.4;
        this.floater('Get them, Pikmin!', e.x, e.y - 90, '#ffd54a', 15);
        this.effect({ kind: 'ring', x: e.x, y: e.y, r0: 10, r1: 150, dur: 0.8, col: '#ffd54a' });
        sfx('bossroar');
      }
    }

    leak(e) {
      e.dead = true;
      this.releaseEnemy(e);
      this.lives = Math.max(0, this.lives - e.def.lives);
      this.floater('-' + e.def.lives, e.x, e.y - 30, '#ff5a5a', 20);
      this.shake = Math.max(this.shake, 0.25);
      sfx('life');
      this.emit('leak', e);
      if (this.lives <= 0) this.finish(false);
    }

    releaseEnemy(e) {
      if (e.blocker && e.blocker.target === e) e.blocker.target = null;
      e.blocker = null;
    }

    /** apply damage. returns actual damage */
    damage(e, amount, dtype, source, silent) {
      if (e.dead) return 0;
      let a = amount;
      const d = e.def;
      if (dtype === 'phys') a *= 1 - (d.armor || 0);
      else if (dtype === 'magic') a *= 1 - (d.mres || 0);
      else if (dtype === 'fire') a *= (1 - (d.mres || 0)) * (1 - (d.fireRes || 0));
      e.hp -= a;
      if (!silent) e.flashT = 0.08;
      if (source && source.isHero) this.heroXp(a * 0.5);
      if (e.hp <= 0) this.kill(e, source);
      return a;
    }

    kill(e, killer) {
      if (e.dead) return;
      e.dead = true;
      this.releaseEnemy(e);
      const reward = Math.round((e.def.reward + (e.def.pik ? TIER.reward[e.tier] : 0)) * this.diff.gold);
      this.gold += reward;
      this.stats.kills++;
      if (killer && killer.isHero) this.heroXp(e.def.captain ? 60 : 8);
      if (e.def.pik) {
        this.effect({ kind: 'ghost', x: e.x, y: e.y - (e.flying ? 22 : 0), t: 0, dur: 1.6, type: e.type });
        sfx('die');
      } else {
        this.effect({ kind: 'ko', x: e.x, y: e.y, t: 0, dur: 2.2, type: e.type, flip: e.dx < 0 });
        sfx('captainDown');
        this.shake = Math.max(this.shake, e.def.boss ? 1 : 0.2);
      }
      this.particle('coin', e.x, e.y - 20);
      this.floater('+' + reward, e.x + 8, e.y - 26, '#ffe066', 12);
      if (e.def.poison && killer && killer.isUnit && !killer.dead) {
        this.hurtUnit(killer, 25, null);
        for (let i = 0; i < 8; i++) this.particle('poison', killer.x, killer.y - 12);
        this.floater('Poisoned!', killer.x, killer.y - 30, '#c58ef3', 12);
      }
    }

    /* ======================= TOWERS ======================= */
    towerCost(id) { return T[id].cost; }

    build(spot, id) {
      const def = T[id];
      if (spot.tower || this.gold < def.cost) { sfx('deny'); return false; }
      this.gold -= def.cost;
      const t = {
        uid: UID++, spot, id, def, family: def.family, tier: def.tier,
        x: spot.x, y: spot.y, cd: 0.4, face: 1, atkT: 0, anim: Math.random() * 10,
        invested: def.cost, pending: null, burstLeft: 0, burstT: 0, abilityT: def.abilityCd || 0,
        units: [], rally: null, buildT: 0, away: false,
      };
      spot.tower = t;
      this.towers.push(t);
      if (def.family === 'den') this.setupDen(t, true);
      this.stats.built++;
      for (let i = 0; i < 14; i++) this.particle('dust', spot.x + U.rand(-26, 26), spot.y + U.rand(-8, 8));
      sfx('build');
      return true;
    }

    upgrade(t, id) {
      const def = T[id];
      if (!t.def.next.includes(id) || this.gold < def.cost) { sfx('deny'); return false; }
      this.gold -= def.cost;
      t.id = id; t.def = def; t.tier = def.tier; t.invested += def.cost;
      t.abilityT = def.abilityCd || 0;
      t.buildT = 0;
      if (def.family === 'den') this.setupDen(t, false);
      for (let i = 0; i < 16; i++) this.particle('spark', t.x + U.rand(-26, 26), t.y - U.rand(0, 40), '#ffe066');
      sfx('upgrade');
      return true;
    }

    sell(t) {
      const refund = Math.round(t.invested * 0.6);
      this.gold += refund;
      for (const u of t.units) this.removeUnit(u);
      t.units = [];
      t.spot.tower = null;
      this.towers = this.towers.filter((x) => x !== t);
      this.floater('+' + refund, t.x, t.y - 40, '#ffe066', 16);
      for (let i = 0; i < 14; i++) this.particle('dust', t.x + U.rand(-26, 26), t.y + U.rand(-8, 8));
      sfx('sell');
    }

    sellValue(t) { return Math.round(t.invested * 0.6); }

    /** ellipse range test (perspective) */
    inRange(t, e, range) {
      const dx = e.x - t.x, dy = (e.y - t.y) / 0.8;
      return dx * dx + dy * dy <= range * range;
    }

    acquire(t, range, air) {
      let best = null, bestRem = 1e9;
      for (const e of this.enemies) {
        if (e.dead || e.carried || e.d < 0) continue;
        if (e.flying && !air) continue;
        if (!this.inRange(t, e, range)) continue;
        const rem = e.path.len - e.d;
        if (rem < bestRem) { bestRem = rem; best = e; }
      }
      return best;
    }

    muzzle(t) {
      const def = t.def;
      const m = MUZZLE[def.creature] || [20, -20];
      const ph = PTD.Art.PLAT_H[t.tier];
      return { x: t.x + m[0] * def.scale * t.face, y: t.y - ph + m[1] * def.scale };
    }

    updateTowers(dt) {
      for (const t of this.towers) {
        const def = t.def;
        t.anim += dt;
        t.buildT += dt;
        if (t.atkT > 0) { t.atkT += dt / 0.42; if (t.atkT >= 1) t.atkT = 0; }
        if (def.family === 'den') { this.updateDen(t, dt); continue; }
        t.cd -= dt;
        if (def.ability) t.abilityT -= dt;
        if (t.away) continue; // wollywog mid-jump
        // burst firing
        if (t.burstLeft > 0) {
          t.burstT -= dt;
          if (t.burstT <= 0) {
            let tg = t.burstTarget;
            if (!tg || tg.dead || !this.inRange(t, tg, def.range + 20)) tg = t.burstTarget = this.acquire(t, def.range, def.air);
            if (tg) { this.fire(t, tg); t.face = tg.x >= t.x ? 1 : -1; t.atkT = 0.001; }
            t.burstLeft--;
            t.burstT = def.burstGap;
          }
          continue;
        }
        if (t.pending) {
          t.pending.t -= dt;
          if (t.pending.t <= 0) {
            const tg = t.pending.target;
            t.pending = null;
            if (!tg.dead) this.fire(t, tg);
            else {
              const alt = this.acquire(t, def.range + 10, def.air);
              if (alt) this.fire(t, alt);
            }
          }
          continue;
        }
        // special abilities
        if (def.ability && t.abilityT <= 0) {
          if (this.towerAbility(t)) { t.abilityT = def.abilityCd; continue; }
          t.abilityT = 0.5;
        }
        if (t.cd <= 0) {
          const tg = this.acquire(t, def.range, def.air);
          if (tg) {
            t.cd = def.rate;
            t.face = tg.x >= t.x ? 1 : -1;
            t.atkT = 0.001;
            if (def.burst) { t.burstLeft = def.burst; t.burstT = 0; t.burstTarget = tg; }
            else if (def.windup) t.pending = { t: def.windup, target: tg };
            else this.fire(t, tg);
          }
        }
      }
    }

    fire(t, tg) {
      const def = t.def;
      const m = this.muzzle(t);
      const dmg = U.rand(def.dmg[0], def.dmg[1]);
      const ty = tg.y - (tg.flying ? 34 : 12);
      switch (def.attack) {
        case 'pebble':
          this.projectiles.push({ kind: 'pebble', x: m.x, y: m.y, target: tg, speed: 430, dmg, dtype: 'phys', src: t, arc: 18, sx: m.x, sy: m.y, prog: 0 });
          for (let i = 0; i < 3; i++) this.particle('smoke', m.x, m.y);
          sfx('pew');
          break;
        case 'bullet':
          this.projectiles.push({ kind: 'bullet', x: m.x, y: m.y, target: tg, speed: 700, dmg, dtype: 'phys', src: t });
          this.particle('flash', m.x, m.y);
          sfx('bullet');
          break;
        case 'spit':
          this.projectiles.push({ kind: 'spit', x: m.x, y: m.y, target: tg, speed: 520, dmg, dtype: 'phys', src: t });
          sfx('pew');
          break;
        case 'fireball':
          this.projectiles.push({ kind: 'fireball', x: m.x, y: m.y, target: tg, speed: 300, dmg, dtype: 'fire', src: t, burn: def.burn });
          for (let i = 0; i < 6; i++) this.particle('ember', m.x, m.y);
          sfx('fire');
          break;
        case 'frost':
          this.projectiles.push({ kind: 'frost', x: m.x, y: m.y, target: tg, speed: 320, dmg, dtype: 'magic', src: t });
          sfx('frost');
          break;
        case 'wind':
          this.projectiles.push({ kind: 'wind', x: m.x, y: m.y, target: tg, speed: 330, dmg, dtype: 'magic', src: t, push: def.push });
          sfx('gust');
          break;
        case 'boulder': {
          const dist = U.dist(m.x, m.y, tg.x, tg.y);
          const dur = 0.75 + dist / 600;
          const p = this.predict(tg, dur);
          this.projectiles.push({ kind: 'boulder', sx: m.x, sy: m.y, tx: p.x, ty: p.y, x: m.x, y: m.y, t: 0, dur, dmg, dtype: 'phys', src: t, splash: def.splash, h: 90 + dist * 0.25, size: 0.6 + def.tier * 0.12 });
          for (let i = 0; i < 6; i++) this.particle('smoke', m.x, m.y);
          sfx('cannon');
          break;
        }
        case 'jump': {
          const dist = U.dist(t.x, t.y, tg.x, tg.y);
          const dur = 0.55 + dist / 500;
          const p = this.predict(tg, dur);
          t.away = true;
          const ph = PTD.Art.PLAT_H[t.tier];
          this.effect({ kind: 'wolly', sx: t.x, sy: t.y - ph, tx: p.x, ty: p.y, t: 0, dur, back: dur * 0.8, tower: t, dmg, splash: def.splash, stun: def.stun, face: p.x >= t.x ? 1 : -1, landed: false });
          sfx('croak');
          break;
        }
      }
      void ty;
    }

    towerAbility(t) {
      const def = t.def;
      if (def.ability === 'snatch') {
        let best = null;
        for (const e of this.enemies) {
          if (e.dead || e.carried || e.def.big || e.d < 0) continue;
          if (!this.inRange(t, e, def.range)) continue;
          if (!best || e.hp > best.hp) best = e;
        }
        if (!best) return false;
        const m = this.muzzle(t);
        best.carried = true;
        this.releaseEnemy(best);
        t.away = true;
        this.effect({ kind: 'snatch', tower: t, e: best, x: m.x, y: m.y, sx: m.x, sy: m.y, phase: 0, t: 0 });
        sfx('snatch');
        return true;
      }
      if (def.ability === 'gust') {
        const tg = this.acquire(t, def.range, false);
        if (!tg) return false;
        t.face = tg.x >= t.x ? 1 : -1;
        t.atkT = 0.001;
        let hit = 0;
        for (const e of this.enemies) {
          if (e.dead || e.flying || e.d < 0) continue;
          if (U.dist(e.x, e.y, tg.x, tg.y) > 85) continue;
          this.damage(e, 25, 'magic', t);
          if (!e.def.boss && !e.def.slowImmune) { this.pushBack(e, 90); hit++; }
        }
        this.effect({ kind: 'gust', x: tg.x, y: tg.y, t: 0, dur: 0.8, dir: -Math.atan2(tg.dy, tg.dx) });
        this.floater('Big Gust!', tg.x, tg.y - 40, '#e9d8ff', 15);
        sfx('gust');
        return true;
      }
      if (def.ability === 'roll') {
        const tg = this.acquire(t, def.range, false);
        if (!tg) return false;
        t.face = tg.x >= t.x ? 1 : -1;
        t.atkT = 0.001;
        this.effect({ kind: 'roll', path: tg.path, d: tg.d + 30, lane: 0, dist: 0, max: 300, t: 0, hit: new Set(), x: tg.x, y: tg.y, rot: 0, src: t });
        sfx('cannon');
        return true;
      }
      return false;
    }

    pushBack(e, amt) {
      if (e.def.boss) return;
      this.releaseEnemy(e);
      e.d = Math.max(0, e.d - amt);
      e.stunT = Math.max(e.stunT, 0.3);
      this.placeEnemy(e);
    }

    /* ======================= DENS & SOLDIERS ======================= */
    setupDen(t, fresh) {
      const def = t.def;
      if (fresh || !t.rally) {
        // default rally: nearest path point
        let best = null;
        for (const p of this.lv.paths) {
          const n = p.nearest(t.x, t.y);
          if (!best || n.dist < best.dist) best = { p, d: n.d, dist: n.dist };
        }
        const pos = best.p.posAt(best.d);
        t.rally = { x: pos.x, y: pos.y };
      }
      // replace soldiers keeping alive status
      const old = t.units;
      t.units = [];
      for (let i = 0; i < def.count; i++) {
        const prev = old[i];
        const u = this.makeSoldier(t, i, def);
        if (prev) {
          u.x = prev.x; u.y = prev.y;
          if (prev.dead) { u.dead = true; u.respawnT = Math.min(prev.respawnT, 2); }
          this.removeUnit(prev);
        } else {
          u.x = t.x; u.y = t.y;
        }
        t.units.push(u);
        this.units.push(u);
      }
    }

    makeSoldier(t, i, def) {
      return {
        uid: UID++, isUnit: true, tower: t, slot: i, kind: def.soldier,
        hp: def.hp, maxHp: def.hp, dmg: def.dmg, rate: def.rate, armor: def.armor || 0,
        regen: def.regen || def.hp * 0.06, respawn: def.respawn,
        x: t.x, y: t.y, face: 1, cd: U.rand(0, 0.6), target: null, dead: false, respawnT: 0,
        walk: Math.random(), atkAnim: 0, idleT: 0, stunT: 0, flashT: 0,
        ability: def.ability, abilityT: U.rand(3, def.abilityCd || 10), speed: 72, engage: 62,
      };
    }

    rallySlot(t, i, n) {
      const offs = n === 2 ? [[-10, 0], [12, 4]] : [[0, -9], [-15, 8], [15, 8]];
      const o = offs[i % offs.length];
      return { x: t.rally.x + o[0], y: t.rally.y + o[1] };
    }

    setRally(t, x, y) {
      const dx = x - t.x, dy = (y - t.y) / 0.8;
      if (dx * dx + dy * dy > t.def.range * t.def.range) return false;
      if (this.lv.distToPath(x, y) > 40) return false;
      t.rally = { x, y };
      for (const u of t.units) this.releaseUnit(u);
      this.effect({ kind: 'flag', x, y, t: 0, dur: 0.9 });
      sfx('click');
      return true;
    }

    updateDen(t, dt) {
      for (const u of t.units) {
        const home = this.rallySlot(t, u.slot, t.units.length);
        this.updateUnit(u, dt, home.x, home.y, t.x, t.y);
      }
    }

    removeUnit(u) {
      this.releaseUnit(u);
      u.removed = true;
      this.units = this.units.filter((x) => x !== u);
    }

    releaseUnit(u) {
      if (u.target) {
        if (u.target.blocker === u) u.target.blocker = null;
        u.target.engagers = Math.max(0, u.target.engagers - 1);
        u.target = null;
      }
    }

    hurtUnit(u, amt, src) {
      if (u.dead) return;
      u.hp -= amt * (1 - (u.armor || 0));
      u.flashT = 0.08;
      if (u.hp <= 0) {
        u.hp = 0;
        u.dead = true;
        this.releaseUnit(u);
        u.respawnT = u.respawn;
        for (let i = 0; i < 8; i++) this.particle('smoke', u.x + U.rand(-8, 8), u.y - U.rand(0, 14));
        if (u.isHero) { this.floater('Retreat!', u.x, u.y - 50, '#ff9a6a', 14); this.emit('heroDown'); }
        if (u.ttl != null) this.removeUnit(u);
      }
      void src;
    }

    findTargetFor(u, hx, hy, R) {
      let best = null, bs = 1e9;
      for (const e of this.enemies) {
        if (e.dead || e.flying || e.carried || e.d < 0) continue;
        const dh = U.dist(e.x, e.y, hx, hy);
        if (dh > R) continue;
        // prefer unengaged enemies
        const score = U.dist(e.x, e.y, u.x, u.y) + (e.blocker ? 60 : 0) + e.engagers * 25;
        if (score < bs) { bs = score; best = e; }
      }
      return best;
    }

    updateUnit(u, dt, hx, hy, ox, oy) {
      if (u.removed || u.hauling) return;
      u.flashT -= dt;
      if (u.atkAnim > 0) u.atkAnim = Math.max(0, u.atkAnim - dt / 0.4);
      if (u.dead) {
        if (u.ttl != null) return;
        u.respawnT -= dt;
        if (u.respawnT <= 0) {
          u.dead = false;
          u.hp = u.maxHp;
          u.x = ox; u.y = oy;
          for (let i = 0; i < 6; i++) this.particle('dust', u.x, u.y);
        }
        return;
      }
      if (u.ttl != null) {
        u.ttl -= dt;
        if (u.ttl <= 0) {
          for (let i = 0; i < 8; i++) this.particle('dust', u.x, u.y);
          this.removeUnit(u);
          return;
        }
      }
      if (u.stunT > 0) { u.stunT -= dt; return; }
      if (u.ability) u.abilityT -= dt;
      // validate target
      const tg = u.target;
      if (tg && (tg.dead || tg.carried || tg.flying || U.dist(tg.x, tg.y, hx, hy) > u.engage + 40)) this.releaseUnit(u);
      if (u.moveOrder) {
        // hero has a move order: walk without fighting
        const d = U.dist(u.x, u.y, hx, hy);
        if (d > 3) {
          this.releaseUnit(u);
          const s = Math.min(d, u.speed * 1.25 * dt);
          u.x += ((hx - u.x) / d) * s; u.y += ((hy - u.y) / d) * s;
          u.face = hx >= u.x ? 1 : -1;
          u.walk += dt * 2;
          u.moving = true;
          return;
        }
        u.moveOrder = false;
      }
      if (!u.target) {
        const ne = this.findTargetFor(u, hx, hy, u.engage);
        if (ne) { u.target = ne; ne.engagers++; }
      }
      if (u.target) {
        const e = u.target;
        const side = u.x <= e.x ? -1 : 1;
        const reach = u.isHero ? 22 : 14 + (u.kind === 'bulbear' ? 6 : 0);
        const fx = e.x + side * reach, fy = e.y + (u.slot != null ? (u.slot - 1) * 3 : 0);
        const d = U.dist(u.x, u.y, fx, fy);
        if (d > 4) {
          const s = Math.min(d, u.speed * dt);
          u.x += ((fx - u.x) / d) * s; u.y += ((fy - u.y) / d) * s;
          u.face = fx >= u.x ? 1 : -1;
          u.walk += dt * 2;
          u.moving = true;
          if (d < 24 && !e.blocker) e.blocker = u;
        } else {
          u.moving = false;
          if (!e.blocker) e.blocker = u;
          u.face = e.x >= u.x ? 1 : -1;
          u.cd -= dt;
          // special: breadbug haul
          if (u.ability === 'haul' && u.abilityT <= 0 && !e.def.big) {
            u.abilityT = 10;
            this.haul(u, e);
            return;
          }
          if (u.isHero) this.heroAbilities(u);
          if (u.cd <= 0 && u.target) {
            u.cd = u.rate;
            u.atkAnim = 1;
            const dm = U.rand(u.dmg[0], u.dmg[1]) * (u.dmgMul || 1);
            this.damage(e, dm, 'phys', u);
            sfx(u.isHero ? 'chomp' : 'hit');
            if (Math.random() < 0.5) this.particle('spark', e.x + U.rand(-4, 4), e.y - 14, '#fff6c8');
          }
        }
        u.idleT = 0;
      } else {
        // return home
        const d = U.dist(u.x, u.y, hx, hy);
        if (d > 3) {
          const s = Math.min(d, u.speed * dt);
          u.x += ((hx - u.x) / d) * s; u.y += ((hy - u.y) / d) * s;
          u.face = hx >= u.x ? 1 : -1;
          u.walk += dt * 2;
          u.moving = true;
        } else {
          u.moving = false;
          u.idleT += dt;
          if (u.idleT > 1.5) u.hp = Math.min(u.maxHp, u.hp + u.regen * dt);
        }
        if (u.isHero) this.heroAbilities(u);
      }
    }

    haul(u, e) {
      e.carried = true;
      this.releaseEnemy(e);
      this.releaseUnit(u);
      u.hauling = true;
      this.effect({ kind: 'haul', u, e, t: 0, sx: u.x, sy: u.y, tx: u.tower.x, ty: u.tower.y });
      this.floater('Yoink!', e.x, e.y - 30, '#ffd38a', 13);
      sfx('snatch');
    }

    /* ======================= HERO ======================= */
    makeHero() {
      const H = PTD.HERO;
      const s = this.lv.heroStart;
      return {
        uid: UID++, isUnit: true, isHero: true, kind: 'emperor', level: 1, xp: 0, xpNext: 120,
        hp: H.hp, maxHp: H.hp, dmg: H.dmg, rate: H.rate, armor: H.armor, regen: H.regen, respawn: H.respawn,
        x: s.x, y: s.y, gx: s.x, gy: s.y, face: 1, cd: 0, target: null, dead: false, respawnT: 0,
        walk: 0, atkAnim: 0, idleT: 0, stunT: 0, flashT: 0, speed: H.speed, engage: H.engage, dmgMul: 1,
        tongueT: 5, quakeT: 8, tongueAnim: 0, moveOrder: false,
      };
    }

    moveHero(x, y) {
      const h = this.hero;
      if (h.dead) return false;
      h.gx = U.clamp(x, 20, PTD.W - 20);
      h.gy = U.clamp(y, 40, PTD.H - 10);
      h.moveOrder = true;
      this.releaseUnit(h);
      this.effect({ kind: 'flag', x: h.gx, y: h.gy, t: 0, dur: 0.8 });
      sfx('click');
      return true;
    }

    heroXp(v) {
      const h = this.hero;
      if (h.level >= 5) return;
      h.xp += v;
      while (h.xp >= h.xpNext && h.level < 5) {
        h.xp -= h.xpNext;
        h.level++;
        h.xpNext = Math.round(h.xpNext * 1.6);
        h.maxHp = Math.round(PTD.HERO.hp * (1 + (h.level - 1) * 0.18));
        h.hp = h.maxHp;
        h.dmgMul = 1 + (h.level - 1) * 0.2;
        this.floater('LEVEL UP!', h.x, h.y - 60, '#ffe066', 18);
        for (let i = 0; i < 16; i++) this.particle('spark', h.x + U.rand(-20, 20), h.y - U.rand(0, 50), '#ffe066');
        sfx('upgrade');
        this.emit('heroLevel', h.level);
      }
    }

    heroAbilities(h) {
      if (h.dead) return;
      // tongue lash: hits up to 4 enemies (incl. flyers) in front
      if (h.tongueT <= 0) {
        const targets = this.enemies.filter((e) => !e.dead && !e.carried && e.d >= 0 && U.dist(e.x, e.y, h.x, h.y) < 95).slice(0, 4);
        if (targets.length >= 1 && (targets.length >= 2 || targets[0].def.captain || targets[0].flying)) {
          h.tongueT = 9;
          h.tongueAnim = 1;
          h.face = targets[0].x >= h.x ? 1 : -1;
          for (const e of targets) {
            this.damage(e, 45 * h.dmgMul, 'phys', h);
            this.particle('spark', e.x, e.y - 14, '#ff9fb0');
          }
          sfx('chomp');
          this.floater('Tongue Lash!', h.x, h.y - 56, '#ff9fb0', 13);
        }
      }
      if (h.quakeT <= 0 && h.target) {
        const n = this.enemies.filter((e) => !e.dead && !e.flying && U.dist(e.x, e.y, h.x, h.y) < 85).length;
        if (n >= 2) {
          h.quakeT = 14;
          h.atkAnim = 1;
          for (const e of this.enemies) {
            if (e.dead || e.flying || U.dist(e.x, e.y, h.x, h.y) > 85) continue;
            this.damage(e, 35 * h.dmgMul, 'phys', h);
            if (!e.def.boss) e.stunT = Math.max(e.stunT, 1.5);
          }
          this.effect({ kind: 'quake', x: h.x, y: h.y, t: 0, dur: 0.7 });
          this.shake = 0.35;
          sfx('boom');
          this.floater('Earthquake!', h.x, h.y - 60, '#ffd38a', 14);
        }
      }
    }

    updateHero(dt) {
      const h = this.hero;
      h.tongueT -= dt;
      h.quakeT -= dt;
      if (h.tongueAnim > 0) h.tongueAnim = Math.max(0, h.tongueAnim - dt / 0.5);
      const wasDead = h.dead;
      this.updateUnit(h, dt, h.gx, h.gy, h.gx, h.gy);
      if (wasDead && !h.dead) { this.floater('I\'m back!', h.x, h.y - 56, '#ffe066', 13); }
    }

    /* ======================= SPELLS ======================= */
    castSpell(id, x, y) {
      const sp = this.spells[id];
      if (sp.cd > 0) { sfx('deny'); return false; }
      if (id === 'snagret') {
        sp.cd = sp.max;
        this.effect({ kind: 'snagret', x, y, t: 0, pecks: 0, dir: x < PTD.W / 2 ? 1 : -1 });
        sfx('snagret');
        return true;
      }
      if (id === 'reinforce') {
        if (this.lv.distToPath(x, y) > 50) { sfx('deny'); return false; }
        sp.cd = sp.max;
        const S = PTD.SPELLS.reinforce;
        for (let i = 0; i < S.count; i++) {
          const u = {
            uid: UID++, isUnit: true, kind: 'reinf', hp: S.hp, maxHp: S.hp, dmg: S.dmg, rate: 1, armor: 0, regen: 3, respawn: 0,
            x: x + (i ? 12 : -12), y: y + (i ? 4 : -2), face: 1, cd: 0, target: null, dead: false, walk: 0, atkAnim: 0, idleT: 0,
            stunT: 0, flashT: 0, speed: 70, engage: 70, ttl: S.ttl, hx: x + (i ? 12 : -12), hy: y + (i ? 4 : -2), slot: i,
          };
          this.units.push(u);
          for (let k = 0; k < 10; k++) this.particle('dust', u.x, u.y);
        }
        sfx('reinforce');
        return true;
      }
      return false;
    }

    /* ======================= PROJECTILES ======================= */
    updateProjectiles(dt) {
      for (const p of this.projectiles) {
        if (p.kind === 'boulder') {
          p.t += dt;
          const k = Math.min(1, p.t / p.dur);
          p.x = U.lerp(p.sx, p.tx, k);
          p.gy = U.lerp(p.sy, p.ty, k);
          p.y = p.gy - Math.sin(k * Math.PI) * p.h;
          p.rot = (p.rot || 0) + dt * 6;
          if (k >= 1) {
            p.done = true;
            this.splash(p.tx, p.ty, p.splash, p.dmg, 'phys', p.src, false);
            this.explosion(p.tx, p.ty, 'dirt');
            this.decal(p.tx, p.ty, 'crater');
            sfx('boom');
          }
          continue;
        }
        const tg = p.target;
        if (tg && !tg.dead && !tg.carried) {
          p.tx = tg.x;
          p.ty = tg.y - (tg.flying ? 34 : 12);
        } else if (p.tx == null) { p.done = true; continue; }
        const dx = p.tx - p.x, dy = p.ty - p.y;
        const d = Math.hypot(dx, dy);
        const step = p.speed * dt;
        if (p.kind === 'pebble') p.prog += step;
        if (d <= step + 4) {
          p.done = true;
          if (tg && !tg.dead && !tg.carried) this.projectileHit(p, tg);
          else if (p.kind === 'fireball') this.explosion(p.tx, p.ty, 'fire');
        } else {
          p.x += (dx / d) * step;
          p.y += (dy / d) * step;
          p.ang = Math.atan2(dy, dx);
          if (p.kind === 'fireball' && Math.random() < 0.7) this.particle('ember', p.x, p.y);
          if (p.kind === 'frost' && Math.random() < 0.6) this.particle('frost', p.x, p.y);
          if (p.kind === 'wind' && Math.random() < 0.4) this.particle('wisp', p.x, p.y);
        }
      }
      this.projectiles = this.projectiles.filter((p) => !p.done);
    }

    projectileHit(p, e) {
      switch (p.kind) {
        case 'pebble':
        case 'bullet':
        case 'spit':
          this.damage(e, p.dmg, 'phys', p.src);
          this.particle('spark', p.x, p.y, '#fff3c0');
          if (p.kind === 'spit') for (let i = 0; i < 4; i++) this.particle('rock', p.x, p.y);
          break;
        case 'fireball':
          this.damage(e, p.dmg, 'fire', p.src);
          if (!e.dead) { e.burnT = 3; e.burnDps = p.burn; }
          // small splash
          for (const o of this.enemies) if (o !== e && !o.dead && U.dist(o.x, o.y, e.x, e.y) < 26) this.damage(o, p.dmg * 0.4, 'fire', p.src);
          this.explosion(p.x, p.y, 'fire');
          break;
        case 'frost':
          this.damage(e, p.dmg, 'magic', p.src);
          if (!e.dead) {
            if (!e.def.slowImmune) { e.slowT = 2.5; e.slowF = 0.5; }
            if (e.tier > 0 && e.def.pik) this.wither(e);
          }
          for (let i = 0; i < 8; i++) this.particle('frost', p.x, p.y);
          break;
        case 'wind':
          this.damage(e, p.dmg, 'magic', p.src);
          if (!e.dead && !e.def.big && !e.def.slowImmune) this.pushBack(e, p.push);
          for (let i = 0; i < 6; i++) this.particle('wisp', p.x, p.y);
          break;
      }
    }

    wither(e) {
      const old = TIER.hp[e.tier];
      e.tier--;
      const nw = TIER.hp[e.tier];
      e.maxHp = Math.round(e.maxHp * nw / old);
      e.hp = Math.min(e.hp, e.maxHp);
      e.baseSpeed = e.def.speed * TIER.speed[e.tier];
      for (let i = 0; i < 6; i++) this.particle('petal', e.x, e.y - 34);
      this.floater('Withered!', e.x, e.y - 40, '#cdd3ff', 11);
    }

    splash(x, y, r, dmg, dtype, src, air) {
      for (const e of this.enemies) {
        if (e.dead || e.carried || e.d < 0) continue;
        if (e.flying && !air) continue;
        const d = U.dist(e.x, (e.y - y) / 0.8 + y, x, y);
        if (d > r) continue;
        const f = d < r * 0.4 ? 1 : 1 - (d - r * 0.4) / (r * 0.6) * 0.5;
        this.damage(e, dmg * f, dtype, src);
      }
    }

    /* ======================= EFFECTS ======================= */
    effect(fx) { fx.t = fx.t || 0; this.effects.push(fx); return fx; }

    updateEffects(dt) {
      for (const f of this.effects) {
        f.t += dt;
        switch (f.kind) {
          case 'ring': case 'flag': case 'quake': case 'gust':
            if (f.t >= f.dur) f.done = true;
            break;
          case 'ghost':
            if (f.t >= f.dur) f.done = true;
            break;
          case 'ko':
            if (f.t >= f.dur) f.done = true;
            break;
          case 'snagret': {
            // timeline: 0-0.35 rise, pecks at 0.5,0.8,1.1, retract 1.3-1.6
            const S = PTD.SPELLS.snagret;
            const peckTimes = [0.5, 0.82, 1.14];
            while (f.pecks < peckTimes.length && f.t >= peckTimes[f.pecks]) {
              f.pecks++;
              for (const e of this.enemies) {
                if (e.dead || e.flying || e.d < 0) continue;
                if (U.dist(e.x, (e.y - f.y) / 0.8 + f.y, f.x, f.y) > S.radius) continue;
                this.damage(e, U.rand(S.dmg[0], S.dmg[1]), 'phys', null);
                if (!e.def.boss) e.stunT = Math.max(e.stunT, 0.5);
              }
              this.shake = 0.25;
              for (let i = 0; i < 10; i++) this.particle('dirt', f.x + U.rand(-30, 30), f.y + U.rand(-10, 10));
              this.decal(f.x + U.rand(-20, 20), f.y + U.rand(-8, 8), 'crack');
              sfx('peck');
            }
            if (f.t < 0.1 && !f.dusted) { f.dusted = true; for (let i = 0; i < 18; i++) this.particle('dirt', f.x + U.rand(-20, 20), f.y); }
            if (f.t >= 1.7) f.done = true;
            break;
          }
          case 'snatch': {
            const t = f.tower, e = f.e;
            // phase 0: fly to enemy, 1: lift, 2: carry back along path & drop, 3: return
            if (f.phase === 0) {
              if (e.dead) { f.phase = 3; break; }
              const tx = e.x - 6, ty = e.y - 40;
              const d = U.dist(f.x, f.y, tx, ty);
              const s = 420 * dt;
              if (d <= s) { f.phase = 1; f.t = 0; } else { f.x += ((tx - f.x) / d) * s; f.y += ((ty - f.y) / d) * s; }
              f.face = tx >= f.sx ? 1 : -1;
            } else if (f.phase === 1) {
              f.y -= 60 * dt;
              e.x = f.x + 6; e.y = f.y + 40;
              if (f.t > 0.5) {
                f.phase = 2; f.t = 0;
                f.dropD = Math.max(0, e.d - 140);
                const p = e.path.posAt(f.dropD);
                f.dx = p.x; f.dy = p.y - 70;
              }
            } else if (f.phase === 2) {
              const d = U.dist(f.x, f.y, f.dx, f.dy);
              const s = 300 * dt;
              f.face = f.dx >= f.x ? 1 : -1;
              if (d <= s) {
                // drop!
                e.carried = false;
                e.d = f.dropD;
                this.placeEnemy(e);
                e.stunT = 1;
                if (!e.dead) this.damage(e, 60 + e.maxHp * 0.35, 'phys', t);
                for (let i = 0; i < 8; i++) this.particle('dust', e.x, e.y);
                this.floater('Dropped!', e.x, e.y - 30, '#fff', 12);
                sfx('peck');
                f.phase = 3;
              } else {
                f.x += ((f.dx - f.x) / d) * s; f.y += ((f.dy - f.y) / d) * s;
                e.x = f.x + 6; e.y = f.y + 40;
              }
            } else {
              const d = U.dist(f.x, f.y, f.sx, f.sy);
              const s = 380 * dt;
              f.face = f.sx >= f.x ? 1 : -1;
              if (d <= s) { f.done = true; t.away = false; t.face = f.face; }
              else { f.x += ((f.sx - f.x) / d) * s; f.y += ((f.sy - f.y) / d) * s; }
            }
            if (e.dead && f.phase < 3) { f.phase = 3; e.carried = false; }
            if (!this.towers.includes(t)) f.done = true;
            break;
          }
          case 'haul': {
            const u = f.u, e = f.e;
            if (u.dead || u.removed || e.dead) {
              if (!e.dead) { e.carried = false; }
              u.hauling = false;
              f.done = true;
              break;
            }
            const k = Math.min(1, f.t / 1.6);
            u.x = U.lerp(f.sx, f.tx, k);
            u.y = U.lerp(f.sy, f.ty, k);
            u.face = f.tx >= f.sx ? -1 : 1; // drags backwards
            u.walk += dt * 2;
            u.moving = true;
            e.x = u.x + (f.tx >= f.sx ? -1 : 1) * -16;
            e.y = u.y;
            if (k >= 1) {
              this.kill(e, u);
              u.hauling = false;
              f.done = true;
              for (let i = 0; i < 6; i++) this.particle('dust', u.x, u.y);
              sfx('chomp');
            }
            break;
          }
          case 'wolly': {
            const tw = f.tower;
            if (!f.landed) {
              const k = Math.min(1, f.t / f.dur);
              f.x = U.lerp(f.sx, f.tx, k);
              f.gy = U.lerp(f.sy, f.ty, k);
              f.y = f.gy - Math.sin(k * Math.PI) * (70 + U.dist(f.sx, f.sy, f.tx, f.ty) * 0.25);
              f.k = k;
              if (k >= 1) {
                f.landed = true; f.t = 0;
                for (const e of this.enemies) {
                  if (e.dead || e.flying || e.d < 0) continue;
                  if (U.dist(e.x, (e.y - f.ty) / 0.8 + f.ty, f.tx, f.ty) > f.splash) continue;
                  this.damage(e, f.dmg, 'phys', tw);
                  if (!e.def.boss) e.stunT = Math.max(e.stunT, f.stun);
                }
                this.explosion(f.tx, f.ty, 'splash');
                this.decal(f.tx, f.ty, 'splat');
                this.shake = 0.3;
                sfx('boom');
              }
            } else if (f.t > 0.35) {
              const k = Math.min(1, (f.t - 0.35) / f.back);
              f.x = U.lerp(f.tx, f.sx, k);
              f.gy = U.lerp(f.ty, f.sy, k);
              f.y = f.gy - Math.sin(k * Math.PI) * 60;
              f.k = k;
              f.returning = true;
              if (k >= 1) { f.done = true; tw.away = false; tw.cd = Math.max(tw.cd, 0.5); }
            }
            if (!this.towers.includes(tw)) f.done = true;
            break;
          }
          case 'roll': {
            const sp = 170 * dt;
            f.d -= sp;
            f.dist += sp;
            f.rot -= dt * 9;
            const p = f.path.posAt(Math.max(0, f.d));
            f.x = p.x; f.y = p.y;
            for (const e of this.enemies) {
              if (e.dead || e.flying || f.hit.has(e.uid)) continue;
              if (U.dist(e.x, e.y, f.x, f.y) < 26) {
                f.hit.add(e.uid);
                this.damage(e, 70, 'phys', f.src);
                if (!e.def.boss) e.stunT = Math.max(e.stunT, 0.6);
                this.particle('dust', e.x, e.y);
              }
            }
            if (Math.random() < 0.5) this.particle('dust', f.x + U.rand(-8, 8), f.y + 6);
            if (f.dist >= f.max || f.d <= 0) {
              f.done = true;
              this.explosion(f.x, f.y, 'dirt');
            }
            break;
          }
        }
      }
      this.effects = this.effects.filter((f) => !f.done);
    }

    /* ======================= PARTICLES & FX helpers ======================= */
    particle(type, x, y, col) {
      if (this.particles.length > 900) return;
      const p = { type, x, y, vx: 0, vy: 0, g: 0, life: 0, max: 0.6, size: 3, col: col || '#fff', rot: Math.random() * 6, vr: 0, z: 0 };
      switch (type) {
        case 'dust': p.vx = U.rand(-40, 40); p.vy = U.rand(-30, -5); p.max = U.rand(0.4, 0.8); p.size = U.rand(4, 9); p.col = '#d9c4a0'; p.g = 30; break;
        case 'dirt': p.vx = U.rand(-90, 90); p.vy = U.rand(-160, -60); p.g = 420; p.max = U.rand(0.5, 0.9); p.size = U.rand(2, 4.5); p.col = U.pick(['#7a5530', '#5b3e22', '#9a7448']); p.vr = U.rand(-10, 10); break;
        case 'rock': p.vx = U.rand(-60, 60); p.vy = U.rand(-120, -40); p.g = 380; p.max = 0.5; p.size = U.rand(1.5, 3); p.col = '#9c968c'; break;
        case 'spark': p.vx = U.rand(-80, 80); p.vy = U.rand(-90, -10); p.g = 160; p.max = U.rand(0.25, 0.5); p.size = U.rand(1.5, 3); break;
        case 'ember': p.vx = U.rand(-25, 25); p.vy = U.rand(-55, -15); p.max = U.rand(0.35, 0.7); p.size = U.rand(2, 4.5); p.col = U.pick(['#ffdd55', '#ff9a2a', '#ff5a1f']); break;
        case 'smoke': p.vx = U.rand(-15, 15); p.vy = U.rand(-40, -15); p.max = U.rand(0.5, 0.9); p.size = U.rand(3, 6); p.col = '#e8e2d8'; break;
        case 'frost': p.vx = U.rand(-50, 50); p.vy = U.rand(-50, 30); p.max = U.rand(0.3, 0.6); p.size = U.rand(1.5, 3.5); p.col = U.pick(['#ffffff', '#bfefff', '#9fd8ff']); p.vr = U.rand(-6, 6); break;
        case 'wisp': p.vx = U.rand(-40, 40); p.vy = U.rand(-30, 10); p.max = U.rand(0.3, 0.6); p.size = U.rand(4, 8); p.col = '#ffffff'; break;
        case 'coin': p.vx = U.rand(-20, 20); p.vy = -110; p.g = 260; p.max = 0.6; p.size = 5; break;
        case 'juice': p.vx = U.rand(-60, 60); p.vy = U.rand(-100, -30); p.g = 260; p.max = 0.6; p.size = U.rand(2, 3.5); break;
        case 'heal': p.vx = U.rand(-10, 10); p.vy = -40; p.max = 0.9; p.size = 4; p.col = '#ff8fcf'; break;
        case 'poison': p.vx = U.rand(-30, 30); p.vy = U.rand(-50, -10); p.max = 0.7; p.size = U.rand(3, 6); p.col = '#b77fe0'; break;
        case 'petal': p.vx = U.rand(-40, 40); p.vy = U.rand(-40, -10); p.g = 50; p.max = 1; p.size = 3; p.col = '#ffffff'; p.vr = U.rand(-8, 8); break;
        case 'flash': p.max = 0.06; p.size = 7; p.col = '#fff6a0'; break;
        case 'splash': p.vx = U.rand(-90, 90); p.vy = U.rand(-150, -50); p.g = 400; p.max = U.rand(0.4, 0.7); p.size = U.rand(2, 4); p.col = U.pick(['#9fd8ff', '#ffffff', '#6fc0f0']); break;
        case 'leafAmb': p.vx = U.rand(10, 30); p.vy = U.rand(12, 26); p.max = U.rand(6, 10); p.size = U.rand(3, 5); p.vr = U.rand(-2, 2); break;
        case 'firefly': p.vx = U.rand(-8, 8); p.vy = U.rand(-8, 8); p.max = U.rand(4, 8); p.size = 2; p.col = '#eaff7a'; break;
      }
      this.particles.push(p);
    }

    updateParticles(dt) {
      for (const p of this.particles) {
        p.life += dt;
        p.vy += p.g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        if (p.type === 'smoke' || p.type === 'wisp' || p.type === 'poison') { p.size += dt * 8; p.vx *= 0.96; }
        if (p.type === 'leafAmb') p.vx += Math.sin(p.life * 2 + p.rot) * 20 * dt;
        if (p.type === 'firefly') { p.vx += U.rand(-30, 30) * dt; p.vy += U.rand(-30, 30) * dt; }
      }
      this.particles = this.particles.filter((p) => p.life < p.max);
    }

    explosion(x, y, style) {
      if (style === 'fire') {
        for (let i = 0; i < 12; i++) this.particle('ember', x + U.rand(-6, 6), y + U.rand(-6, 6));
        for (let i = 0; i < 4; i++) this.particle('smoke', x, y);
        this.effect({ kind: 'ring', x, y, r0: 4, r1: 26, dur: 0.3, col: '#ffb347' });
      } else if (style === 'splash') {
        for (let i = 0; i < 18; i++) this.particle('splash', x + U.rand(-10, 10), y);
        for (let i = 0; i < 8; i++) this.particle('dust', x + U.rand(-24, 24), y + U.rand(-6, 6));
        this.effect({ kind: 'ring', x, y, r0: 10, r1: 60, dur: 0.4, col: '#ffffff', ground: true });
      } else {
        for (let i = 0; i < 14; i++) this.particle('dirt', x + U.rand(-10, 10), y);
        for (let i = 0; i < 8; i++) this.particle('dust', x + U.rand(-20, 20), y + U.rand(-6, 6));
        this.effect({ kind: 'ring', x, y, r0: 8, r1: 46, dur: 0.35, col: '#f4e2c0', ground: true });
      }
    }

    decal(x, y, kind) {
      this.decals.push({ x, y, kind, t: 0, dur: 6, rot: Math.random() * 6 });
      if (this.decals.length > 40) this.decals.shift();
    }

    floater(text, x, y, col, size) {
      this.floaters.push({ text, x, y, col: col || '#fff', size: size || 14, t: 0, dur: 1.1 });
    }

    /* ======================= MAIN UPDATE ======================= */
    update(dtReal) {
      if (this.paused || this.over) {
        // keep particles alive a bit on game over
        if (this.over) { this.updateParticles(dtReal); this.updateFloaters(dtReal); }
        return;
      }
      // fixed-size sub-steps so slow frame rates don't slow the simulation down
      let remaining = Math.min(dtReal, 0.1) * this.speed;
      while (remaining > 1e-4) {
        const dt = Math.min(remaining, 1 / 60);
        this.step(dt);
        remaining -= dt;
      }
    }

    step(dt) {
      this.time += dt;
      for (const k in this.spells) this.spells[k].cd = Math.max(0, this.spells[k].cd - dt);
      this.updateWaves(dt);
      this.updateEnemies(dt);
      this.updateTowers(dt);
      for (const u of this.units.slice()) {
        if (u.tower || u.hauling) continue; // den soldiers are updated by their tower
        this.updateUnit(u, dt, u.hx, u.hy, u.hx, u.hy);
      }
      this.updateHero(dt);
      this.updateProjectiles(dt);
      this.updateEffects(dt);
      this.updateParticles(dt);
      this.updateFloaters(dt);
      for (const d of this.decals) d.t += dt;
      this.decals = this.decals.filter((d) => d.t < d.dur);
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 1.5);
      // ambient particles
      const th = this.def.theme;
      if (th === 'forest' && Math.random() < dt * 1.2) this.particle('leafAmb', U.rand(-50, PTD.W), -10, U.pick(['#e4782b', '#d6452a', '#f2b33a']));
      if (th === 'twilight' && this.particles.filter((p) => p.type === 'firefly').length < 26 && Math.random() < dt * 4) this.particle('firefly', U.rand(0, PTD.W), U.rand(80, PTD.H));
      if (th === 'meadow' && Math.random() < dt * 0.4) this.particle('leafAmb', U.rand(-50, PTD.W), -10, '#ffffff');
    }

    updateFloaters(dt) {
      for (const f of this.floaters) { f.t += dt; f.y -= dt * 28; }
      this.floaters = this.floaters.filter((f) => f.t < f.dur);
    }

    finish(win) {
      if (this.over) return;
      this.over = true;
      this.result = win ? 'win' : 'lose';
      const stars = win ? (this.lives >= 18 ? 3 : this.lives >= 6 ? 2 : 1) : 0;
      this.stars = stars;
      sfx(win ? 'win' : 'lose');
      this.emit('end', { win, stars, lives: this.lives });
    }
  }

  PTD.Game = Game;
})();
