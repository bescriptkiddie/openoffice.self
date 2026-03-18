---
selfware:
  role: memory_changes
  title: "Change Records"
  purpose: "对本实例的每次变更记录元数据（可审计、可协作、可回滚）。"
  scope: "记录协议/数据/运行时/视图/资源等变更；内容可简短但必须可追溯。"
  update_policy: append_only
  owner: user
  created_at: "2026-02-21T10:27:24Z"
  updated_at: "2026-03-17T04:58:49Z"
---

# Change Records

## Template

```yaml
id: "chg-YYYYMMDD-HHMMSS-xxx"
timestamp: "YYYY-MM-DDThh:mm:ssZ"
actor: "user|agent|service"
intent: "add_memory|update_protocol|fix_overflow|pack|..."
paths:
  - "path/to/file"
summary: "What changed and why (human readable)."
rollback_hint: "git revert <ref> | restore backups/<file>.<stamp>-nonememory | manual steps"
notes: "optional"
```

---

## id: chg-20260221-182724-memory

```yaml
id: "chg-20260221-182724-memory"
timestamp: "2026-02-21T10:27:24Z"
actor: "agent"
intent: "add_memory"
paths:
  - "selfware.md"
  - "content/selfware_demo.md"
  - "manifest.md"
  - "content/memory/chat.md"
  - "content/memory/decisions.md"
  - "content/memory/changes.md"
  - "backups/selfware.md.20260221-182724-nonememory"
  - "backups/manifest.md.20260221-182724-nonememory"
  - "backups/selfware_demo.md.20260221-182724-nonememory"
summary: "Add optional multi-file Memory module guidance to protocol; add demo memory files with self-description metadata; create -nonememory backups before change."
rollback_hint: "Restore backups/*-nonememory files back to their original paths."
notes: "Demo memory files use YAML front matter; change records are append-only."
```

---

## id: chg-20260221-193301-ecosystem

```yaml
id: "chg-20260221-193301-ecosystem"
timestamp: "2026-02-21T11:33:01Z"
actor: "agent"
intent: "update_protocol_ecosystem"
paths:
  - "selfware.md"
  - "content/selfware_demo.md"
  - "content/memory/decisions.md"
  - "content/memory/changes.md"
  - "manifest.md"
summary: "Promote Memory change logging to MUST; add optional Ecosystem module to protocol defining artifacts, metadata, publish/consume boundaries, and ecosystem repo directory convention (applies to ecosystem repos only)."
rollback_hint: "Restore backups/*-nonememory for pre-memory baseline; otherwise use git revert (if repo initialized) or manually revert the sections added in the listed paths."
notes: "Artifact trust metadata remains optional to avoid complexity; consumption decisions remain local (no silent apply)."
```

---

## id: chg-20260221-194408-artifact-sha256

```yaml
id: "chg-20260221-194408-artifact-sha256"
timestamp: "2026-02-21T11:44:08Z"
actor: "agent"
intent: "tighten_ecosystem_metadata"
paths:
  - "selfware.md"
  - "content/selfware_demo.md"
  - "content/memory/decisions.md"
  - "content/memory/changes.md"
summary: "Make ecosystem artifact integrity explicit by requiring `sha256` in artifact metadata; keep `distribution` mostly free text with basic parseability constraints and recommended prefixes."
rollback_hint: "Manually revert the added sha256 requirements in selfware.md 11.2 and the mirrored line in content/selfware_demo.md; remove the corresponding decision/change records if needed."
notes: "Trust metadata remains optional; verification uses sha256 as the minimal integrity anchor."
```

---

## id: chg-20260221-201422-protocol-thesis

```yaml
id: "chg-20260221-201422-protocol-thesis"
timestamp: "2026-02-21T12:14:22Z"
actor: "agent"
intent: "strengthen_protocol_opening"
paths:
  - "selfware.md"
  - "content/selfware_demo.md"
  - "content/memory/changes.md"
summary: "Replace the opening sentence with a stronger thesis block: “A file is an app. Everything is a file.” and a concise definition of Selfware as the Agent-era unified file protocol."
rollback_hint: "Revert the opening blockquote in selfware.md and content/selfware_demo.md to the previous single-sentence opening."
notes: "Kept as blockquote for visual emphasis; protocol meaning unchanged."
```

