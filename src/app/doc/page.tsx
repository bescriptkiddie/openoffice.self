"use client";

import { useLang, useContent, useToast } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import { useEffect, useState } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface ChangeEntry {
  id: string;
  timestamp: string;
  actor: string;
  intent: string;
  summary: string;
}

function exportWithMemory(path: string) {
  const url = `/api/export?path=${encodeURIComponent(path)}&format=bundle`;
  const a = document.createElement("a");
  a.href = url;
  a.download = "";
  a.click();
}

export default function DocPage() {
  const { lang } = useLang();
  const { content, contentPath, loading, refetch } = useContent(lang);
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [changes, setChanges] = useState<ChangeEntry[]>([]);

  useEffect(() => {
    function onContentUpdated(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === "string") refetch();
    }
    window.addEventListener("selfware-content-updated", onContentUpdated);
    return () =>
      window.removeEventListener("selfware-content-updated", onContentUpdated);
  }, [refetch]);

  // Fetch per-file change history
  useEffect(() => {
    if (!contentPath) return;
    fetch(`/api/changes?path=${encodeURIComponent(contentPath)}`)
      .then((r) => r.json())
      .then((d) => setChanges(d.changes || []))
      .catch(() => setChanges([]));
  }, [contentPath]);

  async function handleSave() {
    try {
      const payload: Record<string, string> = { content: editText, lang };
      if (contentPath) payload.path = contentPath;
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.show(t("global.saved_source", lang));
        setEditing(false);
        refetch();
      } else {
        toast.show(t("global.save_failed", lang));
      }
    } catch {
      toast.show(t("global.save_failed", lang));
    }
  }

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto px-6 py-10">
        <div className="animate-pulse text-[var(--muted)]">
          {t("self.loading", lang)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto px-6 pb-20">
      {/* Edit Source toggle */}
      <div className="flex justify-end mb-4 gap-2">
        {editing ? (
          <>
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 rounded-md text-xs font-medium
                bg-[var(--panel)] border border-[var(--border)] text-[var(--muted)]
                cursor-pointer hover:text-[var(--text)] transition-colors"
            >
              {t("global.close", lang)}
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 rounded-md text-xs font-medium
                bg-[var(--accent)] text-black cursor-pointer
                hover:opacity-90 transition-opacity"
            >
              {t("global.save_changes", lang)}
            </button>
          </>
        ) : (
          <>
            {contentPath && (
              <button
                onClick={() => {
                  exportWithMemory(contentPath);
                  toast.show(t("export.success", lang));
                }}
                className="px-3 py-1.5 rounded-md text-xs font-medium
                  bg-[var(--panel)] border border-[var(--border)] text-[var(--muted)]
                  cursor-pointer hover:text-[var(--text)] transition-colors
                  flex items-center gap-1"
              >
                📤 {t("export.with_memory", lang)}
              </button>
            )}
            <button
              onClick={() => {
                setEditText(content);
                setEditing(true);
              }}
              className="px-3 py-1.5 rounded-md text-xs font-medium
                bg-[var(--panel)] border border-[var(--border)] text-[var(--muted)]
                cursor-pointer hover:text-[var(--text)] transition-colors"
            >
              {t("global.edit_source", lang)}
            </button>
          </>
        )}
      </div>

      {editing ? (
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="w-full min-h-[70vh] p-4 rounded-xl
            bg-[var(--panel)] border border-[var(--border)]
            text-[var(--text)] font-mono text-sm leading-relaxed
            resize-y outline-none focus:border-[var(--accent)]/30"
        />
      ) : (
        <div className="card p-8 lg:p-12">
          <MarkdownRenderer content={content} />
        </div>
      )}

      {changes.length > 0 && (
        <div className="card p-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🧠</span>
            <h3 className="text-sm font-bold text-[var(--accent)] tracking-wider uppercase">
              {lang === "zh" ? "文件记忆" : "File Memory"}
            </h3>
            <span className="text-[10px] text-[var(--muted)] font-mono ml-auto">
              {changes.length} {lang === "zh" ? "条记录" : "records"}
            </span>
          </div>
          <div className="space-y-2.5">
            {changes.slice(0, 10).map((c) => (
              <div key={c.id} className="flex items-start gap-3">
                <div className="mt-1.5 shrink-0">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: c.actor.includes("user") ? "var(--accent)" : "var(--accent-2)",
                    }}
                  />
                </div>
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
                    {c.summary || c.intent}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
