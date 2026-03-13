# AGENTS.md — openoffice.self

## Project Overview

Selfware protocol reference implementation — a local-first document runtime where files carry their own data, logic, and views. Dual-layer architecture:

- **Next.js 16 frontend** (React 19, TypeScript, Tailwind CSS 4, App Router) — multi-view document renderer with AI-assisted editing
- **Python backend** (`server.py`) — zero-dependency stdlib HTTP server for the legacy/standalone `.self` container runtime

The Next.js app is the primary development target. The Python `server.py` is a standalone runtime that shares no code with the Next.js app.

---

## Build / Dev / Lint Commands

```bash
# Install dependencies
npm install

# Development (Turbopack)
npm run dev              # next dev --turbopack (http://localhost:3000)

# Production build
npm run build            # next build (standalone output)
npm start                # next start

# Lint
npm run lint             # next lint (ESLint)

# Type check (no dedicated script — run manually)
npx tsc --noEmit

# Docker
docker compose up --build
```

### Python Runtime (standalone, no deps)

```bash
python server.py                  # Serve on localhost:8000
python server.py 8001             # Custom port
python server.py pack Out.self    # Package as .self container
```

### Tests

No test framework is currently configured. When adding tests:
- Use **Playwright** for E2E tests (per project convention)
- Use **pytest** for any Python tests

---

## Project Structure

```
src/
  app/                  # Next.js App Router pages
    api/                # Route handlers (REST endpoints)
    doc/page.tsx        # Document view
    canvas/page.tsx     # Canvas view
    ...                 # Other view pages
  components/
    layout/             # Shell, providers, nav components
    ui/                 # Reusable UI components
    ErrorBoundary.tsx   # Global error boundary
    MarkdownRenderer.tsx
  lib/
    types.ts            # Shared types and constants (Theme, Lang, ViewDef, etc.)
    hooks.ts            # React contexts and hooks (useTheme, useLang, useContent, etc.)
    i18n.ts             # i18n translations (zh/en) via t() helper
    selfware.ts         # Server-side utils (file I/O, capabilities, change records)
content/                # Canonical data (write-scoped directory)
  articles/             # Article markdown files
  memory/               # Change records (append-only)
views/                  # Legacy HTML views (served by server.py)
server.py               # Standalone Python runtime (zero deps)
```

---

## Code Style

### TypeScript / Next.js

- **Strict mode** enabled in tsconfig (`"strict": true`)
- **Path aliases**: `@/*` maps to `./src/*` — always use `@/` imports
- **Module resolution**: `bundler` mode
- **Target**: ES2017

#### Imports

```typescript
// 1. Framework/library imports
import { NextRequest, NextResponse } from "next/server";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// 2. Internal imports via @/ alias
import type { Theme, Lang } from "@/lib/types";
import { useLang } from "@/lib/hooks";
import { t } from "@/lib/i18n";
```

- Use `import type { ... }` for type-only imports
- Prefer named exports; default exports for page components and layout

#### Components

- Client components: add `"use client"` directive at top of file
- Server components: default (no directive needed)
- Props: define inline interfaces above the component or in `types.ts`
- Error boundaries: class components (see `ErrorBoundary.tsx`)

#### Naming

- Files: `PascalCase.tsx` for components, `camelCase.ts` for utilities
- Directories: `camelCase` or `kebab-case` (Next.js conventions)
- Types/Interfaces: `PascalCase` (e.g., `ViewDef`, `CapabilitiesPayload`)
- Hooks: `useCamelCase` (e.g., `useTheme`, `useLang`, `useContent`)
- i18n keys: `dot.separated.lowercase` (e.g., `"chat.title"`, `"self.loading"`)

#### Styling

- **Tailwind CSS 4** via `@tailwindcss/postcss` plugin
- CSS custom properties for theming (`--bg`, `--text`, `--accent`, `--panel`, etc.)
- Three themes: `dark` (default), `light`, `book` — toggled via `data-theme` attribute on `<html>`
- Utility class `.card` for panel styling (defined in `globals.css`)
- Inline `style={{}}` acceptable for dynamic computed values
- No CSS modules; global styles in `src/app/globals.css`

#### State Management

- React Context via custom hooks (`ThemeContext`, `LangContext`, `ToastContext`, `ChatContext`)
- All context providers in `src/components/layout/Providers.tsx`
- No external state libraries (no Redux, Zustand, etc.)

#### API Routes

- Located in `src/app/api/*/route.ts`
- Use `NextRequest` / `NextResponse`
- Security: restrict file reads to `content/` directory
- Return JSON responses with appropriate error status codes

#### Error Handling

- Empty `catch` blocks acceptable only for optional operations (e.g., fallback file reads)
- Use `catch (e) { console.error(...) }` for non-critical failures
- API routes: return proper HTTP status codes (400, 403, 404, 500)
- Never suppress TypeScript errors with `as any`, `@ts-ignore`, or `@ts-expect-error`

### Python (`server.py`)

- Pure stdlib — **no external dependencies**
- Functions use `snake_case`
- Type hints on function signatures (basic level)
- No classes except `Handler(http.server.SimpleHTTPRequestHandler)`
- String formatting: f-strings
- File I/O: explicit `encoding="utf-8"`

---

## i18n

- Two languages: `zh` (Chinese, default) and `en` (English)
- Translation strings in `src/lib/i18n.ts` — use `t(key, lang)` helper
- Language detection: URL param > localStorage > browser `Accept-Language`
- Content files have language variants: `selfware_demo.md` (zh), `selfware_demo.en.md` (en)

---

## Environment Variables

```bash
# LLM for AI-assisted editing (used by server.py)
SELFWARE_LLM_BASE_URL=   # OpenAI-compatible API base (default: stepfun)
SELFWARE_LLM_MODEL=      # Model name
SELFWARE_LLM_API_KEY=    # API key (required for chat_edit)

# Server config
SELFWARE_PORT=            # Override default port
SELFWARE_HOST=            # Bind host (default: 127.0.0.1)
```

---

## Key Conventions

1. **Write scope**: All file writes MUST be within `content/` directory
2. **Memory module**: Every content change should generate a change record in `content/memory/changes.md` (append-only)
3. **No silent apply**: Destructive operations require user confirmation
4. **Standalone output**: Next.js builds with `output: 'standalone'` for Docker
5. **Canonical data**: `content/selfware_demo.md` is the single source of truth for instance data
6. **View as function**: Views are projections of the same data — never modify protocol files from views
