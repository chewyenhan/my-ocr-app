# 马来亚1941 互动历史游戏 (Japan_conquer_Malaya)

## 概述
- **类型**：AI 分支叙事历史沉浸游戏
- **课程**：独中高三《马来西亚史》
- **仓库**：`chewyenhan/Japan_conquer_Malaya`（独立 git）
- **部署**：`chewyenhan.github.io/Japan_conquer_Malaya/`
- **Worker**：`malaya1941-ai.chewyenhan.workers.dev`（模型：`gemini-3.5-flash-lite`，单免费 Key）
- **入口**：`chewyenhan.github.io/hualianhistory/` → ⚔️ 沉浸式历史游戏 → 马来亚1941

## 内容
**5 关**：4 个选择关卡 + 1 个结局页。每关：历史场景 → 3 选 1 → AI 生成「统考视角·历史纵深剖析」
- **三维评分**：独立契机(0~12) / 民族代价(0~12) / 占领者信任(-7~12)
- **4 种结局**：民族觉醒者 / 两难幸存者 / 傀儡统治者 / 理想的殉道者
- 支持 **1-6 组**课堂竞赛

## 课文考点覆盖
| 关卡 | 对应考点 |
|------|----------|
| 第一关·山雨欲来 | 沦陷原因(二)：民族矛盾 & "解放者"旗号 |
| 第二关·白人的溃败 | 沦陷原因(一)：英军准备不足 & 排斥本地人 |
| 第三关·丛林闪电战 | 沦陷原因(三)：日军丛林训练 & 中国战场经验 |
| 第四关·共荣的真相 | 太平洋战争原因(I)：资源控制 & 大东亚共荣圈 |

## 关键设计
- 单 HTML 文件（~1200行），vanilla JS，零构建工具
- **Worker 代理唯一模式**：设置中无 API Key 输入框，学生端零配置
- 回退：Worker 不可用时自动使用预写分析（12条）
- 字体：Noto Serif SC 5 个字重（400~900），全局加粗适配投屏
- TTS：浏览器内置 SpeechSynthesis API
- 存储：localStorage（`malaya1941_save`）
- 美化：暗色调军事主题、金色点缀、圆角选择徽章、渐变分数条、脉冲动画关卡点
- 结局阈值经过 81 条路径数学分析

## 架构
遵循 `_SHARED.md` §历史游戏模板。不同于其他三个游戏（单 HTML 而非 game.js + story.js）。

Worker 端点：`GET /models` + `POST /gemini`。模型：Worker 端硬编码 `gemini-3.5-flash-lite`。

## 部署
```bash
# 前端
cd Japan_conquer_Malaya && git add . && git commit -m "..." && git push

# Worker
cd Japan_conquer_Malaya && npx wrangler deploy
# Worker secret: GEMINI_API_KEY

# 封面图同步
cp Japan_conquer_Malaya/malaya1941.png hualianhistory/malaya1941.png
```
