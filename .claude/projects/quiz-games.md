# AI 全能竞技场（Quiz 游戏系列）

## 概述
- **类型**：AI 生成选择题 + Canvas 游戏
- **仓库**：`chewyenhan/hualianhistory`（git submodule 在 `hualianhistory/`）
- **部署**：`chewyenhan.github.io/hualianhistory/`
- **Worker**：`hualianhistory-ai.chewyenhan.workers.dev`（`/gemini` 代理 Gemini API）

## 文件清单
| 文件 | 用途 | 行数 |
|------|------|------|
| `quiz-start.html` | 入口门户，选择游戏模式 | ~300 |
| `quiz.html` | 组别竞技版（多组对抗） | ~1100 |
| `quiz-solo.html` | 个人挑战版（轮盘→翻牌→答题→排行榜） | ~1200 |
| `quiz-battle.html` | 双人大决战（Canvas 战斗动画） | ~2200 |

## 技术栈
- 单 HTML 文件，Vanilla JS + Tailwind CSS CDN + Canvas
- 科技风/奶油风主题切换，BGM 背景音乐，SpeechSynthesis TTS

## 共同功能
- AI 生成选择题（粘贴资料 / 上传 PDF/Word/PPTX）
- 难度分配：简单/中等/困难，各自分值可配
- 倒计时 + 语音朗读 + 知识精华总结
- 下载独立 HTML（离线可玩）
- 内置 fallback：API 不可用时自动生成备用题目

## 双人大决战特有功能（quiz-battle.html）
- **6 种职业**：圣骑士(knight)、神箭手(archer)、大法师(mage)、暗影忍者(ninja)、维京战士(viking)、武士(samurai)
- Canvas 像素风精灵（48×48 → 3x 渲染 = 144px），每职业 3 级进化
- 抢答模式 + 6 种攻击弹道 + 拖尾粒子
- 战败倒地系统（800ms 旋转下坠动画）
- 轮盘抽签 + 胜者连庄 + 手动确认
- **大招技能系统**（~500 行新增）：连胜 3 局触发技能轮盘，7 扇区 5 技能（71% 中技能率）：
  - 🛡️ 护盾：Canvas 脉动光环 + 六边形粒子，格挡对方攻击
  - 💚 复活：绿色螺旋粒子特效，答错可重答一次
  - ❄️ 时空冻结：全屏冰蓝蒙层 + 冰晶，作答时间 +5s
  - ⚡ 双倍得分：胜场 ×2 + 武器放大 2.5x + 金色拖尾
  - 🎯 先发制人：下题自动抢到答题权
  - 🍀 再接再励 ×2：空签无技能（降低中技能概率至 71%）
- **弑王者 King Slayer**：击败 ≥3 连胜对手触发，当局 +1 胜场（与双倍得分不叠加封顶 +2），Canvas 金色大字 + 粒子爆炸 + 号角音效

## 关键设计
- Worker URL 硬编码，**不暴露 API Key 给学生**
- 语音朗读默认开启（`config.voice`）
- 键盘快捷键：空格键 → 知识总结 → 排行榜 → 下一位
- 主题持久化：`localStorage.getItem('quiz_style')`

## 部署
```bash
# 在 hualianhistory/ submodule 内操作
cd hualianhistory && git add . && git commit -m "..." && git push

# Worker（如有修改）
cd hualianhistory && npx wrangler deploy
```
