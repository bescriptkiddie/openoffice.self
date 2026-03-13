"use client";

import { useLang, useContent } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import { useMemo, useState, useCallback, useRef, useEffect } from "react";

interface CanvasCard {
  id: string;
  text: string;
  level: number;
  x: number;
  y: number;
  children: string[];
}

function parseCanvasCards(md: string): CanvasCard[] {
  const lines = md.split("\n");
  const cards: CanvasCard[] = [];
  let id = 0;

  // Center hub
  const titleMatch = md.match(/^#\s+(.+)/m);
  if (titleMatch) {
    cards.push({
      id: `card-${id++}`,
      text: titleMatch[1].trim(),
      level: 1,
      x: 400,
      y: 300,
      children: [],
    });
  }

  // H2 headings as primary cards
  const h2Regex = /^##\s+(.+)/gm;
  let match;
  let angle = 0;
  const angleStep = (2 * Math.PI) / (md.match(/^##\s+/gm)?.length || 1);

  while ((match = h2Regex.exec(md)) !== null) {
    const radius = 250;
    const x = 400 + Math.cos(angle) * radius;
    const y = 300 + Math.sin(angle) * radius;
    const cardId = `card-${id++}`;

    if (cards.length > 0) {
      cards[0].children.push(cardId);
    }

    cards.push({
      id: cardId,
      text: match[1].trim(),
      level: 2,
      x,
      y,
      children: [],
    });
    angle += angleStep;
  }

  return cards;
}

export default function CanvasPage() {
  const { lang } = useLang();
  const { content, loading } = useContent(lang);
  const cards = useMemo(() => parseCanvasCards(content), [content]);

  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const dragging = useRef<string | null>(null);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    cards.forEach((c) => {
      pos[c.id] = { x: c.x, y: c.y };
    });
    setPositions(pos);
  }, [cards]);

  const onMouseDown = useCallback(
    (id: string, e: React.MouseEvent) => {
      dragging.current = id;
      const pos = positions[id] || { x: 0, y: 0 };
      offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    },
    [positions]
  );

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    setPositions((prev) => ({
      ...prev,
      [dragging.current!]: {
        x: e.clientX - offset.current.x,
        y: e.clientY - offset.current.y,
      },
    }));
  }, []);

  const onMouseUp = useCallback(() => {
    dragging.current = null;
  }, []);

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
    <div className="px-6 pb-20">
      <div
        className="card relative overflow-hidden"
        style={{ height: "calc(100vh - 120px)", minHeight: "600px" }}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <h2 className="absolute top-4 left-6 text-sm font-bold text-[var(--accent)] tracking-wider uppercase z-10">
          {t("canvas.title", lang)}
        </h2>

        {/* SVG connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {cards.map((card) =>
            card.children.map((childId) => {
              const from = positions[card.id];
              const to = positions[childId];
              if (!from || !to) return null;
              return (
                <line
                  key={`${card.id}-${childId}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="var(--border)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              );
            })
          )}
        </svg>

        {/* Cards */}
        {cards.map((card) => {
          const pos = positions[card.id] || { x: card.x, y: card.y };
          return (
            <div
              key={card.id}
              className={`absolute cursor-grab active:cursor-grabbing
                px-4 py-3 rounded-xl border border-[var(--border)]
                bg-[var(--panel)] backdrop-blur-sm shadow-lg
                text-sm select-none transition-shadow
                hover:shadow-xl hover:border-[var(--accent)]/30
                ${card.level === 1 ? "font-bold text-base bg-gradient-to-br from-[var(--accent)]/10 to-[var(--accent-2)]/10 border-[var(--accent)]/30" : ""}`}
              style={{
                left: pos.x - 60,
                top: pos.y - 20,
                maxWidth: 200,
              }}
              onMouseDown={(e) => onMouseDown(card.id, e)}
            >
              {card.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
