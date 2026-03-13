"use client";

import { useLang, useContent } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import { useMemo, useState } from "react";

interface OutlineNode {
  level: number;
  text: string;
  children: OutlineNode[];
}

function parseOutline(md: string): OutlineNode[] {
  const lines = md.split("\n");
  const root: OutlineNode[] = [];
  const stack: { level: number; node: OutlineNode }[] = [];

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (!match) continue;

    const level = match[1].length;
    const text = match[2].trim();
    const node: OutlineNode = { level, text, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }
    stack.push({ level, node });
  }

  return root;
}

function OutlineItem({
  node,
  depth = 0,
}: {
  node: OutlineNode;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div style={{ paddingLeft: depth * 20 }}>
      <div
        className="flex items-start gap-2 py-1.5 px-2 rounded-lg cursor-pointer
          hover:bg-[var(--panel-2)] transition-colors group"
        onClick={() => setExpanded(!expanded)}
      >
        {hasChildren ? (
          <span
            className={`text-[10px] text-[var(--muted)] mt-1.5 transition-transform ${expanded ? "rotate-90" : ""}`}
          >
            ▶
          </span>
        ) : (
          <span className="text-[10px] text-[var(--border)] mt-1.5">●</span>
        )}
        <span
          className={`text-sm leading-relaxed ${
            node.level <= 2
              ? "font-semibold text-[var(--text)]"
              : "text-[var(--muted)]"
          }`}
        >
          {node.text}
        </span>
      </div>
      {expanded &&
        hasChildren &&
        node.children.map((child, i) => (
          <OutlineItem key={i} node={child} depth={depth + 1} />
        ))}
    </div>
  );
}

export default function OutlinePage() {
  const { lang } = useLang();
  const { content, loading } = useContent(lang);
  const outline = useMemo(() => parseOutline(content), [content]);

  if (loading) {
    return (
      <div className="max-w-[700px] mx-auto px-6 py-10">
        <div className="animate-pulse text-[var(--muted)]">
          {t("self.loading", lang)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[700px] mx-auto px-6 pb-20">
      <div className="card p-6">
        <h2 className="text-sm font-bold text-[var(--accent)] tracking-wider uppercase mb-4">
          {t("outline.title", lang)}
        </h2>
        <div className="space-y-0.5">
          {outline.map((node, i) => (
            <OutlineItem key={i} node={node} />
          ))}
        </div>
      </div>
    </div>
  );
}
