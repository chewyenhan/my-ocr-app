# 拿破仑：法兰西的荣光与倾覆 (Napoleon Empire)

## 概述
- **类型**：AI 分支叙事历史沉浸游戏
- **课程**：独中初二历史 — 拿破仑时代
- **仓库**：`chewyenhan/Napoleon_Empire`（独立 git）
- **部署**：`chewyenhan.github.io/Napoleon_Empire/`
- **Worker**：`napoleon-ai.chewyenhan.workers.dev`（默认 `gemini-3.5-flash-lite`，前端可选模型，单免费 Key）

## 内容
三条角色路线：帝国军官（军事战役）、民事法官（拿破仑法典）、反法同盟士兵（民族解放）。覆盖：拿破仑法典、大陆封锁、1812 俄国远征、维也纳会议。最终 AI 审判场景——玩家为自己历史遗产辩护。

## 文件
| 文件 | 用途 |
|------|------|
| `index.html` | 主页面 |
| `style.css` | 样式 |
| `game.js` | 游戏逻辑 |
| `story.js` | 剧情数据 |
| `worker.js` | Cloudflare Worker (Gemini 代理) |
| `wrangler.jsonc` | Wrangler 配置 |
| `README.md` | 说明 |

## 架构
遵循 `_SHARED.md` §历史游戏模板。Worker 端点：`GET /models` + `POST /gemini`。CORS：`chewyenhan.github.io`。限流：15 req/min。API Key：`GEMINI_API_KEY`（Cloudflare Secret，**单免费 Key，无付费兜底**）。模型：前端传参，Worker 透传，默认 `gemini-3.5-flash-lite`。

## 部署
```bash
# 前端
cd Napoleon_Empire && git add . && git commit -m "..." && git push

# Worker
cd Napoleon_Empire && npx wrangler deploy
```
