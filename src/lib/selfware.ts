import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, basename } from "path";
import { createHash } from "crypto";
import type { Lang, CapabilitiesPayload } from "./types";

const PROJECT_ROOT = process.cwd();
const CANONICAL_PATH = "content/selfware_demo.md";
const MEMORY_CHANGES_PATH = "content/memory/changes.md";
const MEMORY_ACTIONS_PATH = "content/memory/actions.md";
const SUPPORTED_LANGS: Lang[] = ["zh", "en"];

export function normalizeLang(lang: string | null | undefined): Lang | null {
  if (!lang) return null;
  const v = String(lang).trim().toLowerCase();
  if (v === "zh" || v.startsWith("zh-")) return "zh";
  if (v === "en" || v.startsWith("en-")) return "en";
  return null;
}

export function canonicalPathForLang(lang: Lang | null): string {
  if (lang === "en") return "content/selfware_demo.en.md";
  return CANONICAL_PATH;
}

export function protocolPathForLang(lang: Lang | null): string {
  if (lang === "en") return "selfware.en.md";
  return "selfware.md";
}

function normalizeTextForHash(s: string): string {
  let normalized = (s || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (!normalized.endsWith("\n")) normalized += "\n";
  return normalized;
}

export function sha256Text(s: string): string {
  return createHash("sha256")
    .update(normalizeTextForHash(s), "utf-8")
    .digest("hex");
}

export function readTextFile(path: string): string {
  return readFileSync(join(PROJECT_ROOT, path), "utf-8");
}

export function writeTextFile(path: string, content: string): void {
  const fullPath = join(PROJECT_ROOT, path);
  writeFileSync(fullPath, content, "utf-8");
}

export function fileExists(path: string): boolean {
  return existsSync(join(PROJECT_ROOT, path));
}

/**
 * Resolve the memory file path for a given content file.
 * - Canonical files (content/selfware_demo*.md) → content/memory/changes.md (global)
 * - Article files (content/articles/xxx.md) → content/articles/xxx.memory.md (per-file)
 * - Other content/ files → content/memory/changes.md (fallback to global)
 */
export function memoryPathForFile(contentPath: string): string {
  if (contentPath.startsWith("content/articles/") && contentPath.endsWith(".md")) {
    return contentPath.replace(/\.md$/, ".memory.md");
  }
  return MEMORY_CHANGES_PATH;
}

export function writeChangeRecord(changeYaml: string, contentPath?: string): void {
  if (!changeYaml) return;

  let cleaned = changeYaml.trim();
  if (cleaned.startsWith("```")) {
    const lines = cleaned.split("\n");
    lines.shift();
    while (lines.length && lines[lines.length - 1].trim().startsWith("```")) {
      lines.pop();
    }
    cleaned = lines.join("\n").trim();
  }

  let chgId = "";
  for (const line of cleaned.split("\n")) {
    if (line.trim().startsWith("id:")) {
      chgId = line.split(":", 2)[1].trim().replace(/['"]/g, "");
      break;
    }
  }

  const record = `\n---\n\n## id: ${chgId}\n\n\`\`\`yaml\n${cleaned}\n\`\`\`\n`;

  // Determine memory file path
  const memPath = contentPath ? memoryPathForFile(contentPath) : MEMORY_CHANGES_PATH;
  const fullPath = join(PROJECT_ROOT, memPath);

  // Ensure parent directory exists
  const dirPath = join(fullPath, "..");
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }

  if (memPath !== MEMORY_CHANGES_PATH && !existsSync(fullPath)) {
    const baseName = basename(contentPath || "");
    const nowIso = new Date().toISOString().replace(/\.\d+Z$/, "Z");
    const header = [
      "---",
      "selfware:",
      "  role: memory_changes",
      `  title: "Change Records for ${baseName}"`,
      `  purpose: "对该文件的每次变更记录元数据（可审计、可协作、可回滚）。"`,
      `  scope: "记录 ${contentPath} 的内容变更；内容可简短但必须可追溯。"`,
      "  update_policy: append_only",
      "  owner: user",
      `  created_at: "${nowIso}"`,
      `  updated_at: "${nowIso}"`,
      "---",
      "",
      `# Change Records: ${baseName}`,
      "",
      "## Template",
      "",
      "```yaml",
      'id: "chg-YYYYMMDD-HHMMSS-xxx"',
      'timestamp: "YYYY-MM-DDThh:mm:ssZ"',
      'actor: "user|agent|service"',
      'intent: "add_memory|update_protocol|fix_overflow|pack|..."',
      "paths:",
      '  - "path/to/file"',
      'summary: "What changed and why (human readable)."',
      'rollback_hint: "git revert <ref> | manual steps"',
      'notes: "optional"',
      "```",
      "",
    ].join("\n");
    writeFileSync(fullPath, header, "utf-8");
  }

  let existing = existsSync(fullPath) ? readFileSync(fullPath, "utf-8") : "";

  const nowIsoUpdate = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  existing = existing.replace(
    /^(\s*updated_at:\s*)"[^"]*"/m,
    `$1"${nowIsoUpdate}"`
  );

  writeFileSync(fullPath, existing + record, "utf-8");
}

export function appendActionRecord(entry: string): void {
  const fullPath = join(PROJECT_ROOT, MEMORY_ACTIONS_PATH);
  if (!existsSync(fullPath)) return;

  const nowIsoUpdate = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  let existing = readFileSync(fullPath, "utf-8");
  existing = existing.replace(
    /^(\s*updated_at:\s*)"[^"]*"/m,
    `$1"${nowIsoUpdate}"`
  );

  writeFileSync(fullPath, existing + "\n---\n\n" + entry.trim() + "\n", "utf-8");
}

