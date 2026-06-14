# 🤝 AI 接手包：为历史教学游戏添加 Cloudflare Worker API 代理

> **写给下一个 AI 对话**：这份文档记录了如何把任意一个需要学生手动输入 Gemini API Key 的历史游戏，改成「打开即玩」的零配置体验。请严格按照以下模式操作。

---

## 🔑 新 AI 接手必读：账号与密钥速查

> ⚠️ **先看这里！** 不管你是 ChatGPT、Claude、Gemini 还是任何其他 AI，下面是你接手的全部凭证信息。

### Gemini API Key（核心密钥）

| 项目 | 值 |
|------|-----|
| **API Key** | `AIzaSyD7kA20jI428EXqLjNGmO7gfwqPXdIG5rI` |
| **类型** | Google 预付 Key（不是免费 Key，有余额） |
| **用途** | 藏在 Cloudflare Worker 环境变量中，不暴露给学生 |
| **备用方案** | 如果此 Key 失效，去 https://aistudio.google.com/apikey 创建新的免费 Key |
| **免费额度** | Google 每天 1500 次请求免费，每个游戏每局只用 3 次，基本用不完 |

### Cloudflare 账户信息

| 项目 | 值 |
|------|-----|
| **邮箱** | `chewyenhan@gmail.com` |
| **workers.dev 子域名** | `chewyenhan`（已注册） |
| **所有 Worker 的 URL 格式** | `https://<worker名>.chewyenhan.workers.dev` |
| **Wrangler 版本** | 4.100.0+ |
| **OAuth Token 位置** | `~/.wrangler/config/default.toml`（本机文件） |

### ⚡ Cloudflare 登录方式（二选一）

**方式 A：自动登录（推荐，如果当前环境有浏览器）**
```bash
npx wrangler login
# 浏览器会自动弹出，用 chewyenhan@gmail.com 授权即可
```

**方式 B：手动部署（如果 CLI 没法用）**
1. 打开 https://dash.cloudflare.com/
2. 用 `chewyenhan@gmail.com` 登录
3. 左侧菜单 → **Workers & Pages** → **创建应用程序** → **创建 Worker**
4. 给 Worker 起名（如 `napoleon-ai`）
5. 把 `worker.js` 代码粘贴进去
6. 点击 **部署**
7. 部署后进入 Worker 设置 → **变量和机密** → 添加机密：
   - 名称: `GEMINI_API_KEY`
   - 值: `AIzaSyD7kA20jI428EXqLjNGmO7gfwqPXdIG5rI`

### ⚠️ 重要提醒

- **每个 Worker 独立**：每个游戏需要自己独立的 Worker 和独立的 `GEMINI_API_KEY` 机密（虽然值相同，但要在每个 Worker 里分别设置）
- **不要把 Key 写进前端代码**：`worker.js` 中用 `env.GEMINI_API_KEY` 读取，绝不硬编码在 `.js`/`.html` 文件中
- **不要把 Key 提交到 GitHub**：部署到 Cloudflare 后 Key 只在 Worker 环境变量里

---

## 📋 背景

| 项目 | 说明 |
|------|------|
| **制作者** | 朱彦翰，马来西亚华联中学历史老师 |
| **用途** | 初一历史课堂教学游戏 |
| **目标** | 学生打开浏览器就能玩，无需输入 API Key |
| **方案** | Cloudflare Worker 代理 Gemini API，Key 藏在 Worker 环境变量中 |
| **成本** | 每局 ~1 分钱，Google 免费额度足够覆盖全班 |

---

## 📁 仓库中需要改造的游戏清单

| 游戏 | 目录 | JS 文件 | API Key 变量名 | 状态 |
|------|------|---------|---------------|------|
| 1789：巴黎生存指南 | `1789-paris-survival-guide/` | `game.js` | `customApiKey` | ✅ 已完成 (`paris-ai.chewyenhan.workers.dev`) |
| 拿破仑帝国 | `Napoleon_Empire/` | `game.js` | `apiKey` | ❌ 待改造 |
| 马六甲计划 | `Melaka_Project/` | `melaka_game.js` | `customApiKey` | ❌ 待改造 |
| 模板游戏 | `templatesgame/` | `melaka_game.js` | `customApiKey` | ❌ 待改造 |
| 华联历史问答 | `hualianhistory/` | `quiz.html` | localStorage `gemini_api_key` | ❌ 待改造 |
| 美国独立战争外交特使 | `美国独立战争外交特使扮演/` | `.html`（React 内联） | `apiKey` (React state) | ❌ 待改造 |

