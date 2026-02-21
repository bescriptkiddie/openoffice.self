# Selfware

> A file is an app. Everything is a file.
>
> Selfware 定义一种 Agent 时代的统一文件协议：在同一可分发单元（文件或 `.self` 包）内，实现数据、逻辑与视图的可选一体化；以分布式、去中心化的 Agent 协同方式与自包含的人机互动方式，构建人↔Agent、Agent↔Agent 的协作关系；让文件回归到用户，永不失效，无限进化。

Version: 0.1.0 (Draft)

License (Optional): MIT — you MAY modify, redistribute, and create derivatives.

---

> NOTE（demo 约定）：本文件是本仓库前端读取/编辑的 **Canonical Data（数据权威源）**，并包含一份协议文本的镜像用于演示；Selfware **协议权威源**在根目录 `selfware.md`。

除非标注为“Non‑Normative”，本文使用 RFC 风格术语：
- **MUST / MUST NOT**：必须 / 禁止
- **SHOULD / SHOULD NOT**：应当 / 不应当
- **MAY**：可以

---

## 1. Single‑File Authority（单文件权威源）

本文件（`content/selfware_demo.md`）是本 demo 的 **Canonical Data（数据权威源）**：
- Kernel、Views、Assets、Skills 等均属于运行时实现（runtime），MAY 被替换或由 Agent 重新生成。
- Selfware 协议文本的最终落点是根目录 `selfware.md`；本文件仅作为协议镜像与 demo 内容源。
- 任何“更新文档/数据”的操作，都 MUST 写入 `content/`（本 demo 即写入本文件），并可回滚。

对比传统软件：传统软件通常把“数据”和“逻辑/视图”分离，逻辑与视图由少数大厂通过闭源客户端/服务端掌控，从而实现对文件与生态的事实垄断。Selfware 通过 **数据 + 逻辑 + 视图** 在同一文件（或同一可分发包）内的可选实现，以及 **非中心化** 的运行/分发方式，从根本上移除任何单一主体对软件定义权的垄断。本协议本身也是一个可选项 MIT 协议，你可以任意修改、分发、创造。这是 Agent 时代 的统一文件协议，也是打破藩篱、进入新世界的开始。

---

## 2. Canonical Data（规范数据）

本 demo 的 Canonical Data 为：
- `content/selfware_demo.md`（文本/Markdown）

Selfware 允许 Canonical Data 是任意数据类型（非穷尽）：
- 文本 / Markdown
- JSON / YAML
- 二进制（图片、音频、视频）
- 数据库文件（SQLite 等）
- 代码与工程文件
- Office 文档（docx 等）

实现 MUST 明确 Canonical Data 的读取/写入形状（文本、字节流、或命名资源集）。

---

## 3. View as Function（视图即函数）

任何视图 MUST 被视为函数：
> `View = f(Data, Intent, Rules)`

其中：
- `Data` 来自 Canonical Data
- `Rules` 由协议文件 `selfware.md` 定义（或其允许的扩展）
- Views MUST NOT 成为内容真理源（禁止把 Canonical Data 硬编码进视图文件作为唯一来源）

---

## 4. Runtime API（运行时接口，demo 约定）

Kernel MUST bind to loopback only（`localhost/127.0.0.1/::1`），除非用户显式配置更宽边界。

本 demo 的 API：
- `GET /api/content` -> `{ "content": "<content/selfware_demo.md>" }`
- `POST /api/save` with `{ "content": "<content/selfware_demo.md>" }` -> `{ "status": "success" }`
- `GET /api/self` -> `{ "path": "...", "sha256": "...", "content": "<content/selfware_demo.md>" }`
- `GET /api/manifest` -> `{ "content": "<manifest.md>" }`
- `GET /api/capabilities` -> 运行时能力声明（写入边界、确认动作、可用模块等）
- `GET /api/check_update?url=...` -> 检查远程协议源是否更新（见 6）

写入边界（MUST）：
- `POST /api/save` MUST only write to `content/selfware_demo.md`
- 运行时默认入口：`/` -> `/views/self.html`（Self Dashboard，展示 Canonical/Capabilities/Manifest）

---

## 5. Discovery（发现）

Discovery endpoint 示例（仅示例，不构成默认值）：
- `https://floatboat.ai/discovery/`

Discovery 的目标：在**用户许可**下，携带“意图 + 部分上下文”，去发现更好的解决方案（而不是仅仅搜索）。

Discovery 请求 SHOULD 包含：
- **Intent（意图）**：当前任务目标/希望达成的结果（例如 `update`、`recommend`、`fix_overflow`、`export_cards`）。
- **Partial Context（部分上下文）**：与意图直接相关的最小信息集，例如：
  - 任务目标（goal）
  - 执行状态（state / progress）
  - 执行日志（logs，**可选**，且必须可裁剪/脱敏）

