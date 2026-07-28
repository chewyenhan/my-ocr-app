---
name: frontend-design
description: 基于现代化设计系统（frontend-design）+ shadcn/ui + dataviz + notebooklm 生成专业 UI。支持 React/Tailwind + 纯 HTML/CSS。自动应用 8 种美学锚点、调色板、排版规则，生成卡片、按钮、表单、数据可视化、Dashboard 模板。触发：UI设计、前端页面、组件库、数据展示、仪表盘。
---

# Frontend Design Skill

集成 **frontend-design 美学系统** + **shadcn/ui 组件库** + **dataviz 数据可视化** + **NotebookLM 生成内容**，生成专业、现代、响应式的 UI 界面。

---

## 设计系统

### 8 种美学锚点

| 锚点 | 调色板示例 | 排版 | 适用场景 |
|------|-----------|------|----------|
| **Modern Clean** | 蓝/绿/黄 12色调 | Inter, 12px 圆角 | 通用商业页面 |
| **Dark Neon** | 紫/粉/青 + 深灰 | Orbitron, 8px 圆角 | 游戏/科技 |
| **Nature Earth** | 橙/棕/绿 | 曼陀林, 16px 圆角 | 教育/环保 |
| **Minimalist** | 黑/白/灰 | Helvetica, 4px 圆角 | 极简设计 |
| **Retro 80s** | 品红/黄/蓝绿 | VT323, 2px 圆角 | 复古风格 |
| **Neobrutalism** | 高饱和度 + 黑色描边 | Courier New, 6px 圆角 | 创意/游戏 |
| **Ocean Deep** | 蓝/青/白渐变 | Inter, 16px 圆角 | 科技/金融 |
| **Spring Fresh** | 粉/绿/黄渐变 | Inter, 8px 圆角 | 青春/教育 |

### 核心设计 Token

```css
/* 调色板 */
--primary: #2563EB;
--success: #10B981;
--warning: #F59E0B;
--danger: #EF4444;
--bg-body: #F8FAFC;
--bg-card: #FFFFFF;
--text-primary: #1E293B;
--text-secondary: #64748B;
--border: #E2E8F0;

/* 间距 & 圆角 */
--radius-sm: 0.5rem;
--radius-md: 0.75rem;
--radius-lg: 1rem;
--radius-full: 9999px;
--spacing-xs: 0.5rem;
--spacing-sm: 1rem;
--spacing-md: 1.5rem;
--spacing-lg: 2rem;

/* 排版 */
--font-sans: system-ui, -apple-system, sans-serif;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--font-bold: 700;
--font-medium: 500;
```

---

## shadcn/ui 组件

### React + Tailwind 集成

#### 1. 初始化 shadcn/ui

```bash
# 在 React 项目中
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card table badge tabs form
```

#### 2. 使用组件模板

**Button**（shadcn/ui 风格）
```jsx
import { Button } from "@/components/ui/button"

<Button className="rounded-lg">
  主操作按钮
</Button>

<Button variant="outline" className="rounded-lg">
  次要按钮
</Button>

<Button variant="secondary" className="rounded-lg">
  禁用按钮
</Button>
```

**Card**（数据卡片）
```jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

<Card className="rounded-xl">
  <CardHeader>
    <CardTitle>KPI 指标</CardTitle>
  </CardHeader>
  <CardContent>
    <p>卡片内容</p>
  </CardContent>
</Card>
```

**Table**（数据表格）
```jsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>姓名</TableHead>
      <TableHead>成绩</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>张三</TableCell>
      <TableCell>95</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

**Badge**（状态标签）
```jsx
import { Badge } from "@/components/ui/badge"

<Badge className="rounded-full">成功</Badge>
<Badge variant="secondary" className="rounded-full">进行中</Badge>
```

**Tabs**（选项卡）
```jsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="pairings">
  <TabsList>
    <TabsTrigger value="pairings">对阵表</TabsTrigger>
    <TabsTrigger value="players">选手管理</TabsTrigger>
  </TabsList>
  <TabsContent value="pairings">对阵表内容</TabsContent>
  <TabsContent value="players">选手管理内容</TabsContent>
</Tabs>
```

**Form**（表单组件）
```jsx
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

