# CLAUDE.md — d:\AIgames 项目指南

## Git 仓库结构（重要！）

根目录 `d:\AIgames\` → `chewyenhan/my-ocr-app`（不要随便 push）

独立仓库：
| 本地路径 | GitHub | 部署到 |
|----------|--------|--------|
| `report-system/worker.js` | `chewyenhan/reports` (wrangler deploy) | `hualianhistory-reports.chewyenhan.workers.dev` |
| `report-system/frontend/**` | **必须 clone `chewyenhan/reports` 后单独 push** | `chewyenhan.github.io/reports/` |
| `hualianhistory/` | `chewyenhan/hualianhistory` (git submodule) | `chewyenhan.github.io/hualianhistory/` |
| `Japan_conquer_Malaya/` | `chewyenhan/Japan_conquer_Malaya` | `chewyenhan.github.io/Japan_conquer_Malaya/` |
| `Japan_conquer_Malaya/worker.js` | 同上仓库 (wrangler deploy) | `malaya1941-ai.chewyenhan.workers.dev` |

### 推送 report-system 前端文件的标准流程
```bash
git clone https://github.com/chewyenhan/reports.git d:/AIgames/temp-reports
cp d:/AIgames/report-system/frontend/<changed-files> d:/AIgames/temp-reports/<path>/
cd d:/AIgames/temp-reports && git add . && git commit -m "..." && git push
rm -rf d:/AIgames/temp-reports
```
**禁止**在 `d:\AIgames` 根目录直接 commit/push report-system 文件！

## 当前项目：高三孝评语系统 (S3F Report System)

### 架构
- 后端：Cloudflare Worker (`report-system/worker.js`) + D1 数据库 (SQLite)
- 前端：纯 HTML/CSS/JS，部署在 GitHub Pages
- UI 框架：Pico.css v2（classless CSS，~6KB）
- 认证：PBKDF2 密码哈希 + UUIDv4 Session Token

### S3F 班级结构
- S3FA 文商班 25人 + S3FB 美班 6人 = 31人
- 17 个科目（含 AB 分组过滤）
- ~15 位教师账号
- 班主任：form_teacher（查看全局仪表盘）

### 前端文件（在 `report-system/frontend/`）
| 文件 | 用途 |
|------|------|
| `teacher-login.html` | 教师登录页（中英双语切换 + 返回主页按钮） |
| `teacher-report.html` | 科目老师评语录入（Tab切换科目 + 自动保存） |
| `form-teacher.html` | 班主任仪表盘（全科矩阵 + 生成家长链接 + 导出CSV） |
| `parent.html` | 家长报告查看（手机适配 + 打印） |
| `js/auth.js` | 登录/登出/Session管理（定义 WORKER_URL） |
| `js/i18n.js` | 中英双语翻译（zh/en，~90个key） |
| `js/report-api.js` | API 封装（含独立 API_BASE，不依赖 auth.js） |
| `css/pico.min.css` | Pico.css v2 |

### 关键设计点
- `js/auth.js` 定义 `WORKER_URL`，`js/report-api.js` 有自己的 `API_BASE`（因 parent.html 不加载 auth.js）
- 教师只能看到自己负责科目+分组的学生（美术老师只看S3FB 6人）
- 默认密码：`changeme123`
- 学校品牌：Hua Lian High School / CHEW YEN HAN

### 数据库 Schema（D1/SQLite，8 张表）

```
classes (新) ─────────────────────────────┐
  id, code, name, display_order           │
                                          │
student_groups ──────< students           │
  id (PK)                id (PK)          │
  code (UNIQUE)          name             │
  name                   group_id (FK)    │
  class_id (FK, 新)       parent_code (UNIQUE)
                          photo_url        │
subjects ──< subject_groups >──┘          display_order
  id (PK)    subject_id (FK)
  code       group_id (FK)                teachers ──< teacher_subjects >──┘
  display_name                              id (PK)     teacher_id (FK)
  display_order                             username    subject_id (FK)
                                            password (PBKDF2 salt:hash)
reports ──< students                        display_name
  id (PK)    >── subjects                   role ('teacher'|'form_teacher')
  student_id (FK)                           class_id (FK, 新)
  subject_id (FK)                         sessions ──< teachers
  teacher_id (FK, nullable)                 id (PK)
  feedback (TEXT)                           token (UNIQUE, UUID)
  is_complete (0|1)                         teacher_id (FK)
  UNIQUE(student_id, subject_id)            expires_at

audit_log ──< teachers
  id, teacher_id, action, target, ip_address, created_at
```

**核心关系链**：`students → student_groups → subject_groups ← subjects ← teacher_subjects ← teachers`
教师可视范围由这条 join chain 决定——老师只看到自己科目的、对应分组的学生。

### API 端点（Cloudflare Worker）

| 方法 | 路径 | 认证 | 用途 |
|------|------|------|------|
| POST | `/api/auth/login` | 无 | 登录，返回 token+role+subjects |
| GET | `/api/auth/me` | Bearer | 恢复 session，返回用户信息 |
| POST | `/api/auth/change-password` | Bearer | 修改自己密码 |
| GET | `/api/reports/my-subjects` | Bearer | 获取教师负责的科目+学生+评语 |
| PUT | `/api/reports/{studentId}/{subjectCode}` | Bearer | 保存/更新单条评语 |
| POST | `/api/reports/mark-complete/{subjectCode}` | Bearer | 批量标记某科全部完成 |
| GET | `/api/form-teacher/summary` | Bearer + role=form_teacher | 班主任仪表盘（全科矩阵+进度） |
| POST | `/api/form-teacher/generate-links` | Bearer + role=form_teacher | 批量生成家长访问链接 |
| POST | `/api/form-teacher/reset-password` | Bearer + role=form_teacher | 重置任意教师密码 |
| GET | `/api/parent/report/{code}` | 无（parent_code） | 家长查看报告 |
| GET | `/api/config/class` | 无 | 班级配置（groups+subjects） |

### S3F 科目与分组映射

**公共科目（A+B 都上）**：chinese, malay, english, math, computer, pe, robotics（7科）
**A 组专属（S3FA 文商班 25人）**：commerce, economy, account, history, geography（5科）
**B 组专属（S3FB 美班 6人）**：art_design, art_sketch, art_mixed, art_appr, art_water（5科）
**合计**：17 科

### 教师账号列表（15个，硬编码于 login 页面下拉）

form_teacher（班主任）, chinese_t, malay_t, english_t, math_t, computer_t, pe_t, robotics_t, commerce_t, economy_t, account_t, history_t, geography_t, art_t1（平面设计+素描）, art_t2（综合创作+赏析+水彩）

### 部署

- Worker: `hualianhistory-reports.chewyenhan.workers.dev`
- 前端: `chewyenhan.github.io/reports/`
- 前端 push 流程：clone `chewyenhan/reports` → cp 文件 → commit → push → 删除 temp

## 项目：马来亚1941 互动历史游戏 (Japan_conquer_Malaya)

### 概述
- 仓库：`chewyenhan/Japan_conquer_Malaya`
- 游戏页面：`chewyenhan.github.io/Japan_conquer_Malaya/`
- 主页入口：`chewyenhan.github.io/hualianhistory/` → ⚔️ 沉浸式历史游戏 → 马来亚1941
- API Worker：`malaya1941-ai.chewyenhan.workers.dev`（`Japan_conquer_Malaya/worker.js`）

### 架构
- 单 HTML 文件（`index.html` ~1200行），vanilla JS，零构建工具
- AI 引擎：Gemini API 通过 Cloudflare Worker 代理（**不暴露 Key 给学生**）
- 回退：Worker 不可用时自动使用预写分析（12条，每选项一条）
- 字体：Noto Serif SC 5 个字重（400~900），全局加粗适配投屏
- TTS：浏览器内置 SpeechSynthesis API
- 存储：localStorage 保存进度（`malaya1941_save`）

### 游戏结构
- **5 关**：4 个选择关卡 + 1 个结局页
- **每关**：历史场景 → 3 选 1 → AI 生成「统考视角·历史纵深剖析」
- **三维评分**：独立契机(0~12) / 民族代价(0~12) / 占领者信任(-7~12)
- **4 种结局**：民族觉醒者 / 两难幸存者 / 傀儡统治者 / 理想的殉道者
- 支持 **1-6 组**课堂竞赛

### 课文考点覆盖（独中高三《马来西亚史》）
| 关卡 | 对应考点 |
|------|----------|
| 第一关·山雨欲来 | 沦陷原因(二)：民族矛盾 & "解放者"旗号 |
| 第二关·白人的溃败 | 沦陷原因(一)：英军准备不足 & 排斥本地人 |
| 第三关·丛林闪电战 | 沦陷原因(三)：日军丛林训练 & 中国战场经验 |
| 第四关·共荣的真相 | 太平洋战争原因(I)：资源控制 & 大东亚共荣圈 |

### 关键设计点
- **Worker 代理唯一模式**：设置中删除了 API Key 输入框，学生端不做任何配置即可使用
- **封面图**：`hualianhistory/malaya1941.png`（从 `Japan_conquer_Malaya/malaya1941.png` 复制）
- 美化：暗色调军事主题、金色点缀、圆角选择徽章、渐变分数条、脉冲动画关卡点
- 结局阈值经过 81 条路径数学分析，每种结局都有合理覆盖率
- 署名：© 2026 华联中学 · Hua Lian High School · CHEW YEN HAN 制作

### 部署
- 前端 push：直接在 `Japan_conquer_Malaya/` 内 commit + push（独立仓库）
- Worker：`cd Japan_conquer_Malaya && npx wrangler deploy`
- Worker secret：`GEMINI_API_KEY` 通过 `npx wrangler secret put` 设置
- 封面图需同步到 `hualianhistory/malaya1941.png`

## 项目：AI 全能竞技场（Quiz 游戏系列）

### 概述
- 全部部署在 `chewyenhan.github.io/hualianhistory/` 下
- AI Worker：`hualianhistory-ai.chewyenhan.workers.dev`（`/gemini` 代理 Gemini API）
- 技术栈：单 HTML 文件，Vanilla JS + Tailwind CSS CDN + Canvas
- 支持科技风/奶油风主题切换，BGM 背景音乐，SpeechSynthesis TTS

### 文件清单

| 文件 | 用途 | 行数 |
|------|------|------|
| `quiz-start.html` | 入口门户，选择游戏模式 | ~300 |
| `quiz.html` | 组别竞技版（多组对抗） | ~1100 |
| `quiz-solo.html` | 个人挑战版（轮盘→翻牌→答题→排行榜） | ~1200 |
| `quiz-battle.html` | 双人大决战（Canvas 战斗动画） | ~2200 |

### 共同功能
- AI 生成选择题（粘贴资料 / 上传 PDF/Word/PPTX）
- 难度分配：简单/中等/困难，各自分值可配
- 倒计时 + 语音朗读 + 知识精华总结
- 下载独立 HTML（离线可玩）
- 内置 fallback：API 不可用时自动生成备用题目

### 双人大决战特有功能（quiz-battle.html）

**战斗系统**：
- 6 种职业：圣骑士(knight)、神箭手(archer)、大法师(mage)、暗影忍者(ninja)、维京战士(viking)、武士(samurai)
- Canvas 像素风精灵（48×48 → 3x 渲染 = 144px），每职业 3 级进化外观
- 抢答模式：WAITING_FOR_BUZZ → ANSWERING → (SECOND_CHANCE) → DONE

**攻击动画（6 种弹道）**：
| 职业 | 弹道 | 特效 |
|------|------|------|
| Knight 圣骑士 | 金色剑波 (6×36px) | 光晕阴影 |
| Archer 神箭手 | 箭矢 (线宽5, 箭头8px) | 锐利穿刺 |
| Mage 大法师 | 橙红火球 (外径20px + 核心10px) | 白热核心+尾焰 |
| Ninja 暗影忍者 | 手里剑 (外径14, 内径5) | 旋转残影 |
| Viking 维京战士 | 飞斧 (32×12 头 + 6×14 柄) | 沉重打击感 |
| Samurai 武士 | 刀光斩 (4×50 + 50×6) | 横向斩击 |

- 所有弹道带拖尾粒子（4 个透明度递减光点）
- 弹道尺寸放大 30-50%，适配教室投屏

**战败倒地系统**：
- `leftFallen` / `rightFallen` 持久状态标记（每轮在 `startBattleRound` 重置）
- FALL 动画 800ms（旋转 90° + 下坠），动画结束后静态绘制躺地精灵
- 站立绘制 `drawCharacterAt()` 在 fallen 状态下跳过
- `drawEffects()` 中额外绘制静态躺地精灵（旋转 90° 平躺在地面）

**轮盘抽签**：
- 双人对抗：先抽左方 → 确认 → 再抽右方 → 确认 → 进入选角
- 胜者连庄：用 `spinForSlot()` 替换败方，保留胜方
- ✅ 确认出战 / ⏭️ 缺席跳过 按钮（教师手动控制，不自动跳转）

**评分系统**：
- 三维评分：独立契机(0~12) / 民族代价(0~12) / 占领者信任(-7~12)
- 4 种结局：民族觉醒者 / 两难幸存者 / 傀儡统治者 / 理想的殉道者

### 个人挑战版特有功能（quiz-solo.html）

**轮盘抽签**：
- 单抽 → ✅ 确认出战 / ⏭️ 缺席跳过（与 battle 版同样的手动确认模式）
- 不重复抽取（可切换允许重复）

**卡牌阵列**：翻过的卡牌标记为已完成（灰色 + 🔒），剩余卡牌可选

**排行榜**：按积分排序，题目答完显示"🏁 竞技圆满结束"

### 关键设计点
- Worker URL 硬编码于各 HTML，**不暴露 API Key 给学生**
- 语音朗读默认开启（`config.voice`）
- 键盘快捷键：空格键 → 知识总结 → 排行榜 → 下一位
- 主题持久化：`localStorage.getItem('quiz_style')`

## 项目：Snaptext OCR（Play Store 上架中）

### 概述
- 仓库：`chewyenhan/my-ocr-app`（即本仓库根目录）
- PWA：`chewyenhan.github.io/my-ocr-app/`
- 功能：拍照/选图 → Gemini 2.5 Flash OCR → 导出 TXT/PDF
- 技术栈：React 19 + Vite 8 + Capacitor + html2pdf.js + react-i18next
- 主目录：[`playstore-app/`](playstore-app/)（源码 + CI + keystore）

### 文件结构
```
playstore-app/
├── src/App.jsx              ← 核心：相机、OCR、下载
├── src/i18n/                ← 中英文翻译
├── android/                 ← Capacitor Android 项目（CI 构建入口）
├── .github/workflows/       ← CI：APK 测试 + AAB 正式
├── keystore/                ← 签名密钥
├── public/                  ← 图标、manifest
├── privacy-policy.html
├── HANDOFF.md               ← 项目接力文档
├── build-apk.ps1            ← 本地构建脚本
└── capacitor.config.json
```

### 构建
| 类型 | Workflow | 产出 | 用途 |
|------|----------|------|------|
| APK | `build-capacitor-apk.yml` | `snaptext-test-apk` | 本地测试 |
| AAB | `build-capacitor-aab.yml` | `snaptext-release-aab` | Play Store 上架 |

- APK/AAB 构建需在 GitHub 仓库设置 `KEYSTORE_PASS`、`KEY_PASS`、`KEY_ALIAS` 三个 secrets
- 签名密钥：`playstore-app/keystore/snaptext-signing.keystore`

### Play Store 上架状态
- ✅ PWA 正常运行
- ✅ APK/AAB 构建流程通畅
- ✅ PDF 导出、中文、国际化完成
- ✅ Play Store 素材（图标、feature graphic）
- ⏳ Play Console 封闭测试（需 20 名测试者）

### 其他目录
| 目录 | 说明 |
|------|------|
| `playstore/` | Vite 构建产物（PWA 部署） |
| `twa-project/` | TWA 备选方案（未采用） |

## 项目：AI 市场研究周报 (Weekly Market Brief)

- 输出目录：`research/YYYY-WXX/`
- 每次输出两个文件：`report.md` + `report.html`
- HTML 含完整内联 CSS（深色 Header + 白色卡片布局），底部不带学校/署名
- 覆盖：Mag 7、AI 半导体、AI 基础设施、软件、Crypto
- 信息来源：Bloomberg、CNBC、YouTube（All-In、Ben Cowen、投资TALK君、视野环球财经）、X（@aleabitoreddit）、FT/WSJ
- 写法：结论先行，标注【市场共识】【个人观点】【待确认】，≤200 字/段

### 周报写作流程（5 步，不可跳过）
1. **Collect** — 并行搜索所有固定来源
2. **Categorize** — 按主题归类（禁止按时间顺序）
3. **Judge consensus** — 多来源交叉验证
4. **Label** — 每句话标【市场共识】/【个人观点】/【待确认】
5. **Write** — 先写结论，再写论据，再写投资含义

### 周报结构（8 章 + 一句话总结）
一、本周核心结论 → 二、本周最重要变化 → 三、AI → 四、半导体 → 五、软件 → 六、Crypto → 七、风险 → 八、下周观察重点 → 一句话总结（≤20 字）

## 项目：焕灯 · Huandeng（AI 原生 PPT 生成器）

> 状态：✅ 已部署到 Hugging Face Spaces | 许可证：AGPL-3.0（基于 Anionex/banana-slides）

### 概述
- 仓库：`chewyenhan/huandeng`（GitHub），从 `Anionex/banana-slides`（15.1k stars）fork 并 rebranding
- 品牌：焕灯 · Huandeng（原名 banana-slides / 蕉幻），Logo 为金橙渐变灯泡
- 定位：AI 画整页幻灯片（非套模板），每页独一无二的设计感
- 主页入口：`chewyenhan.github.io/hualianhistory/` → 📚 教师辅助工具库 → 焕灯

### 全部功能（非仅图片转PPTX）
**四种创建模式**：一句话生成 / 从大纲生成 / 从描述生成 / PPT翻新（上传PDF/PPTX）
**编辑流程**：大纲编辑（拖拽排序+自然语言改）→ 描述编辑 → 预览出图（圈选区域编辑）
**五种导出**：PPTX / 可编辑PPTX（OCR+背景修复） / PDF / 图片 / 解说视频（TTS+字幕）
**其他**：AI素材库、参考文件上传、模板系统、多AI后端（Gemini/OpenAI/Anthropic/国产模型）、中英双语

### 部署
| 环境 | 地址 | 说明 |
|------|------|------|
| **HF Spaces（生产）** | `https://empty5354-huandeng.hf.space/` | Docker all-in-one，免费 16GB RAM |
| HF Space 管理 | `https://huggingface.co/spaces/empty5354/huandeng` | 构建/日志/设置 |
| GitHub | `https://github.com/chewyenhan/huandeng` | 源码 |

### HF Spaces 部署详情
- **账号**：empty5354（chewyenhan@gmail.com）
- **口令**：`hua_lian_2026`（唯一入口，API Key 不暴露）
- **管理模式**：`MANAGED_DEPLOYMENT=true` → 前端隐藏 API 设置区 + HelpModal 不显示 API 引导
- **Secrets**：GOOGLE_API_KEY, SECRET_KEY, MINERU_TOKEN（在 HF Space Settings 中）
- **休眠**：48 小时无请求后休眠，重新访问需 ~30 秒冷启动
- **数据持久性**：SQLite + 上传文件为临时存储（容器重启后清空）
- **推送**：`git push hf hf-deploy:main --force`（从 `banana-slides/` 目录）

### 架构
| 组件 | 端口 | 技术栈 |
|------|------|--------|
| 后端 | 5000（内部） | Python Flask + Gemini API + MinerU OCR |
| 前端 | 7860（HF） | React + Vite + TypeScript + Tailwind |
| 反向代理 | 7860 | Nginx → /api/* → Flask :5000 |

### 关键设计
- **API Key 安全**：前端 `API_BASE_URL = ''`（相对路径），所有 AI 调用经 `/api/*` Nginx 代理到 Flask，**Key 不暴露给浏览器**
- **口令墙**：`X-Access-Code` header + `before_request` hook（无用户注册/登录，单一共享口令）
- 导出流程：slide image → img2pdf → MinerU → 提取元素 → Gemini 背景修复 → Gemini 文字格式分析 → PPTX 构建
- 4 并发 worker，支持混合提取器（MinerU + 百度 OCR）
- Docker 支持：all-in-one 镜像（Dockerfile / Dockerfile.allinone）
- 字体回退：本地 NotoSansSC → Docker 系统 NotoSansCJK
- 默认 AI：Gemini（文字 `gemini-3-flash-preview`，图片 `gemini-3-pro-image-preview`），2K 分辨率 16:9
- **当前无**：用户注册/登录、用量追踪、配额限制、支付系统

### API 成本估算
- 文字生成（大纲+描述）：~$0.01/份（极低）
- 图片生成（2K）：$0.134/张
- **典型 10 页 PPT**：≈ $1.50（~RM 6.70）
- 4K 图片：$0.24/张，10 页 ≈ $2.50
- 目前无用量硬限制，靠口令墙控制访问

### 收费规划（讨论稿，未实施）

**当前（A 方案）**：口令私下分享，同僚免费使用。月成本可控（5人×2份≈$15/RM67）。

**远期（B 方案）**：正经收费系统

| 方案 | 马币 | 内容 |
|------|------|------|
| 小额试吃 | RM 3 | 1 份 5 页 1K |
| 单次 | RM 12 | 1 份，不限页数 2K |
| 月费教师版 | RM 25/月 | 10 份/月 2K |
| 月费专业版 | RM 45/月 | 30 份/月 + 4K |

**付费方式**：起步可用手动转账（TNG/DuitNow → 截图 → 发口令）；全自动需 SenangPay（支持 TNG/FPX/卡）+ Webhook。

**需加的系统**：用户注册登录、配额表+扣减、支付回调、数据库迁 D1（HF 重启不丢数据）。

### 凭证
- `GOOGLE_API_KEY` — Gemini API
- `MINERU_TOKEN` — MinerU OCR（免费 2000页/天，90天有效）

### 本地启动
```bash
# 终端1: 后端
cd banana-slides/backend && python app.py   # :5011
# 终端2: 前端
cd banana-slides/frontend && npm run dev    # :3011
# 或一键启动
start.bat
```
浏览器打开 `http://localhost:3011`

## 项目维护规则

- **CLAUDE.md 是每个对话窗的入口**，新项目或旧项目有重大更新时，**主动**同步更新 CLAUDE.md（不等用户提醒）
- 项目弃用/删除时，同步删除 CLAUDE.md 中对应章节
- memory/ 存的是偏好和教训（how/why），CLAUDE.md 存的是项目事实（what/where）
- 两处都更新才算"记住了"

## 品牌/风格记忆
- Pico.css 用于表单/报表类 HTML 项目
- 署名：© 2026 华联中学 · Hua Lian High School · CHEW YEN HAN 制作（仅评语系统项目）
