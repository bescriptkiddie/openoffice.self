# Update root AGENTS.md for agent-facing repository guidance

## TL;DR
> **Summary**: Refresh the existing root `AGENTS.md` into a tighter, agent-optimized guide that accurately documents build/lint/typecheck/test workflow, single-test reality, and repository-specific coding conventions without inventing tooling or external rule files.
> **Deliverables**:
> - Updated `/Users/pika/codespace/ai-space/openoffice.self/AGENTS.md`
> - Clear command reference for dev/build/lint/typecheck/test-related workflows
> - Concise code style guidance aligned to current repo conventions
> **Effort**: Quick
> **Parallel**: NO
> **Critical Path**: 1 → 2 → 3 → 4

## Context
### Original Request
Create or improve an `AGENTS.md` for this repository, around 150 lines long, containing build/lint/test commands (especially how to run a single test), code style guidance, and any Cursor/Copilot rules if they exist.

### Interview Summary
- The repository already contains `/Users/pika/codespace/ai-space/openoffice.self/AGENTS.md` and the requested work should improve that file in place.
- The repo uses Next.js 16, React 19, TypeScript strict mode, Tailwind CSS 4, and a standalone Python runtime in `server.py`.
- There is no configured JS or Python test runner at present; documentation must be honest about that rather than inventing commands.
- No `.cursor/rules`, `.cursorrules`, or `.github/copilot-instructions.md` files exist, so the update should mention absence rather than fabricate guidance.

### Metis Review (gaps addressed)
- Guardrail: do not imply a single-test command exists today when no test framework is configured.
- Guardrail: do not expand scope into creating Cursor/Copilot rule files or CI/CD documentation.
- Guardrail: keep examples copy-pasteable and consistent with actual repo state (`package.json`, `tsconfig.json`, existing source patterns).
- Guardrail: preserve useful existing conventions instead of rewriting the document from scratch with generic advice.

## Work Objectives
### Core Objective
Replace the current root `AGENTS.md` with a more concise, accurate, agent-facing guide that matches the repository’s actual commands, style conventions, and test reality.

### Deliverables
- Revised `/Users/pika/codespace/ai-space/openoffice.self/AGENTS.md`
- Explicit command section for install, dev, build, start, lint, manual typecheck, Docker, and Python runtime
- Explicit testing section that states current absence of a runner and documents future conventions (`Playwright` for E2E, `pytest` for Python)
- Concise style guidance for imports, types, naming, component structure, API routes, error handling, styling, and i18n

### Definition of Done (verifiable conditions with commands)
- `AGENTS.md` exists at repository root and remains the only AGENTS file modified for this task.
- The file reflects actual commands in `package.json` and repo configuration.
- The file explicitly states that no test framework is currently configured and does not present fake single-test commands.
- The file mentions that no Cursor/Copilot instruction files are present.
- The file length is approximately 150 lines (acceptable range: roughly 140–180 lines).
- Verification commands:
  - `python - <<'PY'
from pathlib import Path
p = Path('AGENTS.md')
print(p.exists())
print(sum(1 for _ in p.open()))
PY`
  - `python - <<'PY'
from pathlib import Path
text = Path('AGENTS.md').read_text()
checks = [
  'npm run dev',
  'npm run build',
  'npm run lint',
  'npx tsc --noEmit',
  'No test framework is currently configured',
]
for c in checks:
  print(c, c in text)
PY`

### Must Have
- Accurate scripts from `package.json`
- Accurate TypeScript config details from `tsconfig.json`
- Retained project-specific conventions already documented and still valid
- Honest test guidance including “single test” limitation today
- Clear indication that no Cursor/Copilot rule files exist in repo

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)
- Must NOT add commands that do not work in the current repo
- Must NOT mention nonexistent tools/configs as if already configured
- Must NOT create or reference `.cursor/rules`, `.cursorrules`, or `.github/copilot-instructions.md` as if they exist
- Must NOT bloat AGENTS with generic framework advice disconnected from this codebase
- Must NOT change source code, package scripts, tests, or non-`AGENTS.md` documentation