function getGitInfo(): Record<string, unknown> {
  try {
    const { execSync } = require("child_process");
    execSync("git rev-parse --is-inside-work-tree", {
      stdio: "ignore",
      cwd: PROJECT_ROOT,
    });

    const safe = (cmd: string): string => {
      try {
        return execSync(cmd, { cwd: PROJECT_ROOT, stdio: ["pipe", "pipe", "ignore"] })
          .toString()
          .trim();
      } catch {
        return "";
      }
    };

    const remotesRaw = safe("git remote");
    const remotes = remotesRaw ? remotesRaw.split("\n").filter(Boolean) : [];

    const info: Record<string, unknown> = {
      is_repo: true,
      head: safe("git rev-parse HEAD"),
      branch: safe("git branch --show-current"),
      remotes,
    };

    if (remotes.length) {
      const remoteUrls: Record<string, string> = {};
      for (const r of remotes) {
        remoteUrls[r] = safe(`git remote get-url ${r}`);
      }
      info.remote_urls = remoteUrls;
    }

    return info;
  } catch {
    return { is_repo: false };
  }
}

export function capabilitiesPayload(baseUrl: string = ""): CapabilitiesPayload {
  const payload: CapabilitiesPayload = {
    protocol: {
      path: "selfware.md",
      translations: [{ lang: "en", path: "selfware.en.md" }],
    },
    canonical: {
      path: CANONICAL_PATH,
      variants: [
        { lang: "zh", path: CANONICAL_PATH },
        { lang: "en", path: "content/selfware_demo.en.md" },
      ],
    },
    languages: { supported: [...SUPPORTED_LANGS] },
    write_scope: ["content/"],
    confirmation_required: [
      "pack",
      "publish",
      "send_context",
      "pull_merge",
      "apply_updates",
    ],
    agent_interaction: {
      proactive_prompting: true,
      no_silent_apply: true,
      note: "When a capability is supported but not enabled / missing config / has strategy branches, the agent should ask the user before any write or outbound request.",
    },
    endpoints: {
      content_get: "/api/content",
      content_save: "/api/save",
      chat_edit: "/api/chat-edit",
      self_get: "/api/self-info",
      protocol_get: "/api/protocol",
      manifest_get: "/api/manifest",
      capabilities_get: "/api/capabilities",
      check_update: "/api/check-update",
      proxy: "/api/proxy",
    },
    modules: {
      pack_self: { supported: true },
      local_git: getGitInfo(),
      discovery: {
        supported: true,
        enabled: false,
        endpoint_example: "https://floatboat.ai/discovery/",
      },
      ecosystem: { supported: true, artifact_sha256_required: true },
      self_analysis: { supported: true, implemented: false },
    },
  };

  if (baseUrl) {
    payload.base_url = baseUrl;
  }

  return payload;
}

export function listArticles(): {
  articles: Array<Record<string, unknown>>;
  grouped: Record<string, Array<Record<string, unknown>>>;
  total: number;
} {
  const articles: Array<Record<string, unknown>> = [];

  // 1. Scan content/articles/
  const articlesDir = join(PROJECT_ROOT, "content/articles");
  if (existsSync(articlesDir)) {
    const files = readdirSync(articlesDir)
      .filter((f) => f.endsWith(".md") && !f.endsWith(".memory.md"))
      .sort()
      .reverse();

    for (const filename of files) {
      const filepath = join(articlesDir, filename);
      try {
        const stat = statSync(filepath);
        const content = readFileSync(filepath, "utf-8").slice(0, 2000);

        const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})/);
        const date = dateMatch ? dateMatch[1] : null;

        let title = filename.replace(".md", "");
        const frontTitle = content.match(/^title:\s*['"]?(.+?)['"]?\s*$/m);
        if (frontTitle) title = frontTitle[1].trim();

        let category: string | null = null;
        const catMatch = content.match(/^category:\s*['"]?(.+?)['"]?\s*$/m);
        if (catMatch) category = catMatch[1].trim();

        articles.push({
          filename,
          path: `content/articles/${filename}`,
          date,
          title,
          category,
          size: stat.size,
        });
      } catch {
        continue;
      }
    }
  }


  // Group by year-month
  const grouped: Record<string, Array<Record<string, unknown>>> = {};
  for (const art of articles) {
    const date = (art.date as string) || "_imported";
    const yearMonth = date.startsWith("_") ? date : (date.length >= 7 ? date.slice(0, 7) : date);
    if (!grouped[yearMonth]) grouped[yearMonth] = [];
    grouped[yearMonth].push(art);
  }

  return { articles, grouped, total: articles.length };
}
