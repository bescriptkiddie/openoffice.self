"use client";

import { useLang, useContent } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import { useMemo, useState } from "react";

interface MindNode {
  text: string;
  level: number;
  children: MindNode[];
}

function parseMindmap(md: string): MindNode | null {
  const lines = md.split("\n");
  let root: MindNode | null = null;
  const stack: MindNode[] = [];

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (!match) continue;

    const level = match[1].length;
    const text = match[2].trim();
    const node: MindNode = { text, level, children: [] };

    if (!root) {
      root = node;
      stack.push(node);
      continue;
    }

    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    stack[stack.length - 1].children.push(node);
    stack.push(node);
  }

  return root;
}

function MindmapNode({
  node,
  depth = 0,
  isRoot = false,
}: {
  node: MindNode;
  depth?: number;
  isRoot?: boolean;
}) {
  const [expanded, setExpanded] = useState(depth < 3);

  const colors = [
    "var(--accent)",
    "var(--accent-2)",
    "var(--good)",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
  ];
  const color = colors[depth % colors.length];

  return (
    <div className="relative">
      <div
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl cursor-pointer
          transition-all hover:scale-105
          ${isRoot ? "text-lg font-bold" : "text-sm"}
          ${isRoot ? "bg-gradient-to-r from-[var(--accent)]/20 to-[var(--accent-2)]/20 border-2" : "bg-[var(--panel)] border"}
          border-[var(--border)]`}
        onClick={() => setExpanded(!expanded)}
        style={isRoot ? { borderColor: color } : {}}
      >
        {node.children.length > 0 && (
          <span
            className={`text-[10px] transition-transform ${expanded ? "rotate-90" : ""}`}
            style={{ color }}
          >
            ▶
          </span>
        )}
        <span>{node.text}</span>
      </div>

      {expanded && node.children.length > 0 && (
        <div className="ml-8 mt-2 pl-4 border-l-2 border-[var(--border)] space-y-2">
          {node.children.map((child, i) => (
            <MindmapNode key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MindmapPage() {
  const { lang } = useLang();
  const { content, loading } = useContent(lang);
  const root = useMemo(() => parseMindmap(content), [content]);

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
    <div className="max-w-[1100px] mx-auto px-6 pb-20">
      <div className="card p-8 overflow-auto">
        <h2 className="text-sm font-bold text-[var(--accent)] tracking-wider uppercase mb-6">
          {t("mindmap.title", lang)}
        </h2>
        {root ? (
          <MindmapNode node={root} isRoot />
        ) : (
          <p className="text-[var(--muted)]">No content</p>
        )}
      </div>
    </div>
  );
}
