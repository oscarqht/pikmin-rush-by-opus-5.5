/* Bulborb Rush — bootstrap, resize, input routing, main loop. */
(function () {
  'use strict';
  const PTD = window.PTD;
  const S = PTD.Screens;

  const stage = document.getElementById('stage');
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let scale = 1;
  let dpr = 1;

  function resize() {
    const vw = window.innerWidth, vh = window.innerHeight;
    scale = Math.min(vw / PTD.W, vh / PTD.H);
    const w = Math.floor(PTD.W * scale), h = Math.floor(PTD.H * scale);
    stage.style.width = w + 'px';
    stage.style.height = h + 'px';
    stage.style.fontSize = (16 * scale) + 'px';
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    PTD.Art.setRes(Math.max(1, scale * dpr));
  }

  function toLogical(ev) {
    const r = canvas.getBoundingClientRect();
    return { x: ((ev.clientX - r.left) / r.width) * PTD.W, y: ((ev.clientY - r.top) / r.height) * PTD.H };
  }

  canvas.addEventListener('pointermove', (ev) => {
    if (S.current !== 'game' || !S.game) return;
    const p = toLogical(ev);
    canvas.style.cursor = S.game.pointerMove(p.x, p.y) || 'default';
  });
  canvas.addEventListener('pointerdown', (ev) => {
    PTD.Audio.init();
    if (S.current !== 'game' || !S.game) return;
    const p = toLogical(ev);
    S.game.pointerMove(p.x, p.y);
    S.game.pointerDown(p.x, p.y, ev.pointerType === 'touch');
    ev.preventDefault();
  });
  canvas.addEventListener('contextmenu', (ev) => {
    ev.preventDefault();
    if (S.game) { S.game.closeMenu(); S.game.ui.selected = null; }
  });
  window.addEventListener('keydown', (ev) => {
    if (S.current !== 'game' || !S.game) return;
    if (ev.key === ' ') { S.togglePause(); ev.preventDefault(); return; }
    if (ev.key === 'm' || ev.key === 'M') { S.toggleMute(); return; }
    if (S.game.paused) { if (ev.key === 'Escape') S.resume(); return; }
    S.game.keyDown(ev.key);
  });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && S.current === 'game' && S.game && !S.game.paused && !S.game.over) S.pause();
  });

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    ctx.setTransform(canvas.width / PTD.W, 0, 0, canvas.height / PTD.H, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    try {
      if (S.current === 'game' && S.game) {
        S.game.update(dt);
        S.game.render(ctx);
        S.game.renderHUD(ctx);
      } else if (S.current === 'title' && S.demo) {
        S.updateDemo(dt);
        S.demo.render(ctx);
      } else if (S.current === 'map') {
        S.renderMap(ctx);
      }
      S.updateAlmanac(dt);
    } catch (err) {
      console.error(err);
    }
    requestAnimationFrame(frame);
  }

  function boot() {
    const save = PTD.Save.load();
    PTD.Audio.muted = !!save.muted;
    PTD.Audio.musicOn = save.music !== false;
    resize();
    S.init();
    document.getElementById('loading').classList.add('hide');
    requestAnimationFrame(frame);
  }

  // wait for web fonts (if available) so canvas text uses them
  const fontsReady = document.fonts && document.fonts.load
    ? Promise.race([
        Promise.all([document.fonts.load("20px 'Lilita One'"), document.fonts.load("800 14px 'Nunito'")]),
        new Promise((r) => setTimeout(r, 1500)),
      ])
    : Promise.resolve();
  fontsReady.then(boot, boot);

  // debug / test hook
  PTD.debug = {
    get game() { return S.game; },
    start(i, d) { S.difficulty = d || 'normal'; S.startLevel(i || 0); },
  };
})();
