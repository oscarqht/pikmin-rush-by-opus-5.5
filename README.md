# Bulborb Rush: A Pikmin Tower Defense (React Edition)

A Kingdom Rush–style tower defense game set in the world of Pikmin, with the roles reversed. You command the native creatures (Bulborbs, Breadbugs, Blowhogs, Groinks, Cannon Beetles and more). The Pikmin and their captains (Olimar, Louie, Alph, Brittany, Charlie and the President) are the invaders.

All art and audio are generated procedurally at runtime with Canvas 2D vector drawing and Web Audio synthesis. The application is built with React, TypeScript, and Vite.

## Screenshots

**Tranquil Grove.** A Pikmin column marches in from the Onion while Groinks, Blowhogs, Cannon Beetles and Bulborb dens hold the trail.

![Gameplay: Tranquil Grove](screenshots/03-gameplay-grove.png)

**Twilight Hollow.** The night finale, with Glow Pikmin, fireflies, glowing mushrooms and the President's boss bar.

![Gameplay: Twilight Hollow boss wave](screenshots/06-gameplay-twilight-boss.png)

| Title screen | World map |
| --- | --- |
| ![Title](screenshots/01-title.png) | ![World map](screenshots/02-world-map.png) |
| **Awakening Wood** | **Perplexing Pool** |
| ![Awakening Wood](screenshots/04-gameplay-wood.png) | ![Perplexing Pool](screenshots/05-gameplay-pool.png) |

## Development & Run

This project runs on Node.js with Vite:

```bash
# Install dependencies
npm install

# Run the development server (port 3000)
npm run dev

# Build for production
npm run build
```

## Features

- **React Architecture**: Modular components for screens (Title, World Map, Game canvas view) and modals (Briefing, Piklopedia Almanac, Pause, Results, and About).
- **Procedural Canvas 2D Engine**: All creatures, animations, environments, shadows, effects, and map geography are procedurally rendered without external image files.
- **Synthesized Audio Engine**: Real-time generative chiptune music for themes (Title, Map, Meadow, Forest, Pool, Twilight) and procedural sound effects via Web Audio API.
- **4 Levels**:
  - Tranquil Grove (Meadow)
  - Awakening Wood (Autumn Forest, dual trails)
  - Perplexing Pool (Water ponds, Koppaites)
  - Twilight Hollow (Night, Glow Pikmin, President boss battle)
- **Towers & Upgrades**: 4 tower families (Gatling Groink, Bulborb Den, Fiery Blowhog, Cannon Beetle Larva) with 3 tiers and elite tier-4 specializations.
- **Emperor Bulblax Hero**: Moveable hero unit with ground stomps, group tongue attacks, leveling, and respawns.
- **Special Spells**: Snagret Strike (summoning Burrowing Snagret) and Bulborb Reinforcements.
- **Piklopedia (Almanac)**: Interactive compendium with live animated previews and complete creature/invader combat statistics.
- **Persistent Progress**: Star ratings, difficulty selection, and seen invaders saved in localStorage.