权限（MUST）：
- 任何包含上下文的 Discovery 请求 MUST 在用户明确许可下发送。
- 默认 SHOULD 只发送最小必要上下文；更高粒度上下文必须单独授权。

Discovery 响应 MAY 返回（非穷尽）：
- 一个更合适的 **Selfware**（完整解决方案文件/模板）
- 一个或多个 **Skills**（可复用工作流）
- **代码片段** / 补丁建议
- 其它可被 Agent 消费的内容（规则片段、视图模板、配置建议等）

Discovery 触发点（实现 SHOULD；但 MUST 支持用户主动触发）：
1. **On Start**：每次运行时启动后
2. **On Explicit Update Intent**：用户/Agent 明确请求 `update`
3. **On Missing Capability**：执行 intent 缺少扩展/规则
4. **On Error Recovery**：扩展/规则失败需要替代或降级
5. **On User Request**：用户显式点击/输入 “Discover/Check Updates”

---

## 6. Official Protocol Source & Updates（官网协议源与更新）

### 6.1 Protocol Source（官网协议源）

本文件 MAY 声明一个“官网协议源”（仅用于检查更新，不代表自动覆盖权威）：
- `Protocol Source: https://floatboat.ai/selfware.md`

---

### 6.2 Update Check（更新检查）

若启用官网协议更新检查，运行时 MUST 在以下时机之一触发检查：
- **On Start**（每次运行时）或
- **On User Request**（用户主动要求）

检查 SHOULD 使用 ETag/Last‑Modified 或内容哈希；本 demo 用 `/api/check_update` 提供检查与 diff 摘要。

---

### 6.3 No Silent Apply（禁止静默更新）

一旦检测到官网协议源有更新，运行时 MUST：
1. 告知用户“更新逻辑”（从哪里拉取、如何比对、如何应用、如何回滚点）
2. 告知用户“更新内容摘要”（至少 title + summary；若可用提供 changelog/diff）
3. 让用户确认（Accept/Reject/Defer）
4. 仅在 Accept 后应用更新；Reject MUST 保持当前版本可继续运行

---

## 7. Local Versioning (Git)（本地版本管理）

Selfware 本地文件 **SHOULD** 使用 Git 做版本管理（本地仓库即可；remote 可选）：
- 每次应用更新（无论来源是官网、Discovery、或协作后端）前，运行时 SHOULD 创建一个可回滚点（优先：Git commit/tag；否则：备份文件）。
- 任何“自动拉取/合并 remote”的行为 MUST 走 6.3 的用户确认流程。

---

## 8. Collaboration (Git / Custom)（协作）

除本地版本管理外，Selfware MAY 配置协作后端用于多人协作与同步。协作后端不改变协议文件（`selfware.md`）的定义：它是协议权威文本；协作与同步的写入落点是 `content/` 下的文档数据（本 demo 即 `content/selfware_demo.md`）。

### 8.1 Git Collaboration（Git 协作）

本地项目 MAY 由 Git 承载协作（remote 可选，例如 GitHub）：
- `Collaboration: git`
- `Remote: <git remote url>`
- `Ref: <branch|tag|commit>`（可选，默认 `main`/`master` 由实现决定）