---

## id: chg-20260221-204322-self-analysis

```yaml
id: "chg-20260221-204322-self-analysis"
timestamp: "2026-02-21T12:43:22Z"
actor: "agent"
intent: "add_self_analysis_module"
paths:
  - "selfware.md"
  - "content/selfware_demo.md"
  - "content/memory/decisions.md"
  - "content/memory/changes.md"
summary: "Add optional Self‑Analysis module to protocol: defines inputs, file-based outputs, consent loop with Discovery/ecosystem, and leaves triggers to agent freedom while requiring explicit user-trigger support."
rollback_hint: "Manually remove the Self‑Analysis section from selfware.md and its mirror in content/selfware_demo.md; remove the linked decision/change records if needed."
notes: "Self‑Analysis outputs must remain within instance write scope and always produce Change Records."
```

---

## id: chg-20260221-204703-local-git

```yaml
id: "chg-20260221-204703-local-git"
timestamp: "2026-02-21T12:47:03Z"
actor: "agent"
intent: "enable_local_versioning"
paths:
  - ".gitignore"
  - "content/memory/changes.md"
summary: "Initialize local Git versioning workflow by adding a .gitignore baseline (output/ caches, common build artifacts)."
rollback_hint: "If needed, remove .gitignore and delete the .git directory after initialization; otherwise use git history to revert."
notes: "This record is written before running git init/commit; the git operations are the next step requested by the user."
```

---

## id: chg-20260221-205409-capabilities

```yaml
id: "chg-20260221-205409-capabilities"
timestamp: "2026-02-21T12:54:09Z"
actor: "agent"
intent: "declare_runtime_capabilities"
paths:
  - "selfware.md"
  - "manifest.md"
  - "content/selfware_demo.md"
  - "server.py"
  - "content/memory/changes.md"
summary: "Add Capability Declaration to protocol and demo: runtime must declare write scope, confirmation-required actions, endpoints, and module status; implement GET /api/capabilities and print a startup capability summary."
rollback_hint: "Revert the additions in selfware.md Runtime API, manifest.md Capability Declaration section, and remove /api/capabilities from server.py; keep other protocol content unchanged."
notes: "Capabilities are declarative only; they do not auto-execute privileged actions."
```

---

## id: chg-20260221-210808-self-page

```yaml
id: "chg-20260221-210808-self-page"
timestamp: "2026-02-21T13:08:08Z"
actor: "agent"
intent: "add_self_dashboard"
paths:
  - "views/self.html"
  - "server.py"
  - "js/view-switcher.js"
  - "manifest.md"
  - "selfware.md"
  - "content/memory/changes.md"
summary: "Add a read-only Self dashboard view (canonical + capabilities + manifest), change root redirect to /views/self.html, add Self to view switcher, and document git rollback-point guidance for change records."
rollback_hint: "git revert HEAD"
notes: "Self view is read-only; privileged actions remain agent-mediated with user confirmation."
```

---

## id: chg-20260221-211004-agent-prompting

```yaml
id: "chg-20260221-211004-agent-prompting"
timestamp: "2026-02-21T13:10:04Z"
actor: "agent"
intent: "tighten_agent_interaction"
paths:
  - "selfware.md"
  - "manifest.md"
  - "server.py"
  - "content/memory/changes.md"
summary: "Add an explicit MUST rule: when a capability is supported but not enabled / missing config / has strategy branches, the agent must proactively ask the user before any write or outbound request; surface the policy in /api/capabilities."
rollback_hint: "git revert HEAD"
notes: "This strengthens interactive clarity for users and provides better context for other agents."
```

---

## id: chg-20260221-211432-protocol-order

```yaml
id: "chg-20260221-211432-protocol-order"
timestamp: "2026-02-21T13:14:32Z"
actor: "agent"
intent: "reorder_protocol_sections"
paths:
  - "selfware.md"
  - "content/selfware_demo.md"
  - "content/memory/changes.md"
summary: "Improve protocol readability: move Sharing next to Packaging (as 9.4), move Non‑Normative to the end (appendix), and clarify Git collaboration wording to emphasize content/ as the collaboration write target."
rollback_hint: "git revert HEAD"
notes: "This is an editorial/structure change; normative rules remain the same."
```

