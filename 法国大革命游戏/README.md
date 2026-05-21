# 1789：巴黎生存指南（网页教学版）

这是一个纯前端静态网页游戏（`index.html` + `style.css` + `story.js` + `game.js`），可直接放到 GitHub 并用 GitHub Pages 发布。

## 本地运行

- 直接双击打开 `index.html` 即可运行（无需后端）。
- 如需更稳定的音频/语音体验，建议用本地静态服务器打开（可选）：

```bash
python -m http.server 5173
```

然后在浏览器打开 `http://localhost:5173/`。

## 发布到 GitHub Pages

1. 新建 GitHub 仓库，把整个项目文件夹内容上传（至少包含：`index.html`、`style.css`、`story.js`、`game.js`、`imgs/`、`assets/`）。
2. 打开仓库 `Settings` → `Pages`
3. `Build and deployment`
   - **Source** 选择 `Deploy from a branch`
   - **Branch** 选择 `main`（或 `master`）与 `/ (root)`
4. 保存后等待 1–2 分钟，Pages 会给出访问地址。

## 游戏终点与结局逻辑（当前版本）

- 终点对话：`AI_KING`
- 巴士底狱：`REVOLT`
- 巴士底狱后分结局：`ENDING`（按 `gameState.revolution` 自动生成不同命运）

