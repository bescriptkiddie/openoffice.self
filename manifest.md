# Selfware Demo Manifest
# Version: 0.1.0
# Date: 2026-02-21

Conformance: This project is a demo runtime for `content/selfware_demo.md` (single-file authority).

## 1. 核心定义 (Core Definition)
本仓库是一个 **Selfware 雏形**：把“一个文件（包）就是一个软件”的理念，落成一个可运行、可编辑、可多视图投影的最小闭环。
本清单 (Manifest) 是 Agent 在本仓库内工作的最高优先级执行依据之一（另一个是 `content/selfware_demo.md`）。

## 2. 运行时协议 (Runtime Protocol)

### 🚀 启动指令 (Execution)
Agent 或用户必须通过以下方式启动运行时内核，以获得完整的读写能力：
```bash
python3 server.py
```
如 `8000` 端口被占用，可指定端口：
```bash
SELFWARE_PORT=8001 python3 server.py
```
兼容旧环境变量名：`AUDP_PORT` / `PORT`。

### 📦 打包指令 (Pack to `.self`)

本 demo 支持将整个项目目录打包为一个 `.self` 文件（ZIP 容器 + `self/manifest.md`）。

```bash
python3 server.py pack ./SelfwareDemo.self
```

打包前会展示最终包含文件与总大小，并要求用户确认。若你在 CI 或脚本里使用，可显式确认：
```bash
python3 server.py pack ./SelfwareDemo.self --yes
```

### 🔒 安全沙箱 (Security Sandbox)
- **网络边界**: 服务仅绑定于 `localhost`，禁止外部网络访问。
- **I/O 限制**: 
  - 视图层 (HTML/JS) **没有** 直接的文件系统访问权限。
  - 所有写操作 **必须** 通过 `POST /api/save` 接口进行。
  - 写入范围仅限于 `content/selfware_demo.md` (Canonical Source)。
- **CORS**:
  - 核心 API（`/api/content`、`/api/save`、`/api/self`、`/api/manifest`）默认为同源使用。
  - `/api/proxy` 为导出场景提供资源代理，响应会带 `Access-Control-Allow-Origin: *`（仅代理远程资源，不上传本地内容）。

## 3. 角色与结构 (Roles & Structure)

### 🟣 Self Descriptor（自描述入口）
- **Role**: `bootstrap_descriptor`
- **Path**: `/content/selfware_demo.md`
- **Purpose**: 以“示例即规范”的方式提供最小可 follow 入口：协议版本、入口地址、写入边界与交互规则摘要。

### 🟢 Canonical Source (唯一内容源)
- **Role**: `source_of_truth`
- **Path**: `/content/selfware_demo.md`（默认 `lang=zh`；英文为 `/content/selfware_demo.en.md`）
- **Agent 行为准则**:
  - 若要修改内容，**必须**修改此文件（通过 `/api/save` 写回）。
  - **禁止**直接修改 `/views/` 或 `/*.html` 中的硬编码文本。

### 🟡 Runtime Kernel (运行时内核)
- **Role**: `kernel`
- **Path**: `/server.py`
- **Function**: 提供 HTTP 服务与文件读写 API。
- **Dependencies**: Python 3 标准库 (零依赖)。
  - `GET /api/self?lang=...` -> 返回指定语言的 Canonical Data（含 sha256；默认 `lang=zh`）
  - `GET /api/manifest` -> 返回本文件 `manifest.md`
  - `GET /api/content?lang=...` -> 返回指定语言的 Canonical Data（默认 `lang=zh`）
  - `POST /api/save` -> 写回指定语言的 Canonical Data（payload 可带 `lang`；写入范围仅 `content/`）
  - `GET /api/protocol?lang=...` -> 返回协议文本（默认 `selfware.md`；英文为 `selfware.en.md`）
  - `GET /api/check_update?url=...` -> 检查官网协议源更新（返回 diff 预览；应用更新必须用户确认）
  - `GET /api/proxy?url=...` -> 代理远程资源（主要用于导出）

### 🔵 Interactive Interfaces (交互视图)
- **Role**: `interface`
- **Entry Points**:
  - 🧾 Self 页面: `http://localhost:8000/views/self.html`
    - 英文：`http://localhost:8000/views/self.html?lang=en`
  - 📄 Doc 视图: `http://localhost:8000/views/doc.html`
  - 🎨 画布视图: `http://localhost:8000/views/canvas.html`
  - 🧠 脑图视图: `http://localhost:8000/views/mindmap.html`
  - 📝 大纲视图: `http://localhost:8000/views/outline.html`
  - 📊 演示视图: `http://localhost:8000/views/presentation.html`
  - 🃏 卡片视图: `http://localhost:8000/views/card.html`
- **Behavior**: 启动时自动从 Kernel 拉取数据；保存时推送到 Kernel。

#### 🎨 Canvas (画布视图)
- **Purpose**: Spatial organization and free-form connection of ideas.
- **Transformation Rules**:
  - Document title = Center Hub
  - Level-2 headings = Primary Cards surrounding the Hub
  - Level-3 headings / Bullet lists = Detail Cards connected to Primary Cards
  - Content flow = Spatial proximity rather than linear order
- **Layout Hints**: Infinite 2D grid, draggable nodes, visual connectors for hierarchy.
- **Path**: `/views/canvas.html`

