# open-office.self

> **A file is an app. Everything is a file.**

Selfware 协议的第一个参考实现——一个 local-first 的文档运行时，让文件自带数据、逻辑和视图，成为 Agent 时代的上下文便携容器。

[English](./selfware.en.md) | 中文

---

## 为什么需要 Selfware？

随着 Claude Code、Cursor、Windsurf 等 Agent 应用的爆发，用户开始在不同 Agent 之间频繁切换。但今天的文档只保存"结果"（Markdown），不保存"过程"——检索了哪些素材、做了哪些推理、为什么这么修改。

**这些信息在切换 Agent 时全部丢失。**

```
Agent A (Claude Code):
- 用户："帮我写一个 PRD"
- Agent A 检索知识库、做 rank、生成文档
- 内部有完整上下文：检索了哪些素材、相关性得分、推理链条

三天后，切换到 Agent B (Cursor + Deepseek):
- 用户："基于这份 PRD，继续优化"
- Agent B 只看到一份 Markdown
- ❌ 不知道基于哪些素材
- ❌ 不知道之前的 rank 结果
- ❌ 需要重新检索、重新推理

结果：浪费 Token、上下文丢失、理解偏差
```

这不是"模型能力"的问题，而是**信息丢失**的问题。大模型再强，也不可能从最终的 Markdown 中逆向推导出创作过程中的关键信息。

**没有数据，就没有记忆。没有记忆，Agent 就无法真正"接手"工作。**

---

## 核心方案：数据、逻辑、视图三位一体

传统文档只有一层：给人看的 Markdown。Selfware 把文档变成一个**自包含的运行时**：

| 层 | 职责 | 本项目实现 |
|---|---|---|
| **数据层** | 唯一真理源 + 变更轨迹 + 决策历史 | `content/` 目录，含 Memory 模块 |
| **逻辑层** | 零依赖本地运行时，提供标准 API | `server.py`（纯 Python 标准库） |
| **视图层** | 同一份数据的多种投影 | 7 种视图：文档、画布、脑图、大纲、演示、卡片、Self 仪表盘 |

**价值：**
- Agent A 生成文档时，自动记录上下文到数据层（Memory 模块）
- Agent B 读取文档时，通过 API 获取完整上下文（数据 + 变更历史 + 决策记录）
- 打包为 `.self` 文件后，数据、逻辑、视图一起分发——接收方直接运行，零配置
- 实现跨 Agent 的**无损上下文传递**

---

## 架构概览

```
┌─────────────────────────────────────────────┐
│              .self 容器 (ZIP)                │
├─────────────────────────────────────────────┤
│  selfware.md          ← 协议权威源          │
│  manifest.md          ← 运行时清单          │
│  server.py            ← 零依赖运行时内核     │
│                                             │
│  content/                                    │
│  ├── selfware_demo.md ← Canonical Data      │
│  └── memory/                                │
│      ├── changes.md   ← 变更记录（append-only）│
│      └── decisions.md ← 决策记录             │
│                                             │
│  views/                                      │
│  ├── self.html        ← Self 仪表盘         │
│  ├── doc.html         ← 文档视图            │
│  ├── canvas.html      ← 画布视图            │
│  ├── mindmap.html     ← 脑图视图            │
│  ├── outline.html     ← 大纲视图            │
│  ├── presentation.html← 演示视图            │
│  └── card.html        ← 卡片视图            │
└─────────────────────────────────────────────┘
```

---

## 快速开始

### 方式一：让 Agent 帮你启动

将本仓库 clone 到你的 Agent 工作目录，然后告诉它：

> 帮我运行 open-office.self

Agent 会自动启动运行时并在浏览器中打开交互视图。

### 方式二：手动启动

**依赖：** Python 3（仅标准库，零外部依赖）

```bash
git clone https://github.com/bescriptkiddie/openoffice.self.git
cd openoffice.self
python server.py
```

打开 `http://127.0.0.1:8000/`。

如果端口 `8000` 被占用，运行时会自动选择下一个可用端口。也可以手动指定：

```bash
SELFWARE_PORT=8001 python server.py
```

### 打包为 `.self` 文件

```bash
python server.py pack ./OpenOffice.self
python server.py pack ./OpenOffice.self --yes   # 跳过确认
```

---

## 核心设计原则

