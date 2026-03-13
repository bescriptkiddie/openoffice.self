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
  if (!md) return [];
  const lines = md.split("\n");
  const root: OutlineNode[] = [];
  const stack: { level: number; node: OutlineNode }[] = [];
  let insideStyle = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (insideStyle) {
      if (/^<\/style/i.test(trimmed)) insideStyle = false;
      continue;
    }
    if (/^<style[\s>]/i.test(trimmed)) {
      insideStyle = true;
      continue;
    }

    if (/^-{3,}$/.test(trimmed)) continue;
    if (/^<\s*\//.test(trimmed) || /^<\s*[a-z!]/i.test(trimmed)) continue;
    if (/^(alt|width|height|style)=/i.test(trimmed)) continue;
    if (trimmed === ">") continue;

    let level = 0;
    let text = "";

    if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
      level = 1;
      text = trimmed.substring(2);
    } else if (trimmed.startsWith("## ") && !trimmed.startsWith("### ")) {
      level = 2;
      text = trimmed.substring(3);
    } else if (trimmed.startsWith("### ")) {
      level = 3;
      text = trimmed.substring(4);
    } else if (
      trimmed.startsWith("- ") ||
      trimmed.startsWith("* ") ||
      trimmed.startsWith("+ ")
    ) {
      level = 4;
      text = trimmed.substring(2);
    } else if (/^\d+[.)]\s+/.test(trimmed)) {
      level = 4;
      text = trimmed.replace(/^\d+[.)]\s+/, "");
    } else {
      level = 4;
      text = trimmed;
    }

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
  index = 0,
}: {
  node: OutlineNode;
  depth?: number;
  index?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isLeaf = node.level === 4;

  const levelStyles: Record<number, React.CSSProperties> = {
    1: {
      fontSize: "24px",
      fontWeight: 700,
      color: "#fff",
      borderLeft: "4px solid var(--accent)",
    },
    2: {
      fontSize: "18px",
      fontWeight: 600,
      color: "var(--text)",
    },
    3: {
      fontSize: "16px",
      fontWeight: 400,
      color: "var(--muted)",
    },
    4: {
      fontSize: "14px",
      fontWeight: 400,
      color: "rgb(139, 155, 180)",
      background: "transparent",
      border: "none",
      padding: "8px 20px",
    },
  };

  return (
    <div
      className="relative"
      style={{
        marginBottom: "16px",
        animation: `outline-fade-in 0.4s ease forwards`,
        animationDelay: `${index * 0.06}s`,
        opacity: 0,
      }}
    >
      {isLeaf && (
        <span
          className="absolute"
          style={{
            left: "10px",
            top: "12px",
            color: "var(--accent-2)",
            fontSize: "18px",
            lineHeight: 1,
          }}
        >
          •
        </span>
      )}

      <div
        onClick={() => hasChildren && setExpanded(!expanded)}
        className="flex items-center"
        style={{
          background: isLeaf ? "transparent" : "var(--panel)",
          backdropFilter: isLeaf ? "none" : "blur(10px)",
          WebkitBackdropFilter: isLeaf ? "none" : "blur(10px)",
          padding: isLeaf ? "8px 20px" : "12px 20px",
          borderRadius: "8px",
          border: isLeaf ? "none" : "1px solid rgba(255,255,255,0.05)",
          cursor: hasChildren ? "pointer" : "default",
          transition: "all 0.3s ease",
          paddingLeft: isLeaf ? "30px" : "20px",
          ...levelStyles[node.level] || levelStyles[4],
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          if (isLeaf) {
            el.style.background = "rgba(255,255,255,0.05)";
            el.style.transform = "translateX(3px)";
          } else {
            el.style.transform = "translateX(5px)";
            el.style.borderColor = "rgba(0,240,255,0.3)";
            el.style.background = "rgba(255,255,255,0.08)";
            el.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)";
          }
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.transform = "translateX(0)";
          if (isLeaf) {
            el.style.background = "transparent";
          } else {
            el.style.borderColor = "rgba(255,255,255,0.05)";
            el.style.background = "var(--panel)";
            el.style.boxShadow = "none";
          }
        }}
      >
        <span className="flex-1">{node.text}</span>
        {!isLeaf && (
          <span
            style={{
              fontSize: "10px",
              background: "rgba(0,0,0,0.3)",
              padding: "2px 6px",
              borderRadius: "4px",
              marginLeft: "auto",
              color: "var(--muted)",
              fontFamily: "monospace",
              flexShrink: 0,
            }}
          >
            H{node.level}
          </span>
        )}
      </div>

      {expanded && hasChildren && (
        <div
          style={{
            marginLeft: "40px",
            paddingTop: "10px",
            borderLeft: "1px dashed rgba(255,255,255,0.1)",
            paddingLeft: "20px",
          }}
        >
          {node.children.map((child, i) => (
            <OutlineItem key={i} node={child} depth={depth + 1} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OutlinePage() {
  const { lang } = useLang();
  const { content, loading } = useContent(lang);
  const outline = useMemo(() => parseOutline(content), [content]);

  if (loading) {
    return (
      <div
        style={{ height: "calc(100vh - 3.5rem)" }}
        className="flex items-center justify-center"
      >
        <div className="animate-pulse text-[var(--muted)]">
          {t("self.loading", lang)}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "calc(100vh - 3.5rem)",
        overflowY: "auto",
        backgroundImage:
          "radial-gradient(circle at 10% 20%, rgba(0,240,255,0.1) 0%, transparent 20%), radial-gradient(circle at 90% 80%, rgba(176,38,255,0.1) 0%, transparent 20%)",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px" }}>
        <h1
          style={{
            fontSize: "14px",
            textTransform: "uppercase",
            letterSpacing: "2px",
            color: "var(--muted)",
            marginBottom: "40px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            paddingBottom: "10px",
          }}
        >
          {t("outline.title", lang)}
        </h1>

        <div
          className="relative"
          style={{ paddingLeft: "20px" }}
        >
          <div
            className="absolute left-0 top-0 bottom-0"
            style={{
              width: "2px",
              background: "linear-gradient(to bottom, var(--accent), var(--accent-2))",
              borderRadius: "2px",
              opacity: 0.3,
            }}
          />
          {outline.map((node, i) => (
            <OutlineItem key={i} node={node} index={i} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes outline-fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
