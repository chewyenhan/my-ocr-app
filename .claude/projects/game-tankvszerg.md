# Tank vs Zerg

## Overview
- **Type**: Phaser.js side-scrolling arcade shooter (横版防守射击)
- **Players**: 1-player or 2-player local co-op, same keyboard — endless survival mode
- **Theme**: Tank(s) defend against endless waves of Zerg — survive as long as possible
- **Framework**: Phaser.js 3.87 via CDN
- **Deployment**: GitHub Pages (`chewyenhan.github.io/TankVsZerg/`)
- **Worker**: None — pure local game
- **Repository**: Independent git repo `TankVsZerg/`

## Features
- 🎯 **Auto-aim toggle**: Press fire key to switch between AUTO (auto-target + auto-fire) and MANUAL modes
- 💥 **Splash damage**: Bullets deal 50% collateral damage in 80px radius
- 🔴🔵🟡 **Power-up system**: 10% drop — damage boost (red, +5×3 stacks), shield (blue, +20), nuke (yellow, max 3)
- ☢️ **Nuke**: Q (P1) / U (P2) — instantly clears all on-screen zergs
- 🛡️ **Shield**: E (P1) / I (P2) — +15 shield, 3s cooldown, passive regen 1/sec
- ⏱️ **Survival timer**: Counts UP from 0:00 — high score = longest survival
- 📊 **Leaderboard on death**: Kills, max streak, waves survived, survival time, damage boost, nukes, final score
- 🟢 **Ranged enemy (Spitter)**: Appears from wave 5+, slow bio-artillery that fires acid projectiles
- 👑 **Boss waves**: Every 10 waves — super-sized Ultralisk with chase AI + 3-projectile spread attack
- 🌍 **Dynamic difficulty**: Formula-based scaling (+8% per wave), endless endurance
- 🏜️ **Desert battlefield**: Canvas-generated ground terrain (dirt, craters, tank tracks)
- 🎨 **Kenney tank PNGs**: Real pixel-art tank sprites (`tank_red.png`, `tank_blue.png`), no transparency

## Enemy Types
| Type | Size | Role | Special |
|------|------|------|---------|
| Zergling | 40×30 | Fast melee swarm | 1-shot kill |
| Hydralisk | 48×38 | Winged melee | Moderate HP |
| Drone | 40×30 | Flying scout | Fast, low threat |
| Roach | 48×38 | Armored tank | High HP, high damage |
| Ultralisk | 72×56 | Mini-boss (every 5 waves) | Massive HP/damage |
| **Spitter** | 52×42 | **Ranged artillery** | Fires acid projectiles, keeps distance |
| **Boss Ultra** | 72×56 (×1.3 scale) | **Boss (every 10 waves)** | Chase AI + 3-spread projectile, 200+ HP |

## File
| File | Purpose |
|------|---------|
| `index.html` | Main page (Phaser canvas + HUD overlays) |
| `style.css` | Fullscreen layout, HUD styling, overlays, scoreboard table |
| `game.js` | Phaser.Game bootstrap, global handlers, GameData (survivalTime, waveNumber) |
| `scenes/BootScene.js` | Canvas 2D sprite drawing functions (tank, zerg, bullets, spitter, explosion) |
| `scenes/PreloadScene.js` | Loads Kenney tank/bullet PNGs, generates zerg/background/explosion textures |
| `scenes/MenuScene.js` | Title screen, player naming, mode select, resets game state |
| `scenes/GameScene.js` | Main gameplay: tanks, zerg, bullets, waves, collisions, power-ups, auto-aim, nukes, scoring, enemy AI |
| `scenes/GameOverScene.js` | (Unused — game over is DOM overlay in index.html) |

## Architecture
- Phaser.js 3.87 via CDN, ES module imports for scenes
- Arcade physics (top-down, no gravity)
- **Tanks/Bullets**: Kenney PNG assets (`assets/kenney_tanks/PNG/Retina/`), canvas fallback on load failure
- **Zerg**: Canvas 2D procedural textures (draw functions in BootScene → PreloadScene)
- HUD rendered via DOM overlay on top of canvas (HP bars, score, wave, survival timer)
- Sound: Web Audio API oscillator synthesis (BGM + SFX)
- Bullet expiry: time-based (`expireAt` data) checked in update loop
- Enemy AI: `updateEnemyAI()` handles spitter distance-keeping + boss chase + spread-fire
- Enemy bullets: separate `enemyBullets` group (max 80), body.reset() on recycle
- Shield: 3s cooldown prevents spam; passive regen 1/sec
- **No round system** — endless survival; tank death → leaderboard immediately

## Controls
| | Player 1 (Red) | Player 2 (Blue) |
|--|----------------|-----------------|
| Move | W/A/S/D | Arrow Keys |
| Fire / Toggle Auto-Aim | Space | Enter |
| Burst (costs 5 shield) | Shift | Right Shift |
| Shield Boost | E | I |
| Nuke | Q | U |
| Pause | ESC | ESC |

## Deployment
```bash
cd TankVsZerg && git add . && git commit -m "..." && git push
```
Deploy URL: `chewyenhan.github.io/TankVsZerg/`
