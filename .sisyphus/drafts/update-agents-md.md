# Draft: Update AGENTS.md

## Requirements (confirmed)
- Improve existing `/Users/pika/codespace/ai-space/openoffice.self/AGENTS.md`
- Include build/lint/test commands, especially honest single-test guidance
- Include code style guidelines: imports, formatting, types, naming, error handling
- Include Cursor/Copilot rules if present
- Target roughly 150 lines

## Technical Decisions
- Update the existing root `AGENTS.md`; do not create a second agent guide
- Preserve repository-specific guidance already present when still accurate
- State explicitly that no test runner is currently configured
- Do not invent `.cursor` / Copilot rules because none exist in this repository

## Research Findings
- `package.json` scripts: `dev`, `build`, `start`, `lint`
- `tsconfig.json` confirms `strict: true`, `moduleResolution: "bundler"`, `@/*` path alias
- Existing `AGENTS.md` already documents TS/Python conventions and env vars
- No `.cursor/rules`, `.cursorrules`, or `.github/copilot-instructions.md` found

## Open Questions
- None blocking; “about 150 lines” treated as approximate, not exact

## Scope Boundaries
- INCLUDE: refreshed commands, test guidance, concise style conventions, explicit absence of Cursor/Copilot rules
- EXCLUDE: creating new rule files, adding CI/CD policy, changing code or package scripts
