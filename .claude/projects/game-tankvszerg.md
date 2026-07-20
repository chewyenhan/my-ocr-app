# Tank vs Zerg

## Overview
- **Type**: Phaser.js side-scrolling arcade shooter (横版防守射击)
- **Players**: 1-player (100 rounds) or 2-player local co-op (100 rounds), same keyboard
- **Theme**: Tank(s) defend against waves of Zerg — co-op survival, not PvP
- **Framework**: Phaser.js 3.87 via CDN
- **Deployment**: GitHub Pages (`chewyenhan.github.io/TankVsZerg/`)
- **Worker**: None — pure local game
- **Repository**: Independent git repo `TankVsZerg/`

## Features
- 🎯 **Auto-aim toggle**: Press fire key to switch between AUTO (auto-target + auto-fire) and MANUAL modes
- 💥 **Splash damage**: Bullets deal 50% collateral damage in 80px radius
- 🔴🔵🟡 **Power-up system**: 10% drop — damage boost (red, +5×3 stacks), shield (blue, +20), nuke (yellow, max 3)
- ☢️ **Nuke**: Q (P1) / U (P2) — instantly clears all on-screen zergs
- 🛡️ **Shield**: E (P1) / I (P2) — +15 shield, passive regen 1/sec
- 📊 **Detailed scoreboard**: Kills, max streak, waves, damage boost, nukes used, HP/shield, final score
- 🟢 **Ranged enemy (Spitter)**: Appears from round 3+, slow-moving bio-artillery that fires acid projectiles
- 👑 **Boss waves**: Every 10 waves — super-sized Ultralisk with 3-projectile spread attack
- 🌍 **Dynamic difficulty**: Formula-based scaling (+12% per round, +6% per wave), 100-round endurance
- 🏜️ **Desert battlefield**: Canvas-generated ground terrain (dirt, craters, tank tracks) replacing starfield
- 🎨 **Opaque tank textures**: Solid background fill prevents transparency issues

## Enemy Types
| Type | Size | Role | Special |
|------|------|------|---------|
| Zergling | 40×30 | Fast melee swarm | 1-shot kill |
| Hydralisk | 48×38 | Winged melee | Moderate HP |
| Drone | 40×30 | Flying scout | Fast, low threat |
| Roach | 48×38 | Armored tank | High HP, high damage |
| Ultralisk | 72×56 | Mini-boss (every 5 waves) | Massive HP/damage |
| **Spitter** | 52×42 | **Ranged artillery** | Fires acid projectiles, keeps distance |
| **Boss Ultra** | 72×56 (×1.3 scale) | **Boss (every 10 waves)** | 3-spread projectile attack, 200+ HP |

## File
| File | Purpose |
|------|---------|
| `index.html` | Main page (Phaser canvas + HUD overlays) |
| `style.css` | Fullscreen layout, HUD styling, overlays, scoreboard table |
| `game.js` | Phaser.Game bootstrap, global handlers, GameData (incl. totalRounds) |
| `scenes/BootScene.js` | Canvas 2D sprite drawing functions (tank, zerg, bullets, spitter, explosion) |
| `scenes/PreloadScene.js` | Texture generation from draw functions, desert background, progress bar |
| `scenes/MenuScene.js` | Title screen, player naming, mode select, totalRounds config |
| `scenes/GameScene.js` | Main gameplay: tanks, zerg, bullets, waves, collisions, power-ups, auto-aim, nukes, scoring, enemy AI |
| `scenes/GameOverScene.js` | (Unused — game over is DOM overlay in index.html) |

## Architecture
- Phaser.js 3.87 via CDN, ES module imports for scenes
- Arcade physics (top-down, no gravity)
- All sprites procedural: Canvas 2D draw functions → texture atlases at startup
- HUD rendered via DOM overlay on top of canvas (HP bars, score, wave, timer)
- Sound: Web Audio API oscillator synthesis (BGM + SFX)
- Bullet expiry: time-based (`expireAt` data) checked in update loop
- Enemy AI: `updateEnemyAI()` runs spitter distance-keeping + boss spread-fire logic
- Enemy bullets: separate `enemyBullets` group (max 80), green acid projectile texture
- No external assets, no Worker needed
- Kenney Tanks asset pack available at `assets/kenney_tanks/` (397 PNGs, not yet integrated)

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