---

## id: chg-20260221-212444-memory-timestamps

```yaml
id: "chg-20260221-212444-memory-timestamps"
timestamp: "2026-02-21T13:24:44Z"
actor: "agent"
intent: "tighten_memory_metadata"
paths:
  - "content/memory/chat.md"
  - "content/memory/decisions.md"
  - "content/memory/runs.md"
  - "content/memory/changes.md"
summary: "Tighten memory file metadata and entries to second-level timestamps (ISO-8601 Z) to match changes.md granularity; update created_at/updated_at and entry headings."
rollback_hint: "git revert HEAD"
notes: "Decision timestamps follow the related change record times for consistency (e.g., ecosystem/sha256/self-analysis)."
```

---

## id: chg-20260221-214921-memory-created-at

```yaml
id: "chg-20260221-214921-memory-created-at"
timestamp: "2026-02-21T13:49:21Z"
actor: "agent"
intent: "fix_memory_metadata"
paths:
  - "content/memory/changes.md"
summary: "Align content/memory/changes.md front-matter created_at with the first recorded change timestamp (second-level granularity)."
rollback_hint: "git revert HEAD"
notes: "Keeps memory metadata consistent across files."
```

---

## id: chg-20260221-220137-demo-doc

```yaml
id: "chg-20260221-220137-demo-doc"
timestamp: "2026-02-21T14:01:37Z"
actor: "agent"
intent: "update_demo_document"
paths:
  - "content/selfware_demo.md"
  - "content/memory/changes.md"
summary: "Update demo document to reflect current runtime entry (/ -> /views/self.html) and align section order (move Non‑Normative to the end, keep Sharing within Packaging as 9.4)."
rollback_hint: "git revert HEAD"
notes: "Keeps demo doc consistent with root protocol structure and the current runtime behavior."
```

---

## id: chg-20260221-223102-doc-view

```yaml
id: "chg-20260221-223102-doc-view"
timestamp: "2026-02-21T14:31:02Z"
actor: "agent"
intent: "add_doc_view"
paths:
  - "views/doc.html"
  - "views/self.html"
  - "js/view-switcher.js"
  - "manifest.md"
  - "views/canvas.html"
  - "views/outline.html"
  - "views/mindmap.html"
  - "views/presentation.html"
  - "views/card.html"
  - "content/memory/changes.md"
summary: "Add Doc view for linear reading (markdown render), link it from Self Dashboard, add it to view switcher menu, document entry point in manifest, and bump view-switcher cache version across views to expose the new view everywhere."
rollback_hint: "git revert HEAD"
notes: "Doc view reads Canonical Data via /api/content; editing remains via global editor (agent-mediated actions still require confirmation)."
```

---

## id: chg-20260221-224444-self-doc-polish

```yaml
id: "chg-20260221-224444-self-doc-polish"
timestamp: "2026-02-21T14:44:44Z"
actor: "agent"
intent: "polish_views"
paths:
  - "views/self.html"
  - "views/doc.html"
  - "content/memory/changes.md"
summary: "Polish Self and Doc views styling/layout for clearer navigation and readability."
rollback_hint: "git revert HEAD"
notes: "No behavior change; UI-only adjustments."
```

---

## id: chg-20260225-155639-doc-history-sync

```yaml
id: "chg-20260225-155639-doc-history-sync"
timestamp: "2026-02-25T15:56:39Z"
actor: "agent"
intent: "docs_cleanup_and_history_sync"
paths:
  - "README.md"
  - "selfware.v0.2.md"
  - "selfware.v0.2.zh.md"
  - "selfware.v0.3.md"
  - "selfware.v0.3.zh.md"
  - "content/memory/changes.md"
summary: "Add repository README, remove fragmented v0.x snapshot protocol files, and sync git history to the append-only change records."
rollback_hint: "git revert HEAD"
notes: "Current repository keeps a single current protocol line (`selfware.md` / `selfware.en.md`) without parallel v0.x snapshot files."
```

---

## id: chg-20260225-161055-license-mit

