"use client";

import { useLang, useContent } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import { useMemo, useState } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";

type SplitMode = "single" | "heading" | "separator";

function splitCards(md: string, mode: SplitMode): string[] {
  if (mode === "single") return [md];

  if (mode === "heading") {
    const parts: string[] = [];
    let current: string[] = [];

    for (const line of md.split("\n")) {
      if (line.match(/^##\s+/) && current.length > 0) {
        parts.push(current.join("\n").trim());
        current = [];
      }
      current.push(line);
    }
    if (current.length) parts.push(current.join("\n").trim());
    return parts.filter(Boolean);
  }

  // separator mode
  return md.split(/\n---\n/).map((s) => s.trim()).filter(Boolean);
}

export default function CardPage() {
  const { lang } = useLang();
  const { content, loading } = useContent(lang);
  const [mode, setMode] = useState<SplitMode>("heading");
  const cards = useMemo(() => splitCards(content, mode), [content, mode]);

  const modes: { id: SplitMode; label: string }[] = [
    { id: "single", label: lang === "zh" ? "长图文" : "Longform" },
    { id: "heading", label: lang === "zh" ? "按标题分" : "By headings" },
    { id: "separator", label: lang === "zh" ? "按分割线分" : "By separator" },
  ];

  if (loading) {
    return (
      <div className="max-w-[900px] mx-auto px-6 py-10">
        <div className="animate-pulse text-[var(--muted)]">
          {t("self.loading", lang)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-6 pb-20">
      {/* Mode selector */}
      <div className="flex gap-2 mb-6 justify-center">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer
              border transition-colors
              ${
                m.id === mode
                  ? "bg-[var(--accent)]/15 border-[var(--accent)]/30 text-[var(--accent)]"
                  : "bg-[var(--panel)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
              }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-6">
        {cards.map((cardContent, i) => (
          <div
            key={i}
            className="card p-8 transition-transform hover:-translate-y-0.5 hover:shadow-xl"
          >
            <MarkdownRenderer content={cardContent} />
          </div>
        ))}
      </div>
    </div>
  );
}
