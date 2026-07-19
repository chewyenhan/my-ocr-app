# 共享架构模式

跨多个项目复用的架构模式，在此集中记录。单个项目的具体差异见各自的 `projects/<name>.md`。

---

## 历史游戏模板

**适用范围**：1789 Paris, Napoleon, Melaka, Malaya1941

### 文件结构
```
<game>/
├── index.html      ← 主游戏页面（~120行外壳，加载 JS）
├── style.css       ← 游戏样式（暗色调军事主题/历史主题）
├── game.js         ← 游戏逻辑（状态机、UI、存档）
├── story.js        ← 剧情数据（关卡、选项、得分规则）
├── worker.js       ← Cloudflare Worker（Gemini API 代理）
├── wrangler.jsonc  ← Wrangler 部署配置
└── README.md
```

### 通用架构
- **前端**：纯 HTML + CSS + Vanilla JS，零构建工具
- **AI 引擎**：Gemini API 通过 Cloudflare Worker 代理
- **Worker**：两个端点 `GET /models` + `POST /gemini`，CORS 白名单 `chewyenhan.github.io`
- **限流**：15 req/min per IP
- **API Key（双 Key 阶梯，2026-07 起）**：Secret `GEMINI_API_KEY` 存免费档 Key，优先使用；响应 `!resp.ok`（地区限制 400 / 配额限流 429 等）且设有 Secret `GEMINI_API_KEY_PAID`（付费 Key）时自动换付费 Key 重试一次。两个 Key 均不暴露给客户端
- **模型锁定（2026-07-17 起）**：Worker 忽略前端传来的 `model`，强制 `gemini-2.5-flash`；`/models` 端点也只返回 flash。原因：实测免费档只有 2.5-flash 有额度，2.5-pro / 2.0-flash 免费额度=0，选中即 100% 走付费（且 pro 付费价 ~10 倍）
- **存储**：localStorage 保存进度
- **字体**：Noto Serif SC（Google Fonts CDN）
- **TTS**：浏览器内置 SpeechSynthesis API（Malaya1941 和部分游戏有）

### 部署流程（通用）
```bash
# 前端：直接在项目目录内 commit + push（独立 git 仓库）
cd <game>/ && git add . && git commit -m "..." && git push

# Worker：
cd <game>/ && npx wrangler deploy
```

### Worker 命名约定
| 项目目录 | Worker 名 | Worker URL |
|----------|-----------|------------|
| `1789-paris-survival-guide/` | `paris-ai` | `paris-ai.chewyenhan.workers.dev` |
| `Napoleon_Empire/` | `napoleon-ai` | `napoleon-ai.chewyenhan.workers.dev` |
| `Melaka_Project/` | `melaka-ai` | `melaka-ai.chewyenhan.workers.dev` |
| `Japan_conquer_Malaya/` | `malaya1941-ai` | `malaya1941-ai.chewyenhan.workers.dev` |

---

## 街机游戏

**适用范围**：Tank vs Zerg

### 文件结构
```
TankVsZerg/
├── index.html      ← Phaser canvas + DOM HUD overlays
├── style.css       ← HUD styling, overlay animations
├── game.js         ← Phaser.Game bootstrap (ES module)
├── scenes/
│   ├── BootScene.js    ← Canvas 2D sprite draw functions
│   ├── PreloadScene.js ← Texture generation from draw funcs
│   ├── MenuScene.js    ← Title, naming, mode select
│   ├── GameScene.js    ← Main gameplay
│   └── GameOverScene.js← Results, rematch
├── .gitignore
└── README.md
```

### 通用架构
- **前端**：Phaser.js 3.87 via CDN + ES module scene imports
- **渲染**：Canvas 2D → texture atlas at startup (no external PNG/JPG)
- **Physics**：Arcade (top-down, no gravity)
- **音频**：Web Audio API oscillator synthesis
- **HUD**：DOM overlay on top of canvas
- **无需 Worker**：纯本地多人，无网络请求

---

## 评语系统基架

**适用范围**：report-system (S3F), report-system2 (J2Y)

