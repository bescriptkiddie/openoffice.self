"use client";

import { useLang, useContent } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import { useMemo, useState } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface Slide {
  title: string;
  content: string;
}

function parseSlides(md: string): Slide[] {
  const lines = md.split("\n");
  const slides: Slide[] = [];
  let currentTitle = "";
  let currentLines: string[] = [];

  for (const line of lines) {
    const match = line.match(/^##\s+(.+)/);
    if (match) {
      if (currentTitle || currentLines.length) {
        slides.push({
          title: currentTitle,
          content: currentLines.join("\n").trim(),
        });
      }
      currentTitle = match[1].trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentTitle || currentLines.length) {
    slides.push({
      title: currentTitle,
      content: currentLines.join("\n").trim(),
    });
  }

  return slides;
}

export default function PresentationPage() {
  const { lang } = useLang();
  const { content, loading } = useContent(lang);
  const slides = useMemo(() => parseSlides(content), [content]);
  const [current, setCurrent] = useState(0);

  if (loading) {
    return (
      <div className="max-w-[900px] mx-auto px-6 py-10">
        <div className="animate-pulse text-[var(--muted)]">
          {t("self.loading", lang)}
        </div>
      </div>
    );
  }

  const slide = slides[current];

  return (
    <div className="max-w-[960px] mx-auto px-6 pb-20">
      {/* Slide */}
      <div className="card min-h-[60vh] p-12 flex flex-col justify-center relative">
        {slide && (
          <>
            <h2 className="text-2xl font-bold mb-6 text-[var(--accent)]">
              {slide.title}
            </h2>
            <div className="flex-1">
              <MarkdownRenderer content={slide.content} />
            </div>
          </>
        )}

        {/* Slide counter */}
        <div className="absolute bottom-6 right-8 text-xs text-[var(--muted)] font-mono">
          {current + 1} / {slides.length}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-center gap-4 mt-6">
        <button
          onClick={() => setCurrent(Math.max(0, current - 1))}
          disabled={current === 0}
          className="px-4 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)]
            text-[var(--text)] text-sm cursor-pointer
            disabled:opacity-30 disabled:cursor-not-allowed
            hover:bg-[var(--panel-2)] transition-colors"
        >
          ← Prev
        </button>

        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all cursor-pointer border-none
                ${i === current ? "bg-[var(--accent)] scale-125" : "bg-[var(--border)]"}`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrent(Math.min(slides.length - 1, current + 1))}
          disabled={current === slides.length - 1}
          className="px-4 py-2 rounded-lg bg-[var(--panel)] border border-[var(--border)]
            text-[var(--text)] text-sm cursor-pointer
            disabled:opacity-30 disabled:cursor-not-allowed
            hover:bg-[var(--panel-2)] transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
