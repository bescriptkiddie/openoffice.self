import { NextRequest, NextResponse } from "next/server";
import {
  readTextFile,
  fileExists,
  memoryPathForFile,
  writeChangeRecord,
} from "@/lib/selfware";
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, relative, basename } from "path";
import { execSync } from "child_process";

const PROJECT_ROOT = process.cwd();

/**
 * Export a content file as a .self ZIP container.
 *
 * GET /api/export?path=content/articles/xxx.md
 *
 * Produces a self-contained .self package that includes:
 *   - The article content as canonical data
 *   - Its memory file (change history)
 *   - The Selfware protocol (selfware.md)
 *   - All legacy views (views/*.html) for browser rendering
 *   - The Python runtime (server.py) for local serving
 *   - A container manifest (self/manifest.md) describing the package
 *   - Supporting assets (js/, assets/)
 *
 * The receiver can:
 *   1. Give it to an Agent — the Agent reads self/manifest.md and understands everything
 *   2. Unzip + `python server.py` — opens all views in browser
 */
export async function GET(request: NextRequest) {
  const contentPath = request.nextUrl.searchParams.get("path");

  if (!contentPath || !contentPath.startsWith("content/")) {
    return NextResponse.json(
      { error: "Export restricted to content/ directory" },
      { status: 403 }
    );
  }

  if (!fileExists(contentPath)) {
    return NextResponse.json(
      { error: `${contentPath} not found` },
      { status: 404 }
    );
  }

  const contentFile = readTextFile(contentPath);
  const memPath = memoryPathForFile(contentPath);
  const memoryContent = fileExists(memPath) ? readTextFile(memPath) : "";
  const filename = basename(contentPath, ".md");
  const nowTs = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const tag = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace("T", "-")
    .slice(0, 15);

  // Protocol 10.3: record the export action
  const changeYaml = `id: "chg-${tag}-export_self"
timestamp: "${nowTs}"
actor: "user"
intent: "export_as_self_container"
paths:
  - "${contentPath}"
summary: "Exported ${filename} as .self container with views, runtime, and memory."
rollback_hint: "n/a (read-only operation)"`;

  try {
    writeChangeRecord(changeYaml, contentPath);
  } catch {
    /* best-effort for read-only export */
  }

  const containerManifest = buildContainerManifest(contentPath, filename, nowTs, memPath, memoryContent);

  const tmpDir = join(PROJECT_ROOT, ".next", "cache", `export-${tag}`);
  const selfFilename = `${filename}.self`;
  const tmpZip = join(tmpDir, selfFilename);

  try {
    execSync(`mkdir -p "${tmpDir}"`);

    const zipEntries: Array<{ arcname: string; sourcePath: string }> = [];
    const zipTextEntries: Array<{ arcname: string; content: string }> = [];

    zipTextEntries.push({ arcname: "self/manifest.md", content: containerManifest });

    // server.py expects content/selfware_demo.md (zh) and content/selfware_demo.en.md (en)
    zipTextEntries.push({ arcname: "content/selfware_demo.md", content: contentFile });
    zipTextEntries.push({ arcname: "content/selfware_demo.en.md", content: contentFile });

    if (memoryContent) {
      zipTextEntries.push({ arcname: "content/memory/changes.md", content: memoryContent });
    }

    const memoryFiles = ["content/memory/actions.md", "content/memory/decisions.md"];
    for (const mf of memoryFiles) {
      const fullMf = join(PROJECT_ROOT, mf);
      if (existsSync(fullMf)) {
        zipEntries.push({ arcname: mf, sourcePath: fullMf });
      }
    }

    const protocolFiles = ["selfware.md", "selfware.en.md"];
    for (const pf of protocolFiles) {
      const fullPath = join(PROJECT_ROOT, pf);
      if (existsSync(fullPath)) {
        zipEntries.push({ arcname: pf, sourcePath: fullPath });
      }
    }

    zipEntries.push({ arcname: "server.py", sourcePath: join(PROJECT_ROOT, "server.py") });
    zipEntries.push({ arcname: "manifest.md", sourcePath: join(PROJECT_ROOT, "manifest.md") });

    const viewsDir = join(PROJECT_ROOT, "views");
    if (existsSync(viewsDir)) {
      for (const vf of readdirSync(viewsDir)) {
        const vfPath = join(viewsDir, vf);
        if (statSync(vfPath).isFile()) {
          zipEntries.push({ arcname: `views/${vf}`, sourcePath: vfPath });
        }
      }
    }

    const jsDir = join(PROJECT_ROOT, "js");
    if (existsSync(jsDir)) {
      for (const jf of readdirSync(jsDir)) {
        const jfPath = join(jsDir, jf);
        if (statSync(jfPath).isFile()) {
          zipEntries.push({ arcname: `js/${jf}`, sourcePath: jfPath });
        }
      }
    }

    const assetsDir = join(PROJECT_ROOT, "assets");
    if (existsSync(assetsDir)) {
      collectDir(assetsDir, "assets", zipEntries);
    }

    for (const te of zipTextEntries) {
      const tmpFile = join(tmpDir, te.arcname.replace(/\//g, "__"));
      execSync(`mkdir -p "$(dirname "${tmpFile}")"`);
      require("fs").writeFileSync(tmpFile, te.content, "utf-8");
    }

    const zipScript = buildZipScript(tmpDir, tmpZip, zipEntries, zipTextEntries);
    execSync(zipScript, { cwd: PROJECT_ROOT, timeout: 30000 });

    const zipBuffer = readFileSync(tmpZip);

    execSync(`rm -rf "${tmpDir}"`);

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(selfFilename)}"`,
        "Cache-Control": "no-store",
        "Content-Length": String(zipBuffer.length),
      },
    });
  } catch (e) {
    try { execSync(`rm -rf "${tmpDir}"`); } catch { /* cleanup */ }
    return NextResponse.json(
      { error: `Export failed: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 }
    );
  }
}

function buildContainerManifest(
  contentPath: string,
  title: string,
  exportedAt: string,
  memPath: string,
  memoryContent: string,
): string {
  const hasMemory = !!memoryContent;

  return `Selfware-Container: zip
Selfware-Container-Version: 1
Protocol-Source: selfware.md
Local-Protocol-Path: selfware.md
Canonical-Data-Scope: content/
Canonical-Data-Path: content/selfware_demo.md

---

# ${title}

> This is a Selfware .self container — a self-contained, portable file package.
> Exported at: ${exportedAt}
> Source: ${contentPath}

## For Agents

This package contains a single article exported from a Selfware instance.
Everything an Agent needs to understand and continue working with this file is included.

### Structure

- \`content/selfware_demo.md\` — The article content (canonical data)
- \`content/memory/actions.md\` — **Start here** — what this file can do, available views, operations, constraints
${hasMemory ? `- \`content/memory/changes.md\` — Change history (who changed what, when, why, how to rollback)\n` : ""}- \`content/memory/decisions.md\` — Key architectural decisions and rationale
- \`selfware.md\` — The Selfware protocol (rules for how to interact with this file)
- \`manifest.md\` — Runtime manifest with API docs and capability declarations
- \`server.py\` — Zero-dependency Python runtime (start with \`python server.py\`)
- \`views/\` — 7 interactive views (doc, canvas, mindmap, outline, presentation, card, self)

### How to Use

**Option A — Agent reads directly:**
1. Read this manifest to understand the package
2. Read \`content/memory/actions.md\` to know what you can do (views, operations, constraints)
3. Read \`content/selfware_demo.md\` for the article content
${hasMemory ? `4. Read \`content/memory/changes.md\` for change history and context\n` : ""}5. Read \`selfware.md\` for protocol rules

**Option B — Start the runtime:**
\`\`\`bash
python server.py
\`\`\`
Opens at http://127.0.0.1:8000 with all views available.

### Memory Summary
${hasMemory
    ? `This file has been tracked with ${memoryContent.split("## id:").length - 1} change record(s).
Each record includes: actor, intent, affected paths, human-readable summary, and rollback instructions.`
    : "No change records were found for this file at export time."}

### Protocol Rules (key constraints)
- All writes MUST be within \`content/\` directory
- Destructive operations require user confirmation (No Silent Apply)
- Every content change MUST generate a Change Record
- The runtime binds to localhost only
`;
}

