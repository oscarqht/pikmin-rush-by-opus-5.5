/* Bulborb Rush — persistent progression: star upgrade tree + Emperor Bulblax levels/skills.
   Everything here is stored in the existing save (localStorage) and read when a level starts. */
(function () {
  'use strict';
  const PTD = window.PTD;
  const Save = PTD.Save;

  /* ------------------------------------------------------------------
   * STAR UPGRADE TREE — 6 tracks × 5 ranks, bought with earned stars.
   * Each rank's `m` is merged into the track's modifiers (additive).
   * ------------------------------------------------------------------ */
  const RANK_COST = (PTD.RANK_COST = [1, 1, 2, 2, 3]);

  PTD.UPGRADE_TREE = [
    {
      id: 'groink', name: 'Groink Gunnery', por: 'cre:groink', blurb: 'Ranged towers',
      ranks: [
        { d: 'Groinks cost 10% less', m: { cost: -0.1 } },
        { d: '+8% range', m: { range: 0.08 } },
        { d: '+15% damage', m: { dmg: 0.15 } },
        { d: 'Fire 12% faster', m: { rate: 0.12 } },
        { d: 'Hollow pebbles: ignore 30% of armour', m: { pierce: 0.3 } },
      ],
    },
    {
      id: 'den', name: 'Bulborb Burrows', por: 'borb:red', blurb: 'Den creatures',
      ranks: [
        { d: 'Dens cost 10% less', m: { cost: -0.1 } },
        { d: 'Den creatures +20% health', m: { hp: 0.2 } },
        { d: 'Fallen creatures return 30% sooner', m: { respawn: -0.3 } },
        { d: '+20% bite damage', m: { dmg: 0.2 } },
        { d: 'Thick hide: +15% armour', m: { armor: 0.15 } },
      ],
    },
    {
      id: 'hog', name: 'Blowhog Bellows', por: 'cre:fiery', blurb: 'Magic towers',
      ranks: [
        { d: 'Blowhogs cost 10% less', m: { cost: -0.1 } },
        { d: '+8% range', m: { range: 0.08 } },
        { d: 'Burns are 50% hotter', m: { burn: 0.5 } },
        { d: '+15% damage', m: { dmg: 0.15 } },
        { d: 'Wildfire: fireball splash +60%', m: { splash: 0.6 } },
      ],
    },
    {
      id: 'cannon', name: 'Beetle Barrage', por: 'cre:larva', blurb: 'Artillery towers',
      ranks: [
        { d: 'Cannon Beetles cost 10% less', m: { cost: -0.1 } },
        { d: '+15% splash radius', m: { splash: 0.15 } },
        { d: '+15% damage', m: { dmg: 0.15 } },
        { d: '+8% range', m: { range: 0.08 } },
        { d: 'Aftershock: boulders stun for 0.5s', m: { stun: 0.5 } },
      ],
    },
    {
      id: 'beetle', name: 'Anode Amplifier', por: 'cre:anode', blurb: 'Electric towers',
      ranks: [
        { d: 'Anode Beetles cost 10% less', m: { cost: -0.1 } },
        { d: 'Bolts jump to 1 more Pikmin', m: { chain: 1 } },
        { d: '+15% damage', m: { dmg: 0.15 } },
        { d: '+8% range', m: { range: 0.08 } },
        { d: 'Overcharge: 15% chance to stun', m: { shock: 0.15 } },
      ],
    },
    {
      id: 'spells', name: 'Burrow Rituals', por: 'spell:snagret', blurb: 'Spells',
      ranks: [
        { d: 'Snagret Strike recharges 15% faster', m: { snagCd: -0.15 } },
        { d: 'Reinforcements bring 3 Dwarf Bulborbs', m: { reinfCount: 1 } },
        { d: 'Snagret Strike hits a 20% wider area', m: { snagRadius: 0.2 } },
        { d: 'Reinforcements: +50% health, stay 5s longer', m: { reinfHp: 0.5, reinfTtl: 5 } },
        { d: 'The Snagret pecks 4 times', m: { snagPecks: 1 } },
      ],
    },
  ];

  /* ------------------------------------------------------------------
   * HERO — Emperor Bulblax persistent levels (cap 10) and skills.
   * cumulative XP needed to reach each level (index = level)
   * ------------------------------------------------------------------ */
  const HERO_XP = (PTD.HERO_XP = [0, 0, 1000, 2500, 4500, 7000, 10000, 14000, 19000, 25000, 32000]);
  const HERO_MAX = (PTD.HERO_MAX_LEVEL = 10);

  PTD.HERO_SKILLS = [
    {
      id: 'tongue', name: 'Tongue Lash',
      desc: 'The Emperor lashes his tongue across a group of Pikmin, flyers included.',
      ranks: ['+30% lash damage, hits 5 foes', '+60% lash damage, hits 6 foes', '+90% lash damage, hits 7 foes, recharges in 6s'],
    },
    {
      id: 'quake', name: 'Earthquake',
      desc: 'His stomp shakes the ground, hurting and stunning everything nearby.',
      ranks: ['Wider quake, stun lasts 2s', 'Even wider, +60% damage, 2.5s stun', 'Huge quake, +90% damage, 3s stun'],
    },
    {
      id: 'hide', name: 'Royal Hide',
      desc: 'Thick, speckled hide and a royal appetite for recovery.',
      ranks: ['+15% health, +6% armour', '+30% health, +12% armour, faster healing', '+45% health, +18% armour, much faster healing'],
    },
    {
      id: 'roar', name: 'Royal Roar',
      desc: 'A thunderous bellow that sends nearby Pikmin tumbling back down the trail and rouses nearby den creatures.',
      ranks: ['Unlock the Roar (every 18s)', 'Pushes further, heals den creatures, every 15s', 'Pushes furthest, stuns captains, every 12s'],
    },
  ];

  /* ------------------------------------------------------------------
   * save helpers
   * ------------------------------------------------------------------ */
  function data() {
    const d = Save.data || Save.load();
    if (!d.upgrades || typeof d.upgrades !== 'object') d.upgrades = {};
    if (!d.hero || typeof d.hero !== 'object') d.hero = { xp: 0, skills: {} };
    if (!d.hero.skills) d.hero.skills = {};
    if (typeof d.hero.xp !== 'number' || !isFinite(d.hero.xp) || d.hero.xp < 0) d.hero.xp = 0;
    return d;
  }

  const clampRank = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));

  const Progress = (PTD.Progress = {
    /* ---------- stars & tree ---------- */
    starsEarned() {
      const d = data();
      let n = 0;
      for (const lv of PTD.LEVELS || []) n += Math.max(0, Math.min(3, (d.stars && d.stars[lv.id]) || 0));
      return n;
    },
    rank(track) {
      return clampRank(data().upgrades[track], 5);
    },
    starsSpent() {
      let n = 0;
      for (const tr of PTD.UPGRADE_TREE) for (let r = 0; r < this.rank(tr.id); r++) n += RANK_COST[r];
      return n;
    },
    starsAvailable() {
      return Math.max(0, this.starsEarned() - this.starsSpent());
    },
    nextCost(track) {
      const r = this.rank(track);
      return r >= 5 ? null : RANK_COST[r];
    },
    canBuy(track) {
      const c = this.nextCost(track);
      return c != null && this.starsAvailable() >= c;
    },
    buy(track) {
      if (!PTD.UPGRADE_TREE.some((t) => t.id === track) || !this.canBuy(track)) return false;
      data().upgrades[track] = this.rank(track) + 1;
      Save.write();
      return true;
    },
    resetTree() {
      data().upgrades = {};
      Save.write();
    },

    /** aggregated modifiers from the tree: { groink: {...}, den: {...}, ..., spells: {...} } */
    mods() {
      const out = {};
      for (const tr of PTD.UPGRADE_TREE) {
        const m = { cost: 0, dmg: 0, range: 0, rate: 0, pierce: 0, hp: 0, respawn: 0, armor: 0, burn: 0, splash: 0, stun: 0, chain: 0, shock: 0, snagCd: 0, reinfCount: 0, snagRadius: 0, reinfHp: 0, reinfTtl: 0, snagPecks: 0 };
        const r = this.rank(tr.id);
        for (let i = 0; i < r; i++) for (const k in tr.ranks[i].m) m[k] += tr.ranks[i].m[k];
        out[tr.id] = m;
      }
      // guard against a corrupted save making the tree overspent
      if (this.starsSpent() > this.starsEarned()) {
        this.resetTree();
        return this.mods();
      }
      return out;
    },

    /* ---------- hero ---------- */
    heroXp() { return data().hero.xp; },
    levelForXp(xp) {
      let L = 1;
      while (L < HERO_MAX && xp >= HERO_XP[L + 1]) L++;
      return L;
    },
    heroLevel() { return this.levelForXp(this.heroXp()); },
    skillRank(id) { return clampRank(data().hero.skills[id], 3); },
    skills() {
      const o = {};
      for (const s of PTD.HERO_SKILLS) o[s.id] = this.skillRank(s.id);
      return o;
    },
    pointsSpent() {
      let n = 0;
      for (const s of PTD.HERO_SKILLS) n += this.skillRank(s.id);
      return n;
    },
    pointsAvailable() {
      return Math.max(0, this.heroLevel() - 1 - this.pointsSpent());
    },
    buySkill(id) {
      if (!PTD.HERO_SKILLS.some((s) => s.id === id)) return false;
      if (this.pointsAvailable() < 1 || this.skillRank(id) >= 3) return false;
      data().hero.skills[id] = this.skillRank(id) + 1;
      Save.write();
      return true;
    },
    resetSkills() {
      data().hero.skills = {};
      Save.write();
    },
    /** store the Emperor's XP at the end of a level. Returns { gained, before, after }. */
    commitHero(game) {
      if (!game || game.heroCommitted) return null;
      game.heroCommitted = true;
      const d = data();
      const before = this.levelForXp(d.hero.xp);
      const total = Math.min(HERO_XP[HERO_MAX], Math.max(d.hero.xp, game.hero.totalXp || 0));
      const gained = Math.round(total - d.hero.xp);
      d.hero.xp = total;
      Save.write();
      return { gained, before, after: this.levelForXp(total) };
    },
  });

  void Progress;
})();
