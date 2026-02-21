# Selfware Protocol v0.3 (Agent-Native Draft)

Version: `0.3.0`  
Status: `Proposal`  
License: `MIT` (optional)

Unless marked `Non-Normative`, this document uses RFC terms:
- `MUST` / `MUST NOT`
- `SHOULD` / `SHOULD NOT`
- `MAY`

## 1. Scope

Selfware defines a portable unit for human+agent execution handoff.

In v0.3, agent continuity is first-class:
- agent-readable state is canonical,
- mutation is event-sourced,
- handoff is a protocol object (not only text),
- verification is required before apply and publish.

## 2. Bundle-Only Unit

Selfware defines one unit type:
- `bundle`: one `.self` container (zip-compatible) with structured files.

Implementations MUST declare `unit_type: bundle`.

## 3. Canonical Layers

Each bundle MUST declare three authorities:
- `protocol_authority`: protocol/rules source.
- `state_authority`: canonical machine state scope (default `state/`).
- `content_authority`: canonical user-facing content scope (default `content/`).

Rules:
- Agent writes MUST target `state_authority` by default.
- Writes to `content_authority` MUST reference a state event id.
- View artifacts MUST be projections, not authorities.
- Runtime MUST NOT mutate protocol authority without explicit user approval.

## 4. Required Bundle Layout

Minimum required paths:
- `self/manifest.yaml`
- `self/contract.yaml`
- `state/events/events.ndjson`
- `state/tasks/`
- `state/handoffs/`
- `state/agents/`
- `content/`

Optional paths:
- `views/`
- `runtime/`
- `skills/`
- `artifacts/`

## 5. Agent Identity (Agent Card)

Each active agent MUST have an agent card:
- path: `state/agents/<agent_id>.yaml`
- required fields:
  - `agent_id`
  - `label`
  - `runtime`
  - `model`
  - `capabilities_ref`
  - `policy_ref`

If an agent executes without a valid card, runtime MUST reject execution.

## 6. Session and Run Records

Each execution run MUST have a run record:
- path: `state/runs/<run_id>.yaml`
- required fields:
  - `run_id`
  - `agent_id`
  - `intent`
  - `input_refs`
  - `output_refs`
  - `started_at`
  - `ended_at`
  - `result` (`success|failed|blocked`)

Run records MUST be immutable after close, except appending error annotations.

## 7. Task Graph and Lifecycle

Tasks are protocol objects:
- path: `state/tasks/<task_id>.yaml`

Minimum lifecycle states:
- `proposed`
- `claimed`
- `running`
- `blocked`
- `done`
- `verified`
- `applied`
- `abandoned`

Rules:
- transitions MUST follow allowed state graph.
- `claimed` MUST include owner agent and lease expiry.
- lease expiry MUST return task to `proposed` or `blocked`.
- `applied` MUST reference verification evidence.

## 8. Event-Sourced Mutation

All significant mutations MUST be represented as append-only events:
- path: `state/events/events.ndjson`

Minimum event fields:
- `event_id`
- `ts`
- `actor` (`human|agent|service`)
- `type`
- `intent`
- `inputs`
- `outputs`
- `paths`
- `prev_event_ids` (may be empty)
- `hash`

Mutation rules:
- no in-place state rewrite without an event.
- runtime MUST reject writes that cannot be linked to an event.
- event deletion or reordering is forbidden.

## 9. Handoff Protocol

Handoff is explicit protocol state:
- path: `state/handoffs/<handoff_id>.yaml`

Required fields:
- `handoff_id`
- `from_agent`
- `to_agent` (or `any`)
- `objective`
- `task_refs`
- `required_event_refs`
- `required_artifact_refs`
- `open_questions`
- `acceptance_criteria`
- `status` (`offered|accepted|rejected|expired`)

Receiver MUST validate referenced events/artifacts before `accepted`.

## 10. Capability and Policy Gates

Runtime MUST expose machine-readable capability and policy declarations.

Action classes:
- `local_write`
- `external_send`
- `tool_exec`
- `update_apply`
- `publish`

Rules:
- default deny for undeclared actions.
- `external_send`, `update_apply`, and `publish` MUST require explicit approval.
- no silent remote mutation is allowed.

## 11. Verification and Acceptance

Before `done -> verified -> applied`, runtime MUST evaluate:
- contract acceptance checks (`self/contract.yaml`),
- task-specific checks declared in task object.

Verification output MUST be materialized:
- path: `state/verification/<verification_id>.yaml`
- includes checks run, outcomes, evidence refs.

Without verification evidence, task MUST NOT enter `applied`.

## 12. Replay and Provenance

Replay levels:
- `exact_replay`: same runtime/deps/input, byte-identical outputs.
- `semantic_replay`: outputs may differ in representation but pass acceptance checks.
- `trace_replay`: event+run+artifact graph can be replayed step-by-step.

Runtime MUST declare replay level per run.

## 13. Collaboration and Merge Semantics

Git or custom backend MAY be used.

Merge rules:
- event log is append-only; no history rewrite.
- divergent event streams merge by event id set union.
- task state conflicts MUST be resolved through explicit transition events.
- any auto-merge affecting `applied` state MUST require approval.

## 14. Conformance Levels (Agent-Native)

`AN0 Portable`:
- valid bundle layout,
- manifest + contract,
- local execution possible.

`AN1 Stateful`:
- AN0 + event-sourced state,
- task lifecycle objects,
- handoff objects.

`AN2 Autonomous`:
- AN1 + policy gates,
- verification objects,
- replay declaration per run.

Implementation MUST declare `conformance_level: AN0|AN1|AN2`.

## 15. Non-Goals

This protocol does not:
- replace Git/OCI/package registries,
- enforce a single model provider or runtime vendor,
- remove human approval from high-risk actions.

## Appendix A (Non-Normative): Minimal Manifest Example

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

## Appendix B (Non-Normative): Minimal Event Example

```json
{"event_id":"evt-001","ts":"2026-02-25T12:00:00Z","actor":"agent","type":"task.transition","intent":"claim task t-1","inputs":{"task_id":"t-1","from":"proposed","to":"claimed"},"outputs":{"owner":"agent-a"},"paths":["state/tasks/t-1.yaml"],"prev_event_ids":[],"hash":"sha256:..."}
```
