/* Bulborb Rush — synthesized audio (Web Audio API). No audio files needed. */
(function () {
  'use strict';
  const PTD = window.PTD;

  const A = (PTD.Audio = {
    ctx: null,
    master: null,
    sfx: null,
    music: null,
    muted: false,
    musicOn: true,
    _last: {},
    _noiseBuf: null,
    _seq: null,

    init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = (this.ctx = new AC());
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.8;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      this.master.connect(comp).connect(ctx.destination);
      this.sfx = ctx.createGain();
      this.sfx.gain.value = 0.55;
      this.sfx.connect(this.master);
      this.music = ctx.createGain();
      this.music.gain.value = this.musicOn ? 0.22 : 0;
      this.music.connect(this.master);
      // noise buffer
      const len = ctx.sampleRate * 1;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this._noiseBuf = buf;
      if (this._pendingMusic) this.startMusic(this._pendingMusic);
    },

    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.05);
    },
    setMusic(on) {
      this.musicOn = on;
      if (this.music) this.music.gain.setTargetAtTime(on ? 0.22 : 0, this.ctx.currentTime, 0.1);
    },

    /* ---------- primitive voices ---------- */
    tone(freq, dur, opt = {}) {
      const ctx = this.ctx;
      if (!ctx) return;
      const t0 = ctx.currentTime + (opt.delay || 0);
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = opt.type || 'sine';
      o.frequency.setValueAtTime(freq, t0);
      if (opt.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, opt.slide), t0 + dur);
      const v = opt.vol == null ? 0.3 : opt.vol;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(v, t0 + (opt.attack || 0.005));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      let node = o;
      if (opt.filter) {
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = opt.filter;
        node.connect(f);
        node = f;
      }
      node.connect(g).connect(opt.dest || this.sfx);
      o.start(t0);
      o.stop(t0 + dur + 0.05);
    },
    noise(dur, opt = {}) {
      const ctx = this.ctx;
      if (!ctx) return;
      const t0 = ctx.currentTime + (opt.delay || 0);
      const s = ctx.createBufferSource();
      s.buffer = this._noiseBuf;
      s.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = opt.ftype || 'lowpass';
      f.frequency.setValueAtTime(opt.freq || 1200, t0);
      if (opt.fslide) f.frequency.exponentialRampToValueAtTime(opt.fslide, t0 + dur);
      f.Q.value = opt.q || 0.8;
      const g = ctx.createGain();
      const v = opt.vol == null ? 0.3 : opt.vol;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(v, t0 + (opt.attack || 0.01));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      s.connect(f).connect(g).connect(opt.dest || this.sfx);
      s.start(t0, Math.random() * 0.5);
      s.stop(t0 + dur + 0.05);
    },

    /* ---------- named effects ---------- */
    play(name) {
      if (!this.ctx || this.muted) return;
      const now = performance.now();
      const gap = { pew: 45, hit: 40, pop: 60, boom: 80, fire: 70, die: 35, coin: 50, chomp: 90, bullet: 30 }[name] || 0;
      if (gap && this._last[name] && now - this._last[name] < gap) return;
      this._last[name] = now;
      const r = Math.random;
      switch (name) {
        case 'pew': // groink pebble shot
          this.tone(520 + r() * 80, 0.09, { type: 'square', slide: 180, vol: 0.08, filter: 1800 });
          this.noise(0.05, { freq: 2500, vol: 0.06 });
          break;
        case 'bullet':
          this.tone(900 + r() * 200, 0.05, { type: 'square', slide: 300, vol: 0.05, filter: 2500 });
          break;
        case 'boom':
          this.tone(120, 0.35, { type: 'sine', slide: 40, vol: 0.4 });
          this.noise(0.4, { freq: 900, fslide: 120, vol: 0.3 });
          break;
        case 'cannon':
          this.tone(90, 0.25, { type: 'triangle', slide: 50, vol: 0.35 });
          this.noise(0.18, { freq: 600, vol: 0.18 });
          break;
        case 'fire':
          this.noise(0.4, { freq: 600, fslide: 2400, vol: 0.18, ftype: 'bandpass', q: 0.6 });
          this.tone(180, 0.25, { type: 'sawtooth', slide: 90, vol: 0.05, filter: 800 });
          break;
        case 'frost':
          this.noise(0.35, { freq: 4000, fslide: 1500, vol: 0.12, ftype: 'highpass' });
          this.tone(1400, 0.3, { type: 'sine', slide: 2200, vol: 0.05 });
          break;
        case 'gust':
          this.noise(0.6, { freq: 300, fslide: 1400, vol: 0.2, ftype: 'bandpass', q: 1.2, attack: 0.15 });
          break;
        case 'hit':
          this.noise(0.06, { freq: 1800, vol: 0.08 });
          break;
        case 'chomp':
          this.tone(160, 0.12, { type: 'square', slide: 60, vol: 0.12, filter: 700 });
          this.noise(0.08, { freq: 900, vol: 0.12 });
          break;
        case 'die': { // pikmin death squeak
          const f = 1100 + r() * 400;
          this.tone(f, 0.28, { type: 'sine', slide: f * 1.6, vol: 0.08, delay: 0 });
          this.tone(f * 1.5, 0.35, { type: 'triangle', slide: f * 2.2, vol: 0.04, delay: 0.05 });
          break;
        }
        case 'captainHit':
          this.tone(330, 0.2, { type: 'square', slide: 220, vol: 0.08, filter: 1400 });
          break;
        case 'captainDown':
          [523, 440, 349, 262].forEach((f, i) => this.tone(f, 0.18, { type: 'triangle', vol: 0.14, delay: i * 0.09 }));
          break;
        case 'coin':
          this.tone(1320, 0.08, { type: 'square', vol: 0.05, filter: 3000 });
          this.tone(1760, 0.14, { type: 'square', vol: 0.05, filter: 3000, delay: 0.06 });
          break;
        case 'build':
          this.noise(0.2, { freq: 500, vol: 0.25 });
          this.tone(110, 0.2, { type: 'sine', slide: 60, vol: 0.3 });
          [523, 659, 784].forEach((f, i) => this.tone(f, 0.18, { type: 'triangle', vol: 0.1, delay: 0.1 + i * 0.06 }));
          break;
        case 'upgrade':
          [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, { type: 'triangle', vol: 0.12, delay: i * 0.07 }));
          break;
        case 'sell':
          this.noise(0.15, { freq: 700, vol: 0.2 });
          [988, 1319].forEach((f, i) => this.tone(f, 0.12, { type: 'square', vol: 0.05, filter: 2500, delay: i * 0.08 }));
          break;
        case 'click':
          this.tone(700, 0.05, { type: 'triangle', vol: 0.12 });
          break;
        case 'deny':
          this.tone(180, 0.15, { type: 'square', vol: 0.08, filter: 900 });
          this.tone(150, 0.2, { type: 'square', vol: 0.08, filter: 900, delay: 0.1 });
          break;
        case 'life':
          this.tone(220, 0.35, { type: 'sawtooth', slide: 110, vol: 0.12, filter: 1200 });
          break;
        case 'wave': // whistle!
          this.tone(1568, 0.16, { type: 'sine', vol: 0.12 });
          this.tone(2093, 0.4, { type: 'sine', vol: 0.12, delay: 0.16, slide: 2350 });
          break;
        case 'whistle': // olimar whistle
          this.tone(1800, 0.5, { type: 'sine', vol: 0.06, slide: 2400 });
          break;
        case 'snagret':
          this.noise(0.5, { freq: 300, vol: 0.3 });
          this.tone(700, 0.25, { type: 'sawtooth', slide: 1300, vol: 0.08, filter: 2000, delay: 0.3 });
          break;
        case 'peck':
          this.tone(260, 0.1, { type: 'square', slide: 80, vol: 0.12, filter: 900 });
          this.noise(0.1, { freq: 1200, vol: 0.15 });
          break;
        case 'reinforce':
          [392, 523].forEach((f, i) => this.tone(f, 0.15, { type: 'square', vol: 0.07, filter: 1600, delay: i * 0.1 }));
          break;
        case 'snatch':
          this.noise(0.35, { freq: 1500, fslide: 400, vol: 0.12, ftype: 'bandpass' });
          break;
        case 'croak':
          this.tone(140, 0.18, { type: 'sawtooth', slide: 90, vol: 0.12, filter: 600 });
          this.tone(120, 0.2, { type: 'sawtooth', slide: 80, vol: 0.12, filter: 600, delay: 0.14 });
          break;
        case 'heal':
          [784, 988, 1175].forEach((f, i) => this.tone(f, 0.15, { type: 'sine', vol: 0.06, delay: i * 0.05 }));
          break;
        case 'win':
          [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) =>
            this.tone(f, i === 6 ? 0.8 : 0.2, { type: 'triangle', vol: 0.16, delay: i * 0.13 })
          );
          break;
        case 'lose':
          [392, 370, 349, 262].forEach((f, i) => this.tone(f, i === 3 ? 0.9 : 0.3, { type: 'triangle', vol: 0.15, delay: i * 0.28 }));
          break;
        case 'star':
          this.tone(1047, 0.3, { type: 'triangle', vol: 0.14 });
          this.tone(1568, 0.4, { type: 'sine', vol: 0.08, delay: 0.05 });
          break;
        case 'bossroar':
          this.tone(90, 0.8, { type: 'sawtooth', slide: 60, vol: 0.18, filter: 500 });
          this.noise(0.8, { freq: 400, vol: 0.15 });
          break;
      }
    },

    /* ---------- generative music ---------- */
    startMusic(theme) {
      if (!this.ctx) {
        this._pendingMusic = theme;
        return;
      }
      if (this._seq && this._seq.theme === theme) return;
      this.stopMusic();
      const THEMES = {
        title: { root: 60, scale: [0, 2, 4, 7, 9], bpm: 96, prog: [0, 5, 3, 4], bright: 1 },
        map: { root: 62, scale: [0, 2, 4, 7, 9], bpm: 88, prog: [0, 3, 5, 4], bright: 1 },
        meadow: { root: 60, scale: [0, 2, 4, 7, 9], bpm: 104, prog: [0, 5, 3, 4], bright: 1 },
        forest: { root: 57, scale: [0, 2, 3, 7, 8], bpm: 100, prog: [0, 3, 5, 4], bright: 0.8 },
        pool: { root: 62, scale: [0, 2, 4, 7, 9], bpm: 96, prog: [0, 4, 5, 3], bright: 0.9 },
        twilight: { root: 55, scale: [0, 2, 3, 7, 10], bpm: 92, prog: [0, 5, 3, 4], bright: 0.7 },
      };
      const th = THEMES[theme] || THEMES.meadow;
      const ctx = this.ctx;
      const seq = (this._seq = { theme, step: 0, next: ctx.currentTime + 0.1, th, timer: null, motif: [] });
      const rng = PTD.U.rng(theme.length * 977 + th.root);
      // build a repeating motif (16 steps x 2 phrases)
      for (let p = 0; p < 2; p++) {
        const m = [];
        for (let i = 0; i < 16; i++) {
          const on = i % 4 === 0 ? rng() < 0.85 : i % 2 === 0 ? rng() < 0.55 : rng() < 0.2;
          m.push(on ? rng.int(0, 7) : -1);
        }
        seq.motif.push(m);
      }
      const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
      const noteIn = (deg, octave) => {
        const s = th.scale;
        const o = Math.floor(deg / s.length);
        return th.root + 12 * (octave + o) + s[((deg % s.length) + s.length) % s.length];
      };
      const chordOff = [0, 2, 4, 3, 4, 5, 1];
      const tick = () => {
        const spb = 60 / th.bpm / 4; // 16th note
        while (seq.next < ctx.currentTime + 0.25) {
          const st = seq.step;
          const bar = Math.floor(st / 16) % 4;
          const i16 = st % 16;
          const t = seq.next;
          const delay = Math.max(0, t - ctx.currentTime);
          const chordRoot = th.prog[bar];
          // bass on beats
          if (i16 % 8 === 0) {
            this.tone(midi(noteIn(chordRoot, -2)), spb * 7, { type: 'triangle', vol: 0.32, delay, dest: this.music, attack: 0.01 });
          } else if (i16 % 8 === 6 && th.bright > 0.8) {
            this.tone(midi(noteIn(chordRoot + 2, -2)), spb * 2, { type: 'triangle', vol: 0.18, delay, dest: this.music });
          }
          // pad chord every bar
          if (i16 === 0) {
            [0, 2, 4].forEach((o) =>
              this.tone(midi(noteIn(chordRoot + o, 0)), spb * 15, { type: 'sine', vol: 0.05, delay, dest: this.music, attack: 0.3 })
            );
          }
          // marimba melody
          const phrase = seq.motif[Math.floor(st / 64) % 2];
          const deg = phrase[i16];
          if (deg >= 0) {
            const n = midi(noteIn(deg + chordOff[chordRoot % 7] * 0, 1));
            this.tone(n, 0.35, { type: 'sine', vol: 0.16, delay, dest: this.music, attack: 0.002 });
            this.tone(n * 4, 0.06, { type: 'sine', vol: 0.03, delay, dest: this.music, attack: 0.001 });
          }
          // soft shaker
          if (i16 % 2 === 0) this.noise(0.04, { freq: 7000, ftype: 'highpass', vol: i16 % 4 === 0 ? 0.03 : 0.015, delay, dest: this.music });
          if (i16 === 4 || i16 === 12) this.noise(0.08, { freq: 1800, ftype: 'bandpass', vol: 0.05, delay, dest: this.music });
          seq.next += spb;
          seq.step++;
        }
      };
      seq.timer = setInterval(tick, 60);
      tick();
    },
    stopMusic() {
      this._pendingMusic = null;
      if (this._seq) {
        clearInterval(this._seq.timer);
        this._seq = null;
      }
    },
  });
  void A;
})();
