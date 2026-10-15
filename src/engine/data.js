/* Bulborb Rush — game data: enemies, towers, hero, spells. */
(function () {
  'use strict';
  const PTD = window.PTD;

  /* ------------------------------------------------------------------
   * ENEMIES — the Pikmin and their captains are invading the creatures' home.
   * hp/speed are base values (leaf tier); bud/flower tiers scale them.
   * ------------------------------------------------------------------ */
  PTD.TIER = {
    hp: [1, 1.4, 1.85],
    speed: [1, 1.08, 1.16],
    reward: [0, 1, 2],
    names: ['Leaf', 'Bud', 'Flower'],
  };

  PTD.ENEMIES = {
    red: {
      name: 'Red Pikmin', pik: true, hp: 30, speed: 34, armor: 0, mres: 0, reward: 6, dmg: [1, 3], rate: 1, lives: 1, fireRes: 0.5,
      desc: 'The most common invader. Fire-resistant: Blowhog flames only do half damage.',
      tip: 'Half damage from fire.',
    },
    yellow: {
      name: 'Yellow Pikmin', pik: true, hp: 26, speed: 44, armor: 0, mres: 0, reward: 6, dmg: [1, 2], rate: 0.9, lives: 1,
      desc: 'Big-eared and light on their feet. They scurry past slow towers.',
      tip: 'Fast but fragile.',
    },
    blue: {
      name: 'Blue Pikmin', pik: true, hp: 38, speed: 33, armor: 0, mres: 0, reward: 7, dmg: [1, 3], rate: 1, lives: 1,
      desc: 'Sturdy all-rounders with gill-like mouths. A little tougher than reds.',
      tip: 'Slightly tougher.',
    },
    purple: {
      name: 'Purple Pikmin', pik: true, hp: 150, speed: 22, armor: 0.35, mres: 0, reward: 16, dmg: [5, 9], rate: 1.4, lives: 2, stunHit: true,
      desc: 'Heavy and slow. Their ground-pound stuns defenders, and armour shrugs off pebbles.',
      tip: 'Armoured heavyweight; magic works best.',
    },
    white: {
      name: 'White Pikmin', pik: true, hp: 24, speed: 56, armor: 0, mres: 0, reward: 7, dmg: [1, 2], rate: 0.8, lives: 1, poison: true,
      desc: 'Red-eyed sprinters. Poisonous: any creature that bites one down takes damage.',
      tip: 'Very fast. Poisons melee killers.',
    },
    rock: {
      name: 'Rock Pikmin', pik: true, hp: 100, speed: 28, armor: 0.65, mres: 0, reward: 16, dmg: [3, 6], rate: 1.1, lives: 1,
      desc: 'Living pebbles. Their stony bodies laugh off physical attacks.',
      tip: 'Very high armour; use Blowhogs.',
    },
    winged: {
      name: 'Winged Pikmin', pik: true, hp: 34, speed: 42, armor: 0, mres: 0, reward: 8, dmg: [1, 2], rate: 1, lives: 1, flying: true,
      desc: 'Fluttering pink Pikmin that fly over Bulborb dens. Cannon Beetles cannot hit them.',
      tip: 'Flying: ignores dens and cannons.',
    },
    ice: {
      name: 'Ice Pikmin', pik: true, hp: 55, speed: 32, armor: 0, mres: 0.2, reward: 9, dmg: [2, 3], rate: 1, lives: 1, slowImmune: true,
      desc: 'Frosty crystalline Pikmin. Immune to slowing frost and gusts.',
      tip: 'Immune to slow & push.',
    },
    glow: {
      name: 'Glow Pikmin', pik: true, hp: 48, speed: 40, armor: 0, mres: 0.6, reward: 9, dmg: [1, 3], rate: 1, lives: 1,
      desc: 'Night-time Pikmin that shimmer with bioluminescence. Resist magic.',
      tip: 'High magic resistance.',
    },
    olimar: {
      name: 'Captain Olimar', captain: true, big: true, hp: 520, speed: 28, armor: 0.2, mres: 0, reward: 45, dmg: [8, 14], rate: 1.2, lives: 3, ability: 'whistle',
      desc: 'Veteran Hocotate Freight captain. His whistle rallies nearby Pikmin, speeding them up and shaking off slows.',
      tip: 'Whistle speeds up nearby Pikmin.',
    },
    louie: {
      name: 'Louie', captain: true, big: true, hp: 380, speed: 46, armor: 0.1, mres: 0, reward: 40, dmg: [6, 10], rate: 1, lives: 3, ability: 'snack',
      desc: 'Always hungry. Fast on his feet, and once wounded he stops for a snack to heal himself.',
      tip: 'Heals once when hurt.',
    },
    alph: {
      name: 'Alph', captain: true, big: true, hp: 420, speed: 32, armor: 0.1, mres: 0, reward: 40, dmg: [6, 10], rate: 1, lives: 3, ability: 'pluck',
      desc: 'Koppaite engineer. Plucks fresh sprouts as he walks, adding Pikmin to the march.',
      tip: 'Spawns Pikmin over time.',
    },
    brittany: {
      name: 'Brittany', captain: true, big: true, hp: 380, speed: 34, armor: 0, mres: 0.2, reward: 40, dmg: [5, 9], rate: 1, lives: 3, ability: 'heal',
      desc: 'Koppaite botanist. Shares fruit juice that heals nearby Pikmin.',
      tip: 'Heals nearby Pikmin.',
    },
    charlie: {
      name: 'Captain Charlie', captain: true, big: true, hp: 900, speed: 24, armor: 0.45, mres: 0, reward: 60, dmg: [15, 25], rate: 1.3, lives: 4, ability: 'tank',
      desc: 'The burly Koppaite captain. Heavily armoured and hits hard.',
      tip: 'Tanky. Armour 45%.',
    },
    president: {
      name: 'The President', captain: true, big: true, boss: true, hp: 4200, speed: 15, armor: 0.3, mres: 0.2, reward: 300, dmg: [30, 45], rate: 1.5, lives: 20, ability: 'summon',
      desc: 'President of Hocotate Freight. Summons squads of Pikmin and is immune to being carried off.',
      tip: 'BOSS. Summons Pikmin. Costs 20 lives!',
    },
  };

  /* ------------------------------------------------------------------
   * TOWERS — native creatures. family: groink | den | hog | cannon
   * tier 1-3 = upgrades, tier 4 = elite branch.
   * ------------------------------------------------------------------ */
  PTD.TOWERS = {
    groink1: {
      family: 'groink', tier: 1, name: 'Gatling Groink', cost: 70, creature: 'groink', scale: 0.62,
      attack: 'pebble', dtype: 'phys', dmg: [4, 7], rate: 0.8, range: 140, air: true, next: ['groink2'],
      desc: 'A goldfish-shaped walker that lobs pebbles from its retractable cannon. Hits flyers.',
    },
    groink2: { family: 'groink', tier: 2, name: 'Gatling Groink II', cost: 110, creature: 'groink', scale: 0.7, attack: 'pebble', dtype: 'phys', dmg: [7, 11], rate: 0.7, range: 152, air: true, next: ['groink3'], desc: 'A bigger Groink with a faster cannon.' },
    groink3: { family: 'groink', tier: 3, name: 'Gatling Groink III', cost: 160, creature: 'groink', scale: 0.78, attack: 'pebble', dtype: 'phys', dmg: [11, 17], rate: 0.6, range: 165, air: true, next: ['manatlegs', 'snitch'], desc: 'A battle-scarred Groink. Ready to evolve.' },
    manatlegs: {
      family: 'groink', tier: 4, name: 'Man-at-Legs', cost: 230, creature: 'manatlegs', scale: 0.74,
      attack: 'bullet', dtype: 'phys', dmg: [6, 10], rate: 1.15, burst: 8, burstGap: 0.08, range: 175, air: true, next: [],
      desc: 'A towering arachnorb with a belly-mounted gatling. Sprays bursts of 8 rapid shots.',
    },
    snitch: {
      family: 'groink', tier: 4, name: 'Swooping Snitchbug', cost: 250, creature: 'snitch', scale: 0.88,
      attack: 'spit', dtype: 'phys', dmg: [28, 42], rate: 1.4, range: 215, air: true, ability: 'snatch', abilityCd: 9, next: [],
      desc: 'Long-range spitter. Every 9s it swoops down, snatches a Pikmin and drops it far back down the trail.',
    },

    den1: {
      family: 'den', tier: 1, name: 'Dwarf Bulborb Den', cost: 70, soldier: 'dwarf', count: 3, hp: 50, dmg: [1, 3], rate: 1, armor: 0, respawn: 10, range: 160, next: ['den2'],
      desc: 'A burrow of three Dwarf Bulborbs that block the trail and nibble invaders.',
    },
    den2: { family: 'den', tier: 2, name: 'Orange Dwarf Den', cost: 110, soldier: 'dwarfOrange', count: 3, hp: 90, dmg: [3, 5], rate: 1, armor: 0.1, respawn: 10, range: 165, next: ['den3'], desc: 'Tougher Orange Dwarf Bulborbs.' },
    den3: { family: 'den', tier: 3, name: 'Red Bulborb Den', cost: 150, soldier: 'red', count: 3, hp: 150, dmg: [6, 10], rate: 1, armor: 0.2, respawn: 10, range: 170, next: ['bulbear', 'breadbug'], desc: 'Full-grown Red Bulborbs. Ready to evolve.' },
    bulbear: {
      family: 'den', tier: 4, name: 'Spotty Bulbear Lair', cost: 230, soldier: 'bulbear', count: 3, hp: 300, dmg: [13, 21], rate: 1.1, armor: 0.35, respawn: 12, range: 175, regen: 14, next: [],
      desc: 'Massive Spotty Bulbears. Very tough, heavy bites and fast regeneration.',
    },
    breadbug: {
      family: 'den', tier: 4, name: 'Breadbug Burrow', cost: 230, soldier: 'breadbug', count: 3, hp: 230, dmg: [8, 13], rate: 1, armor: 0.25, respawn: 10, range: 175, ability: 'haul', abilityCd: 10, next: [],
      desc: 'Greedy Breadbugs. Every 10s each one drags the Pikmin it is fighting back into its burrow. Gone!',
    },

    hog1: {
      family: 'hog', tier: 1, name: 'Fiery Blowhog', cost: 100, creature: 'fiery', scale: 0.6,
      attack: 'fireball', dtype: 'fire', dmg: [9, 17], rate: 1.5, range: 130, air: true, burn: 3, windup: 0.25, next: ['hog2'],
      desc: 'Inflates and spits fireballs that burn. Fire ignores armour (Red Pikmin resist it).',
    },
    hog2: { family: 'hog', tier: 2, name: 'Fiery Blowhog II', cost: 160, creature: 'fiery', scale: 0.68, attack: 'fireball', dtype: 'fire', dmg: [18, 32], rate: 1.5, range: 140, air: true, burn: 5, windup: 0.25, next: ['hog3'], desc: 'Hotter flames, longer reach.' },
    hog3: { family: 'hog', tier: 3, name: 'Fiery Blowhog III', cost: 240, creature: 'fiery', scale: 0.76, attack: 'fireball', dtype: 'fire', dmg: [30, 52], rate: 1.5, range: 150, air: true, burn: 8, windup: 0.25, next: ['withering', 'puffy'], desc: 'A blazing elder Blowhog. Ready to evolve.' },
    withering: {
      family: 'hog', tier: 4, name: 'Withering Blowhog', cost: 260, creature: 'withering', scale: 0.74,
      attack: 'frost', dtype: 'magic', dmg: [38, 62], rate: 1.4, range: 155, air: true, slow: 0.5, slowT: 2.5, wither: true, windup: 0.25, next: [],
      desc: 'Its chilling breath slows foes and withers flowers: Flower and Bud Pikmin revert to weaker Leaf Pikmin.',
    },
    puffy: {
      family: 'hog', tier: 4, name: 'Puffy Blowhog', cost: 260, creature: 'puffy', scale: 0.7,
      attack: 'wind', dtype: 'magic', dmg: [40, 64], rate: 1.6, range: 150, air: true, push: 35, ability: 'gust', abilityCd: 10, windup: 0.3, next: [],
      desc: 'A floating balloon-hog. Gusts push enemies back; every 10s a Big Gust blows a whole group away.',
    },

    cannon1: {
      family: 'cannon', tier: 1, name: 'Cannon Beetle Larva', cost: 125, creature: 'larva', scale: 0.68,
      attack: 'boulder', dtype: 'phys', dmg: [8, 15], rate: 3, range: 160, splash: 46, air: false, windup: 0.3, next: ['cannon2'],
      desc: 'Inhales through its blowhole and spits boulders that crush groups. Cannot hit flyers.',
    },
    cannon2: { family: 'cannon', tier: 2, name: 'Cannon Beetle Larva II', cost: 220, creature: 'larva', scale: 0.76, attack: 'boulder', dtype: 'phys', dmg: [18, 32], rate: 3, range: 170, splash: 48, air: false, windup: 0.3, next: ['cannon3'], desc: 'Bigger boulders, bigger splats.' },
    cannon3: { family: 'cannon', tier: 3, name: 'Cannon Beetle Larva III', cost: 320, creature: 'larva', scale: 0.84, attack: 'boulder', dtype: 'phys', dmg: [30, 50], rate: 3, range: 180, splash: 52, air: false, windup: 0.3, next: ['decorated', 'wolly'], desc: 'A massive larva. Ready to evolve.' },
    decorated: {
      family: 'cannon', tier: 4, name: 'Decorated Cannon Beetle', cost: 330, creature: 'decorated', scale: 0.8,
      attack: 'boulder', dtype: 'phys', dmg: [45, 70], rate: 3, range: 190, splash: 56, air: false, ability: 'roll', abilityCd: 9, windup: 0.3, next: [],
      desc: 'An ornate armoured beetle. Every 9s it fires a huge boulder that rolls back down the trail, flattening everything.',
    },
    wolly: {
      family: 'cannon', tier: 4, name: 'Yellow Wollywog Pond', cost: 320, creature: 'wolly', scale: 0.78,
      attack: 'jump', dtype: 'phys', dmg: [60, 95], rate: 3.2, range: 170, splash: 62, air: false, stun: 1.2, next: [],
      desc: 'A Yellow Wollywog leaps out of its pond and belly-flops onto the march, stunning everything it squashes.',
    },
  };

  PTD.BUILD_LIST = ['groink1', 'den1', 'hog1', 'cannon1'];

  PTD.FAMILY_NAME = { groink: 'Ranged', den: 'Den', hog: 'Magic', cannon: 'Artillery' };

  PTD.HERO = {
    name: 'Emperor Bulblax',
    hp: 420, dmg: [14, 22], rate: 1.1, armor: 0.25, speed: 58, respawn: 15, regen: 14, engage: 90,
    desc: 'The ruler of the creature kingdom. Click him (or his portrait), then click the ground to move. Lashes his tongue at groups and causes earthquakes with his stomps. Levels up as he fights.',
  };

  PTD.SPELLS = {
    snagret: {
      name: 'Snagret Strike', cd: 45, radius: 75, dmg: [45, 70], pecks: 3,
      desc: 'A Burrowing Snagret erupts from the ground and pecks everything in the area three times.',
    },
    reinforce: {
      name: 'Bulborb Reinforcements', cd: 15, count: 2, hp: 70, dmg: [3, 6], ttl: 20,
      desc: 'Summon two Green Dwarf Bulborbs to block the trail for 20 seconds.',
    },
  };
})();