---

## 🔧 通用改造步骤（每个游戏重复此流程）

### 第一步：在游戏目录创建 Worker 文件

#### 1a. 创建 `worker.js`

每个游戏需要一个独立的 Worker（对应独立的 workers.dev 子域名）。Worker 代码完全标准化，只需改注释中的游戏名：

```js
// ==========================================
// Cloudflare Worker — [游戏名] Gemini API 代理
// 把 API Key 藏在 Worker 环境变量里，学生无需手动输入
// ==========================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // --- CORS 预检 ---
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

    // --- 端点 1: 获取模型列表（硬编码，避免免费 Key 无法调用 list 接口）---
    if (url.pathname === '/models' && request.method === 'GET') {
      const models = {
        models: [
          { name: 'models/gemini-2.5-flash', displayName: 'Gemini 2.5 Flash (推荐)' },
          { name: 'models/gemini-2.5-pro', displayName: 'Gemini 2.5 Pro' },
          { name: 'models/gemini-2.0-flash', displayName: 'Gemini 2.0 Flash' },
          { name: 'models/gemini-1.5-flash', displayName: 'Gemini 1.5 Flash' },
          { name: 'models/gemini-1.5-pro', displayName: 'Gemini 1.5 Pro' }
        ]
      };
      return new Response(JSON.stringify(models), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // --- 端点 2: Gemini 对话 ---
    if (url.pathname === '/gemini' && request.method === 'POST') {
      try {
        const body = await request.json();
        const model = body.model || 'gemini-2.5-flash';

        const geminiBody = {
          system_instruction: body.system_instruction,
          contents: body.contents
        };

        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': env.GEMINI_API_KEY
            },
            body: JSON.stringify(geminiBody)
          }
        );

        return new Response(await resp.text(), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'AI 请求失败' }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // --- 其他路径 ---
    return new Response('Not found', { status: 404, headers: corsHeaders });
  }
};
```

#### 1b. 创建 `wrangler.jsonc`

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "你的worker名",
  "main": "worker.js",
  "compatibility_date": "2026-06-01",
  "compatibility_flags": ["nodejs_compat"]
}
```

**Worker 命名建议**：每个游戏一个独立 Worker，格式如 `napoleon-ai`、`melaka-ai`、`hualian-ai`。

---

### 第二步：部署 Worker

> ⚠️ 需要先确保 Cloudflare 已登录。运行 `npx wrangler whoami` 检查。

```bash
# 进入游戏目录
cd "游戏目录名"

# 部署 Worker
npx wrangler deploy

# 设置 API Key 密钥（会弹出交互式输入）
npx wrangler secret put GEMINI_API_KEY
```

**API Key 信息**：
- Key: `AIzaSyD7kA20jI428EXqLjNGmO7gfwqPXdIG5rI`（朱老师的预付 Key）
- 如 Key 失效，去 https://aistudio.google.com/apikey 创建新的免费 Key

部署成功后，Worker URL 格式为：`https://游戏名.chewyenhan.workers.dev`

**注意**：如果 `npx wrangler deploy` 报 "workers.dev subdomain not registered"，第一次需要先注册子域名：
```bash
# 如果还没注册过 workers.dev 子域名（用户名 chewyenhan 已注册，通常不需要再执行）
npx wrangler worker subdomain chewyenhan
```

---

### 第三步：修改游戏 JS 文件

这是最关键的步骤。需要在 JS 文件顶部添加 Worker URL 常量，然后修改两处 API 调用。

#### 3a. 添加 Worker URL 常量

在文件顶部（紧跟初始状态变量之后）添加：

```javascript
// Cloudflare Worker 代理地址
const WORKER_URL = 'https://你的worker名.chewyenhan.workers.dev';
```

#### 3b. 修改模型检测函数 `detectModels()`

