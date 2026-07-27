# 马六甲：东方十字路口 (Melaka: Eastern Crossroads)

## 概述
- **类型**：AI 分支叙事历史沉浸游戏
- **课程**：独中初一历史 — 马六甲苏丹国
- **仓库**：`chewyenhan/Melaka_Project`（独立 git）
- **部署**：`chewyenhan.github.io/Melaka_Project/`
- **Worker**：`melaka-ai.chewyenhan.workers.dev`（模型：`gemini-3.5-flash-lite`，单免费 Key）

## 内容
三条角色路线：爪哇商人（贸易与港法）、天猛公副手（防御暹罗、郑和外交）、阿拉伯传教士（伊斯兰传播、发展成小麦加）。AI 动态情绪谈判系统——NPC 根据玩家选择+数值做出不同反应。

## 文件
| 文件 | 用途 |
|------|------|
| `index.html` | 主页面 |
| `melaka_style.css` | 样式 |
| `melaka_game.js` | 游戏逻辑（742行，含关键词追踪+心形谈判系统） |
| `melaka_story.js` | 剧情数据 |
| `worker.js` | Cloudflare Worker (Gemini 代理) |
| `wrangler.jsonc` | Wrangler 配置 |
| `README.md` | 说明 |

## 架构
遵循 `_SHARED.md` §历史游戏模板。注意：此项目文件有 `melaka_` 前缀，与模板略有不同（game.js → melaka_game.js）。

Worker 端点：`GET /models` + `POST /gemini`。CORS：`chewyenhan.github.io`。限流：15 req/min。API Key：`GEMINI_API_KEY`（Cloudflare Secret，**单免费 Key，无付费兜底**）。模型：Worker 端硬编码 `gemini-3.5-flash-lite`。

## 部署
```bash
# 前端
cd Melaka_Project && git add . && git commit -m "..." && git push

# Worker
cd Melaka_Project && npx wrangler deploy
```
