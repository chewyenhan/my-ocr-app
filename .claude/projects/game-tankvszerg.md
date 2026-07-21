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
- 🔴🔵🟡🟢 **Power-up system**: 10% drop — weapon EXP (red cannon, level up weapon), swarm missile launcher (blue missile, 15s auto-homing), nuke (yellow radiation, max 3+tech), heal (green cross, +30 HP)
- ❌ **No nuke chain**: Zergs killed by nuke drop no power-ups — prevents infinite nuke loop
- ☢️ **Nuke**: Q (P1) / U (P2) — instantly clears all on-screen zergs, count shown in HUD
- 🚀 **Swarm Missile Launcher**: Pickup grants 15s (+tech) of auto-tracking homing missiles (200ms fire rate, 20 dmg, 50px splash radius)
- 🛡️ **Shield**: E (P1) / I (P2) — +15 shield, 3s cooldown, passive regen 1/sec, starts full (30/30 + tech)
- ⏱️ **Survival timer**: Counts UP from 0:00 — high score = longest survival
- 📊 **Leaderboard on death**: Kills, max streak, waves survived, survival time, weapon level, nukes, final score, tech points earned
- 🟢 **Ranged enemy (Spitter)**: Appears from wave 5+, fires acid projectiles (12 dmg, 16×16 body, 450px range, 1.8-2.2s fire rate)
- 👑 **Boss waves**: Every 10 waves — two-phase fight. Boss HP: `2000+wave×300` (10x scaling), damage `15+wave×2`, **spread fire**: 1 bullet at wave 10, +1 every 10 waves. Short 3-beep alarm on entry, BGM during fight only
- 🌍 **Dynamic difficulty**: Formula-based scaling (+8% per wave), **co-op scaling** (×1.6 count, ×1.3 HP), **breathing waves** after boss (×0.5 count)
- 🏜️ **Desert battlefield**: Canvas-generated ground terrain (dirt, craters, tank tracks)
- 🎨 **Kenney tank PNGs**: Real pixel-art tank sprites (`tank_red.png`, `tank_blue.png`), no transparency
- 🎵 **Real sound effects**: Downloaded CC0 SFX (shooting, explosions, power-ups) with oscillator fallback. BGM plays only during boss fights
- 🔬 **Tech Tree**: Meta-progression system — **P1/P2 independent trees** with 6 upgradable stats (attack, armor, fire rate, nuke cap, shield cap, swarm duration), earned per-player, persisted in localStorage with JSON import/export backup
- ⚔ **Weapon Evolution**: 5-level in-game weapon system — Lv1 Single → Lv2 Dual → Lv3 Spread (5-way) → Lv4 Pierce (3-way) → Lv5 MAX Laser (beam + 80px splash)

## Enemy Types
| Type | Size | Role | Special |
|------|------|------|---------|
| Zergling | 40×30 | Fast melee swarm | 1-shot kill |
| Hydralisk | 48×38 | Winged melee | Moderate HP |
| Drone | 40×30 | Flying scout | Fast, low threat |
| Roach | 48×38 | Armored tank | High HP, high damage |
| Ultralisk | 72×56 | Mini-boss (every 5 waves) | Massive HP/damage |
| **Spitter** | 52×42 | **Ranged artillery** | Fires acid projectiles, keeps distance |
| **Boss Ultra** | 72×56 (×1.3 scale) | **Boss (every 10 waves)** | Chase AI + continuous machine-gun fire, 200+ HP |

## Tech Tree
| Tech | Levels | Effect | Total Cost |
|------|--------|--------|------------|
| Attack | 0→20 | +3 base dmg/level (15→75) | ~6200 |
| Armor | 0→10 | +15 HP/level (100→250) | ~1625 |
| Fire Rate | 0→5 | -60ms interval/level (500→200ms) | ~1200 |
| Nuke Cap | 0→5 | +1 nuke/level (3→8) | ~1600 |
| Shield Cap | 0→5 | +5 shield/level (30→55) | ~975 |
| Swarm Dur | 0→5 | +3s duration/level (15→30s) | ~800 |