**改造前**（直接调 Gemini，需要 key）：
```javascript
async function detectModels() {
    const key = document.getElementById('api-key-input').value.trim();
    if (!key) { alert("请先输入 API Key！"); return; }
    customApiKey = key;  // 或 apiKey = key;
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${customApiKey}`);
        // ... 解析 models ...
    } catch (e) { alert("检测失败"); }
}
```

**改造后**（调 Worker，无需 key）：
```javascript
async function detectModels() {
    try {
        const response = await fetch(`${WORKER_URL}/models`);
        const data = await response.json();
        const select = document.getElementById('model-select');
        select.innerHTML = '';
        data.models.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.name.replace('models/', '');
            opt.text = m.displayName || m.name;
            select.appendChild(opt);
        });
        select.style.display = 'block';  // 或 'inline-block'
        // 注意：不再需要保存 apiKey/customApiKey 变量
    } catch (e) {
        // 降级：Worker 不可用时加载默认模型列表
        const fallbackModels = [
            { name: 'models/gemini-2.5-flash', displayName: 'Gemini 2.5 Flash (推荐)' },
            { name: 'models/gemini-1.5-flash', displayName: 'Gemini 1.5 Flash' }
        ];
        const select = document.getElementById('model-select');
        select.innerHTML = '';
        fallbackModels.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.name.replace('models/', '');
            opt.text = m.displayName;
            select.appendChild(opt);
        });
        select.style.display = 'block';
    }
}
```

#### 3c. 修改 AI 对话函数

**改造前**（直接调 Gemini，key 拼在 URL 里）：
```javascript
// 模式 A: key 在 URL query string
const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    { method: 'POST', headers: {...}, body: JSON.stringify({...}) }
);

// 模式 B: key 在 URL query string（完全等效）
const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${customApiKey}`,
    { method: 'POST', body: JSON.stringify({...}) }
);
```

**改造后**（调 Worker，key 由 Worker 注入）：
```javascript
const resp = await fetch(`${WORKER_URL}/gemini`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        model: model,
        system_instruction: { parts: [{ text: currentSysPrompt }] },
        contents: [{ role: 'user', parts: [{ text: promptText }] }]
    })
});
```

**关键点**：
- 请求体传 `model`、`system_instruction`、`contents` 三个字段
- **不再需要** `?key=` 查询参数
- **不再需要** `customApiKey` / `apiKey` 变量检查（`if (!apiKey) return`）

#### 3d. 移除 API Key 变量依赖

- 删除或注释掉 `let apiKey = ''` / `let customApiKey = ""` 
- 删除所有 `if (!apiKey)` / `if (!customApiKey)` 的提前返回检查
- 如果有 `apiKey = key` 赋值语句，删除

---

### 第四步：修改 HTML 文件

#### 4a. 替换 API Key 输入区

**改造前**（手动输入 Key）：
```html
<div id="api-setup">
    <p>🔌 外接 API 设置</p>
    <input type="password" id="api-key-input" placeholder="在此输入 Gemini API Key">
    <button onclick="detectModels()">🔍 检测并加载模型</button>
    <select id="model-select" style="display: none;"></select>
</div>
```

**改造后**（自动检测）：
```html
<div id="api-setup" style="...原有样式...">
    <p style="...">🤖 AI 模型选择</p>
    <p id="model-status" style="color: #aaa;">正在自动连接 AI 服务...</p>
    <select id="model-select" style="display: none; ..."></select>
</div>
```

#### 4b. 添加页面加载自动检测脚本

在 `</body>` 前添加：

```html
<script>
window.addEventListener('DOMContentLoaded', () => {
    detectModels().then(() => {
        const status = document.getElementById('model-status');
        if (status) status.innerText = '✅ AI 服务已就绪，请选择模型后开始游戏';
    }).catch(() => {
        const status = document.getElementById('model-status');
        if (status) status.innerText = '⚠️ AI 服务暂不可用，已加载默认模型列表';
    });
});
</script>
```

#### 4c. 更新游戏内指南/卷轴

如果 HTML 中有「API 配置指南」或「开发初衷与指南」区域，把其中关于 API Key 的内容替换为：

```html
<h3>🤖 AI 对话说明</h3>
<p>本游戏内置 AI 对话功能，<b>无需任何设置</b>。在最后一关可直接与 AI 对话，你的每句话都会影响历史走向。</p>
```

