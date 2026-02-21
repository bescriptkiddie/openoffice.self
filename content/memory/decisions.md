---
selfware:
  role: memory_decisions
  title: "Decisions"
  purpose: "记录协议/架构关键决策，便于协作与回溯。"
  scope: "只记录会影响边界、默认值、兼容策略、更新/协作规则的决策。"
  update_policy: append_only
  owner: user
  created_at: "2026-02-21T10:27:24Z"
  updated_at: "2026-02-21T13:24:44Z"
---

# Decisions

> 每条决策应包含：时间、决策点、选项、结论、理由、影响范围（paths/模块）。
> 写入要求：新增决策时，必须同时在 `content/memory/changes.md` 写一条 Change Record。

## 2026-02-21T10:27:24Z — Protocol vs Data boundary

- 协议权威源：根目录 `selfware.md`
- 数据/文档写入边界：`content/`（本 demo 为 `content/selfware_demo.md`）

## 2026-02-21T10:27:24Z — `.self` packaging compatibility

- `.self` 采用 ZIP 容器（兼容优先），并在包内用 `self/manifest.md` 做自描述与版本协商。

## 2026-02-21T11:33:01Z — Ecosystem publishing & discovery

- Floatboat 同时支持：内容托管 + 索引；也支持只索引外部工件（例如 git url+ref）。
- 去中心化生态仓库约定：顶层 `selfware/`、`skills/`、`practices/`。
- Discovery 返回候选工件必须带元数据；由用户本地 Agent/一级用户决策是否采用与如何应用。

## 2026-02-21T11:44:08Z — Artifact integrity

- 生态工件元信息中 `sha256` 设为 MUST，用于拉取/更新/协作时的可验证性与可审计性。

## 2026-02-21T12:43:22Z — Self‑Analysis module

- Self‑Analysis 是可选模块；协议只定义边界与输出形状，不绑定实现细节与触发点。
- 触发点可由 Agent 自由决定，但必须支持用户显式触发；对外发送与应用更新仍必须用户许可与 No Silent Apply。