若启用 Git 协作，运行时 MUST：
1. 在 **On Start** 或 **On User Request** 时检查 remote 是否有更新（实现 MAY 只做其中一种，但 MUST 支持用户主动触发）。
2. 一旦检测到更新，必须走 **6.3 No Silent Apply** 的流程（告知更新逻辑 + 内容摘要 + 用户确认）后才能拉取/合并。
3. 合并前 MUST 创建可回滚点（优先 Git commit/tag；否则备份文件）。
4. 冲突出现时 MUST 暂停自动应用，转为让用户确认解决策略（手工/辅助合并/放弃）。 [参见](#6.3 No Silent Apply（禁止静默更新）)

### 8.2 Custom Collaboration（自定义协作服务）

Selfware MAY 使用自定义协作服务：
- `Collaboration: custom`
- `Endpoint: <service url>`

无论协作服务形态如何：
- 写入边界必须保持：只写 `content/`（或 `content/` 下被允许写入的具体文件集合）
- 任何会改变本地 `selfware.md` 的同步/合并，都 MUST 先经过用户确认与告知（同 6.3）

---

## 9. Packaging（`.self` 容器，协议镜像）

> NOTE：以下为根目录 `selfware.md` 的协议镜像，用于 demo 展示；以 `selfware.md` 为准。

### 9.1 Container Format（格式层）

一个 `.self` 文件 MUST 是一个 **ZIP 容器**（为兼容性优先；允许被通用 unzip 工具解包）。

`.self` 容器内 MUST 包含：
- `self/manifest.md`

`self/manifest.md` MUST 至少包含：
- `Selfware-Container: zip`
- `Selfware-Container-Version: 1`
- `Protocol-Source: https://floatboat.ai/selfware.md`（示例；可替换）
- `Local-Protocol-Path: selfware.md`
- `Canonical-Data-Scope: content/`

---

### 9.2 Pack Policy（策略层）

实现 MUST：
1. 声明 include / exclude / required
2. 打包前向用户展示“最终包含列表 + 总大小 + 输出路径”，并让用户确认（Accept/Reject）
3. 默认只在容器内生成 `self/manifest.md`，不写回本地协议文件 `selfware.md`（除非用户明确要求）

默认排除（实现 SHOULD）：
- `.DS_Store`
- `__pycache__/`, `*.pyc`
- `node_modules/`, `.venv/`
- `dist/`, `build/`
- `output/`, `*.log`, `*.tmp`
- `.git/`（除非用户明确要求包含）

---

### 9.3 Pack Plan Placement（落点）

打包协议由 `selfware.md` 定义；pack plan SHOULD 放在实例自描述文件中。

本 demo 的 pack plan 放在 `manifest.md`。

---

### 9.4 Sharing（分享/分发）

若要分享一个 Selfware 项目，SHOULD 将整个项目目录打包为一个 ZIP，并将文件名后缀命名为 `.self`（例如 `my_project.self`）。

好处：你分享出去的是一个“活的文档/活的软件”。如果接收方是被信任的协作者，并且在你的许可边界内拥有协作后端访问权限（例如对你的 GitHub 仓库有访问权限），那么当他打开 Selfware 时，可以按本协议的更新规则自动检查更新，并在用户确认后拉取/合并，从而持续与最新版本对齐。

---

## 10. Memory (Optional)（记忆模块，可选，协议镜像）

> NOTE：以下为根目录 `selfware.md` 的协议镜像，用于 demo 展示；以 `selfware.md` 为准。

Memory 是 Selfware 实例在 `content/` 内维护的一组可审计上下文文件。建议落在：
- `content/memory/`

要求：
- 每个 memory 文件必须在文件顶部包含元信息（Metadata），用于自描述（role/title/purpose/scope/update_policy/owner/created_at/updated_at 等）。
- 任何变更 MUST 写入 `content/memory/changes.md` 的 Change Record（含 id/timestamp/actor/intent/paths/summary/rollback_hint）。
- 若用于 Discovery，必须用户明确许可，并默认只发送最小必要片段。

---

## 11. Ecosystem (Optional)（生态模块，可选，协议镜像）

> NOTE：以下为根目录 `selfware.md` 的协议镜像，用于 demo 展示；以 `selfware.md` 为准。

生态目标：将实例内沉淀的 know‑how（practice/skill/selfware/patch）发布到 Floatboat（托管/索引）与/或 GitHub/Git（去中心化），让其他人通过 Discovery 发现与复用；最终由用户本地 Agent/一级用户基于元数据决策是否采用。

要求（摘要）：
- 工件 MUST 自描述元信息（type/id/version/protocol_version_range/applies_to/license/sha256/provenance/distribution；trust 可选）。
- publish MUST 用户确认，并写 Change Record。
- Discovery 返回候选 + 元信息；应用更新 MUST 走 No Silent Apply。
- 生态仓库 SHOULD 使用顶层 `selfware/`、`skills/`、`practices/`；不强制普通 `.self` 实例内部结构。

---

## 12. Self‑Analysis (Optional)（自分析模块，可选，协议镜像）

> NOTE：以下为根目录 `selfware.md` 的协议镜像，用于 demo 展示；以 `selfware.md` 为准。

Self‑Analysis 用于从实例的 changes/decisions 与内容中提炼 know‑how，生成可执行改进建议，并在用户许可下与 Discovery/生态发布形成闭环。

要点（摘要）：
- 输出 MUST 文件化、可审计、可回滚，并写 Change Record。
- 可生成 insights / practices/skills 草稿 / discovery 请求草案 / publish queue（待发布清单）。
- 触发点由 Agent 自由决定，但 MUST 支持用户显式触发；对外发送/应用更新仍遵循用户许可与 No Silent Apply。

---

## Non‑Normative（非规范性）

本仓库的 `views/`、`server.py`、`assets/`、`skills/` 仅用于演示“同一份 Markdown 被多视图投影 + 可保存”的最小闭环。

本 demo 额外提供一个只读的 Self Dashboard：
- `/views/self.html`：展示 Canonical Data、Capability Declaration、Manifest（用于更好的人机与 Agent 协作上下文对齐）
