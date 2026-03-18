# AGENTS.md — openoffice.self

## Project Overview

Selfware protocol reference implementation — a local-first document runtime where files carry their own data, logic, and views. Dual-layer architecture:

- **Next.js 16 frontend** (React 19, TypeScript, Tailwind CSS 4, App Router) — multi-view document renderer with AI-assisted editing
- **Python backend** (`server.py`) — zero-dependency stdlib HTTP server for the legacy/standalone `.self` container runtime

The Next.js app is the primary development target. The Python `server.py` is a standalone runtime that shares no code with the Next.js app.

---

## Commands

```bash
npm install              # Install dependencies
npm run dev              # next dev --turbopack → http://localhost:3000
npm run build            # next build (standalone output for Docker)
npm start                # next start (production)
npm run lint             # next lint (ESLint)
npx tsc --noEmit         # Type check (no dedicated script)
docker compose up --build
```

### Python Runtime (standalone, zero deps)

```bash
python server.py                  # Serve on localhost:8000
python server.py 8001             # Custom port
python server.py pack Out.self    # Package as .self container
```

### Testing

No test framework is currently configured. There is no `npm test` command.

When adding tests:
- **E2E**: Playwright — `npx playwright test tests/example.spec.ts`
- **Python**: pytest — `pytest tests/test_server.py`
- **Type checking a single file**: `npx tsc --noEmit src/path/to/file.ts` (not a test, but catches type errors)

No `.cursor/rules`, `.cursorrules`, or `.github/copilot-instructions.md` files exist in this repository.

---

## Code Style

### TypeScript / Next.js

- **Strict mode** (`"strict": true` in tsconfig)
- **Path aliases**: `@/*` → `./src/*` — always use `@/` imports, never relative `../`
- **Module resolution**: `bundler` mode, target ES2017

#### Imports

Order: framework/library → internal `@/` imports. Use `import type` for type-only imports.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { useState, useCallback } from "react";
import type { Theme, Lang } from "@/lib/types";
import { useLang } from "@/lib/hooks";
import { t } from "@/lib/i18n";
```

Prefer named exports. Default exports only for page components and layouts.

#### Components

- Client components: `"use client"` directive at top of file
- Server components: default (no directive)
- Props: inline interfaces above the component, or shared in `types.ts`
- Error boundaries: class components (see `ErrorBoundary.tsx`)

#### Naming

| Entity | Convention | Examples |
|--------|-----------|----------|
| Component files | `PascalCase.tsx` | `AppShell.tsx`, `ImportModal.tsx` |
| Utility files | `camelCase.ts` | `hooks.ts`, `selfware.ts` |
| Types/Interfaces | `PascalCase` | `ViewDef`, `CapabilitiesPayload` |
| Hooks | `useCamelCase` | `useTheme`, `useLang`, `useContent` |
| i18n keys | `dot.separated` | `"chat.title"`, `"self.loading"` |
| Directories | `camelCase` or `kebab-case` | Next.js conventions |

#### Styling

- **Tailwind CSS 4** via `@tailwindcss/postcss`
- CSS custom properties for theming: `--bg`, `--text`, `--accent`, `--panel`, etc.
- Three themes: `dark` (default), `light`, `book` — toggled via `data-theme` on `<html>`
- No CSS modules; global styles in `src/app/globals.css`
- Inline `style={{}}` acceptable for dynamic values

#### State Management

- React Context via custom hooks (`ThemeContext`, `LangContext`, `ToastContext`, `ChatContext`)
- All providers in `src/components/layout/Providers.tsx`
- No external state libraries (no Redux, Zustand, etc.)

#### API Routes

- Located at `src/app/api/*/route.ts`
- Use `NextRequest` / `NextResponse`
- Security: restrict file reads to `content/` directory
- Return JSON with appropriate HTTP status codes (400, 403, 404, 500)
- Always check external API response status before parsing (e.g., LLM calls)

#### Error Handling

- Empty `catch` blocks only for optional/fallback operations (e.g., reading a file that may not exist)
- Non-critical failures: `catch (e) { console.error(...) }`
- **Never** suppress TypeScript errors with `as any`, `@ts-ignore`, or `@ts-expect-error`

### Python (`server.py`)

- Pure stdlib — **no external dependencies**
- Functions: `snake_case` with basic type hints
- Single handler class: `Handler(http.server.SimpleHTTPRequestHandler)`
- String formatting: f-strings
- File I/O: explicit `encoding="utf-8"`

---

## i18n

- Two languages: `zh` (Chinese, default) and `en` (English)
- Translations in `src/lib/i18n.ts` — use `t(key, lang)` helper
- Detection priority: URL `?lang=` param → localStorage → browser `Accept-Language`
- Content variants: `selfware_demo.md` (zh), `selfware_demo.en.md` (en)

---

## Memory System

Content changes are tracked by the memory module in `content/memory/`:

| File | Purpose |
|------|---------|
| `changes.md` | Append-only change records — who changed what, when, why, how to rollback |
| `summaries.md` | Phase summaries — periodic compression of change records (Block AttnRes pattern) |
| `decisions.md` | Key architecture/protocol decisions with rationale |
| `actions.md` | Agent action guide — what operations are available and their constraints |

Per-article changes also write to `content/articles/<name>.memory.md` (co-located with the article). Both the per-file memory and global `changes.md` are updated on every change — see `writeChangeRecord()` in `src/lib/selfware.ts`.

### Memory Compression (Block Attention Residuals)

When `changes.md` accumulates many records, call `POST /api/memory-compress` to compress them into a phase summary in `summaries.md`. Agent reads summaries first (cross-block attention), expands into `changes.md` details only when needed (intra-block data). Compression is LLM-driven: relevant decisions get high weight and are retained, obsolete intermediate states get compressed away.

---

## Environment Variables

```bash
SELFWARE_LLM_BASE_URL=   # OpenAI-compatible API base (default: stepfun)
SELFWARE_LLM_MODEL=      # Model name
SELFWARE_LLM_API_KEY=    # API key (required for chat_edit and import)
SELFWARE_PORT=            # Override default port
SELFWARE_HOST=            # Bind host (default: 127.0.0.1)
```

---

## Key Conventions

1. **Write scope**: All file writes MUST target `content/` directory
2. **Memory on every change**: Generate change records in both per-file `.memory.md` and global `content/memory/changes.md`
3. **No silent apply**: Destructive operations require user confirmation
4. **Standalone output**: Next.js builds with `output: 'standalone'` for Docker
5. **Canonical data**: `content/selfware_demo.md` is the single source of truth for instance data
6. **View as function**: Views are projections of the same data — never modify protocol files from views
7. **LLM error handling**: Always check LLM API response status before parsing; surface real error messages instead of generic failures
