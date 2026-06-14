---
name: add-game
description: 'Automate the creation of a new historical text-based game. Use when the user provides a historical text (课文) or wants to clone the game template.'
---

# Add Game Workflow

你正在协助用户基于 `templatesgame` 模板，全自动创建一个全新的历史交互式游戏。

## When to Use
当用户要求“制作一个新游戏”、“根据课文生成游戏”或提供了一段历史背景文本时触发。

## Procedure
请严格按照以下步骤执行：

### 1. 自动构思与设计 (Analysis)
如果用户提供了课文或历史背景：
1. 分析文本，提取核心矛盾。
2. 设计 3 个不同阵营/阶层的角色选项。
3. 为每个角色设计核心属性（如：财富、权力、声望等）。
4. 构思一个包含多分支选择的剧情树（包含 `START` 节点及每个角色的专属走向）。
*注：此步骤的结果先保存在你的思考上下文中，用于步骤 3 的写入。*

### 2. 克隆与脚手架搭建 (Clone)
1. 确定新游戏文件夹的英文名（如 `French_Revolution`）。
2. 使用文件读取或终端命令，将 `templatesgame` 完整复制为根目录下的新文件夹。
3. 将新文件夹中的旧专有文件重命名为通用名称：
   - `melaka_game.js` -> `game.js`
   - `melaka_story.js` -> `story.js`
   - `melaka_style.css` -> `style.css`
4. 修改新文件夹中的 `index.html`，更新 `<title>`，并将引用的 JS 和 CSS 路径更新为上述的新名称。

### 3. 智能代码注入 (Smart Injection)
使用第 1 步构思好的剧本逻辑：
1. 覆写新文件夹的 `story.js`：将原有的 `const script = {...}` 替换为你设计的剧情树节点、选项及属性变化逻辑。为每个节点配置预期的图片路径（如 `img: "assets/start_bg.png"`）。
2. 覆写新文件夹的 `game.js`：更新 `gameState` 中的初始属性字段，并根据历史背景更新 AI 对话的 Prompt 设定。
3. 覆写新文件夹的 `style.css`：修改 `:root` 中的主色调，以匹配该历史时期的视觉氛围。

### 4. 提取素材清单 (Asset Extraction)
扫描你刚刚生成的 `story.js`。
在聊天框中向用户输出一份 Markdown 格式的待办清单（Checklist）：
- 逐一列出剧情中需要的图片（如 `assets/xxx.png`）和画面要求。
- 提醒用户将这些素材存放到新游戏的 `assets/` 文件夹中即可运行测试。