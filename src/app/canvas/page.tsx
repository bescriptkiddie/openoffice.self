"use client";

import { useLang, useContent } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";

interface ParsedNode {
  id: string;
  title: string;
  content: string[];
  level: number;
  parentId: string | null;
}

interface CardModel extends ParsedNode {
  x: number;
  y: number;
}

const GAP_X = 350;
const GAP_Y = 200;
const CARD_W = 260;
const ROOT_W = 320;

function parseToNodes(md: string): ParsedNode[] {
  if (!md.trim()) return [];
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const nodes: ParsedNode[] = [];
  const usedIds = new Map<string, number>();

  const makeId = (title: string): string => {
    const base =
      "node-" +
      (title || "untitled")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-_]/g, "")
        .slice(0, 60) || "node-untitled";
    const n = usedIds.get(base) || 0;
    usedIds.set(base, n + 1);
    return n === 0 ? base : `${base}-${n + 1}`;
  };

  let currentNode: ParsedNode | null = null;
  const contextStack: Record<number, ParsedNode | null> = { 1: null, 2: null, 3: null };
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

    if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
      const title = trimmed.substring(2);
      const id = makeId(title);
      currentNode = { id, title, content: [], level: 1, parentId: null };
      nodes.push(currentNode);
      contextStack[1] = currentNode;
      contextStack[2] = null;
      contextStack[3] = null;
    } else if (trimmed.startsWith("## ") && !trimmed.startsWith("### ")) {
      const title = trimmed.substring(3);
      const id = makeId(title);
      const parent = contextStack[1];
      currentNode = { id, title, content: [], level: 2, parentId: parent?.id ?? null };
      nodes.push(currentNode);
      contextStack[2] = currentNode;
      contextStack[3] = null;
    } else if (trimmed.startsWith("### ")) {
      const title = trimmed.substring(4);
      const id = makeId(title);
      const parent = contextStack[2];
      currentNode = { id, title, content: [], level: 3, parentId: parent?.id ?? null };
      nodes.push(currentNode);
      contextStack[3] = currentNode;
    } else {
      if (currentNode) {
        if (/^-{3,}$/.test(trimmed)) continue;
        if (/^<img[\s>]/i.test(trimmed)) continue;
        if (/^(alt|width|height|style)=/i.test(trimmed)) continue;
        if (trimmed === ">") continue;
        currentNode.content.push(trimmed);
      }
    }
  }

  return nodes;
}

interface TreeNode {
  id: string;
  children: TreeNode[];
}

function calculateTreeLayout(nodes: ParsedNode[]): Record<string, { x: number; y: number }> {
  const root = nodes.find((n) => n.level === 1);
  if (!root) return {};

  const idMap: Record<string, TreeNode> = {};
  for (const n of nodes) {
    idMap[n.id] = { id: n.id, children: [] };
  }
  for (const n of nodes) {
    if (n.level > 1 && n.parentId && idMap[n.parentId]) {
      idMap[n.parentId].children.push(idMap[n.id]);
    }
  }

  const positions: Record<string, { x: number; y: number }> = {};

  function layoutSubtree(node: TreeNode, x: number, startY: number): number {
    if (node.children.length === 0) {
      positions[node.id] = { x, y: startY };
      return GAP_Y;
    }

    let currentY = startY;
    for (const child of node.children) {
      const h = layoutSubtree(child, x + GAP_X, currentY);
      currentY += h;
    }

    const firstY = positions[node.children[0].id].y;
    const lastY = positions[node.children[node.children.length - 1].id].y;
    positions[node.id] = { x, y: (firstY + lastY) / 2 };

    return currentY - startY;
  }

  layoutSubtree(idMap[root.id], 0, 0);

  const rootPos = positions[root.id];
  const offsetX = 200 - rootPos.x;
  const offsetY = 300 - rootPos.y;

  const final: Record<string, { x: number; y: number }> = {};
  for (const [id, pos] of Object.entries(positions)) {
    final[id] = { x: pos.x + offsetX, y: pos.y + offsetY };
  }
  return final;
}

function formatContentHTML(lines: string[]): string {
  let html = "";
  let inList: "ul" | "ol" | null = null;
  for (const line of lines) {
    const ul = line.match(/^[-*+]\s+(.*)$/);
    const ol = line.match(/^\d+[.)]\s+(.*)$/);
    if (ul) {
      if (inList !== "ul") {
        if (inList === "ol") html += "</ol>";
        html += "<ul>";
        inList = "ul";
      }
      html += `<li>${ul[1]}</li>`;
    } else if (ol) {
      if (inList !== "ol") {
        if (inList === "ul") html += "</ul>";
        html += "<ol>";
        inList = "ol";
      }
      html += `<li>${ol[1]}</li>`;
    } else {
      if (inList === "ul") html += "</ul>";
      if (inList === "ol") html += "</ol>";
      inList = null;
      html += `<p style="margin:4px 0">${line}</p>`;
    }
  }
  if (inList === "ul") html += "</ul>";
  if (inList === "ol") html += "</ol>";
  return html;
}

