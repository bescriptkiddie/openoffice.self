"use client";

import { useEffect, useState, useMemo } from "react";
import { useLang } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import { VIEWS, ARCHIVE_LINK, type Article } from "@/lib/types";
import Link from "next/link";

// ─── Extract preamble (before first ---) for focused demo ───
function extractPreamble(text: string): string {
  const idx = text.indexOf("\n---");
  return idx > 0 ? text.slice(0, idx) : text.slice(0, 600);
}

// ─── Mini renderers for the Hero demo ───
function MiniDoc({ text }: { text: string }) {
  const preamble = extractPreamble(text);
  const lines = preamble.split("\n").filter(Boolean);
  return (
    <div className="space-y-1.5 text-[13px] leading-relaxed text-[var(--text)]">
      {lines.map((line, i) => {
        if (line.startsWith("# "))
          return <div key={i} className="text-base font-bold mb-1">{line.replace(/^#+\s*/, "")}</div>;
        if (line.startsWith("## "))
          return <div key={i} className="text-sm font-semibold text-[var(--accent)] mt-2">{line.replace(/^#+\s*/, "")}</div>;
        if (line.startsWith("> "))
          return <div key={i} className="border-l-2 border-[var(--accent)] pl-3 text-[var(--muted)] italic text-xs">{line.replace(/^>\s*/, "")}</div>;
        if (line.startsWith("- "))
          return <div key={i} className="flex items-start gap-1.5 text-xs text-[var(--muted)]"><span className="text-[var(--accent)] mt-0.5">•</span><span>{line.replace(/^-\s*/, "")}</span></div>;
        return <div key={i} className="text-[var(--muted)] text-xs">{line}</div>;
      })}
    </div>
  );
}

function MiniOutline({ text }: { text: string }) {
  const preamble = extractPreamble(text);
  const lines = preamble.split("\n");
  // Build outline: headings with their child bullets
  const nodes: { level: number; label: string; children: string[] }[] = [];
  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      nodes.push({ level: headingMatch[1].length, label: headingMatch[2], children: [] });
    } else if (line.startsWith("- ") && nodes.length > 0) {
      nodes[nodes.length - 1].children.push(line.replace(/^-\s*/, "").replace(/\*\*/g, ""));
    }
  }
  return (
    <div className="space-y-1.5">
      {nodes.map((node, i) => (
        <div key={i}>
          <div
            className="flex items-center gap-2 text-xs"
            style={{ paddingLeft: (node.level - 1) * 16 }}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                background: node.level === 1 ? "var(--accent)" : node.level === 2 ? "var(--accent-2)" : "var(--border)",
              }}
            />
            <span className={node.level <= 2 ? "font-semibold text-[var(--text)]" : "text-[var(--muted)]"}>
              {node.label}
            </span>
          </div>
          {node.children.length > 0 && (
            <div className="ml-8 mt-0.5 space-y-0.5">
              {node.children.slice(0, 3).map((c, j) => (
                <div key={j} className="text-[10px] text-[var(--muted)] truncate">
                  ├─ {c}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MiniSlide({ text }: { text: string }) {
  const preamble = extractPreamble(text);
  const h1Match = preamble.match(/^#\s+(.+)/m);
  const title = h1Match ? h1Match[1].trim() : "Selfware";
  // Get blockquote lines as subtitle
  const quoteLines = preamble.split("\n").filter((l) => l.startsWith("> ")).map((l) => l.replace(/^>\s*/, ""));
  // Get H2 headings as slide bullets
  const h2s = preamble.split("\n").filter((l) => l.startsWith("## ")).map((l) => l.replace(/^##\s*/, ""));
  return (
    <div className="flex flex-col items-center justify-center text-center h-full py-2">
      <div className="text-lg font-bold bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-transparent mb-2">{title}</div>
      {quoteLines.length > 0 && (
        <div className="text-[11px] text-[var(--muted)] italic leading-relaxed max-w-[85%] mb-4">
          {quoteLines[0]}
        </div>
      )}
      <div className="flex gap-6 mt-1">
        {h2s.slice(0, 3).map((h, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-sm">
              {["🧬", "👁", "🧠"][i] || "✦"}
            </div>
            <span className="text-[10px] font-medium text-[var(--text)]">{h}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 text-[10px] text-[var(--border)] font-mono">1 / 3</div>
    </div>
  );
}

// ─── Change record type ───
interface ChangeEntry {
  id: string;
  timestamp: string;
  actor: string;
  intent: string;
  summary: string;
}

// ─── Main page ───
export default function SelfPage() {
  const { lang } = useLang();
  const [selfData, setSelfData] = useState<{
    path: string;
    sha256: string;
    content: string;
  } | null>(null);
  const [caps, setCaps] = useState<Record<string, unknown> | null>(null);
  const [changes, setChanges] = useState<{ total: number; changes: ChangeEntry[] }>({ total: 0, changes: [] });
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [demoTab, setDemoTab] = useState(0);
  const [autoCycle, setAutoCycle] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [contentSnippet, setContentSnippet] = useState("");

  useEffect(() => {
    fetch(`/api/self-info?lang=${lang}`)
      .then((r) => r.json())
      .then(setSelfData)
      .catch(console.error);
    fetch("/api/capabilities")
      .then((r) => r.json())
      .then(setCaps)
      .catch(console.error);
    fetch("/api/changes")
      .then((r) => r.json())
      .then(setChanges)
      .catch(console.error);
    fetch("/api/articles")
      .then((r) => r.json())
      .then((d) => setRecentArticles((d.articles || []).slice(0, 3)))
      .catch(console.error);
    fetch(`/api/content?lang=${lang}`)
      .then((r) => r.json())
      .then((d) => setContentSnippet(d.content || ""))
      .catch(console.error);
  }, [lang]);

  // Auto-cycle demo tabs (pauses on manual click, resumes after 8s)
  useEffect(() => {
    if (!autoCycle) {
      const resume = setTimeout(() => setAutoCycle(true), 8000);
      return () => clearTimeout(resume);
    }
    const timer = setInterval(() => {
      setDemoTab((prev) => (prev + 1) % 3);
    }, 3500);
    return () => clearInterval(timer);
  }, [autoCycle]);

  const demoTabs = useMemo(
    () => [
      { label: lang === "zh" ? "文档" : "Doc", icon: "📄" },
      { label: lang === "zh" ? "大纲" : "Outline", icon: "📝" },
      { label: lang === "zh" ? "演示" : "Slides", icon: "📊" },
    ],
    [lang]
  );

  const viewCards = VIEWS.filter((v) => v.path !== "/");
  const recentChanges = changes.changes.slice(0, 5);

  const capsData = caps as Record<string, unknown> | null;
  const writeScope = capsData?.write_scope ? String(capsData.write_scope) : "content/";
  const confirmRequired = Array.isArray(capsData?.confirmation_required)
    ? (capsData.confirmation_required as string[])
    : [];
  const agentInteraction = capsData?.agent_interaction as Record<string, unknown> | undefined;

  return (
    <div className="max-w-[1200px] mx-auto px-6 pb-18">

      {/* ═══ Section 1: Hero ═══ */}
      <div className="card p-8 lg:p-10 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 items-start">
          {/* Left: Story */}
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-3 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-transparent leading-tight">
              A File Is An App
            </h1>
            <p className="text-[var(--muted)] text-sm leading-relaxed mb-6">
              {lang === "zh"
                ? "Selfware 让一个 markdown 文件变成活的制品——它有身份、有多种视图、有记忆、有协议驱动的 AI 编辑。不是 viewer，是 runtime。"
                : "Selfware turns a single markdown file into a living artifact — with identity, multiple views, memory, and protocol-driven AI editing. Not a viewer — a runtime."}
            </p>
            <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
              <span className="px-2 py-1 rounded-md bg-[var(--accent)]/10 text-[var(--accent)] font-mono">
                {selfData?.path || "..."}
              </span>
              <span className="opacity-40">•</span>
              <span className="font-mono">
                SHA {selfData?.sha256?.slice(0, 12) || "..."}
              </span>
            </div>
          </div>

          {/* Right: Live demo */}
          <div>
            {/* Source file indicator */}
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--good)] opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--good)]" />
              </span>
              <span className="text-[11px] font-mono text-[var(--muted)]">
                {selfData?.path || "selfware_demo.md"} → {demoTabs[demoTab].label}
              </span>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 mb-3">
              {demoTabs.map((tab, i) => (
                <button
                  key={i}
                  onClick={() => { setDemoTab(i); setAutoCycle(false); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer
                    border transition-all
                    ${i === demoTab
                      ? "bg-[var(--accent)]/12 border-[var(--accent)]/30 text-[var(--accent)]"
                      : "bg-transparent border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
                    }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Demo content */}
            <div
              className={`bg-[var(--panel-2)] border border-[var(--border)] rounded-xl p-4 h-[220px] transition-all ${hovered ? "overflow-y-auto" : "overflow-hidden"}`}
              onMouseEnter={() => { setHovered(true); setAutoCycle(false); }}
              onMouseLeave={() => { setHovered(false); setAutoCycle(true); }}
            >
              {contentSnippet ? (
                <>
                  {demoTab === 0 && <MiniDoc text={contentSnippet} />}
                  {demoTab === 1 && <MiniOutline text={contentSnippet} />}
                  {demoTab === 2 && <MiniSlide text={contentSnippet} />}
                </>
              ) : (
                <div className="animate-pulse text-[var(--muted)] text-sm">
                  {t("self.loading", lang)}
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-2 mt-3 px-3 py-1.5 rounded-lg bg-[var(--accent)]/5 border border-[var(--accent)]/15">
              <span className="text-xs font-medium text-[var(--accent)]">
                ↑ {lang === "zh" ? "同一份文件，三种投影。数据不变，视图随心。" : "Same file, three projections. Data stays, views change."}
              </span>
            </div>
        </div>
      </div>
      </div>

      {/* ═══ Section 2: Anatomy — What's inside this file ═══ */}
      <div className="mb-8">
        <h2 className="text-xs font-bold text-[var(--muted)] tracking-widest uppercase mb-4 px-1">
          {lang === "zh" ? "这个文件里有什么" : "What's inside this file"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Identity */}
          <div className="card p-5">
            <div className="text-xl mb-2">🧬</div>
            <div className="text-sm font-bold mb-1">{lang === "zh" ? "身份" : "Identity"}</div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              {lang === "zh"
                ? "协议版本、SHA-256 哈希、canonical 路径——这个文件知道自己是什么。"
                : "Protocol version, SHA-256 hash, canonical path — this file knows what it is."}
            </p>
            <div className="mt-3 text-[10px] font-mono text-[var(--accent)] truncate">
              {selfData?.sha256?.slice(0, 20) || "..."}…
            </div>
          </div>

          {/* Views */}
          <div className="card p-5">
            <div className="text-xl mb-2">👁</div>
            <div className="text-sm font-bold mb-1">{lang === "zh" ? "n 种视图" : "n Views"}</div>
            <p className="text-xs text-[var(--muted)] leading-relaxed mb-3">
              {lang === "zh"
                ? "同一份数据，n 种投影方式。"
                : "Same data, n different projections."}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {viewCards.map((v) => (
                <span key={v.path} className="text-sm" title={v.name}>{v.icon}</span>
              ))}
            </div>
          </div>

          {/* Memory */}
          <div className="card p-5">
            <div className="text-xl mb-2">🧠</div>
            <div className="text-sm font-bold mb-1">{lang === "zh" ? "记忆" : "Memory"}</div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              {lang === "zh"
                ? "每次变更都被追踪：谁、何时、为什么、怎么回滚。"
                : "Every change is tracked: who, when, why, how to rollback."}
            </p>
            <div className="mt-3 text-sm font-bold text-[var(--accent)]">
              {changes.total} {lang === "zh" ? "条变更记录" : "change records"}
            </div>
          </div>

          {/* Protocol */}
          <div className="card p-5">
            <div className="text-xl mb-2">📜</div>
            <div className="text-sm font-bold mb-1">{lang === "zh" ? "协议" : "Protocol"}</div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              {lang === "zh"
                ? "AI 遵循严格规则：不能静默修改，写入受限，必须确认。"
                : "AI follows strict rules: no silent edits, scoped writes, mandatory confirmation."}
            </p>
            <div className="mt-3 text-[10px] text-[var(--good)] font-medium">
              ✓ {lang === "zh" ? "协议强制执行中" : "Protocol enforced"}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Section 3: Live Views ═══ */}
      <div className="mb-8">
        <h2 className="text-xs font-bold text-[var(--muted)] tracking-widest uppercase mb-4 px-1">
          {lang === "zh" ? "选择视图" : "Choose a view"}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {viewCards.map((v) => (
            <Link
              key={v.path}
              href={v.path}
              className="card p-4 flex flex-col items-center gap-2 text-center
                no-underline transition-all hover:-translate-y-1 hover:border-[var(--accent)]/30
                hover:shadow-lg group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{v.icon}</span>
              <span className="text-xs font-bold text-[var(--text)]">{v.name}</span>
              <span className="text-[10px] text-[var(--muted)] leading-tight">
                {v.description?.[lang] || ""}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ═══ Section 4: Memory Timeline ═══ */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">🧠</span>
            <h2 className="text-sm font-bold text-[var(--accent)] tracking-wider uppercase">
              {lang === "zh" ? "这个文件会记忆" : "This File Remembers"}
            </h2>
          </div>
          <span className="text-xs text-[var(--muted)] font-mono">
            {changes.total} {lang === "zh" ? "条记录" : "records"}
          </span>
        </div>

        {recentChanges.length > 0 ? (
          <div className="space-y-3">
            {recentChanges.map((c) => (
              <div key={c.id} className="flex items-start gap-3">
                {/* Timeline dot */}
                <div className="mt-1.5 shrink-0">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: c.actor.includes("user") ? "var(--accent)" : "var(--accent-2)",
                    }}
                  />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono text-[var(--muted)]">
                      {new Date(c.timestamp).toLocaleDateString()}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{
                        background: c.actor.includes("user")
                          ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                          : "color-mix(in srgb, var(--accent-2) 15%, transparent)",
                        color: c.actor.includes("user") ? "var(--accent)" : "var(--accent-2)",
                      }}
                    >
                      {c.actor}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text)] leading-relaxed truncate">
                    {c.intent}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--muted)] text-sm animate-pulse">
            {t("self.loading", lang)}
          </p>
        )}
      </div>

      {/* ═══ Section 5: Article Archive ═══ */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">{ARCHIVE_LINK.icon}</span>
            <h2 className="text-sm font-bold text-[var(--accent)] tracking-wider uppercase">
              {ARCHIVE_LINK.description?.[lang] || ARCHIVE_LINK.name}
            </h2>
          </div>
          <Link
            href={ARCHIVE_LINK.path}
            className="text-xs text-[var(--muted)] no-underline hover:text-[var(--accent)] transition-colors"
          >
            {lang === "zh" ? "查看全部 →" : "View all →"}
          </Link>
        </div>

        {recentArticles.length > 0 ? (
          <div className="space-y-2">
            {recentArticles.map((art) => (
              <Link
                key={art.filename}
                href={`/doc?path=${encodeURIComponent(art.path)}`}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl
                  bg-[var(--panel-2)] border border-[var(--border)]
                  text-[var(--text)] no-underline text-sm
                  transition-all hover:-translate-y-px hover:border-[var(--accent)]/30
                  hover:shadow-md group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[var(--muted)] font-mono text-xs shrink-0">
                    {art.date || "—"}
                  </span>
                  <span className="truncate group-hover:text-[var(--accent)] transition-colors">
                    {art.title}
                  </span>
                </div>
                <span className="text-[10px] text-[var(--muted)] shrink-0 ml-2">
                  {art.size > 1024 ? `${(art.size / 1024).toFixed(1)}KB` : `${art.size}B`}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-[var(--muted)] text-sm text-center py-4">
            {lang === "zh" ? "暂无文章" : "No articles yet"}
          </p>
        )}
      </div>

      {/* ═══ Section 6: Protocol Rules ═══ */}
      <div className="mb-8">
        <h2 className="text-xs font-bold text-[var(--muted)] tracking-widest uppercase mb-4 px-1">
          {lang === "zh" ? "AI 如何与这个文件交互" : "How AI interacts with this file"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="text-xl mb-2">🔒</div>
            <div className="text-sm font-bold mb-1">{lang === "zh" ? "受限写入" : "Scoped Writes"}</div>
            <p className="text-xs text-[var(--muted)] leading-relaxed mb-2">
              {lang === "zh"
                ? "AI 只能写入指定目录，不能随意修改协议文件。"
                : "AI can only write to designated directories. Protocol files are read-only."}
            </p>
            <div className="text-[10px] font-mono px-2 py-1 rounded bg-[var(--panel-2)] text-[var(--accent)] inline-block">
              {writeScope}
            </div>
          </div>

          <div className="card p-5">
            <div className="text-xl mb-2">✋</div>
            <div className="text-sm font-bold mb-1">{lang === "zh" ? "需要确认" : "Confirmation Required"}</div>
            <p className="text-xs text-[var(--muted)] leading-relaxed mb-2">
              {lang === "zh"
                ? "敏感操作必须经用户明确批准才能执行。"
                : "Sensitive operations require explicit user approval before execution."}
            </p>
            <div className="flex flex-wrap gap-1">
              {confirmRequired.slice(0, 4).map((action) => (
                <span
                  key={action}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]"
                >
                  {action}
                </span>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="text-xl mb-2">🤖</div>
            <div className="text-sm font-bold mb-1">{lang === "zh" ? "不能静默修改" : "No Silent Apply"}</div>
            <p className="text-xs text-[var(--muted)] leading-relaxed mb-2">
              {lang === "zh"
                ? "每次编辑都生成变更记录，包含意图、路径和回滚方法。"
                : "Every edit generates a change record with intent, paths, and rollback instructions."}
            </p>
            <div className="text-[10px] text-[var(--good)] font-medium">
              {agentInteraction?.no_silent_apply ? "✓ " : ""}
              {lang === "zh" ? "强制变更追踪" : "Mandatory change tracking"}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
