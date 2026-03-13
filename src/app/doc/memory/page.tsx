"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLang } from "@/lib/hooks";

interface ChangeEntry {
  id: string;
  timestamp: string;
  actor: string;
  intent: string;
  summary: string;
  paths: string[];
  rollback_hint: string;
}

export default function MemoryPage() {
  const { lang } = useLang();
  const searchParams = useSearchParams();
  const contentPath = searchParams.get("path") || "";
  const [changes, setChanges] = useState<ChangeEntry[]>([]);
  const [memoryPath, setMemoryPath] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contentPath) return;
    setLoading(true);
    fetch(`/api/changes?path=${encodeURIComponent(contentPath)}`)
      .then((r) => r.json())
      .then((d) => {
        setChanges(d.changes || []);
        setMemoryPath(d.memoryPath || "");
      })
      .catch(() => setChanges([]))
      .finally(() => setLoading(false));
  }, [contentPath]);

  const fileName = contentPath.split("/").pop()?.replace(".md", "") || contentPath;

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto px-6 py-10">
        <div className="animate-pulse text-[var(--muted)] text-sm">
          {lang === "zh" ? "加载中..." : "Loading..."}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto px-6 pb-20">
      <div className="card p-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🧠</span>
          <h1 className="text-xl font-bold text-[var(--text)]">
            {lang === "zh" ? "文件记忆" : "File Memory"}
          </h1>
        </div>
        <p className="text-xs text-[var(--muted)] mb-1">{fileName}</p>
        <p className="text-[10px] font-mono text-[var(--muted)] mb-6">
          {memoryPath || "—"}
        </p>

        {changes.length === 0 ? (
          <div className="text-center py-12 text-[var(--muted)] text-sm">
            {lang === "zh"
              ? "这个文件还没有变更记录。通过 AI 编辑产生的修改会自动记录在这里。"
              : "No change records yet. Changes made via AI editing will be recorded here."}
          </div>
        ) : (
          <div className="space-y-4">
            {changes.map((c) => (
              <div
                key={c.id}
                className="border border-[var(--border)] rounded-xl p-4 hover:border-[var(--accent)]/20 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      background: c.actor.includes("user") ? "var(--accent)" : "var(--accent-2)",
                    }}
                  />
                  <span className="text-xs font-mono text-[var(--muted)]">
                    {new Date(c.timestamp).toLocaleString()}
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
                <p className="text-sm text-[var(--text)] leading-relaxed mb-2">
                  {c.summary || c.intent}
                </p>
                {c.rollback_hint && (
                  <div className="text-[10px] font-mono text-[var(--muted)] bg-[var(--panel-2)] rounded-md px-2 py-1 inline-block">
                    ↩ {c.rollback_hint}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