## Verification Strategy
> ZERO HUMAN INTERVENTION — all verification is agent-executed.
- Test decision: none currently configured; verify documentation accuracy instead of executing nonexistent tests
- QA policy: Every task includes agent-executed document validation scenarios
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy
### Parallel Execution Waves
> Target: 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> This task is small and sequential because each step depends on the previous document revision.

Wave 1: audit current inputs and decide the exact retained/removed guidance
Wave 2: rewrite `AGENTS.md` with concise structure and accurate commands
Wave 3: verify commands, line count, wording, and scope fidelity

### Dependency Matrix (full, all tasks)
- Task 1 blocks Tasks 2-4
- Task 2 blocks Tasks 3-4
- Task 3 blocks Task 4
- Task 4 blocks final verification wave

### Agent Dispatch Summary (wave → task count → categories)
- Wave 1 → 1 task → quick
- Wave 2 → 1 task → writing
- Wave 3 → 2 tasks → quick, writing
- Final Verification Wave → 4 tasks → oracle, unspecified-high, deep

## TODOs
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [ ] 1. Audit the current AGENTS.md against repo truth

  **What to do**: Compare the existing `AGENTS.md` to `package.json`, `tsconfig.json`, `next.config.ts`, `server.py`, and relevant source conventions. Produce a concrete keep/remove/add list before editing.
  **Must NOT do**: Do not edit any file during this task. Do not infer commands or tools that are not present.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: focused repository audit with low implementation complexity
  - Skills: `[]` — no extra skill needed
  - Omitted: `["frontend-design"]` — not a UI/design task

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: [2, 3, 4] | Blocked By: []

  **References** (executor has NO interview context — be exhaustive):
  - Existing guide: `/Users/pika/codespace/ai-space/openoffice.self/AGENTS.md:1-193` — baseline content to preserve or tighten
  - Scripts: `/Users/pika/codespace/ai-space/openoffice.self/package.json:5-10` — only documented npm scripts that may be presented as runnable
  - TS config: `/Users/pika/codespace/ai-space/openoffice.self/tsconfig.json:2-29` — strict mode, bundler resolution, alias
  - Next config: `/Users/pika/codespace/ai-space/openoffice.self/next.config.ts:3-9` — standalone output and turbopack root
  - Language detection example: `/Users/pika/codespace/ai-space/openoffice.self/src/components/layout/Providers.tsx:7-25` — confirms zh/en detection behavior
  - Hook/types patterns: `/Users/pika/codespace/ai-space/openoffice.self/src/lib/hooks.ts:26-37`, `/Users/pika/codespace/ai-space/openoffice.self/src/lib/types.ts` — type and naming patterns

  **Acceptance Criteria** (agent-executable only):
  - [ ] A written keep/remove/add checklist exists in the executor’s working notes before any edit begins.
  - [ ] The checklist includes an explicit statement that no Cursor/Copilot instruction files exist.
  - [ ] The checklist includes an explicit statement that no test framework is currently configured.

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: Confirm all documented commands come from repo config
    Tool: Read
    Steps: Read AGENTS.md, package.json, tsconfig.json, next.config.ts; compare documented commands and config claims.
    Expected: Every retained command or config statement has a supporting source file.
    Evidence: .sisyphus/evidence/task-1-agents-audit.md

  Scenario: Confirm absence of Cursor/Copilot instruction files
    Tool: Glob
    Steps: Search for **/.cursor/rules/**, **/.cursorrules, and **/.github/copilot-instructions.md from repo root.
    Expected: No matching files are found.
    Evidence: .sisyphus/evidence/task-1-agents-audit-error.md
  ```

  **Commit**: NO | Message: `docs(agents): audit existing guidance` | Files: [`AGENTS.md`]

- [ ] 2. Rewrite AGENTS.md into concise agent-facing structure

  **What to do**: Edit the existing root `AGENTS.md` in place. Keep the useful architecture/context summary, command section, style conventions, i18n notes, env vars, and key conventions, but compress the wording to hit the target length. Add an explicit testing section that states there is no configured test runner today and explains future conventions for Playwright and pytest.
  **Must NOT do**: Do not create a new AGENTS file elsewhere. Do not add new repository policy not grounded in source files. Do not document single-test commands as available today unless they are clearly framed as future/when-configured guidance.

  **Recommended Agent Profile**:
  - Category: `writing` — Reason: documentation rewrite with accuracy constraints
  - Skills: `[]` — no additional writing skill required beyond repository grounding
  - Omitted: `["content-creator"]` — marketing tone is undesirable for technical agent instructions

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: [3, 4] | Blocked By: [1]

  **References** (executor has NO interview context — be exhaustive):
  - File to update: `/Users/pika/codespace/ai-space/openoffice.self/AGENTS.md`
  - Baseline content worth preserving: `/Users/pika/codespace/ai-space/openoffice.self/AGENTS.md:14-193`
  - Scripts source of truth: `/Users/pika/codespace/ai-space/openoffice.self/package.json:5-10`
  - TS compiler conventions: `/Users/pika/codespace/ai-space/openoffice.self/tsconfig.json:2-29`
  - Next standalone output: `/Users/pika/codespace/ai-space/openoffice.self/next.config.ts:3-9`
  - Runtime/env references: `/Users/pika/codespace/ai-space/openoffice.self/AGENTS.md:171-193`, `/Users/pika/codespace/ai-space/openoffice.self/server.py`

  **Acceptance Criteria** (agent-executable only):
  - [ ] `AGENTS.md` remains at repo root and is the only AGENTS file edited.
  - [ ] The file includes install/dev/build/start/lint/manual typecheck/Docker/Python runtime commands.
  - [ ] The file contains a testing section with the exact reality that no test framework is currently configured.
  - [ ] The file mentions no Cursor/Copilot rule files are present, or omits them entirely without implying they exist.
  - [ ] The file length is approximately 140–180 lines.

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: Validate revised AGENTS structure and length
    Tool: Read
    Steps: Read the updated AGENTS.md and count lines using a line-count command or script.
    Expected: Document is concise, readable, and roughly 140–180 lines with the required sections present.
    Evidence: .sisyphus/evidence/task-2-rewrite-agents.md

  Scenario: Validate testing wording is honest
    Tool: Read
    Steps: Read the testing section and compare against package.json and repo search results for test frameworks.
    Expected: No fake npm test command or nonexistent runner is documented as currently available.
    Evidence: .sisyphus/evidence/task-2-rewrite-agents-error.md
  ```

  **Commit**: NO | Message: `docs(agents): tighten repository instructions` | Files: [`AGENTS.md`]

