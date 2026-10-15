/* Bulborb Rush — HTML screens & flow: title, world map, briefing, almanac, pause, results. */
(function () {
  'use strict';
  const PTD = window.PTD;
  const U = PTD.U;
  const Art = PTD.Art;
  const H = Art.H;
  const OUT = Art.OUT;
  const TAU = Math.PI * 2;
  const $ = (s, r) => (r || document).querySelector(s);
  const sfx = (n) => PTD.Audio && PTD.Audio.play(n);

  const S = (PTD.Screens = {
    current: 'title',
    game: null,
    demo: null,
    mapCanvas: null,
    levelIdx: 0,
    difficulty: 'normal',
  });

  /** copy a cached sprite into a fresh <canvas> element */
  function spriteCanvas(s, cls) {
    const c = document.createElement('canvas');
    c.width = s.c.width; c.height = s.c.height;
    c.getContext('2d').drawImage(s.c, 0, 0);
    if (cls) c.className = cls;
    return c;
  }
  S.spriteCanvas = spriteCanvas;

  S.show = function (id) {
    document.querySelectorAll('.screen').forEach((el) => el.classList.toggle('active', el.id === id));
  };
  S.modal = function (id, on) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', !!on);
  };

  S.init = function () {
    // title buttons
    $('#btn-play').onclick = () => { PTD.Audio.init(); sfx('click'); S.toMap(); };
    $('#btn-almanac').onclick = () => { PTD.Audio.init(); sfx('click'); S.openAlmanac(); };
    $('#btn-about').onclick = () => { PTD.Audio.init(); sfx('click'); S.modal('modal-about', true); };
    $('#about-close').onclick = () => { sfx('click'); S.modal('modal-about', false); };
    $('#map-back').onclick = () => { sfx('click'); S.toTitle(); };
    $('#map-almanac').onclick = () => { sfx('click'); S.openAlmanac(); };
    $('#brief-close').onclick = () => { sfx('click'); S.modal('modal-brief', false); };
    $('#brief-go').onclick = () => { sfx('click'); S.modal('modal-brief', false); S.startLevel(S.levelIdx); };
    document.querySelectorAll('#brief-diff button').forEach((b) => {
      b.onclick = () => {
        S.difficulty = b.dataset.d;
        document.querySelectorAll('#brief-diff button').forEach((x) => x.classList.toggle('sel', x === b));
        sfx('click');
      };
    });
    $('#alm-close').onclick = () => { sfx('click'); S.modal('modal-almanac', false); };
    document.querySelectorAll('#alm-tabs button').forEach((b) => {
      b.onclick = () => { sfx('click'); S.almanacTab(b.dataset.tab); };
    });
    $('#pause-resume').onclick = () => S.resume();
    $('#pause-restart').onclick = () => { S.modal('modal-pause', false); S.startLevel(S.levelIdx); };
    $('#pause-quit').onclick = () => { S.modal('modal-pause', false); S.toMap(); };
    $('#pause-music').onclick = () => S.toggleMusic();
    $('#pause-sound').onclick = () => S.toggleMute();
    $('#end-map').onclick = () => { S.modal('modal-end', false); S.toMap(); };
    $('#end-retry').onclick = () => { S.modal('modal-end', false); S.startLevel(S.levelIdx); };
    S.syncSoundButtons();
    S.toTitle();
  };

  /* ---------------- TITLE (live demo behind) ---------------- */
  S.toTitle = function () {
    S.current = 'title';
    S.game = null;
    S.show('screen-title');
    S.makeDemo();
    PTD.Audio.startMusic('title');
  };

  S.makeDemo = function () {
    const g = new PTD.Game(PTD.LEVELS[0], { difficulty: 'casual', seen: { red: 1, yellow: 1, blue: 1, winged: 1, olimar: 1, purple: 1, white: 1 } });
    g.demo = true;
    g.gold = 99999;
    g.initUI();
    const wasMuted = PTD.Audio.muted;
    PTD.Audio.muted = true;
    const picks = [['groink1', 1], ['den2', 3], ['hog2', 4], ['cannon1', 6], ['groink3', 8], ['snitch', 2], ['withering', 9]];
    for (const [id, i] of picks) {
      const s = g.spots[i % g.spots.length];
      if (!s || s.tower) continue;
      const fam = PTD.TOWERS[id].family;
      const base = { groink: 'groink1', den: 'den1', hog: 'hog1', cannon: 'cannon1' }[fam];
      g.build(s, base);
      let t = s.tower;
      const chain = [];
      let cur = id;
      while (cur !== base) {
        const prev = Object.keys(PTD.TOWERS).find((k) => PTD.TOWERS[k].next.includes(cur));
        chain.unshift(cur);
        cur = prev;
      }
      for (const c of chain) g.upgrade(t, c);
      t.buildT = 1;
    }
    g.lives = 9999;
    g.particles.length = 0;
    PTD.Audio.muted = wasMuted;
    S.demo = g;
    S.demoT = 0;
  };

  S.updateDemo = function (dt) {
    const g = S.demo;
    if (!g) return;
    S.demoT += dt;
    const mute = PTD.Audio.muted;
    PTD.Audio.muted = true; // demo is silent
    if (g.spawners.length === 0 && g.enemies.length < 30) {
      const types = ['red', 'yellow', 'blue', 'red', 'winged', 'purple', 'white'];
      const t = types[Math.floor(S.demoT / 4) % types.length];
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
  };

  /* ---------------- WORLD MAP ---------------- */
  S.toMap = function () {
    S.current = 'map';
    S.game = null;
    S.show('screen-map');
    S.buildMapNodes();
    PTD.Audio.startMusic('map');
  };

  S.unlocked = function (i) {
    if (i === 0) return true;
    return PTD.Save.stars(PTD.LEVELS[i - 1].id) > 0;
  };

  S.buildMapNodes = function () {
    const wrap = $('#map-nodes');
    wrap.innerHTML = '';
    let total = 0;
    PTD.LEVELS.forEach((lv, i) => {
      const st = PTD.Save.stars(lv.id);
      total += st;
      const open = S.unlocked(i);
      const b = document.createElement('button');
      b.className = 'map-node' + (open ? '' : ' locked') + (st ? ' done' : '') + (open && !st ? ' next' : '');
      b.style.left = (lv.mapPos[0] / 12.8) + '%';
      b.style.top = (lv.mapPos[1] / 7.2) + '%';
      b.innerHTML = `<span class="flag"><span class="num">${i + 1}</span></span><span class="stars">${[0, 1, 2].map((k) => `<i class="${k < st ? 'on' : ''}">★</i>`).join('')}</span><span class="label">${lv.name}</span>`;
      b.onclick = () => {
        PTD.Audio.init();
        if (!open) { sfx('deny'); return; }
        sfx('click');
        S.openBrief(i);
      };
      wrap.appendChild(b);
    });
    $('#map-stars').textContent = `${total} / ${PTD.LEVELS.length * 3}`;
  };

  /** painted parchment world map */
  S.paintMap = function () {
    const W = PTD.W, Hh = PTD.H, R = Art.RES;
    const c = Art.canvas(W * R, Hh * R);
    const g = c.getContext('2d');
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
    const land = (g, k) => H.wobble(g, W / 2 + 20, Hh / 2 + 20, 560 * k, 300 * k, U.rng(5), 22, 0.12);
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
    const pts = PTD.LEVELS.map((l) => l.mapPos);
    g.setLineDash([2, 10]);
    g.lineWidth = 6; g.strokeStyle = '#6b4424';
    g.beginPath(); g.moveTo(140, 470);
    pts.forEach((p, i) => {
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

    function tree(g, x, y, s, col) {
      g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 10 * s); g.lineWidth = 3 * s; g.strokeStyle = '#5a3a1e'; g.stroke();
      g.beginPath(); H.circ(g, x, y - 16 * s, 10 * s);
      g.fillStyle = H.vol(g, x, y - 16 * s, 10 * s, 10 * s, col, 0.3, -0.3); g.fill();
      g.lineWidth = 1.8; g.strokeStyle = OUT; g.stroke();
    }
  };

  S.renderMap = function (ctx) {
    if (!S.mapCanvas || S.mapRes !== Art.RES) {
      S.mapCanvas = S.paintMap(); S.mapRes = Art.RES;
      S.mapCanvas.addEventListener('contextlost', () => { S.mapCanvas = null; });
    }
    ctx.drawImage(S.mapCanvas, 0, 0, PTD.W, PTD.H);
    // marching pikmin on the trail (little animation)
    const t = performance.now() / 1000;
    for (let i = 0; i < 5; i++) {
      const k = ((t * 0.04 + i * 0.03) % 1);
      const pts = [[140, 470]].concat(PTD.LEVELS.map((l) => l.mapPos));
      const seg = Math.min(pts.length - 2, Math.floor(k * (pts.length - 1)));
      const f = k * (pts.length - 1) - seg;
      const a = pts[seg], b = pts[seg + 1];
      const cx = (a[0] + b[0]) / 2, cy = Math.min(a[1], b[1]) - 60;
      const x = (1 - f) * (1 - f) * a[0] + 2 * (1 - f) * f * cx + f * f * b[0];
      const y = (1 - f) * (1 - f) * a[1] + 2 * (1 - f) * f * cy + f * f * b[1];
      const s = Art.pikmin(['red', 'yellow', 'blue', 'purple', 'white'][i], 0, 'side', Math.floor(t * 10 + i) % 8, 'walk');
      Art.blit(ctx, s, x, y + 4, b[0] < a[0], 0.8);
    }
  };

  /* ---------------- BRIEFING ---------------- */
  S.openBrief = function (i) {
    S.levelIdx = i;
    const lv = PTD.LEVELS[i];
    $('#brief-title').textContent = lv.name;
    $('#brief-sub').textContent = lv.subtitle;
    $('#brief-desc').textContent = lv.desc;
    $('#brief-meta').textContent = `${lv.waves.length} waves · ${lv.paths.length} trail${lv.paths.length > 1 ? 's' : ''} · Starting pokos ${lv.gold}`;
    const st = PTD.Save.stars(lv.id);
    $('#brief-stars').innerHTML = [0, 1, 2].map((k) => `<i class="${k < st ? 'on' : ''}">★</i>`).join('');
    // thumbnail
    const th = $('#brief-thumb');
    th.innerHTML = '';
    const built = PTD.buildLevel(lv);
    const c = Art.paintLevel(built, 0.5);
    c.className = 'thumb';
    th.appendChild(c);
    // enemies preview
    const types = [];
    lv.waves.forEach((w) => w.forEach((g) => { if (!types.includes(g.type)) types.push(g.type); }));
    const ew = $('#brief-enemies');
    ew.innerHTML = '';
    for (const t of types) {
      const cv = spriteCanvas(Art.portrait(PTD.enemyPortrait(t, 0), 48), 'mini');
      cv.title = PTD.ENEMIES[t].name;
      ew.appendChild(cv);
    }
    document.querySelectorAll('#brief-diff button').forEach((x) => x.classList.toggle('sel', x.dataset.d === S.difficulty));
    S.modal('modal-brief', true);
  };

  /* ---------------- GAME ---------------- */
  S.startLevel = function (i) {
    S.levelIdx = i;
    const lv = PTD.LEVELS[i];
    const seen = PTD.Save.data.seen || {};
    const g = new PTD.Game(lv, { difficulty: S.difficulty, seen });
    g.initUI();
    g.on('newEnemy', () => { PTD.Save.data.seen = g.seenTypes; PTD.Save.write(); });
    g.on('end', (r) => setTimeout(() => { if (S.game === g && S.current === 'game') S.showEnd(r); }, r.win ? 900 : 700));
    S.game = g;
    S.demo = null;
    S.current = 'game';
    S.show('screen-game');
    PTD.Audio.startMusic(lv.theme);
  };

  S.pause = function () {
    const g = S.game;
    if (!g || g.over) return;
    g.paused = true;
    S.syncSoundButtons();
    S.modal('modal-pause', true);
    sfx('click');
  };
  S.resume = function () {
    if (!S.game) return;
    S.game.paused = false;
    S.modal('modal-pause', false);
    sfx('click');
  };
  S.togglePause = function () {
    if (!S.game) return;
    if (S.game.paused) S.resume(); else S.pause();
  };

  S.toggleMute = function () {
    PTD.Audio.init();
    PTD.Audio.setMuted(!PTD.Audio.muted);
    PTD.Save.data.muted = PTD.Audio.muted;
    PTD.Save.write();
    S.syncSoundButtons();
    sfx('click');
  };
  S.toggleMusic = function () {
    PTD.Audio.init();
    PTD.Audio.setMusic(!PTD.Audio.musicOn);
    PTD.Save.data.music = PTD.Audio.musicOn;
    PTD.Save.write();
    S.syncSoundButtons();
    sfx('click');
  };
  S.syncSoundButtons = function () {
    const m = $('#pause-music'), s = $('#pause-sound');
    if (m) m.textContent = 'Music: ' + (PTD.Audio.musicOn ? 'On' : 'Off');
    if (s) s.textContent = 'Sound: ' + (PTD.Audio.muted ? 'Off' : 'On');
  };

  S.showEnd = function (r) {
    const g = S.game;
    const lv = PTD.LEVELS[S.levelIdx];
    const box = $('#modal-end');
    box.classList.toggle('win', r.win);
    box.classList.toggle('lose', !r.win);
    $('#end-title').textContent = r.win ? 'VICTORY!' : 'DEFEAT';
    $('#end-sub').textContent = r.win
      ? (S.levelIdx === PTD.LEVELS.length - 1 ? 'The President retreats! The creature kingdom is safe… for now.' : 'The Pikmin have been driven back to their Onion!')
      : 'The Pikmin overran the burrow. Regroup and try again!';
    $('#end-stats').innerHTML = `<span>❤ ${g.lives} lives left</span><span>☠ ${g.stats.kills} defeated</span><span>Wave ${Math.min(g.waveIdx, g.waveTotal)}/${g.waveTotal}</span>`;
    const stars = $('#end-stars');
    stars.innerHTML = [0, 1, 2].map(() => '<i>★</i>').join('');
    if (r.win) {
      PTD.Save.setStars(lv.id, r.stars);
      [...stars.children].forEach((el, k) => {
        if (k < r.stars) setTimeout(() => { el.classList.add('on'); sfx('star'); }, 500 + k * 450);
      });
    }
    $('#end-retry').textContent = r.win ? 'Replay' : 'Retry';
    $('#end-map').textContent = r.win ? 'Continue' : 'World Map';
    S.modal('modal-end', true);
  };

  /* ---------------- ALMANAC (Piklopedia) ---------------- */
  S.openAlmanac = function () {
    S.modal('modal-almanac', true);
    S.almanacTab(S.almTab || 'creatures');
  };

  S.almanacTab = function (tab) {
    S.almTab = tab;
    document.querySelectorAll('#alm-tabs button').forEach((b) => b.classList.toggle('sel', b.dataset.tab === tab));
    const grid = $('#alm-grid');
    grid.innerHTML = '';
    const entries = [];
    if (tab === 'creatures') {
      const order = ['groink1', 'manatlegs', 'snitch', 'den1', 'den2', 'den3', 'bulbear', 'breadbug', 'hog1', 'withering', 'puffy', 'cannon1', 'decorated', 'wolly'];
      for (const id of order) entries.push({ por: PTD.towerPortrait(id), name: PTD.TOWERS[id].name, kind: 'tower', id });
      entries.push({ por: 'borb:emperor', name: PTD.HERO.name, kind: 'hero' });
      entries.push({ por: 'spell:snagret', name: PTD.SPELLS.snagret.name, kind: 'spell', id: 'snagret' });
      entries.push({ por: 'spell:reinforce', name: PTD.SPELLS.reinforce.name, kind: 'spell', id: 'reinforce' });
    } else {
      for (const id of Object.keys(PTD.ENEMIES)) entries.push({ por: PTD.enemyPortrait(id, 2), name: PTD.ENEMIES[id].name, kind: 'enemy', id });
    }
    entries.forEach((en, i) => {
      const b = document.createElement('button');
      b.className = 'alm-item';
      b.appendChild(spriteCanvas(Art.portrait(en.por, 72)));
      const sp = document.createElement('span');
      sp.textContent = en.name;
      b.appendChild(sp);
      b.onclick = () => { sfx('click'); S.almanacDetail(en); grid.querySelectorAll('.alm-item').forEach((x) => x.classList.toggle('sel', x === b)); };
      grid.appendChild(b);
      if (i === 0) { b.classList.add('sel'); S.almanacDetail(en); }
    });
  };

  S.almanacDetail = function (en) {
    const d = $('#alm-detail');
    d.innerHTML = '';
    // big animated portrait
    const cv = document.createElement('canvas');
    cv.width = 220 * 2; cv.height = 180 * 2;
    cv.className = 'alm-big';
    d.appendChild(cv);
    S.almAnim = { cv, en, t: 0 };
    const h = document.createElement('h3');
    h.textContent = en.name;
    d.appendChild(h);
    const p = document.createElement('p');
    const stats = document.createElement('div');
    stats.className = 'alm-stats';
    const add = (k, v) => { const s = document.createElement('span'); s.innerHTML = `<b>${k}</b> ${v}`; stats.appendChild(s); };
    if (en.kind === 'tower') {
      const t = PTD.TOWERS[en.id];
      p.textContent = t.desc;
      add('Type', PTD.FAMILY_NAME[t.family] + (t.tier === 4 ? ' · Elite' : ' · Tier ' + t.tier));
      add('Cost', t.cost + ' pokos');
      PTD.towerStats(en.id).forEach((s) => add('', s));
    } else if (en.kind === 'enemy') {
      const e = PTD.ENEMIES[en.id];
      p.textContent = e.desc;
      add('HP', e.hp + (e.pik ? ' (leaf)' : ''));
      add('Speed', e.speed < 25 ? 'Slow' : e.speed < 38 ? 'Normal' : e.speed < 50 ? 'Fast' : 'Very fast');
      add('Armour', Math.round((e.armor || 0) * 100) + '%');
      add('Magic res', Math.round((e.mres || 0) * 100) + '%');
      add('Lives', e.lives);
      add('Bounty', e.reward + ' pokos');
      if (e.flying) add('', 'Flying');
    } else if (en.kind === 'hero') {
      p.textContent = PTD.HERO.desc;
      add('HP', PTD.HERO.hp); add('Bite', PTD.HERO.dmg.join('-')); add('Armour', '25%'); add('Respawn', PTD.HERO.respawn + 's');
    } else {
      const s = PTD.SPELLS[en.id];
      p.textContent = s.desc;
      add('Cooldown', s.cd + 's');
    }
    d.appendChild(p);
    d.appendChild(stats);
  };

  /** animate the almanac big portrait each frame */
  S.updateAlmanac = function (dt) {
    const a = S.almAnim;
    if (!a || !document.getElementById('modal-almanac').classList.contains('active')) return;
    a.t += dt;
    const g = a.cv.getContext('2d');
    g.setTransform(2, 0, 0, 2, 0, 0);
    g.clearRect(0, 0, 220, 180);
    g.lineJoin = 'round'; g.lineCap = 'round';
    // backdrop
    const bg = g.createRadialGradient(110, 80, 10, 110, 90, 140);
    bg.addColorStop(0, '#fff6dc'); bg.addColorStop(1, '#e8cf98');
    g.fillStyle = bg; g.fillRect(0, 0, 220, 180);
    g.fillStyle = '#9ad35e'; g.beginPath(); g.ellipse(110, 160, 120, 34, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(25,30,10,0.25)'; g.beginPath(); g.ellipse(110, 150, 50, 12, 0, 0, TAU); g.fill();
    const en = a.en;
    const ph = (a.t * 0.8) % 1;
    const atk = (a.t % 3) > 2.4 ? ((a.t % 3) - 2.4) / 0.6 : 0;
    g.save();
    g.translate(110, 150);
    const [cat, id] = en.por.split(':');
    if (cat === 'cre') {
      const fit = { manatlegs: 1.35, snitch: 1.5, puffy: 1.5, decorated: 1.6, groink: 1.9, fiery: 1.9, withering: 1.9, larva: 1.9, wolly: 1.9 }[id] || 1.7;
      g.scale(fit, fit);
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
      const tier = Math.floor(a.t / 2) % 3;
      Art.drawPikmin(g, type, tier, Math.floor(a.t / 2.5) % 2 ? 'front' : 'side', ph, 'walk');
    } else if (cat === 'cap') {
      const s = Art.CAPT[id].scale;
      g.scale(2.2 / Math.sqrt(s), 2.2 / Math.sqrt(s));
      Art.drawCaptain(g, id, Math.floor(a.t / 2.5) % 2 ? 'front' : 'side', ph, 'walk');
    } else if (cat === 'spell') {
      if (id === 'snagret') {
        const k = (a.t % 2.5) / 2.5;
        Art.drawSnagret(g, 0, 0, Math.min(1, k * 4), Math.max(0, Math.sin(k * Math.PI * 4)) * 0.8, 1);
      } else {
        g.scale(2.6, 2.6);
        Art.drawBulborb(g, Art.BORB.reinf, ph, 0, true, 0);
      }
    }
    g.restore();
  };
})();
