# 项目接力包：SnapText OCR App → Play Store

## 一句话目标

一个运行在 Android 上的 OCR 应用：拍照/选图 → Gemini API 提取文字 → 导出 TXT / PDF → 发布到 Google Play Store。

---

## 文件结构

```
playstore-app/
├── index.html                 ← Vite 入口
├── package.json               ← React + Vite + Capacitor + html2pdf.js
├── vite.config.js
├── capacitor.config.json
├── build-apk.ps1              ← 本地构建 APK 脚本
├── src/
│   ├── main.jsx
│   ├── App.jsx                ← 核心：拍照、OCR、下载 TXT/PDF
│   ├── index.css
│   └── i18n/                  ← 中英文国际化
├── public/                    ← 图标、manifest
├── android/                   ← Capacitor Android 项目
└── HANDOFF.md                 ← 本文件
```

---

## 技术栈

| 层 | 技术 | 用途 |
|----|------|------|
| 前端 | React 19 + Vite 8 | UI |
| OCR | Gemini 2.5 Flash API | 从图片提取文字 |
| 移动端 | Capacitor | 原生文件系统、相机、Android APK |
| PDF 生成 | html2pdf.js | 将提取的文字导出为 PDF |
| 国际化 | react-i18next + CapacitorPreferences | 中英文切换 |
| APK 构建 | GitHub Actions + pwabuilder | CI 自动构建 |

---

## 当前进度

### 已完成
- [x] 相机拍照 + 图片选择
- [x] Gemini OCR 文字提取（支持中英文）
- [x] TXT 下载（原生 + Web）
- [x] PDF 导出（html2pdf.js）
- [x] 中英文国际化
- [x] Capacitor Android 配置
- [x] GitHub Actions APK 构建 workflow
- [x] 本地构建脚本 `build-apk.ps1`

---

## ⚠️ 已知问题（来自上次会话）

### 1. PDF 打开后空白 —— 🔴 严重
- `printToPdf` 函数使用 `html2pdf` 生成 PDF
- 文件能下载，但打开后是空白页
- 可能原因：
  - `html2pdf` 的 DOM 元素注入/清理时机问题
  - 字体加载问题（`Noto Sans SC` 可能未嵌入）
  - `arraybuffer` 输出格式有问题
  - 元素被过早 cleanup

### 2. APK 是旧版本 —— 🔴 严重
- 用户反映 APK 版本没有更新
- GitHub Actions workflow 可能未触发或使用了旧代码
- Workflow 文件位置需确认：`.github/workflows/build-apk.yml`

### 3. PDF 中文显示 —— 🟡 可能有问题
- 使用了 `Noto Sans SC` 字体，但 html2pdf 可能不嵌入中文字体
- 需要在 PDF 中嵌入字体或使用 base64 字体方案

### 4. 下载文件命名 —— 🟢 已修复
- 现在会弹出 prompt 让用户输入文件名
- 自动添加 `.txt` / `.pdf` 后缀

---

## 关键代码位置

| 功能 | 文件 | 函数/位置 |
|------|------|-----------|
| TXT 下载 | `src/App.jsx:131` | `downloadTxt()` |
| PDF 导出 | `src/App.jsx:164` | `printToPdf()` |
| Gemini API 调用 | `src/App.jsx:12` | `GEMINI_API` 常量 |
| 原生文件写入 | `src/App.jsx:139` | `Filesystem.writeFile()` |
| APK 构建脚本 | `build-apk.ps1` | 本地构建 |
| GitHub Workflow | `.github/workflows/` | CI 构建 APK |

---

## 启动方式

### Web 开发
```bash
cd d:\AIgames\playstore-app
npm install
npm run dev
# 浏览器打开 http://localhost:5173
```

### 本地构建 APK
```bash
cd d:\AIgames\playstore-app
.\build-apk.ps1
```

### 触发 GitHub Actions 构建 APK
1. Push 到 GitHub 仓库
2. Actions → Build Snaptext APK → Run workflow
3. 完成后下载 APK artifact

---

## ⚠️ 上次会话记录 (2026-05-25)

### 原始问题
- 点击"下载 txt"按钮 → 变成"发送 txt 给别人"（使用了 `Share.share()`）
- 点击"下载 pdf"按钮 → 变成"发送 html 给别人"（同上）

### 做了什么
1. **downloadTxt** — 改为使用 `Filesystem.writeFile()`（原生）或 Blob 下载（Web）
2. **printToPdf** — 添加 `html2pdf.js`，生成真正的 PDF（之前是 HTML）
3. **GitHub Actions workflow** — 创建了自动构建 APK 的 CI
4. **build-apk.ps1** — 创建本地 APK 构建脚本
5. 文件命名改进：弹出 prompt 让用户自定义文件名

### 用户最后反馈
- PDF 下载后打开是**空白**
- APK 是**旧版本**（workflow 没有正确构建新代码）
- 中文可能乱码
- 用户非常 frustrated，放弃了那次会话

### 修复优先级
1. **先修复 PDF 空白问题** — 这是用户最关心的
2. **验证 APK 构建** — 确保 workflow 正确触发并使用最新代码
3. **中文字体嵌入** — 确保 PDF 中文不乱码

---

## 传递建议

给下一个 AI 的提示：
1. **先让项目跑起来** — `npm install && npm run dev`，确认 Web 端正常工作
2. **PDF 空白是核心问题** — 检查 `html2pdf` 的用法，可能需要换方案（如 `jspdf` 直接构建）
3. **APK 构建** — 检查 GitHub 仓库是否存在 `.github/workflows/` 目录和 workflow 文件
4. **不要碰已稳定的部分** — Gemini OCR 调用、相机功能、国际化都已经正常工作
5. 用户会要求你来运行，不是他自己运行