- [ ] 3. Verify command accuracy and single-test wording

  **What to do**: Re-read the updated `AGENTS.md` and cross-check every command against repo truth. Pay special attention to the “single test” ask: document the current limitation and, if included, clearly separate future guidance from present-day runnable commands.
  **Must NOT do**: Do not silently leave ambiguous wording such as “run a single test with npm test” when no such command exists.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: fast factual verification against repo files
  - Skills: `[]` — no extra skills needed
  - Omitted: `["git-master"]` — not a git task

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: [4] | Blocked By: [2]

  **References** (executor has NO interview context — be exhaustive):
  - Updated doc: `/Users/pika/codespace/ai-space/openoffice.self/AGENTS.md`
  - Scripts: `/Users/pika/codespace/ai-space/openoffice.self/package.json:5-10`
  - Existing test guidance baseline: `/Users/pika/codespace/ai-space/openoffice.self/AGENTS.md:45-49` (pre-rewrite)
  - Repo-wide test/tool presence check via search over `package.json`, config files, and source tree

  **Acceptance Criteria** (agent-executable only):
  - [ ] Every command in `AGENTS.md` appears exactly in package scripts or is clearly labeled as a manual command.
  - [ ] The document does not claim a current single-test command exists when it does not.
  - [ ] Typecheck guidance uses a valid manual command format (for example `npx tsc --noEmit`).

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: Cross-check commands line by line
    Tool: Read
    Steps: Extract each command from AGENTS.md and compare against package.json and known manual commands.
    Expected: All commands are valid and clearly labeled.
    Evidence: .sisyphus/evidence/task-3-command-verification.md

  Scenario: Negative check for fake test commands
    Tool: Grep
    Steps: Search AGENTS.md for `npm test`, `vitest`, `jest`, and `playwright test` wording.
    Expected: Any such references are either absent or explicitly described as future setup guidance rather than current commands.
    Evidence: .sisyphus/evidence/task-3-command-verification-error.md
  ```

  **Commit**: NO | Message: `docs(agents): verify command accuracy` | Files: [`AGENTS.md`]

- [ ] 4. Final editorial pass for agent usability and scope fidelity

  **What to do**: Make a final pass on `AGENTS.md` to ensure the tone is operational, concise, and repository-specific. Remove redundancy, ensure examples use actual project terminology, and preserve important guardrails like write scope and no silent apply.
  **Must NOT do**: Do not add generic best-practice padding, CI/CD sections, or speculative future architecture guidance.

  **Recommended Agent Profile**:
  - Category: `writing` — Reason: final clarity and concision pass
  - Skills: `[]` — no extra skill needed
  - Omitted: `["content-research-writer"]` — external citations are unnecessary

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: [F1, F2, F3, F4] | Blocked By: [2, 3]

  **References** (executor has NO interview context — be exhaustive):
  - Final doc target: `/Users/pika/codespace/ai-space/openoffice.self/AGENTS.md`
  - Existing conventions to preserve: `/Users/pika/codespace/ai-space/openoffice.self/AGENTS.md:186-193`
  - Style/naming evidence: `/Users/pika/codespace/ai-space/openoffice.self/src/lib/hooks.ts`, `/Users/pika/codespace/ai-space/openoffice.self/src/lib/types.ts`, `/Users/pika/codespace/ai-space/openoffice.self/src/components/layout/Providers.tsx`

  **Acceptance Criteria** (agent-executable only):
  - [ ] The document remains repository-specific and avoids generic filler.
  - [ ] Existing key conventions still appear in the final guide.
  - [ ] The final wording is concise enough for agent consumption and not materially longer than requested.

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: Review for repository-specific language
    Tool: Read
    Steps: Read final AGENTS.md and compare examples/terminology against actual files and conventions in the repo.
    Expected: References match real project structure and behavior.
    Evidence: .sisyphus/evidence/task-4-editorial-pass.md

  Scenario: Review for scope creep
    Tool: Read
    Steps: Scan final AGENTS.md for invented sections on CI, deployment policy, or nonexistent tool configs.
    Expected: No out-of-scope or fabricated guidance appears.
    Evidence: .sisyphus/evidence/task-4-editorial-pass-error.md
  ```

  **Commit**: NO | Message: `docs(agents): finalize concise agent guide` | Files: [`AGENTS.md`]

## Final Verification Wave (4 parallel agents, ALL must APPROVE)
- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ playwright if UI)
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy
- No commit as part of this plan unless the user explicitly requests one later.
- If the executor is later asked to commit, the commit should include only `AGENTS.md` unless unrelated documentation changes are explicitly requested.

## Success Criteria
- The repository root `AGENTS.md` is improved in place, not duplicated.
- Agents reading the file can immediately see how to install, run, lint, typecheck, and understand current testing limitations.
- The file accurately reflects repo-specific TypeScript, Next.js, styling, API route, Python, i18n, and memory-module conventions.
- The document remains concise, operational, and free of fabricated tooling or rule files.
