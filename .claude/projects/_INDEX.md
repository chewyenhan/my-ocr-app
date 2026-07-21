# 项目总览矩阵

共 16 个项目。做任务前先定位项目，再读对应文件。

## 街机游戏（1个）

| 项目 | 知识文件 | 独立仓库 | 部署 |
|------|----------|----------|------|
| Tank vs Zerg | `game-tankvszerg.md` | `chewyenhan/TankVsZerg` (独立) | `chewyenhan.github.io/TankVsZerg/` | 入口：`hualianhistory/` → 🎮 小游戏 → Tank vs Zerg |

**架构**：Phaser.js 3.87 via CDN，Arcade physics，程序化精灵（Canvas 2D），零外部文件。2 人同键对战。

## 历史沉浸游戏（5个 — 4 个同模板 + 1 个独立 React 架构）

| 项目 | 知识文件 | 年级 | 独立仓库 | 部署 (GitHub Pages) | Worker |
|------|----------|------|----------|---------------------|--------|
| 1789 巴黎生存指南 | `game-1789-paris.md` | 初一 | `chewyenhan/-` | `chewyenhan.github.io/-/` | `paris-ai.chewyenhan.workers.dev` |
| 拿破仑帝国 | `game-napoleon.md` | 初二 | `chewyenhan/Napoleon_Empire` | `chewyenhan.github.io/Napoleon_Empire/` | `napoleon-ai.chewyenhan.workers.dev` |
| 马六甲东方十字路口 | `game-melaka.md` | 初一 | `chewyenhan/Melaka_Project` | `chewyenhan.github.io/Melaka_Project/` | `melaka-ai.chewyenhan.workers.dev` |
| 马来亚1941 | `game-malaya1941.md` | 高三 | `chewyenhan/Japan_conquer_Malaya` | `chewyenhan.github.io/Japan_conquer_Malaya/` | `malaya1941-ai.chewyenhan.workers.dev` |
| 启蒙运动（理想号） | `game-enlightment.md` | 初二 | `chewyenhan/Enlightment` | `chewyenhan.github.io/Enlightment/` | ❌（无 Worker） |

**共享架构**：见 `_SHARED.md` §历史游戏模板（game.js + story.js + worker.js + Gemini 代理模式）
**独立架构**：启蒙运动使用 React + TypeScript + Express，与上述 4 个模板完全不同

## 课堂工具（2个）

| 项目 | 知识文件 | 独立仓库 | 部署 |
|------|----------|----------|------|
| 美国独立战争外交特使 | `game-american-revolution.md` | ❌ (根仓库) | 本地 HTML 文件，无线上部署 |
| 高中历史分流说明会 | `historysharing.md` | `chewyenhan/high-school-history-talk` | 本地 HTML slideshow，无线上部署 |

## Quiz 游戏

| 项目 | 知识文件 | 位置 | 部署 |
|------|----------|------|------|
| AI 全能竞技场 (4个游戏) | `quiz-games.md` | `hualianhistory/` submodule | `chewyenhan.github.io/hualianhistory/` |

## 学生评语系统（2个 — 同一架构）

| 项目 | 知识文件 | 班级 | 独立仓库 | Worker | 前端 |
|------|----------|------|----------|--------|------|
| S3F 高三孝 | `report-s3f.md` | S3F (17科, 2组, 31人) | ❌ (前端需单独 push) | `hualianhistory-reports.chewyenhan.workers.dev` | `chewyenhan.github.io/reports/` |
| J2Y 初二忠 | `report-j2y.md` | J2Y (11科, 1组, 36人) | ❌ (前端需单独 push) | `j2y-reports.chewyenhan.workers.dev` | `chewyenhan.github.io/reports-j2y/` |

**共享架构**：见 `_SHARED.md` §评语系统基架（Worker + D1 + Pico.css 前端）

## 比赛管理系统

| 项目 | 知识文件 | 独立仓库 | 前端部署 (GitHub Pages) | Worker |
|------|----------|----------|-------------------------|--------|
| 国际象棋比赛系统 | `game-chess.md` | `chewyenhan/chess-system` | `chewyenhan.github.io/chess-system/` | `chess-system.chewyenhan.workers.dev` |

**架构**：Worker + D1 + Pico.css（复用了评语系统模式）。Auth：admin_token UUID（无密码登录）。

## PPT 生成器（2个 — 不同方案）

| 项目 | 知识文件 | 类型 | 仓库 | 部署 |
|------|----------|------|------|------|
| 焕灯 Huandeng | `huandeng.md` | Web 应用 (Flask + React) | `chewyenhan/huandeng` | HF Spaces `empty5354-huandeng.hf.space` |
| PPT Master | `ppt-master.md` | Claude Code Skill | ⚠️ `hugohe3/ppt-master` (fork) | `hugohe3.github.io/ppt-master/` |

## 移动应用

| 项目 | 知识文件 | 仓库 | 部署 |
|------|----------|------|------|
| Snaptext OCR | `snaptext-ocr.md` | `chewyenhan/my-ocr-app` (根仓库) | `chewyenhan.github.io/my-ocr-app/` + Play Store |

## 研究输出

| 项目 | 知识文件 | 输出目录 |
|------|----------|----------|
| 每周市场简报 | `weekly-brief.md` | `research/YYYY-WXX/` |
