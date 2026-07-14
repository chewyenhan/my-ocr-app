# AI 全能竞技场（Quiz 游戏系列）

## 概述
- **类型**：AI 生成选择题 + Canvas 游戏
- **仓库**：`chewyenhan/hualianhistory`（git submodule 在 `hualianhistory/`）
- **部署**：`chewyenhan.github.io/hualianhistory/`
- **Worker**：`hualianhistory-ai.chewyenhan.workers.dev`（`/gemini` 代理 Gemini API）

## 文件清单
| 文件 | 用途 | 行数 |
|------|------|------|
| `quiz-start.html` | 入口门户，选择游戏模式 | ~280 |
| `quiz.html` | 组别竞技版（多组对抗） | ~1100 |
| `quiz-solo.html` | 个人挑战版（轮盘→翻牌→答题→排行榜） | ~1200 |
| `quiz-battle.html` | 大决战模式：双人决战 + 组别对决（Canvas 战斗动画） | ~3600 |

## 技术栈
- 单 HTML 文件，Vanilla JS + Tailwind CSS CDN + Canvas
- 科技风/奶油风主题切换，BGM 背景音乐，SpeechSynthesis TTS

## 共同功能
- AI 生成选择题（粘贴资料 / 上传 PDF/Word/PPTX）
- 难度分配：简单/中等/困难，各自分值可配
- 倒计时 + 语音朗读 + 知识精华总结
- 下载独立 HTML（离线可玩）
- 内置 fallback：API 不可用时自动生成备用题目

## quiz-battle.html 游戏模式

### 入口页
打开后显示"⚔️ 大决战模式"标题，两个入口卡片：⚔️ 双人决战和 🏰 组别对决。底部有 📖 使用说明可展开面板，含流程说明和技能介绍。右上角后台可见 BGM 控件。

### 模式一：双人决战（原有）

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
- **弑王者 King Slayer**：对手分数 ≥3 时答题打败对方，你的分数直接翻一倍

### 模式二：组别对决（~850 行）
- **设定**：AI/题目/难度/计时器与双人模式共享，替换学生名单为组别配置
  - 组别数量滑块（2-10）+ 每组玩家数量滑块（1-10）
  - 动态组别卡片：组名输入框（默认"组别1"）+ N 个玩家名输入框
- **轮盘流程**：轮盘抽左组 → 选该组存活玩家 → 轮盘抽右组 → 选玩家 → 角色选择 → 战斗
- **🏆 胜者连庄（Winner Stays）**：胜方玩家留在场上，仅败方换人
  - 胜方组保持活跃（不在 `groupQueue` 中），败方组推到队列末尾
  - 新挑战者从队列头部取出
  - 败方换人时仅新玩家选角（`startSingleCharSelect`），胜方保留角色/等级
- **轮转算法**：活跃组不在队列中，`groupQueue` 仅含等待中的组别
  - 初始取队列前两组 → 选完后从队列移除
  - 败方组（仍有存活玩家）→ push 到队列尾部
  - 全灭 → 从队列移除
- **淘汰逻辑**：玩家淘汰 → 标记该组该玩家 `eliminated` → 组内还有其他存活玩家则组保留
  - 组内所有玩家淘汰 → 组从 `groupQueue` 移除
- **得分规则**：得分以组别累计（`groups[i].totalWins`），排行榜按组别总分排序
- **结束条件**：只剩 ≤1 组存活 或 题目用尽 → 组别排行榜
- **战斗核心**：完全复用双人决战的 `startBattleRound()` / `handleBuzzer()` / `resolveRound()` 等，零改动

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
