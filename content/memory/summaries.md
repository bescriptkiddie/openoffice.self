---
selfware:
  role: memory_summaries
  title: "Phase Summaries"
  purpose: "对变更记录进行阶段性压缩摘要（类似 Block Attention Residuals），Agent 读取时先看摘要，按需展开细节。"
  scope: "每个阶段覆盖一段时间内的变更记录，提炼关键决策、架构变化和保留上下文。"
  update_policy: append_only
  owner: user
  created_at: "2026-03-18T00:00:00Z"
  updated_at: "2026-03-18T02:57:20Z"
---

# Phase Summaries

> Agent 接手时先读本文件（跨块注意力），再按需展开 `changes.md` 中的细节（块内数据）。
> 每次压缩由 LLM 根据文档当前状态判断哪些历史变更仍然相关，过时的中间状态获得低权重被压缩，关键决策获得高权重被保留。

## Template

```yaml
phase_id: "phase-YYYYMMDD-YYYYMMDD"
period: "YYYY-MM-DD ~ YYYY-MM-DD"
changes_compressed: <number of change records compressed>
summary: "这个阶段发生了什么（人类可读）"
key_decisions:
  - "关键决策 1"
  - "关键决策 2"
retained_context:
  - "仍然有效的约束或规则"
deprecated:
  - "已过时或被替代的内容"
detail_ref: "changes.md 中对应的 id 范围"
```

---

## phase-20260221-20260314

```yaml
phase_id: "phase-20260221-20260314"
period: "2026-02-21 ~ 2026-03-14"
changes_compressed: 31
summary: "本阶段标志着Selfware从概念验证迈向成熟协议。通过引入Memory、Ecosystem、Self-Analysis三大模块，建立能力声明与agent交互规范，并细化时间戳与完整性要求，形成了以文件为中心的统一应用模型。同时构建了多视图投影系统与本地Git工作流，确立了版本控制与变更追踪的工程实践。后期工作聚焦于demo内容的观点深化，围绕'记忆工程'与'龙虾现象'展开论述，最终导出为自包含的知识容器。"
key_decisions:
  - "将Memory变更日志记录提升为MUST要求，确立记忆工程的基础地位"
  - "引入Ecosystem模块并强制artifact元数据包含sha256，保证生态完整性"
  - "强化协议开篇thesis为'A file is an app. Everything is a file.'，明确核心哲学"
  - "建立Capability Declaration机制，要求运行时声明写范围、确认动作、端点和模块状态"
  - "规定当能力已支持但未启用/配置缺失/有策略分支时，agent必须主动询问用户"
  - "重排协议章节，将Sharing移至Packaging旁，明确content/为协作写目标"
  - "将memory文件时间戳精度细化至秒级（ISO-8601 Z），与变更记录对齐"
retained_context:
  - "协议核心thesis：'A file is an app. Everything is a file.'，定义Selfware为Agent时代的统一文件协议"
  - "Memory模块MUST：所有变更必须记录，形成可追溯的记忆链"
  - "Ecosystem artifact必须包含sha256字段，distribution字段建议使用前缀但保持自由文本"
  - "运行时必须实现GET /api/capabilities并打印启动摘要，声明能力范围"
  - "agent交互规则：能力未启用/配置缺失/策略分支时，必须在任何写操作或出站请求前主动询问用户"
  - "本地Git工作流：.gitignore基线排除output/、caches和常见构建产物"
  - "视图系统原理：View = f(Data, Intent, Rules)，支持任意数量投影方式"
  - "时间戳标准：ISO-8601格式，Z时区，秒级精度"
  - "协作模型：content/目录是团队协作的主要写目标"
deprecated:
  - "旧版本协议文件：selfware.v0.2.md、selfware.v0.2.zh.md、selfware.v0.3.md、selfware.v0.3.zh.md（已清理）"
detail_ref: "chg-20260221-182724-memory ~ chg-20260314-140104-export_self"
```
