# 1789：巴黎生存指南 (1789: Paris Survival Guide)

## 概述
- **类型**：AI 分支叙事历史沉浸游戏
- **课程**：独中初一历史 — 法国大革命
- **仓库**：`chewyenhan/-`（独立 git）
- **部署**：`chewyenhan.github.io/-/`
- **Worker**：`paris-ai.chewyenhan.workers.dev`（模型：`gemini-3.5-flash-lite`，单免费 Key）

## 内容
玩家扮演不同社会等级角色，在 1789 年巴黎与路易十六进行 AI 对话谈判。覆盖：三级会议、国民议会、攻占巴士底狱。选择影响三维度：革命值 / 王权 / 民愤。

## 文件
| 文件 | 用途 |
|------|------|
| `index.html` | 主页面 |
| `style.css` | 样式 |
| `game.js` | 游戏逻辑 |
| `story.js` | 剧情数据 |
| `worker.js` | Cloudflare Worker (Gemini 代理) |
| `wrangler.jsonc` | Wrangler 配置 |

## 架构
遵循 `_SHARED.md` §历史游戏模板。Worker 端点：`GET /models` + `POST /gemini`。CORS：`chewyenhan.github.io`。限流：15 req/min。API Key：`GEMINI_API_KEY`（Cloudflare Secret，**单免费 Key，无付费兜底**）。模型：Worker 端硬编码 `gemini-3.5-flash-lite`。

## 部署
```bash
# 前端
cd 1789-paris-survival-guide && git add . && git commit -m "..." && git push

# Worker
cd 1789-paris-survival-guide && npx wrangler deploy
```
