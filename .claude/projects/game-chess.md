# 学校国际象棋比赛系统 (Chess Tournament System)

## 概述
- **类型**：比赛管理系统（瑞士制配对 + 积分榜）
- **目标用户**：老师（管理端）+ 学生（只读看板）
- **仓库**：`chewyenhan/chess-system`（独立 git）
- **前端部署**：`chewyenhan.github.io/chess-system/` (GitHub Pages)
- **入口**：`hualianhistory/` → 📚 教师辅助工具库 → 国际象棋比赛系统
- **Worker**：`chess-system.chewyenhan.workers.dev`
- **数据库**：D1 `chess-system-db` (ID: `0d798ed9-69aa-4ac8-bacc-06ac57cf2ef3`)

## 功能
5 轮瑞士制个人赛管理系统。老师创建比赛→导入名单→一键生成配对→录入胜负→发布成绩。学生通过公开 ID 页面（手机适配）实时查看对战表和积分榜。

- **瑞士制配对引擎**：不重复相遇、积分相近匹配、黑白平衡、奇数自动轮空(BYE=1分)
- **破同分排序**：Buchholz / Median / Direct Encounter / Sonneborn-Berger / Progressive（可自定义优先级顺序）
- **成绩撤销**：30分钟内可撤销已录入成绩（重置为 PENDING）
- **软删除**：删除比赛后数据保留，可通过"恢复"按钮恢复
- **搜索筛选**：首页搜索框 + 状态筛选（准备中/对战中/已结束）
- **数据导出**：管理员可导出完整比赛数据为 JSON（选手+对局+积分榜）
- **数据导入**：导入 JSON 文件可恢复完整比赛状态
- **Auth**：创建比赛时生成 UUID admin_token，存 localStorage（持久存储）。管理端点需 Bearer Token

## 文件
| 文件 | 用途 |
|------|------|
| `index.html` | 首页（创建比赛 + 已有比赛入口 + 导出导入） |
| `admin.html` | 管理控制台（?id=xxx，包含导出导入按钮） |
| `match.html` | 学生看板（?id=xxx，只读，30s 自动刷新） |
| `js/api.js` | API 封装（API_BASE + fetchWithAuth + export/import） |
| `js/utils.js` | 工具函数（URL 参数、格式化、Tab 切换） |
| `worker.js` | Cloudflare Worker（~670行，12 个 API 端点） |
| `swiss.js` | 瑞士制配对算法（Worker 导入模块） |
| `tiebreakers.js` | 破同分排序算法（Worker 导入模块） |
| `schema.sql` | 数据库参考 |
| `migrations/0001_schema.sql` | D1 建表迁移（3 张表） |
| `migrations/0002_add_updated_at.sql` | 添加 updated_at 字段（成绩撤销） |
| `migrations/0003_add_deleted_at.sql` | 添加 deleted_at 字段（软删除） |
| `wrangler.json` | Wrangler 部署配置 |
| `README.md` | 项目说明 |

## 架构
- **前端**：纯 HTML/CSS/JS + Pico.css v2，零构建工具
- **后端**：Cloudflare Worker + D1（复用了评语系统 Worker 模式）
- **API**：
  - 公开端点：6 个（创建、查询、积分榜、对局列表、导出）
  - 管理端点：6 个（更新、导入选手、生成配对、录入结果、成绩撤销、软删除/恢复）
- **CORS**：`chewyenhan.github.io` + localhost
- **限流**：30 req/min per IP

## 数据库
3 张表：`tournaments`、`players`、`matches`
- matches 表：`result` 字段 PENDING/WHITE_WIN/BLACK_WIN/DRAW/BYE

## 部署
```bash
# 前端 → GitHub Pages
cd chess-system && git push origin main

# Worker（含 D1 迁移）
cd chess-system && npx wrangler deploy

# 手动 D1 迁移
npx wrangler d1 execute chess-system-db --remote --file=migrations/0001_schema.sql
npx wrangler d1 execute chess-system-db --remote --file=migrations/0002_add_updated_at.sql
npx wrangler d1 execute chess-system-db --remote --file=migrations/0003_add_deleted_at.sql
```

---

## 🎯 未来优化方案

### 优先级 1：高价值优化（第一阶段）

#### 1. 成绩撤销功能
**现状**：录入成绩后只能修改或删除整个比赛
**问题**：学生可能误操作，管理员需要重新录入
**建议**：
- 在 `matches` 表添加 `updated_at` 字段
- 管理端显示每局的"撤销"按钮
- 限制：仅可撤销录入后的30分钟内

#### 2. 软删除比赛
**现状**：删除比赛会级联删除所有数据，无法恢复
**问题**：误删比赛后数据丢失
**建议**：
- `tournaments` 表添加 `deleted_at` 字段（软删除）
- 已删除比赛在首页显示为灰色，单独管理
- 提供"恢复比赛"功能（恢复 players + matches）

#### 3. 搜索和筛选功能
**现状**：已保存比赛列表只能按时间倒序
**问题**：比赛数量多时查找困难
**建议**：
- 首页添加搜索框（按比赛名称搜索）
- 管理端添加筛选：按状态（进行中/已结束）、按轮次筛选

---

### 优先级 2：用户体验优化

#### 4. 批量修改成绩
**现状**：每局比赛单独点击录入按钮
**问题**：多场比赛时操作繁琐
**建议**：
- 对阵表添加"全选"功能
- 批量修改所有相同结果的局数

#### 5. 积分榜导出
**现状**：学生只能在浏览器查看积分榜
**问题**：无法保存或分享成绩
**建议**：
- 学生看板添加"导出为图片/CSV"按钮
- CSV 格式：姓名,年级,积分,对手分,直胜...

---

### 优先级 3：功能增强

#### 6. 多人管理员支持
**现状**：单个 admin_token，一人拥有全部权限
**问题**：多人管理时容易冲突
**建议**：
- 添加 `managers` 表（管理员列表 + 权限）
- 支持多管理员同时操作
- 敏感操作（删除比赛）需要权限验证

---

## 📋 实施计划

### 第一阶段（已完成 ✅）
1. ✅ 成绩撤销功能（30分钟限制）
2. ✅ 软删除比赛（deleted_at 字段）
3. ✅ 搜索和筛选（API 驱动）
4. ✅ 破同分规则排序（上移/下移按钮）
5. ✅ Progressive 默认启用

### 第二阶段（已完成 ✅）
6. ✅ 比赛数据导出（JSON 格式）
7. ✅ 比赛数据导入（完整恢复）
8. ✅ 导出/导入按钮集成

### 第三阶段
9. 积分榜导出（图片/CSV）
10. 批量修改成绩
11. 比赛模板
12. 多人管理员
13. 实时通知（WebSocket）
14. 审计日志