#### 🧠 Mind Map (脑图视图)
- **Purpose**: Enable non-linear exploration.
- **Transformation Rules**:
  - Root node = document title
  - Level-2 headings = main branches
  - Level-3 headings = sub-branches
  - Bullet lists become leaf nodes
  - Paragraphs are summarized into node labels
- **Layout Hints**: Radial layout, balance branches evenly, use short semantic labels.
- **Interaction**: Support real-time source editing (Markdown); sync content changes back to the canonical source (`content/selfware_demo.md`).
- **Path**: `/views/mindmap.html`

#### 📝 Outline (大纲视图)
- **Purpose**: Expose structural hierarchy.
- **Extraction Rules**:
  - Each heading becomes a node
  - Heading levels define depth
  - Paragraphs are included as leaf nodes (same level as list items)
- **Output Example**:
  - 为什么需要 AI 时代的大一统格式
    - 问题背景
    - 核心洞察
    - 四种核心视图需求
    - 设计原则
      - 单一内容源
      - 视图即函数
      - AI 优先
    - 未来影响
- **Path**: `/views/outline.html`

#### 📊 Slides (演示视图)
- **Purpose**: Presentation-ready narrative.
- **Slide Rules**:
  - Each level-2 heading = one slide
  - Slide title = heading text
  - Slide bullets = summarized paragraphs or lists
  - Limit 5 bullets per slide
- **Tone**: Clear, persuasive, executive-level.
- **Path**: `/views/presentation.html`

## 4. Pack Plan（打包计划）

打包计划用于声明本项目导出为 `.self` 时的 include/exclude/required，并作为打包前用户确认的依据。

### 4.1 Required（最小必需）
- `selfware.md`
- `manifest.md`
- `content/**`

### 4.2 Include（默认包含）
- `selfware.en.md`
- `server.py`
- `views/**`
- `assets/**`
- `skills/**`
- `js/**`

### 4.3 Exclude（默认排除）
- `.git/**`
- `output/**`
- `backups/**`
- `__pycache__/**`
- `**/*.pyc`
- `**/.DS_Store`
- `node_modules/**`
- `.venv/**`
- `dist/**`
- `build/**`
- `**/*.log`

## 5. Memory (Optional)（记忆模块，可选）

本 demo 启用可选 Memory 模块，落在：
- `content/memory/`

约定：
- `content/memory/` 下每个文件必须在顶部包含元信息（YAML front matter 或 `## Meta` 段落）。
- 每次变更 MUST 追加一条 Change Record 到 `content/memory/changes.md`。

## 6. Capability Declaration（能力声明）

运行时启动时会声明自身能力与边界，并提供机器可读接口：
- `GET /api/capabilities`

本 demo 的能力概览：
- `serve_local`: 仅本地 `127.0.0.1`
- `read_canonical`: `GET /api/content`
- `write_canonical`: `POST /api/save`（写入范围：`content/`）
- `pack_self`: `python3 server.py pack <out>.self [--yes]`
- `check_updates`: `GET /api/check_update?url=...`
- `local_git`: 已初始化（用于本地回滚点）
- `ecosystem`: 协议支持（Artifact 元信息含 `sha256`；托管/索引并存），具体发布实现可替换
- `self_analysis`: 协议支持（可选模块），实现可替换

必须用户确认（No Silent Apply）：
- pack / publish / send context / pull&merge / apply updates

Agent 交互约束（MUST）：
- 当能力已支持但尚未启用/尚缺配置/存在策略分支时，必须先由 Agent 主动询问并获得明确确认，才执行会产生写入或对外通信的动作。

#### 🃏 Card (卡片视图)
- **Purpose**: 将同一份 Markdown 内容实时渲染成“可导出”的卡片（长图文 / 自动拆分 / 横线拆分）。
- **Transformation Rules**:
  - 长图文：整篇渲染成 1 张卡片
  - 自动拆分：按二级标题（`##`）分卡
  - 横线拆分：按分割线（`---`）分卡
- **Interaction**:
  - 左侧编辑 Markdown，中心实时渲染多卡片
  - 右侧菜单调整尺寸、缩放、字体与纹理
  - 支持导出 PNG / SVG（导出全部卡片；多卡自动 ZIP）
- **Path**: `/views/card.html`

#### 📄 Document (文档视图)
- **Purpose**: Linear reading for humans.
- **Rules**: Render markdown as-is, preserve headings and paragraphs, ignore view-only metadata.
- **Output**: Scrollable document layout similar to traditional articles.

## 4. Agent 操作指南 (Agent Directives)

当被要求"编辑文档"或"更新视图"时，请遵循以下决策树：

1. **先读协议入口** -> 打开 `/content/selfware_demo.md`（或 `GET /api/self`）。
2. **修改内容?** -> 编辑 `/content/selfware_demo.md`。
3. **修改样式/布局?** -> 编辑对应的 `/views/*.html` 或 `/js/view-switcher.js`。
4. **修改协议/运行时规则?** -> 优先改 `/content/selfware_demo.md`，必要时再改 `/server.py`。
5. **分发/打包?** -> 确保包含 `server.py` 和本 `manifest.md`。
6. **遇到错误?** -> 检查 `python3 server.py` 是否正在运行。

## 5. 完整性校验 (Integrity)
- 严禁删除 `manifest.md`。
- 严禁修改 `server.py` 的安全限制（如 localhost 绑定）。
- 严禁让任何写接口突破 `content/selfware_demo.md` 的写入边界。