### 1. 单文件权威源（Single-File Authority）

协议文本 `selfware.md` 是唯一权威源。运行时、视图、资源均可被替换或由 Agent 重新生成。任何 Agent 只需读懂一个 Markdown 文件，就能理解整个协议。

### 2. 视图即函数（View as Function）

```
View = f(Data, Intent, Rules)
```

同一份数据，通过不同函数投影为 7 种视图。视图永远不是内容真理源——数据的一致性由数据层保证。

### 3. Memory 模块（可审计的上下文记录）

每条变更记录包含语义级信息：

```yaml
id: "chg-20260221-182724-memory"
timestamp: "2026-02-21T10:27:24Z"
actor: "agent"
intent: "add_memory"
paths:
  - "content/selfware_demo.md"
summary: "人类可读的变更摘要"
rollback_hint: "git revert HEAD"
```

不是传统 changelog（"第 5 行被删除"），而是语义级演化记录（"作者决定收窄功能范围，因为技术评估后成本过高"）。

### 4. 能力声明（Capability Declaration）

运行时启动时自动声明自身能力边界，让任何 Agent 在接触 `.self` 文件时立即知道"我能做什么、不能做什么"。

```bash
GET /api/capabilities
```

### 5. 禁止静默操作（No Silent Apply）

任何会产生写入或对外通信的操作，必须先告知用户逻辑 + 内容摘要 + 回滚方式，获得明确确认后才执行。

---

## 与 MCP 的关系

| | MCP（Model Context Protocol） | Selfware |
|---|---|---|
| **解决的问题** | Agent 与外部工具/数据源的连接 | 文档本身如何承载上下文 |
| **定位** | "管道"——连接各种数据源 | "容器"——文件自己记住创作过程 |
| **互补** | Agent 通过 MCP 连接数据源 | `.self` 文件本身就是自包含数据源 |
| **未来** | MCP Server 可直接暴露 `.self` 文件 API | 任何支持 MCP 的 Agent 自动消费文档上下文 |

---

## 运行时 API

| 接口 | 方法 | 说明 |
|---|---|---|
| `/api/content` | GET | 获取 Canonical Data |
| `/api/save` | POST | 写入内容（范围限定在 `content/`） |
| `/api/self` | GET | 获取内容 + SHA256 |
| `/api/manifest` | GET | 获取运行时清单 |
| `/api/capabilities` | GET | 能力声明 |
| `/api/protocol` | GET | 获取协议文本 |
| `/api/chat_edit` | POST | AI 辅助编辑 |
| `/api/check_update` | GET | 检查协议更新 |

---

## 安全模型

- **网络边界：** 仅绑定 `localhost`，禁止外部访问
- **写入范围：** 限定在 `content/` 目录
- **操作确认：** 打包、发布、上下文发送、拉取合并等高影响操作必须用户确认

---

## 项目文件说明

| 文件 | 说明 |
|---|---|
| `selfware.md` | Selfware 协议权威源（中文） |
| `selfware.en.md` | 协议英文翻译 |
| `manifest.md` | 运行时清单与打包计划 |
| `server.py` | 零依赖 Python 运行时内核 |
| `content/selfware_demo.md` | 规范数据源（中文） |
| `content/selfware_demo.en.md` | 规范数据源（英文） |
| `content/memory/` | Memory 模块（变更记录 + 决策记录） |
| `views/` | 7 种视图投影 |
| `thought.md` | 项目设计思考与愿景 |

---

## 已完成功能

- ✅ 零依赖 Python 运行时（纯标准库）
- ✅ 7 种视图投影（doc, canvas, mindmap, outline, presentation, card, self）
- ✅ Memory 模块（changes.md + decisions.md，append-only）
- ✅ `.self` 打包分发（ZIP 容器 + 自描述清单）
- ✅ 能力声明 API
- ✅ 安全沙箱（localhost-only，写入范围限定）
- ✅ 多语言支持（中/英）
- ✅ AI 辅助编辑

---

## 协议许可

MIT. 详见 [LICENSE](./LICENSE)。

你可以任意修改、分发、创造衍生作品。这是 Agent 时代的统一文件协议，也是打破藩篱、进入新世界的开始。

---

## 联系方式

- 邮箱：qikachu1996@gmail.com
- GitHub：[@bescriptkiddie](https://github.com/bescriptkiddie)