function collectDir(
  dirPath: string,
  arcPrefix: string,
  entries: Array<{ arcname: string; sourcePath: string }>,
) {
  for (const item of readdirSync(dirPath)) {
    if (item === ".DS_Store") continue;
    const fullPath = join(dirPath, item);
    const arcname = `${arcPrefix}/${item}`;
    if (statSync(fullPath).isDirectory()) {
      collectDir(fullPath, arcname, entries);
    } else {
      entries.push({ arcname, sourcePath: fullPath });
    }
  }
}

function buildZipScript(
  tmpDir: string,
  tmpZip: string,
  fileEntries: Array<{ arcname: string; sourcePath: string }>,
  textEntries: Array<{ arcname: string; content: string }>,
): string {
  const parts: string[] = [`rm -f "${tmpZip}"`];

  const stageDir = join(tmpDir, "_stage");
  parts.push(`mkdir -p "${stageDir}"`);

  for (const te of textEntries) {
    const dest = join(stageDir, te.arcname);
    const tmpFile = join(tmpDir, te.arcname.replace(/\//g, "__"));
    parts.push(`mkdir -p "$(dirname "${dest}")" && cp "${tmpFile}" "${dest}"`);
  }

  for (const fe of fileEntries) {
    const dest = join(stageDir, fe.arcname);
    parts.push(`mkdir -p "$(dirname "${dest}")" && cp "${fe.sourcePath}" "${dest}"`);
  }

  parts.push(`cd "${stageDir}" && zip -r "${tmpZip}" . -x "*.DS_Store"`);

  return parts.join(" && ");
}
