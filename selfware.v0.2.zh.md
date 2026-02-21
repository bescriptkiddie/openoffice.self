# Selfware 协议 v0.2（草案）

Version: `0.2.0`  
Status: `Proposal`  
License: `MIT`（可选）

除非标注为 `Non-Normative`，本文使用 RFC 术语：
- `MUST` / `MUST NOT`
- `SHOULD` / `SHOULD NOT`
- `MAY`

## 1. 范围（Scope）

Selfware 定义一种本地优先的软件单元，用于人类与 Agent 协同。

Selfware 单元是最小完整应用事实，至少包含：
- 目标与输入输出契约，
- 数据、逻辑与视图，
- 决策与变更历史，
- 可复现执行上下文。

本协议定义边界与保证，不绑定单一运行时实现。

## 2. 单元模型（Unit Model）

Selfware 仅定义一种单元类型：
- `bundle`：一个 `.self` 容器（zip 兼容）承载结构化文件。

实现 MUST 声明 `unit_type: bundle`。

## 3. 权威源与边界（Authorities and Boundaries）

每个单元 MUST 定义两个权威源：
- `protocol_authority`：规则来源（本 demo 为 `selfware.md`）。
- `data_authority`：规范可写范围（本 demo 为 `content/`）。

规则：
- 未经用户明确确认，运行时 MUST NOT 写入协议权威源。
- 运行时 MUST 仅在数据权威范围内写入用户内容。
- 视图产物 MUST NOT 成为唯一真理源。

## 4. 契约优先（Contract-First）

每个单元 MUST 提供机器可读契约，至少包含：
- `goal`：目标结果。
- `input_schema`：输入结构。
- `output_schema`：输出结构。
- `acceptance`：成功判定检查。

执行与更新 MUST 通过该契约验证。

## 5. 能力与权限模型（Capability and Permission Model）

运行时 MUST 提供能力声明（机器可读，且 SHOULD 提供人类可读视图）：
- 可写入范围，
- 外发网络范围，
- 可执行工具与动作，
- 需要确认的动作集合，
- 预算限制（`time`、`cost`、`tokens`）。

权限策略：
- 默认拒绝。
- 任何新增写入范围或外发范围 MUST 需要显式用户同意。
- 能力 MAY 由策略预授权，但策略必须可检查。

## 6. 本地优先网络模型（Local-First Networking）

默认 SHOULD 为离线优先：
- 本地读写 MUST 在无网络时可工作。
- 远端同步、发现、发布属于可选启用能力。

启用外部通信时：
- 外发上下文 MUST 最小化且可脱敏。
- 运行时 MUST 告知用户发送的数据类别。

## 7. 更新与应用规则（Update and Apply Rules）

更新来源可以是：
- 协议源，
- 协作后端，
- discovery 结果。

禁止静默应用：
1. 运行时 MUST 展示来源与应用逻辑。
2. 运行时 MUST 展示更新摘要（可用时 SHOULD 展示 diff）。
3. 运行时 MUST 要求显式 `Accept/Reject/Defer`。
4. `Reject` 后运行时 MUST 保持当前版本可运行。

应用前，运行时 MUST 创建回滚点（git ref 或备份快照）。

## 8. 打包（`.self`）

`.self` MUST 为 zip 兼容容器，并包含：
- `self/manifest.yaml`
- `self/contract.yaml`

`self/manifest.yaml` MUST 至少包含：
- `name`, `version`, `unit_type`
- `protocol_authority`
- `data_authority`
- `runtime_requirements`
- `permissions`

打包操作 MUST：
- 展示 include/exclude 结果与输出路径，
- 写出前需要用户确认，
- 不得把修改协议权威源当作副作用。

## 9. 审计模型（Audit Model）

每个单元 MUST 为关键动作维护追加写入的审计记录。

必需记录类别：
- `decision`（意图、理由、风险），
- `change`（修改文件、摘要、回滚提示），
- `run`（输入/输出哈希、结果、耗时）。

高频改动时，实现 MAY 批量记录，但 MUST 保留顺序与责任归属。

## 10. 重放保证（Replay Guarantees）

定义两级重放能力：
- `exact_replay`：相同运行时、依赖、输入，输出字节一致。
- `semantic_replay`：输出表示可不同，但 MUST 通过契约验收检查。

运行时 MUST 为每次执行声明其重放级别。

## 11. 一致性等级（Conformance Levels）

`L0 Runnable`（最低）：
- 单元结构有效，
- 逻辑可执行，
- 契约可用。

`L1 Auditable`：
- 满足 L0，
- 有决策/变更记录，
- 应用更新前有回滚点。

`L2 Shareable`：
- 满足 L1，
- 支持 `.self` 打包，
- 共享工件有内容哈希，
- 消费与应用有显式确认流程。

实现 MUST 声明自身等级（`L0`/`L1`/`L2`）。

## 12. 可选扩展（Optional Extensions）

以下为扩展，不是核心强制要求：
- `Memory`：面向长周期协作的结构化上下文文件。
- `Ecosystem`：可发布工件（`practice`、`skill`、`selfware`、`patch`）。
- `Self-Analysis`：从本地历史提炼可复用 know-how。

扩展 MUST NOT 削弱第 3-9 节核心规则。

## 13. 非目标（Non-Goals）

本协议不：
- 替代 Git、OCI 或现有包管理/仓库生态，
- 强制唯一 IDE、运行时或云供应商，
- 强制容器边界之外的唯一内部架构。

## 附录 A（Non-Normative）：最小 Manifest 示例

```yaml
name: selfware-demo
version: 0.2.0
unit_type: bundle
protocol_authority: selfware.md
data_authority: content/
runtime_requirements:
  - python>=3.11
permissions:
  fs_write:
    - content/**
  net_outbound: []
conformance_level: L1
```

## 附录 B（Non-Normative）：最小 Decision Record 示例

```json
{"id":"dec-001","ts":"2026-02-25T12:00:00Z","actor":"human","intent":"tighten update safety","decision":"require explicit Accept/Reject/Defer","rationale":"prevent silent drift","risk":"extra friction"}
```
