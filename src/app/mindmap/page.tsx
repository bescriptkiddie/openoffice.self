"use client";

import { useLang, useContent } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import {
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";

interface MindNode {
  id: string;
  text: string;
  level: number;
  children: MindNode[];
  collapsed?: boolean;
}

interface LayoutNode {
  id: string;
  text: string;
  level: number;
  x: number;
  y: number;
  width: number;
  height: number;
  children: LayoutNode[];
  collapsed: boolean;
  parentId?: string;
}

function parseMindmap(md: string): MindNode | null {
  if (!md.trim()) return null;
  const lines = md.split("\n");
  let root: MindNode | null = null;
  const stack: MindNode[] = [];
  let idCounter = 0;

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (!match) continue;

    const level = match[1].length;
    const text = match[2].trim();
    const node: MindNode = {
      id: `mn-${idCounter++}`,
      text,
      level,
      children: [],
    };

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

const NODE_H = 36;
const NODE_PAD_X = 20;
const V_GAP = 14;
const H_GAP = 180;
const DEPTH_COLORS = [
  "var(--accent)",
  "var(--accent-2)",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];

function measureText(text: string, level: number): number {
  const fontSize = level === 1 ? 16 : level === 2 ? 14 : 13;
  return Math.min(text.length * fontSize * 0.6 + NODE_PAD_X * 2, 260);
}

function layoutTree(
  node: MindNode,
  collapsedSet: Set<string>,
  depth: number = 0,
  parentId?: string
): LayoutNode {
  const width = measureText(node.text, node.level);
  const collapsed = collapsedSet.has(node.id);

  const layoutChildren: LayoutNode[] = [];
  if (!collapsed) {
    for (const child of node.children) {
      layoutChildren.push(layoutTree(child, collapsedSet, depth + 1, node.id));
    }
  }

  const ln: LayoutNode = {
    id: node.id,
    text: node.text,
    level: node.level,
    x: 0,
    y: 0,
    width,
    height: NODE_H,
    children: layoutChildren,
    collapsed,
    parentId,
  };

  return ln;
}

function getSubtreeHeight(node: LayoutNode): number {
  if (node.children.length === 0) return NODE_H;
  let totalH = 0;
  for (const child of node.children) {
    totalH += getSubtreeHeight(child);
  }
  totalH += (node.children.length - 1) * V_GAP;
  return Math.max(NODE_H, totalH);
}

function assignPositions(node: LayoutNode, x: number, y: number): void {
  const subtreeH = getSubtreeHeight(node);
  node.x = x;
  node.y = y + subtreeH / 2 - NODE_H / 2;

  if (node.children.length === 0) return;

  let childY = y;
  for (const child of node.children) {
    const childH = getSubtreeHeight(child);
    assignPositions(child, x + node.width + H_GAP, childY);
    childY += childH + V_GAP;
  }
}

function flattenNodes(node: LayoutNode): LayoutNode[] {
  const result: LayoutNode[] = [node];
  for (const child of node.children) {
    result.push(...flattenNodes(child));
  }
  return result;
}

interface Edge {
  from: LayoutNode;
  to: LayoutNode;
}

function collectEdges(node: LayoutNode): Edge[] {
  const edges: Edge[] = [];
  for (const child of node.children) {
    edges.push({ from: node, to: child });
    edges.push(...collectEdges(child));
  }
  return edges;
}

function bezierPath(from: LayoutNode, to: LayoutNode): string {
  const x1 = from.x + from.width;
  const y1 = from.y + from.height / 2;
  const x2 = to.x;
  const y2 = to.y + to.height / 2;
  const cx = (x1 + x2) / 2;
  return `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`;
}

export default function MindmapPage() {
  const { lang } = useLang();
  const { content, loading } = useContent(lang);
  const tree = useMemo(() => parseMindmap(content), [content]);

  const [collapsedSet, setCollapsedSet] = useState<Set<string>>(new Set());
  const [pan, setPan] = useState({ x: 60, y: 0 });
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const layoutRoot = useMemo(() => {
    if (!tree) return null;
    const root = layoutTree(tree, collapsedSet);
    const totalH = getSubtreeHeight(root);
    assignPositions(root, 40, 40);
    return root;
  }, [tree, collapsedSet]);

  const nodes = useMemo(() => (layoutRoot ? flattenNodes(layoutRoot) : []), [layoutRoot]);
  const edges = useMemo(() => (layoutRoot ? collectEdges(layoutRoot) : []), [layoutRoot]);

  const svgBounds = useMemo(() => {
    if (nodes.length === 0) return { w: 800, h: 600 };
    let maxX = 0;
    let maxY = 0;
    for (const n of nodes) {
      maxX = Math.max(maxX, n.x + n.width + 100);
      maxY = Math.max(maxY, n.y + n.height + 100);
    }
    return { w: maxX, h: maxY };
  }, [nodes]);

  // Center vertically on mount
  useEffect(() => {
    if (containerRef.current && layoutRoot) {
      const containerH = containerRef.current.clientHeight;
      const treeH = getSubtreeHeight(layoutRoot);
      const offsetY = Math.max(0, (containerH - treeH * scale) / 2);
      setPan((p) => ({ ...p, y: offsetY }));
    }
  }, [layoutRoot, scale]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setScale((s) => Math.min(2, Math.max(0.3, s - e.deltaY * 0.002)));
    } else {
      setPan((p) => ({
        x: p.x - e.deltaX,
        y: p.y - e.deltaY,
      }));
    }
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.target === containerRef.current || (e.target as HTMLElement).tagName === "svg" || (e.target as HTMLElement).tagName === "path") {
        isPanning.current = true;
        panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      }
    },
    [pan]
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning.current) return;
    setPan({
      x: panStart.current.panX + (e.clientX - panStart.current.x),
      y: panStart.current.panY + (e.clientY - panStart.current.y),
    });
  }, []);

  const onPointerUp = useCallback(() => {
    isPanning.current = false;
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

  if (!layoutRoot) {
    return (
      <div
        style={{ height: "calc(100vh - 3.5rem)" }}
        className="flex items-center justify-center"
      >
        <p className="text-[var(--muted)]">No content</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        height: "calc(100vh - 3.5rem)",
        overflow: "hidden",
        cursor: isPanning.current ? "grabbing" : "grab",
        position: "relative",
        background: "var(--bg)",
      }}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: "0 0",
          position: "absolute",
          top: 0,
          left: 0,
          width: svgBounds.w,
          height: svgBounds.h,
        }}
      >
        <svg
          width={svgBounds.w}
          height={svgBounds.h}
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        >
          {edges.map((edge, i) => (
            <path
              key={i}
              d={bezierPath(edge.from, edge.to)}
              fill="none"
              stroke="var(--accent-2)"
              strokeWidth="2"
              opacity="0.5"
              style={{
                strokeDasharray: 1000,
                strokeDashoffset: 1000,
                animation: `mindmap-draw 0.8s ease forwards`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </svg>

        {nodes.map((node, i) => {
          const depth = node.level - 1;
          const color = DEPTH_COLORS[depth % DEPTH_COLORS.length];
          const isRoot = depth === 0;
          const hasChildren = node.children.length > 0 || (tree && findOriginalNode(tree, node.id)?.children.length);

          return (
            <div
              key={node.id}
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse(node.id);
              }}
              style={{
                position: "absolute",
                left: node.x,
                top: node.y,
                width: node.width,
                height: node.height,
                borderRadius: "18px",
                display: "flex",
                alignItems: "center",
                padding: "0 14px",
                cursor: "pointer",
                fontSize: isRoot ? "16px" : depth === 1 ? "14px" : "13px",
                fontWeight: isRoot ? 700 : depth === 1 ? 600 : 400,
                color: "var(--text)",
                background: isRoot
                  ? `linear-gradient(135deg, rgba(0,240,255,0.15), rgba(176,38,255,0.15))`
                  : "var(--panel)",
                border: `1.5px solid ${isRoot ? color : "var(--border)"}`,
                boxShadow: isRoot ? `0 0 20px rgba(0,240,255,0.15)` : "none",
                transition: "all 0.25s ease",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                opacity: 0,
                animation: `mindmap-node-in 0.4s ease forwards`,
                animationDelay: `${i * 0.04}s`,
                zIndex: 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = color;
                e.currentTarget.style.boxShadow = `0 4px 16px rgba(0,0,0,0.25)`;
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isRoot ? color : "var(--border)";
                e.currentTarget.style.boxShadow = isRoot ? `0 0 20px rgba(0,240,255,0.15)` : "none";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                  marginRight: "10px",
                }}
              />
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  flex: 1,
                }}
              >
                {node.text}
              </span>
              {hasChildren && (
                <span
                  style={{
                    marginLeft: "6px",
                    fontSize: "10px",
                    color: "var(--muted)",
                    flexShrink: 0,
                    transform: node.collapsed ? "rotate(0deg)" : "rotate(90deg)",
                    transition: "transform 0.2s ease",
                  }}
                >
                  ▶
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "16px",
          right: "16px",
          display: "flex",
          gap: "8px",
          zIndex: 10,
        }}
      >
        <button
          onClick={() => setScale((s) => Math.min(2, s + 0.2))}
          className="cursor-pointer"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "var(--panel)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            fontSize: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          +
        </button>
        <button
          onClick={() => setScale((s) => Math.max(0.3, s - 0.2))}
          className="cursor-pointer"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "var(--panel)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            fontSize: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          −
        </button>
        <button
          onClick={() => {
            setScale(1);
            setPan({ x: 60, y: 0 });
          }}
          className="cursor-pointer"
          style={{
            height: "36px",
            borderRadius: "10px",
            background: "var(--panel)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            fontSize: "12px",
            padding: "0 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Reset
        </button>
      </div>

      <style>{`
        @keyframes mindmap-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes mindmap-node-in {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function findOriginalNode(node: MindNode, id: string): MindNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findOriginalNode(child, id);
    if (found) return found;
  }
  return null;
}
