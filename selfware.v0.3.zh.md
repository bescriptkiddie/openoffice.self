# Selfware 协议 v0.3（Agent-Native 草案）

Version: `0.3.0`  
Status: `Proposal`  
License: `MIT`（可选）

除非标注为 `Non-Normative`，本文使用 RFC 术语：
- `MUST` / `MUST NOT`
- `SHOULD` / `SHOULD NOT`
- `MAY`

## 1. 范围（Scope）

Selfware 定义一种用于人类与 Agent 执行交接的可移植单元。

在 v0.3 中，Agent 连续性是一等目标：
- Agent 可读状态是规范数据，
- 变更采用事件溯源，
- handoff 是协议对象（而非仅文本），
- 应用与发布前必须验证。

## 2. 仅支持 Bundle 形态（Bundle-Only Unit）

Selfware 仅定义一种单元类型：
- `bundle`：一个 `.self` 容器（zip 兼容）承载结构化文件。

实现 MUST 声明 `unit_type: bundle`。

## 3. 规范层与权威边界（Canonical Layers）

每个 bundle MUST 声明三个权威层：
- `protocol_authority`：协议/规则来源。
- `state_authority`：规范机器状态范围（默认 `state/`）。
- `content_authority`：规范用户内容范围（默认 `content/`）。

规则：
- Agent 写入默认 MUST 落在 `state_authority`。
- 写入 `content_authority` MUST 关联一个状态事件 id。
- 视图产物 MUST 是投影，不得成为权威源。
- 未经用户显式批准，运行时 MUST NOT 修改协议权威源。

## 4. 必需目录结构（Required Bundle Layout）

最小必需路径：
- `self/manifest.yaml`
- `self/contract.yaml`
- `state/events/events.ndjson`
- `state/tasks/`
- `state/handoffs/`
- `state/agents/`
- `content/`

可选路径：
- `views/`
- `runtime/`
- `skills/`
- `artifacts/`

## 5. Agent 身份卡（Agent Card）

每个活跃 Agent MUST 有身份卡：
- 路径：`state/agents/<agent_id>.yaml`
- 必填字段：
  - `agent_id`
  - `label`
  - `runtime`
  - `model`
  - `capabilities_ref`
  - `policy_ref`

若 Agent 无有效身份卡即执行，运行时 MUST 拒绝执行。

## 6. 会话与运行记录（Session and Run Records）

每次执行运行 MUST 产生 run 记录：
- 路径：`state/runs/<run_id>.yaml`
- 必填字段：
  - `run_id`
  - `agent_id`
  - `intent`
  - `input_refs`
  - `output_refs`
  - `started_at`
  - `ended_at`
  - `result`（`success|failed|blocked`）

run 关闭后 MUST 视为不可变；仅允许追加错误注释。

## 7. 任务图与状态机（Task Graph and Lifecycle）

任务是协议对象：
- 路径：`state/tasks/<task_id>.yaml`

最小状态集合：
- `proposed`
- `claimed`
- `running`
- `blocked`
- `done`
- `verified`
- `applied`
- `abandoned`

规则：
- 状态流转 MUST 遵守允许的状态图。
- `claimed` MUST 记录 owner agent 与租约过期时间。
- 租约过期后 MUST 回到 `proposed` 或 `blocked`。
- `applied` MUST 关联验证证据。

## 8. 事件溯源变更模型（Event-Sourced Mutation）

所有关键变更 MUST 以追加事件表示：
- 路径：`state/events/events.ndjson`

最小事件字段：
- `event_id`
- `ts`
- `actor`（`human|agent|service`）
- `type`
- `intent`
- `inputs`
- `outputs`
- `paths`
- `prev_event_ids`（可空）
- `hash`

变更规则：
- 没有事件，不得原地重写状态。
- 运行时 MUST 拒绝无法关联事件的写入。
- 禁止删除或重排事件。

## 9. Handoff 协议对象（Handoff Protocol）

handoff 必须显式文件化：
- 路径：`state/handoffs/<handoff_id>.yaml`

必填字段：
- `handoff_id`
- `from_agent`
- `to_agent`（或 `any`）
- `objective`
- `task_refs`
- `required_event_refs`
- `required_artifact_refs`
- `open_questions`
- `acceptance_criteria`
- `status`（`offered|accepted|rejected|expired`）

接收方在 `accepted` 前 MUST 校验引用的事件与工件。

## 10. 能力与策略门控（Capability and Policy Gates）

运行时 MUST 暴露机器可读能力声明与策略声明。

动作类别：
- `local_write`
- `external_send`
- `tool_exec`
- `update_apply`
- `publish`

规则：
- 未声明动作默认拒绝。
- `external_send`、`update_apply`、`publish` MUST 显式批准。
- 禁止静默远程变更。

## 11. 验证与验收（Verification and Acceptance）

在 `done -> verified -> applied` 前，运行时 MUST 执行：
- 契约验收检查（`self/contract.yaml`），
- 任务对象声明的专项检查。

验证输出 MUST 文件化：
- 路径：`state/verification/<verification_id>.yaml`
- 包含检查项、结果、证据引用。

无验证证据，任务 MUST NOT 进入 `applied`。

## 12. 重放与溯源（Replay and Provenance）

重放级别：
- `exact_replay`：运行时/依赖/输入一致，输出字节一致。
- `semantic_replay`：输出表示可不同，但通过验收检查。
- `trace_replay`：事件+运行+工件图可逐步重放。

运行时 MUST 为每次 run 声明重放级别。

## 13. 协作与合并语义（Collaboration and Merge Semantics）

可使用 Git 或自定义后端。

合并规则：
- 事件日志只追加，不改写历史。
- 分叉事件流按事件 id 集合并集。
- 任务状态冲突 MUST 通过显式状态流转事件解决。
- 任何影响 `applied` 状态的自动合并 MUST 先获批准。

## 14. 一致性等级（Agent-Native）

`AN0 Portable`：
- 有效 bundle 结构，
- manifest + contract，
- 可本地执行。

`AN1 Stateful`：
- 满足 AN0，
- 有事件溯源状态，
- 有任务状态机对象，
- 有 handoff 对象。

`AN2 Autonomous`：
- 满足 AN1，
- 有策略门控，
- 有验证对象，
- 每次 run 声明重放级别。

实现 MUST 声明 `conformance_level: AN0|AN1|AN2`。

## 15. 非目标（Non-Goals）

本协议不：
- 替代 Git/OCI/包仓库生态，
- 绑定单一模型供应商或运行时厂商，
- 移除高风险动作中的人工批准环节。

## 附录 A（Non-Normative）：最小 Manifest 示例

```yaml
name: selfware-demo
version: 0.3.0
unit_type: bundle
protocol_authority: selfware.v0.3.md
state_authority: state/
content_authority: content/
runtime_requirements:
  - python>=3.11
conformance_level: AN1
policy:
  require_approval:
    - external_send
    - update_apply
    - publish
```

## 附录 B（Non-Normative）：最小 Event 示例

```json
{"event_id":"evt-001","ts":"2026-02-25T12:00:00Z","actor":"agent","type":"task.transition","intent":"claim task t-1","inputs":{"task_id":"t-1","from":"proposed","to":"claimed"},"outputs":{"owner":"agent-a"},"paths":["state/tasks/t-1.yaml"],"prev_event_ids":[],"hash":"sha256:..."}
```
