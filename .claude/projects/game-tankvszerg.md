# Tank vs Zerg

## Overview
- **Type**: Phaser.js side-scrolling arcade shooter (横版防守射击)
- **Players**: 2-player local competitive (same keyboard)
- **Theme**: Two tanks defend against waves of Zerg enemies, competing to destroy each other
- **Framework**: Phaser.js 3.87 via CDN
- **Deployment**: GitHub Pages (`chewyenhan.github.io/TankVsZerg/`)
- **Worker**: None — pure local multiplayer
- **Repository**: Independent git repo `TankVsZerg/`

## File
| File | Purpose |
|------|---------|
| `index.html` | Main page (Phaser canvas + HUD overlays) |
| `style.css` | Fullscreen layout, HUD styling, overlays |
| `game.js` | Phaser.Game bootstrap, global handlers |
| `scenes/BootScene.js` | Canvas 2D sprite drawing functions (tank, zerg, bullets, explosion) |
| `scenes/PreloadScene.js` | Texture generation from draw functions, progress bar |
| `scenes/MenuScene.js` | Title screen, player naming, mode select (shared/split screen) |
| `scenes/GameScene.js` | Main gameplay: tanks, zerg, bullets, waves, collisions, scoring |
| `scenes/GameOverScene.js` | Results display, rematch/menu buttons |

## Architecture
- Phaser.js 3.87 via CDN, ES module imports for scenes
- Arcade physics (top-down, no gravity)
- All sprites procedural: Canvas 2D draw functions → texture atlases at startup
- HUD rendered via DOM overlay on top of canvas (HP bars, score, wave, timer)
- Sound: Web Audio API oscillator synthesis
- No external assets, no Worker needed

## Controls
| | Player 1 (Red) | Player 2 (Blue) |
|--|----------------|-----------------|
| Move | W/A/S/D | Arrow Keys |
| Fire | Space | Enter |
| Burst (costs shield) | Shift | Right Shift |
| Shield Boost | E | I |
| Pause | ESC | ESC |

## Deployment
```bash
cd TankVsZerg && git add . && git commit -m "..." && git push
```
Deploy URL: `chewyenhan.github.io/TankVsZerg/`
