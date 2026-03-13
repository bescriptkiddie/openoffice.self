---
selfware:
  role: memory_actions
  title: "Actions"
  purpose: "声明本实例（及其中每个文件）对 Agent 开放的操作能力与约束。Agent 读完即知行动空间。"
  scope: "覆盖视图投影、内容编辑、AI 协作、导入导出、运行时启动等全部可用操作。"
  update_policy: append_only
  owner: user
  created_at: "2026-03-13T15:00:00Z"
  updated_at: "2026-03-13T15:00:00Z"
---

# Actions

> 本文件是 Agent 的行动指南。拿到 `.self` 容器后，先读这里，就知道能做什么、怎么做、什么不能做。
> 写入要求：当实例能力发生变化时（新增视图、新增操作、变更边界），必须追加记录并同步 `content/memory/changes.md`。

---

## 📖 视图投影

本实例支持以下视图，每种视图是同一份 Canonical Data 的不同投影函数 `View = f(Data, Intent, Rules)`：

| 视图 | 路径 | 说明 |
|------|------|------|
| 📄 文档 | `/doc` 或 `views/doc.html` | 线性阅读，Markdown 渲染 |
| 🧠 脑图 | `/mindmap` 或 `views/mindmap.html` | 非线性探索，标题→分支→叶节点 |
| 📝 大纲 | `/outline` 或 `views/outline.html` | 层级结构，标题深度=缩进 |
| 🎨 画布 | `/canvas` 或 `views/canvas.html` | 空间组织，自由拖拽连接 |
| 📊 演示 | `/presentation` 或 `views/presentation.html` | H2→幻灯片，限 5 条要点 |
| 🃏 卡片 | `/card` 或 `views/card.html` | 可导出卡片（长图文/按H2拆分/按---拆分）|
| 🏠 自述 | `/` 或 `views/self.html` | 仪表盘：身份、能力、记忆概览 |
| 📚 归档 | `/archive` 或 `views/archive.html` | 文章列表与归档浏览 |

**Agent 操作**：切换视图不修改数据，只改变投影方式。所有视图从同一个 Canonical Data 源读取。

---

## ✏️ 内容编辑

| 操作 | 端点 | 说明 |
|------|------|------|
| 读取内容 | `GET /api/content?lang=zh\|en` | 读取 Canonical Data |
| 读取文章 | `GET /api/content?path=content/articles/xxx.md` | 读取指定文章 |
| 保存内容 | `POST /api/save` body: `{content, lang, path?}` | 写入内容，自动生成 Change Record |
| AI 编辑 | `POST /api/chat-edit` body: `{instruction, selection?, lang, path?}` | AI 按协议修改，生成 Change Record |
| 导入 | `POST /api/import` body: `{content, filename, lang, saveAs}` | AI 转化为 Selfware 格式，生成 Change Record |
| 导出 | `GET /api/export?path=content/articles/xxx.md` | 导出为 `.self` ZIP 容器（含视图、运行时、记忆）|

**写入边界**：所有写操作限制在 `content/` 目录内。协议文件 `selfware.md` 只读。

---

## 🧠 记忆系统

| 文件 | 角色 | 说明 |
|------|------|------|
| `content/memory/changes.md` | 变更记录 | 每次内容变更的审计日志（谁、何时、为什么、怎么回滚）|
| `content/memory/decisions.md` | 决策记录 | 影响架构/边界/策略的关键决策 |
| `content/memory/actions.md` | 能力声明 | 本文件——Agent 的行动空间指南 |
| `content/articles/*.memory.md` | 文件级记忆 | 每篇文章独立的变更追踪 |

**Agent 操作**：记忆文件是 append-only，不可编辑或删除已有记录。

---

## 🚀 运行时

| 操作 | 命令 | 说明 |
|------|------|------|
| 启动 Next.js | `npm run dev` | 开发模式，http://localhost:3000 |
| 启动 Python | `python server.py` | 独立运行时，http://localhost:8000 |
| 打包 .self | `python server.py pack Out.self` | 将整个实例打包为 ZIP 容器 |
| 构建生产版 | `npm run build && npm start` | Next.js 生产模式 |

---

## 🔒 约束（MUST NOT）

- **不可静默修改**：所有内容变更必须生成 Change Record
- **不可突破写入边界**：只能写入 `content/` 目录
- **不可编辑记忆**：memory 文件只可追加，不可修改已有记录
- **不可跳过确认**：pack、publish、send_context、pull_merge、apply_updates 需用户确认
- **不可修改协议文件**：`selfware.md` 只能通过协议更新流程修改（需确认+回滚点）

---

## 🌐 i18n

支持语言：`zh`（中文，默认）、`en`（英文）

- URL 参数 `?lang=en` 切换语言
- 内容文件语言变体：`selfware_demo.md`（zh）、`selfware_demo.en.md`（en）
- 翻译字符串通过 `t(key, lang)` 函数获取