function bezierPath(
  sx: number,
  sy: number,
  tx: number,
  ty: number
): string {
  const dx = tx - sx;
  const dy = ty - sy;
  const c1x = sx + dx * 0.4;
  const c1y = sy + dy * 0.1;
  const c2x = tx - dx * 0.4;
  const c2y = ty - dy * 0.1;
  return `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tx} ${ty}`;
}

export default function CanvasPage() {
  const { lang } = useLang();
  const { content, loading } = useContent(lang);

  const parsedNodes = useMemo(() => parseToNodes(content), [content]);
  const treePositions = useMemo(() => calculateTreeLayout(parsedNodes), [parsedNodes]);

  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const dragging = useRef<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setPositions(treePositions);
  }, [treePositions]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setScale((s) => Math.min(4, Math.max(0.1, s - e.deltaY * 0.001)));
    }
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-card-id]")) return;
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    },
    [pan]
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (isPanning.current) {
      setPan({
        x: panStart.current.px + (e.clientX - panStart.current.x),
        y: panStart.current.py + (e.clientY - panStart.current.y),
      });
    }
    if (dragging.current) {
      setPositions((prev) => ({
        ...prev,
        [dragging.current!]: {
          x: prev[dragging.current!].x + e.movementX / scale,
          y: prev[dragging.current!].y + e.movementY / scale,
        },
      }));
    }
  }, [scale]);

  const onPointerUp = useCallback(() => {
    isPanning.current = false;
    dragging.current = null;
  }, []);

  const onCardPointerDown = useCallback(
    (id: string, e: React.PointerEvent) => {
      e.stopPropagation();
      dragging.current = id;
    },
    []
  );

  const resetView = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setScale(1);
  }, []);

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

  const edges: { from: string; to: string }[] = [];
  for (const node of parsedNodes) {
    if (node.parentId) {
      edges.push({ from: node.parentId, to: node.id });
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        height: "calc(100vh - 3.5rem)",
        overflow: "hidden",
        cursor: isPanning.current ? "grabbing" : "grab",
        position: "relative",
        background: "transparent", // Let body background show through
      }}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: "0 0",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            overflow: "visible",
            zIndex: 1,
          }}
        >
          {edges.map((edge) => {
            const from = positions[edge.from];
            const to = positions[edge.to];
            if (!from || !to) return null;

            const fromNode = parsedNodes.find((n) => n.id === edge.from);
            const fromW = fromNode?.level === 1 ? ROOT_W : CARD_W;
            const toW = CARD_W;

            const sx = from.x + fromW / 2;
            const sy = from.y + 40;
            const tx = to.x + toW / 2;
            const ty = to.y + 40;

            return (
              <path
                key={`${edge.from}-${edge.to}`}
                d={bezierPath(sx, sy, tx, ty)}
                fill="none"
                stroke="var(--border)"
                strokeWidth="2"
                opacity="0.6"
              />
            );
          })}
        </svg>

        {parsedNodes.map((node) => {
          const pos = positions[node.id];
          if (!pos) return null;
          const isRoot = node.level === 1;
          const w = isRoot ? ROOT_W : CARD_W;

          return (
            <div
              key={node.id}
              data-card-id={node.id}
              onPointerDown={(e) => onCardPointerDown(node.id, e)}
              style={{
                position: "absolute",
                left: pos.x,
                top: pos.y,
                width: w,
                background: "var(--panel)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: isRoot
                  ? "2px solid var(--text)"
                  : "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "20px",
                boxShadow: "var(--shadow)",
                userSelect: "none",
                cursor: "default",
                zIndex: 10,
                transition: "box-shadow 0.2s, border-color 0.2s, transform 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.borderColor = "var(--text)";
                e.currentTarget.style.zIndex = "100";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = isRoot
                  ? "var(--text)"
                  : "var(--border)";
                e.currentTarget.style.zIndex = "10";
              }}
            >
              <div
                style={{
                  fontSize: isRoot ? "1.4rem" : "1.1rem",
                  fontWeight: "bold",
                  color: "var(--text)",
                  marginBottom: "12px",
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: "12px",
                  textAlign: isRoot ? "center" : "left",
                  pointerEvents: "none",
                }}
              >
                {node.title}
              </div>
              {node.content.length > 0 && (
                <div
                  style={{
                    fontSize: "0.9rem",
                    lineHeight: 1.6,
                    color: "var(--muted)",
                    pointerEvents: "none",
                    maxHeight: "160px",
                    overflow: "hidden",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: formatContentHTML(node.content.slice(0, 8)),
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "25px",
          right: "25px",
          display: "flex",
          gap: "12px",
          zIndex: 500,
        }}
      >
        <button
          onClick={resetView}
          className="cursor-pointer"
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            padding: "10px 16px",
            borderRadius: "8px",
            backdropFilter: "blur(5px)",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "var(--shadow)",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--panel-2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--panel)";
          }}
        >
          🎯 {lang === "zh" ? "重置视图" : "Reset"}
        </button>
      </div>
    </div>
  );
}