```yaml
id: "chg-20260225-161055-license-mit"
timestamp: "2026-02-25T16:10:55Z"
actor: "agent"
intent: "set_protocol_license_mit"
paths:
  - "LICENSE"
  - "README.md"
  - "selfware.md"
  - "selfware.en.md"
  - "content/selfware_demo.md"
  - "content/selfware_demo.en.md"
  - "content/memory/changes.md"
summary: "Set protocol and repository license to MIT explicitly: add LICENSE file and remove optional wording in protocol/demo documents."
rollback_hint: "git revert HEAD"
notes: "This change clarifies MIT as active license choice, not an optional placeholder."
```

---

## id: chg-20260310-163743-chat_edit

```yaml
id: "chg-20260310-163743-chat_edit"
timestamp: "2026-03-10T16:37:43Z"
actor: "user+agent"
intent: "chat_edit"
paths:
  - "content/selfware_demo.md"
  - "content/memory/changes.md"
summary: "已在标题后添加一个换行（空行），使标题与后续内容之间多一个分隔，视觉上更清晰。"
rollback_hint: "git diff / git checkout -- <paths>"
notes: ""
```

---

## id: chg-20260310-164130-chat_edit

```yaml
id: "chg-20260310-164130-chat_edit"
timestamp: "2026-03-10T16:41:30Z"
actor: "user+agent"
intent: "把标题中的日期改成 2026-03-11"
paths: ["content/selfware_demo.md"]
summary: "更新了文档标题中的日期，从 2026-03-10 改为 2026-03-11"
rollback_hint: "git checkout -- content/selfware_demo.md"
```

---

## id: chg-20260310-165216-chat_edit

```yaml
id: "chg-20260310-165216-chat_edit"
timestamp: "2026-03-10T16:52:16Z"
actor: "user+agent"
intent: "Translate selected passage to Chinese"
paths: ["content/selfware_demo.md"]
summary: "Translated the English description of Selfware's unified file protocol to Chinese within the blockquote."
rollback_hint: "git checkout -- content/selfware_demo.md"
```

---

## id: chg-20260312-125424-import

```yaml
id: "chg-20260312-125424-import"
timestamp: "2026-03-12T12:54:24Z"
actor: "user+agent"
intent: "import_markdown"
paths:
  - "content/articles/人人都在装龙虾，但装完之后能干嘛？.md"
  - "content/memory/changes.md"
summary: "导入文章《人人都在装龙虾，但装完之后能干嘛？》，讨论AI Agent（龙虾）现象、商业价值、生态机会等关键主题。"
rollback_hint: "git checkout -- content/articles/人人都在装龙虾，但装完之后能干嘛？.md"
```

---

## id: chg-20260312-125710-import

```yaml
id: "chg-20260312-125710-import"
timestamp: "2026-03-12T12:57:10Z"
actor: "user+agent"
intent: "import_markdown"
paths:
  - "content/articles/人人都在装龙虾，但装完之后能干嘛？.md"
  - "content/memory/changes.md"
summary: "导入关于'龙虾'(OpenClaw)现象的文章，分析其流行原因、情绪与商业价值、生态空白及未来机会。源文件：人人都在装龙虾，但装完之后能干嘛？.md"
rollback_hint: "git checkout -- content/articles/人人都在装龙虾，但装完之后能干嘛？.md"
```

---

## id: chg-20260312-140203-chat_edit

```yaml
id: "chg-20260312-140203-chat_edit"
timestamp: "2026-03-12T14:02:03Z"
actor: "user+agent"
intent: "将'过程简化与价值聚焦'的思考融入文章，强调AI Agent时代应忽略过程、专注价值创造"
paths: ["content/selfware_demo.md"]
summary: "在'记忆工程'文章中新增第5节，引用'龙虾'比喻和电商网站例子，阐述新时代技术过程可被自动化忽略，应聚焦于'装完工具后能干嘛'的价值创造问题"
rollback_hint: "git checkout -- content/selfware_demo.md"
```

---

## id: chg-20260312-140525-chat_edit

```yaml
id: "chg-20260312-140525-chat_edit"
timestamp: "2026-03-12T14:05:25Z"
actor: "user+agent"
intent: "用户评论'不知道干嘛，说明生态还是空的'这个观察很仔细，但未提供明确编辑指令"
paths: []
summary: "用户对某个观察表示赞赏，但未给出具体修改指示，因此 canonical content 未作变更"
rollback_hint: "无需回滚，内容未修改"
```

---