### 共享架构
- **后端**：Cloudflare Worker + D1 (SQLite)
- **前端**：纯 HTML/CSS/JS + Pico.css v2
- **认证**：PBKDF2 密码哈希 + UUIDv4 Session Token
- **API 路由模板**（两个系统完全相同）：
  - `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/change-password`
  - `GET /api/reports/my-subjects`, `PUT /api/reports/{id}/{code}`, `POST /api/reports/mark-complete/{code}`
  - `GET /api/form-teacher/summary`, `POST /api/form-teacher/generate-links`, `POST /api/form-teacher/reset-password`
  - `GET /api/parent/report/{code}`, `GET /api/config/class`
- **数据库 Schema**：8 张表（students, student_groups, subjects, subject_groups, teachers, teacher_subjects, reports, sessions, audit_log）
- **前端文件结构**：
  - `teacher-login.html` — 教师登录
  - `teacher-report.html` — 科目评语录入
  - `form-teacher.html` — 班主任仪表盘
  - `parent.html` — 家长报告查看
  - `js/auth.js` — 认证（定义 WORKER_URL）
  - `js/i18n.js` — 中英双语
  - `js/report-api.js` — API 封装（独立 API_BASE）
  - `css/pico.min.css` — Pico.css v2

### 实例差异
| | S3F (report-system) | J2Y (report-system2) |
|---|---|---|
| 学生分组 | 2组 (A/B) | 1组 |
| 科目数 | 17 | 11 |
| 教师数 | 15 | 12 |
| Worker | `hualianhistory-reports` | `j2y-reports` |
| D1 DB | `report-system-db` | `j2y-report-db` |

### 前端 Push 流程（重要！）
两个评语系统的**前端文件不在独立 git 仓库中**。必须 clone 对应的 GitHub Pages 仓库后单独 push：
```bash
# S3F:
git clone https://github.com/chewyenhan/reports.git temp-reports
cp report-system/frontend/<files> temp-reports/<path>/
cd temp-reports && git add . && git commit -m "..." && git push
rm -rf temp-reports

# J2Y: 同上，但目标仓库是 chewyenhan/reports-j2y
```
**禁止**在根目录直接 commit/push 评语系统前端文件！

### Worker 部署（两个系统相同）
```bash
cd report-system/ && npx wrangler deploy    # S3F
cd report-system2/ && npx wrangler deploy   # J2Y
```

---

## API Key 安全模式

**几乎所有项目采用同一模式**：
- API Key 存储在服务端（Cloudflare Secret / HF Secrets / .env.local）
- 前端不直接调用 Gemini/OpenAI API
- 通过 Worker/Flask 后端代理所有 AI 请求
- 例外：`美国独立战争外交特使扮演`（用户自行输入 API Key）、`quiz-generator`（已删除）、Snaptext OCR（前端直连 Gemini，Key 运行时提供，bundle 内无硬编码）

### 双 Key 阶梯（4 个历史游戏 + Quiz Worker，2026-07 起）
- `GEMINI_API_KEY` = **免费档** Key（无 billing 的 Google 项目）；`GEMINI_API_KEY_PAID` = 付费 Key，仅在免费调用失败时兜底重试一次
- 引入原因（2026-07 实测）：
  - 免费档 `gemini-2.5-flash` 仅 **5 RPM/Key**（另见 429 报文出现过 limit: 20，Google 额度维度有波动），且 5 个 Worker 共用同一个免费 Key = 共享这几次/分钟
  - Cloudflare Worker 出口机房漂移，免费档偶发 `User location is not supported`（约 1/4 概率，与学生所在地无关）
  - **免费档只有 2.5-flash 有额度**：2.5-pro / 2.0-flash 免费额度=0（实测 `limit: 0`），1.5 系列已退役 → 2026-07-17 起 5 个 Worker 全部强制 `model = 'gemini-2.5-flash'`（quiz 页面下拉框选什么都无效）
- 更换 Secret：`printf '%s' "KEY" | npx wrangler secret put GEMINI_API_KEY[_PAID]`（在各项目目录内执行）
