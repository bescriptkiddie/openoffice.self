# Selfware Protocol v0.2 (Draft)

Version: `0.2.0`  
Status: `Proposal`  
License: `MIT` (optional)

Unless marked `Non-Normative`, this document uses RFC terms:
- `MUST` / `MUST NOT`
- `SHOULD` / `SHOULD NOT`
- `MAY`

## 1. Scope

Selfware defines a local-first application unit for human+agent collaboration.

A Selfware unit is the minimum complete application fact:
- goal and I/O contract,
- data, logic, and view,
- decision and change history,
- reproducible execution context.

This protocol defines boundaries and guarantees, not a single runtime implementation.

## 2. Unit Model

Selfware defines one unit type:
- `bundle`: one `.self` container (zip-compatible) with structured files.

Implementations MUST declare `unit_type: bundle`.

## 3. Authorities and Boundaries

Each unit MUST define two authorities:
- `protocol_authority`: rule source (for this demo, `selfware.md`).
- `data_authority`: canonical writable scope (for this demo, `content/`).

Rules:
- Runtime MUST NOT write protocol authority without explicit user confirmation.
- Runtime MUST write user content only inside data authority.
- View artifacts MUST NOT become the single source of truth.

## 4. Contract-First

Each unit MUST expose a machine-readable contract with:
- `goal`: intended outcome.
- `input_schema`: accepted inputs.
- `output_schema`: expected outputs.
- `acceptance`: checks that define success.

Execution and updates MUST be validated against this contract.

## 5. Capability and Permission Model

Runtime MUST provide a capability declaration (machine-readable, and SHOULD be human-readable):
- writable scopes,
- outbound network scopes,
- executable tools/actions,
- confirmation-required actions,
- budget limits (`time`, `cost`, `tokens`).

Permission policy:
- default is deny.
- any new write scope or outbound scope MUST require explicit user consent.
- capabilities MAY be pre-approved by policy, but policy must be inspectable.

## 6. Local-First Networking

Default mode SHOULD be offline-first:
- local read/write MUST work without network.
- remote sync/discovery/publish are opt-in features.

When external communication is enabled:
- context sent out MUST be minimized and redactable.
- user MUST be told what data class is being sent.

## 7. Update and Apply Rules

Updates may come from:
- protocol source,
- collaboration backend,
- discovery results.

No silent apply:
1. runtime MUST show source and apply logic.
2. runtime MUST show summary (and SHOULD show diff when available).
3. runtime MUST require explicit `Accept/Reject/Defer`.
4. runtime MUST keep the current version runnable after `Reject`.

Before apply, runtime MUST create a rollback point (git ref or backup snapshot).

## 8. Packaging (`.self`)

`.self` MUST be zip-compatible and include:
- `self/manifest.yaml`
- `self/contract.yaml`

`self/manifest.yaml` MUST include at least:
- `name`, `version`, `unit_type`
- `protocol_authority`
- `data_authority`
- `runtime_requirements`
- `permissions`

Pack operation MUST:
- show include/exclude result and output path,
- require user confirmation before write,
- avoid mutating protocol authority as a side effect.

## 9. Audit Model

Each unit MUST maintain append-only audit records for significant actions.

Required record classes:
- `decision` (intent, rationale, risk),
- `change` (files touched, summary, rollback hint),
- `run` (inputs/outputs hash, result, timing).

For high-frequency edits, implementations MAY batch records, but MUST preserve order and attribution.

## 10. Replay Guarantees

Two replay levels are defined:
- `exact_replay`: same runtime, same deps, same inputs, byte-identical outputs.
- `semantic_replay`: outputs may differ in representation but MUST satisfy contract acceptance checks.

Runtime MUST declare which replay level is supported per run.

## 11. Conformance Levels

`L0 Runnable` (minimum):
- valid unit structure,
- executable logic,
- contract available.

`L1 Auditable`:
- L0 + decision/change records,
- rollback points for applied updates.

`L2 Shareable`:
- L1 + `.self` packaging,
- content hash for shared artifacts,
- explicit consume/apply confirmation flow.

Implementations MUST declare their level (`L0`/`L1`/`L2`).

## 12. Optional Extensions

The following are extensions, not core requirements:
- `Memory`: structured context files for long-horizon collaboration.
- `Ecosystem`: publishable artifacts (`practice`, `skill`, `selfware`, `patch`).
- `Self-Analysis`: extraction of reusable know-how from local history.

Extensions MUST NOT weaken core rules in Sections 3-9.

## 13. Non-Goals

This protocol does not:
- replace Git, OCI, or existing package registries,
- force one IDE, one runtime, or one cloud provider,
- force one internal architecture beyond required container boundaries.

## Appendix A (Non-Normative): Minimal Manifest Example

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

## Appendix B (Non-Normative): Minimal Decision Record Example

```json
{"id":"dec-001","ts":"2026-02-25T12:00:00Z","actor":"human","intent":"tighten update safety","decision":"require explicit Accept/Reject/Defer","rationale":"prevent silent drift","risk":"extra friction"}
```