- **P1/P2 independent**: Each player has their own tree (`tankVszerg_techtree_p1` / `_p2`)
- Tech points earned per-player: `wave × kills / 10`
- Co-op mode: each player earns separately based on their own kills
- Persisted in `localStorage` with **JSON Export/Import** for backup
- Old single-tree saves auto-migrated to both players on first load
- UI: P1/P2 tab switching, Export/Import buttons in tech tree panel

## Weapon Evolution
| Level | Name | Pattern | Dmg Bonus | Exp Needed |
|-------|------|---------|-----------|------------|
| Lv1 | Basic Cannon | 1 shot straight | +0 | 0 |
| Lv2 | Dual Cannon | 2 parallel (8px gap) | +5 | 3 |
| Lv3 | Spread Shot | 5-way fan (40°) | +10 | 6 (cumulative) |
| Lv4 | Pierce Cannon | 3-way piercing | +15 | 11 |
| Lv5 MAX | Super Laser | Beam + 80px splash | +25 | 19 |

- Damage formula: `15 + TechTree.attack×3 + weaponBonus`
- Each red power-up = +1 weapon EXP
- Death resets weapon to Lv1

## File
| File | Purpose |
|------|---------|
| `index.html` | Main page (Phaser canvas + HUD overlays + Tech Tree + Keybinding overlays) |
| `style.css` | Fullscreen layout, HUD styling, overlays, scoreboard table, tech tree panel |
| `game.js` | Phaser.Game bootstrap, GameData, TechTree, keybinding UI, tech tree UI |
| `scenes/BootScene.js` | Canvas 2D sprite drawing functions (tank, zerg, bullets, spitter, explosion) |
| `scenes/PreloadScene.js` | Loads Kenney tank/bullet PNGs + SFX audio files, generates zerg/background/explosion textures |
| `scenes/MenuScene.js` | Title screen, player naming, mode select, tech tree button, resets game state |
| `scenes/GameScene.js` | Main gameplay: tanks, zerg, bullets, waves, collisions, power-ups, auto-aim, nukes, scoring, weapon evolution, boss state machine, manual collision, enemy AI |
| `scenes/GameOverScene.js` | (Unused — game over is DOM overlay in index.html) |
| `assets/sfx/` | Downloaded CC0 sound effects (12 files, ~11.5 MB) |

## Architecture
- Phaser.js 3.87 via CDN, ES module imports for scenes
- Arcade physics (top-down, no gravity)
- **Tanks/Bullets**: Kenney PNG assets (`assets/kenney_tanks/PNG/Retina/`), canvas fallback on load failure
- **Zerg**: Canvas 2D procedural textures (draw functions in BootScene → PreloadScene)
- HUD rendered via DOM overlay on top of canvas (HP bars, score, wave, survival timer, nuke display, weapon level)
- Sound: Real WAV/MP3 SFX with oscillator fallback. BGM only during boss fights (starts on boss spawn, stops on boss death)
- Bullet expiry: time-based (`expireAt` data) checked in update loop
- Enemy AI: `updateEnemyAI()` handles spitter distance-keeping + boss chase + continuous fire
- Enemy bullets: separate `enemyBullets` group (max 80), body.reset() on recycle, **manual distance collision fallback**
- Shield: 3s cooldown prevents spam; passive regen 1/sec
- **Weapon evolution**: 5 levels, fireBullet() switch-based pattern generation
- **No round system** — endless survival; tank death → leaderboard with tech points

## Controls
| | Player 1 (Red) | Player 2 (Blue) |
|--|----------------|-----------------|
| Move | W/A/S/D (customizable) | Arrow Keys (customizable) |
| Fire / Toggle Auto-Aim | Space (customizable) | Enter (customizable) |
| Burst (costs 5 shield) | Shift | Right Shift |
| Shield Boost | E (customizable) | I (customizable) |
| Nuke | Q (customizable) | U (customizable) |
| Pause | ESC | ESC |

- **Keybinding**: Menu screen "⚙ CUSTOMIZE CONTROLS" button → DOM overlay → click key → press new key → save. Persists via `localStorage`.
- **Tech Tree**: Menu screen "🔬 TECH TREE" button → DOM overlay → view/upgrade stats.

## Deployment
```bash
cd TankVsZerg && git add . && git commit -m "..." && git push
```
Deploy URL: `chewyenhan.github.io/TankVsZerg/`
