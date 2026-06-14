# 接力包：Cloudflare Worker 代理 Vertex AI / Gemini API

## 目标
给拿破仑帝国游戏（Napoleon_Empire/）搭一个 Cloudflare Worker 代理，把 API Key 藏在 Worker 里，学生打开网页就能玩，不用手动输入 Key。

## 当前状态

### 游戏文件
- `d:\AIgames\Napoleon_Empire\index.html` — 游戏主页，含 API Key 输入框
- `d:\AIgames\Napoleon_Empire\game.js` — 核心逻辑，第 151 行调 Gemini API
- `d:\AIgames\Napoleon_Empire\story.js` — 剧情数据
- `d:\AIgames\Napoleon_Empire\style.css` — 样式

### 游戏 AI 调用方式
- 只有最后一关触发 AI（`node.ai_eval === true`）
- 每局 3 次对话，每次回复限 50 字
- 当前代码（game.js:151）直接调 `generativelanguage.googleapis.com`，需要玩家输入 API Key

### 每局 AI 用量
- 输入：~1500 tokens（系统提示 ~400 + 玩家发言 ~100）
- 输出：~300 tokens（50字中文）
- 每局 3 次调用 = 总计约 1800 tokens
- 成本：$0.0012/局（几乎为零）

## 决定方案

**方案：Cloudflare Worker + 免费 Gemini API Key**

理由：
- 班级 30 人，实际没几个人玩历史教学游戏
- 免费额度 250 次/天绰绰有余
- 如果真的超了，再换成 Vertex AI SA JSON 也不迟
- Cloudflare Worker 完全免费（每天 10 万次请求）

## 待执行步骤

### 第一步：获取免费 Gemini API Key
1. 打开 https://aistudio.google.com/apikey
2. 用 Google 账号登录
3. 点击 "Create API Key"
4. 复制 Key（类似 `AIza...`）

### 第二步：注册 Cloudflare（如果还没账号）
1. https://dash.cloudflare.com/sign-up
2. 免费账户，不需要绑卡

### 第三步：创建 Worker
1. Cloudflare Dashboard → Workers & Pages → Create Worker
2. 粘贴代理代码（见下方）
3. 在 Worker 设置 → Variables → 添加环境变量：
   - 变量名: `GEMINI_API_KEY`
   - 值: 第一步拿到的 Key
4. 部署

### 第四步：改游戏代码
- 把 `game.js` 第 151 行的 `https://generativelanguage.googleapis.com/...?key=${apiKey}` 
- 改成 `https://你的worker名.workers.dev/gemini`
- 去掉首页的 API Key 输入框（可选，方便学生）

## Worker 代理代码（参考）

简单代理，把前端请求转发给 Gemini API：

```js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/gemini') {
      const body = await request.json();
      const model = body.model || 'gemini-2.5-flash';
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: body.system_instruction,
            contents: body.contents
          })
        }
      );
      
      return new Response(await response.text(), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' }
      });
    }
    
    return new Response('Not found', { status: 404 });
  }
};
```

## 关键文件路径
- 游戏根目录: `d:\AIgames\Napoleon_Empire\`
- 原 proxy: `d:\AIgames\vertex-openai-proxy\index.js`（本地 Node.js 代理，已跑通但不再需要）
- Vertex SA JSON: `C:\Users\User\Desktop\gemini3-499309-6f98c6d1f748.json`
- Cloud 项目: `gemini3-499309`

## 备注
- 用户是历史老师，给学生用
- 如果以后想改用 Vertex AI 花钱余额，只需把 Worker 里的 `GEMINI_API_KEY` 换成 SA JSON，目标 URL 换成 Vertex API
- 绝对不要把任何 Key/JSON 提交到 GitHub