<Form>
  <FormField
    control={form.control}
    name="name"
    render={({ field }) => (
      <FormItem>
        <FormLabel>姓名</FormLabel>
        <FormControl>
          <Input placeholder="输入姓名" {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>
```

---

### 纯 HTML/CSS 集成

如果不需要 React，可以直接使用 CSS 类：

```html
<!-- 使用设计系统 CSS -->
<link rel="stylesheet" href="design-system.css">

<!-- shadcn/ui 风格组件 -->
<div class="card rounded-xl">
  <div class="card-header">
    <h3 class="card-title">标题</h3>
    <p class="card-subtitle">副标题</p>
  </div>
  <div class="card-content">
    内容
  </div>
</div>

<button class="btn btn-primary rounded-md">按钮</button>

<div class="badge rounded-full">标签</div>

<div class="tabs">
  <button class="tab active">选项卡1</button>
  <button class="tab">选项卡2</button>
</div>
```

---

## Dashboard 模板

### 1. 经典 Dashboard 布局

```html
<div class="dashboard">
  <!-- 侧边栏 -->
  <aside class="sidebar">
    <nav class="nav-menu">
      <a href="#" class="nav-item active">📊 仪表盘</a>
      <a href="#" class="nav-item">👥 用户管理</a>
      <a href="#" class="nav-item">📈 数据分析</a>
      <a href="#" class="nav-item">⚙️ 系统设置</a>
    </nav>
  </aside>

  <!-- 主内容区 -->
  <main class="main-content">
    <!-- 顶部导航 -->
    <header class="top-bar">
      <h1>欢迎回来，管理员</h1>
      <div class="user-profile">👤 管理员</div>
    </header>

    <!-- KPI 卡片区域 -->
    <section class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">总用户数</div>
        <div class="kpi-value">12,345</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">活跃用户</div>
        <div class="kpi-value">8,901</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">总收入</div>
        <div class="kpi-value">$45,678</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">完成订单</div>
        <div class="kpi-value">3,456</div>
      </div>
    </section>

    <!-- 主图表区 -->
    <section class="charts-section">
      <div class="chart-card">
        <h3 class="section-title">收入趋势</h3>
        <div id="revenueChart"></div>
      </div>
      <div class="chart-card">
        <h3 class="section-title">用户分布</h3>
        <div id="userChart"></div>
      </div>
    </section>

    <!-- 数据表格 -->
    <section class="table-section">
      <h3 class="section-title">最近订单</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>用户</th>
            <th>金额</th>
            <th>状态</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>ORDER-001</td>
            <td>张三</td>
            <td>$299</td>
            <td><span class="badge badge-green">完成</span></td>
            <td>2026-07-29</td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>
</div>
```

### 2. 教育场景 Dashboard

```html
<div class="dashboard education">
  <!-- 顶部统计卡片 -->
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-icon">👥</div>
      <div class="kpi-label">班级总数</div>
      <div class="kpi-value">12</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon">👨‍🎓</div>
      <div class="kpi-label">学生总数</div>
      <div class="kpi-value">356</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon">📅</div>
      <div class="kpi-label">本周课程</div>
      <div class="kpi-value">24</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon">⭐</div>
      <div class="kpi-label">平均评分</div>
      <div class="kpi-value">4.6</div>
    </div>
  </div>

  <!-- 图表区 -->
  <div class="charts-grid">
    <div class="chart-card">
      <h3>班级 attendance</h3>
      <div id="attendanceChart"></div>
    </div>
    <div class="chart-card">
      <h3>成绩分布</h3>
      <div id="scoreChart"></div>
    </div>
  </div>

  <!-- 课程安排表 -->
  <div class="schedule-table">
    <h3>本周课程安排</h3>
    <table>
      <thead>
        <tr>
          <th>时间</th>
          <th>周一</th>
          <th>周二</th>
          <th>周三</th>
          <th>周四</th>
          <th>周五</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>第1-2节</td>
          <td>数学</td>
          <td>语文</td>
          <td>英语</td>
          <td>数学</td>
          <td>物理</td>
        </tr>
        <tr>
          <td>第3-4节</td>
          <td>英语</td>
          <td>物理</td>
          <td>化学</td>
          <td>历史</td>
          <td>地理</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

## dataviz 数据可视化

调用 **dataviz skill** 生成图表代码。

### ECharts 配置示例

```javascript
import * as echarts from 'echarts';

const chart = echarts.init(document.getElementById('chart'));
chart.setOption({
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: ['周一', '周二', '周三'] },
  yAxis: { type: 'value' },
  series: [{
    type: 'line',
    data: [120, 200, 150],
    smooth: true,
    areaStyle: { color: '#2563EB' }
  }]
});
```

### Chart.js 配置示例

```javascript
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const ctx = document.getElementById('chart').getContext('2d');
new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['周一', '周二', '周三'],
    datasets: [{
      label: '收入',
      data: [120, 200, 150],
      backgroundColor: '#10B981'
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false
  }
});
```

---

## NotebookLM 内容生成

### 1. 生成教学材料

使用 **notebooklm skill** 生成内容，然后用 **dataviz** 可视化数据。

**流程**：
1. 导入课文原文到 NotebookLM
2. 生成学习指南/PPT
3. 提取关键数据（如时间线、事件列表）
4. 用 dataviz 可视化（时间线图表、分类柱状图）

### 2. 生成数据报表

**流程**：
1. 使用 notebooklm skill 生成数据报表草稿
2. 提取数字、百分比、排名
3. 用 dataviz 生成 KPI 卡片、图表
4. 组合成 Dashboard 模板

---

## React 组件库（可选）

### 可复用组件

```tsx
// components/kpi-card.tsx
interface KPICardProps {
  icon: string;
  label: string;
  value: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function KPICard({ icon, label, value, trend }: KPICardProps) {
  return (
    <Card className="rounded-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <span className="text-sm text-gray-600">{label}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {trend && (
          <div className={`text-sm mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% vs 上月
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// components/data-table.tsx
interface DataTableProps<T> {
  columns: { key: keyof T; title: string }[];
  data: T[];
}

export function DataTable<T>({ columns, data }: DataTableProps<T>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.key}>{col.title}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.id}>
            {columns.map((col) => (
              <TableCell key={col.key}>{row[col.key]}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## 快速启动指南

### 1. 纯 HTML/CSS（无框架）

```bash
# 1. 复制设计系统 CSS
# 2. 使用 shadcn/ui 风格的 HTML 类
# 3. 组合成 Dashboard 模板
# 4. 集成 dataviz 图表
```

### 2. React + Tailwind

```bash
# 1. 初始化 shadcn/ui
npx shadcn-ui@latest init

# 2. 添加组件
npx shadcn-ui@latest add button card table badge tabs form

# 3. 创建 Dashboard 组件
npx shadcn-ui@latest add card
npx shadcn-ui@latest add chart

# 4. 集成 dataviz
npm install echarts
# 或
npm install chart.js
```

---

## 实战案例

### 案例 1：历史课 Dashboard

```html
<!-- 教育场景 Dashboard -->
<div class="dashboard education">
  <!-- KPI 卡片 -->
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-icon">📅</div>
      <div class="kpi-label">当前章节</div>
      <div class="kpi-value">5.1 封建与大一统</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon">👨‍🎓</div>
      <div class="kpi-label">学生总数</div>
      <div class="kpi-value">35</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon">⏰</div>
      <div class="kpi-label">本周课时</div>
      <div class="kpi-value">3 课时</div>
    </div>
  </div>

  <!-- 图表区 -->
  <div class="charts-grid">
    <div class="chart-card">
      <h3>时间线：秦朝历史</h3>
      <div id="timelineChart"></div>
    </div>
    <div class="chart-card">
      <h3>知识点掌握度</h3>
      <div id="masteryChart"></div>
    </div>
  </div>

  <!-- 课程表 -->
  <div class="schedule-table">
    <h3>本周课程安排</h3>
    <table>
      <thead>
        <tr>
          <th>时间</th>
          <th>周一</th>
          <th>周二</th>
          <th>周三</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>第1-2节</td>
          <td>秦始皇统一六国</td>
          <td>秦朝政治制度</td>
          <td>秦朝经济文化</td>
        </tr>
        <tr>
          <td>第3-4节</td>
          <td>楚汉之争</td>
          <td>汉朝的强盛</td>
          <td>复习与测验</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### 案例 2：Chess System Dashboard

```html
<!-- 国际象棋比赛系统 Dashboard -->
<div class="dashboard chess">
  <!-- KPI 卡片 -->
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-icon">👥</div>
      <div class="kpi-label">总选手数</div>
      <div class="kpi-value" id="kpiPlayers">0</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon">📊</div>
      <div class="kpi-label">已完成轮次</div>
      <div class="kpi-value" id="kpiRounds">0</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon">📝</div>
      <div class="kpi-label">待录成绩</div>
      <div class="kpi-value" id="kpiPending">0</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon">♟️</div>
      <div class="kpi-label">总对局数</div>
      <div class="kpi-value" id="kpiMatches">0</div>
    </div>
  </div>

  <!-- 对阵表 Tabs -->
  <div class="tabs">
    <button class="tab active">📊 对阵表</button>
    <button class="tab">👥 选手管理</button>
    <button class="tab">🏆 积分榜</button>
  </div>

  <!-- 对阵表内容 -->
  <div id="pairingList" class="pairing-grid">
    <!-- 动态生成 -->
  </div>

  <!-- 选手列表 -->
  <div id="playerList" class="table-section">
    <table class="player-table">
      <thead>
        <tr>
          <th>#</th>
          <th>姓名</th>
          <th>年级</th>
          <th>积分</th>
          <th>排名</th>
        </tr>
      </thead>
      <tbody id="playerTableBody">
        <!-- 动态生成 -->
      </tbody>
    </table>
  </div>
</div>
```

---

## 注意事项

1. **设计系统一致性**：所有页面必须使用统一的调色板、圆角、间距
2. **响应式设计**：至少支持桌面、平板、手机三档断点
3. **可访问性**：遵循 WCAG 2.1 标准，确保颜色对比度 ≥ 4.5:1
4. **性能优化**：图表懒加载，图片压缩，减少 HTTP 请求
5. **组件复用**：React 组件抽取到 `components/` 目录，便于维护

---

## 更新记录

- 2026-07-29：初始化 frontend-design skill，集成 shadcn/ui + dataviz + notebooklm
- 2026-07-29：添加 8 种美学锚点 + 设计 Token
- 2026-07-29：添加 shadcn/ui 组件模板 + Dashboard 模板