---

### 第五步：更新 README.md（如果有）

把部署指南中关于"输入 API Key"的内容替换为：

```markdown
## 🚀 快速开始
学生打开网页即玩，无需下载，无需输入 API Key。AI 对话功能自动可用。
```

---

## 🔀 特殊游戏处理

### 拿破仑帝国 (Napoleon_Empire)
- **JS 文件**: `game.js`
- **API Key 变量**: `apiKey`（let 声明）
- **API 调用位置**:
  - 第 151 行: `generateContent?key=${apiKey}` — AI 结局点评
  - 第 243 行: `models?key=${key}` — 模型检测
- **HTML 改动**: `#api-setup` 区域（第 28-34 行），含密码输入框 + 检测按钮
- **Worker 名建议**: `napoleon-ai`
- **特殊点**: 该游戏在 `renderNode()` 中有 `if (apiKey && selectedModel)` 检查（第 102 行），需要改为直接调用（因为 Worker 总是可用）

### 马六甲计划 (Melaka_Project)
- **JS 文件**: `melaka_game.js`
- **API Key 变量**: `customApiKey`
- **API 调用位置**:
  - 第 515 行: `models?key=${customApiKey}`
  - 第 578 行: `generateContent?key=${customApiKey}`
- **HTML 改动**: `#api-key-input` 密码框
- **Worker 名建议**: `melaka-ai`

### 华联历史问答 (hualianhistory)
- **JS 文件**: `quiz.html`（JS 和 HTML 在同一文件中）
- **API Key 变量**: `localStorage.getItem('gemini_api_key')`
- **API 调用位置**:
  - 约第 434 行: 模型检测
  - 约第 597 行: 题目生成
- **特殊点**: 需要移除 localStorage 存取逻辑，改为只用 Worker URL
- **Worker 名建议**: `hualian-ai`

### 美国独立战争外交特使
- **文件**: `美国独立战争外交特使扮演.html`（React 内联在单个 HTML 中）
- **API Key 变量**: React `useState("")` 的 `apiKey`
- **特殊点**: 这是 React 应用，改动模式相同但写法不同
  - `fetch(\`https://generativelanguage...?key=${apiKey}\`)` → `fetch('https://xxx.workers.dev/gemini', {...})`
  - 模型检测同理
  - 移除 `<input type="password" value={apiKey} ...>` 输入框
- **Worker 名建议**: `diplomat-ai`

---

## ✅ 验证方法

每个游戏改造完成后，逐项检查：

1. [ ] 打开游戏 HTML 页面，不再看到 API Key 密码输入框
2. [ ] 模型下拉菜单自动加载（显示 Gemini 2.5 Flash 等选项）
3. [ ] 状态显示 "✅ AI 服务已就绪"
4. [ ] 正常走完游戏流程，进入 AI 对话环节
5. [ ] 输入对话内容后收到 AI 回复（说明 Worker 代理成功）
6. [ ] 浏览器 F12 Network 面板确认请求发到了 `workers.dev` 而不是 `googleapis.com`
7. [ ] 游戏指南/卷轴中不再提到 "API Key" 或 "输入 Key"

---

## 🔐 安全提醒

- **绝对不要**把 `GEMINI_API_KEY` 写在任何 `.js`、`.html`、`README.md` 文件中
- **绝对不要**把 API Key 提交到 GitHub
- Worker 环境变量是唯一存放 Key 的地方
- `.gitignore` 中应包含 `.dev.vars`（本地开发密钥文件）

---

## 📊 成本参考（给朱老师）

| 每次对话 | 每局（3 次） | 30 人各玩一局 |
|----------|-------------|--------------|
| ~$0.0005 | ~$0.0015 | ~$0.04 |

**结论**：预付 $5 可以用好几年。Google 每天还有免费额度，基本不花钱。

---

## 📞 Cloudflare 账户信息

- **邮箱**: `chewyenhan@gmail.com`
- **workers.dev 子域名**: `chewyenhan`（已注册）
- **OAuth Token 位置**: `~/.wrangler/config/default.toml`
- **Wrangler 版本**: 4.100.0

---

*最后由朱彦翰 + Antigravity 在 2026-06-14 整理。下一个 AI，加油！🚀*
