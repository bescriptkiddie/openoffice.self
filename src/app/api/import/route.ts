import { NextRequest, NextResponse } from "next/server";
import {
  readTextFile,
  writeTextFile,
  writeChangeRecord,
  appendActionRecord,
  memoryPathForFile,
  fileExists,
} from "@/lib/selfware";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

const LLM_BASE_URL = (
  process.env.SELFWARE_LLM_BASE_URL || "https://api.stepfun.com/v1"
).replace(/\/+$/, "");
const LLM_MODEL = process.env.SELFWARE_LLM_MODEL || "step-3.5-flash";
const LLM_API_KEY = process.env.SELFWARE_LLM_API_KEY || "";

const CONTENT_DELIMITER = "===CONTENT===";
const CHANGE_DELIMITER = "===CHANGE_RECORD===";

function sanitizeFilename(name: string): string {
  // Remove extension, sanitize, add back .md
  let base = name.replace(/\.md$/i, "").trim();
  // Replace unsafe characters
  base = base.replace(/[\/\\:*?"<>|]/g, "-").replace(/\s+/g, "-");
  if (!base) base = "imported";
  return base + ".md";
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const rawContent: string = data.content;
    const filename: string = data.filename || "imported.md";
    const lang: string = data.lang || "zh";
    const saveAs: "canonical" | "article" = data.saveAs || "canonical";

    if (typeof rawContent !== "string" || !rawContent.trim()) {
      return NextResponse.json(
        { error: "Missing 'content' field" },
        { status: 400 }
      );
    }

    // Read protocol for LLM context
    const protocolPath = lang === "en" ? "selfware.en.md" : "selfware.md";
    let protocolText = "";
    try {
      protocolText = readTextFile(protocolPath);
    } catch {
      // Protocol file not found, proceed without
    }

    // Read current canonical for reference
    let currentCanonical = "";
    try {
      const cpath =
        lang === "en"
          ? "content/selfware_demo.en.md"
          : "content/selfware_demo.md";
      currentCanonical = readTextFile(cpath);
    } catch {
      // OK
    }

    const nowTs = new Date().toISOString().replace(/\.\d+Z$/, "Z");
    const tag = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace("T", "-")
      .slice(0, 15);

    const targetPath =
      saveAs === "article"
        ? `content/articles/${sanitizeFilename(filename)}`
        : lang === "en"
          ? "content/selfware_demo.en.md"
          : "content/selfware_demo.md";

    const systemPrompt = `You are the Selfware Import Converter. You transform raw Markdown into **Selfware-compliant canonical format** — a structured, metadata-rich document that any Agent can instantly understand and continue working with.

## Output Structure (MANDATORY — follow this EXACT format):

Your output MUST have three parts in order:

### PART 1: YAML Frontmatter

Start the file with YAML frontmatter wrapped in \`---\`. This is the Selfware identity — it's how Agents and the runtime recognize this is not just a random .md file.

\`\`\`
---
selfware:
  type: "canonical"                    # canonical | article | note
  version: "0.1.0"
  created_at: "${nowTs}"
  source:
    type: "import"                     # import | ai_generated | manual
    original_filename: "(source filename)"
  language: "${lang}"
  title: "(extracted or generated title)"
  summary: "(1-3 sentence summary of the content)"
  keywords:
    - keyword1
    - keyword2
    - keyword3
  structure:
    sections: (number of H2 sections)
    word_count: (approximate)
---
\`\`\`

### PART 2: Structured Content

After the frontmatter, output the content in this structure:

\`\`\`markdown
# Title

> One-line summary or key insight (blockquote)

## 📌 Table of Contents

- [Section 1](#section-1)
- [Section 2](#section-2)
- ...

---

## Section 1

Content...

---

## Section 2

Content...
\`\`\`

**Content rules:**
- H1: one only, the document title
- H2: major sections, separated by \`---\`
- H3+: subsections within H2
- Preserve ALL meaningful content — do NOT omit or summarize
- If the source is unstructured, reorganize by logical flow
- Keep the original author's language and voice
- Extract key insights, data points, and conclusions — make them prominent
- Use blockquotes for key takeaways or important quotes
- Use lists, tables, code blocks as appropriate

### PART 3: Change Record

On a new line, output exactly: ===CHANGE_RECORD===
Then output a YAML block (no fences):
   id: "chg-${tag}-import"
   timestamp: "${nowTs}"
   actor: "user+agent"
   intent: "import_markdown"
    paths:
      - "${targetPath}"
      - "${memoryPathForFile(targetPath)}"
   summary: (describe what was imported, topics, how it was restructured)
   rollback_hint: "git checkout -- ${targetPath}"

## What NOT to do:
- Do NOT wrap the entire output in code fences
- Do NOT add commentary about the conversion process
- Do NOT fabricate information not in the source
- Do NOT translate unless instructed

${protocolText ? `## Reference — Selfware Protocol (excerpt):\n${protocolText.slice(0, 2000)}` : ""}`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      {
        role: "user" as const,
        content: `Convert this Markdown file into Selfware canonical format.\n\nSource filename: ${filename}\nSave target: ${targetPath}\nLanguage: ${lang}\n\n--- SOURCE CONTENT ---\n${rawContent}`,
      },
    ];

    const llmRes = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages,
        temperature: 0.15,
      }),
      signal: AbortSignal.timeout(120000),
    });

    const llmData = await llmRes.json();

    if (!llmRes.ok) {
      const errMsg = llmData?.error?.message || llmData?.message || JSON.stringify(llmData);
      throw new Error(`LLM API error (${llmRes.status}): ${errMsg}`);
    }

    let rawOutput = llmData?.choices?.[0]?.message?.content || "";

    // Strip code fences if present
    if (rawOutput.trimStart().startsWith("```")) {
      const lines = rawOutput.split("\n");
      lines.shift();
      while (
        lines.length &&
        lines[lines.length - 1].trim().startsWith("```")
      ) {
        lines.pop();
      }
      rawOutput = lines.join("\n");
    }

    if (!rawOutput.trim()) {
      throw new Error("LLM returned empty content");
    }

    // Parse output
    let convertedContent = rawOutput.trim();
    let changeYaml = "";

    if (convertedContent.includes(CHANGE_DELIMITER)) {
      const parts = convertedContent.split(CHANGE_DELIMITER);
      convertedContent = parts[0].trim();
      changeYaml = parts[1].trim();
    }

    if (convertedContent.includes(CONTENT_DELIMITER)) {
      const parts = convertedContent.split(CONTENT_DELIMITER);
      convertedContent = parts[0].trim();
    }

    // Ensure target directory exists
    if (saveAs === "article") {
      const articlesDir = join(process.cwd(), "content/articles");
      if (!existsSync(articlesDir)) {
        mkdirSync(articlesDir, { recursive: true });
      }
    }

    // Write converted content
    writeTextFile(targetPath, convertedContent);

    // Write memory change record
    try {
      if (changeYaml) {
        writeChangeRecord(changeYaml, targetPath);
      } else {
        // Fallback: write a basic change record
        const fallbackYaml = `id: "chg-${tag}-import"
timestamp: "${nowTs}"
actor: "user+agent"
intent: "import_markdown"
paths:
  - "${targetPath}"
  - "${memoryPathForFile(targetPath)}"
summary: "Imported ${filename} and converted to Selfware canonical format."
rollback_hint: "git checkout -- ${targetPath}"`;
        writeChangeRecord(fallbackYaml, targetPath);
      }
    } catch (memErr) {
      console.error("Warning: failed to write change record:", memErr);
    }

    try {
      appendActionRecord(
        `## ${nowTs} — 新增内容: ${sanitizeFilename(filename)}\n\n` +
        `- **路径**: \`${targetPath}\`\n` +
        `- **类型**: ${saveAs === "article" ? "文章 (content/articles/)" : "主文档 (canonical)"}\n` +
        `- **来源**: 用户导入\n` +
        `- **可用操作**: 阅读(doc)、大纲(outline)、脑图(mindmap)、画布(canvas)、演示(presentation)、卡片(card)、AI 编辑、导出 .self\n` +
        `- **记忆文件**: \`${memoryPathForFile(targetPath)}\`\n`
      );
    } catch {
      /* actions record is best-effort */
    }

    return NextResponse.json({
      status: "success",
      path: targetPath,
      filename: sanitizeFilename(filename),
      lang,
      saveAs,
      contentLength: convertedContent.length,
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Import failed: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 }
    );
  }
}