## id: chg-20260312-140710-chat_edit

```yaml
id: "chg-20260312-140710-chat_edit"
timestamp: "2026-03-12T14:07:10Z"
actor: "user+agent"
intent: "将关于吃到红利的表述修改为'真正能吃到红利的，永远是最先感知到商业价值的人'"
paths: ["content/selfware_demo.md"]
summary: "在'过程简化与价值聚焦'章节，将'未来真正吃到红利的人，不一定是最早装工具的人，而是最早回答那个问题的人'改为'真正能吃到红利的，永远是最先感知到商业价值的人'，使观点更简洁有力。"
rollback_hint: "git checkout -- content/selfware_demo.md"
```

---

## id: chg-20260312-171036-chat_edit

```yaml
id: "chg-20260312-171036-chat_edit"
timestamp: "2026-03-12T17:10:36Z"
actor: "user+agent"
intent: "将'未来真正吃到红利的人'段落替换为'未来能吃到红利的，永远是能够快速找到自己的定位的人'"
paths:
  - "content/selfware_demo.md"
summary: "替换了关于'吃到红利'的结论句，强调快速找到定位而非最早装龙虾或回答问题"
rollback_hint: "git checkout -- content/selfware_demo.md"
```

---

## id: chg-20260313-103546-chat_edit

```yaml
id: "chg-20260313-103546-chat_edit"
timestamp: "2026-03-13T10:35:46Z"
actor: "user+agent"
intent: "将'6种'改为'n种'以表达视图的可扩展性"
paths: ["content/selfware_demo.md"]
summary: "在视图描述中将'6种投影'改为'n种投影'，强调Selfware支持任意数量的视图投影方式，不限于当前实现的6种"
rollback_hint: "git checkout -- content/selfware_demo.md"
```

---

## id: chg-20260314-134356-chat_edit

```yaml
id: "chg-20260314-134356-chat_edit"
timestamp: "2026-03-14T13:43:56Z"
actor: "user+agent"
intent: "删除选中的YAML front matter元数据"
paths: ["content/selfware_demo.md"]
summary: "删除了文档开头的YAML front matter元数据块，保留了正文内容。"
rollback_hint: "git checkout -- content/selfware_demo.md"
```

---

## id: chg-20260314-135737-chat_edit

```yaml
id: "chg-20260314-135737-chat_edit"
timestamp: "2026-03-14T13:57:37Z"
actor: "user+agent"
intent: "用户认为OpenClaw火爆只是AgentOS预热，修改相关表述"
paths: ["content/selfware_demo.md"]
summary: "修改第1.1节核心定位表述，将'抢占Agent OS入口的竞争'改为'只是Agent OS的预热'，以反映用户观点认为这仅是开始而非真正竞争"
rollback_hint: "git checkout -- content/selfware_demo.md"
```

---

## id: chg-20260314-140104-export_self

```yaml
id: "chg-20260314-140104-export_self"
timestamp: "2026-03-14T14:01:04Z"
actor: "user"
intent: "export_as_self_container"
paths:
  - "content/articles/OpenClaw-与-Agent-OS：从入口争夺到信任体系构建.md"
summary: "Exported OpenClaw-与-Agent-OS：从入口争夺到信任体系构建 as .self container with views, runtime, and memory."
rollback_hint: "n/a (read-only operation)"
```

---

## id: chg-20260316-165910-chat_edit

```yaml
id: "chg-20260316-165910-chat_edit"
timestamp: "2026-03-16T16:59:10Z"
actor: "user+agent"
intent: "删除选中的句子"
paths: ["content/selfware_demo.md"]
summary: "从文档中删除句子：'这三个点撞在一起后，我开始觉得：我需要的不是“写作技巧升级”，而是一个更适合 AI 时代的 pika 写作 v6.0。'"
rollback_hint: "git checkout -- content/selfware_demo.md"
```

---

## id: chg-20260317-045840-chat_edit

```yaml
id: "chg-20260317-045840-chat_edit"
timestamp: "2026-03-17T04:58:40Z"
actor: "user+agent"
intent: "删除这个文字"
paths: ["content/selfware_demo.md"]
summary: "从文档标题中删除 'pika写作 v6.0：' 文字"
rollback_hint: "git checkout -- content/selfware_demo.md"
```
