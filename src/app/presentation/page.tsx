"use client";

import { useLang, useContent } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface Slide {
  title: string;
  content: string;
  isTitle: boolean;
}

function parseSlides(md: string): Slide[] {
  if (!md.trim()) return [];
  const sections = md
    .split(/\n(?=## )|(?=^# )/gm)
    .filter((s) => s.trim().length > 0);

  return sections.map((section) => {
    const lines = section.trim().split("\n");
    const firstLine = lines[0] || "";
    const isH1 = firstLine.startsWith("# ") && !firstLine.startsWith("## ");
    const isH2 = firstLine.startsWith("## ");
    const title = isH1
      ? firstLine.replace(/^#\s+/, "")
      : isH2
        ? firstLine.replace(/^##\s+/, "")
        : "";
    const content = isH1 || isH2 ? lines.slice(1).join("\n").trim() : section.trim();
    return { title, content, isTitle: isH1 };
  });
}

export default function PresentationPage() {
  const { lang } = useLang();
  const { content, loading } = useContent(lang);
  const slides = useMemo(() => parseSlides(content), [content]);
  const [current, setCurrent] = useState(0);
  const slideRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const totalSlides = slides.length;

  const goNext = useCallback(() => {
    setCurrent((c) => Math.min(c + 1, totalSlides - 1));
  }, [totalSlides]);

  const goPrev = useCallback(() => {
    setCurrent((c) => Math.max(c - 1, 0));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev]);

  // Auto-fit slide content
  useEffect(() => {
    const slide = slideRef.current;
    const inner = innerRef.current;
    if (!slide || !inner) return;

    // Reset
    inner.style.transform = "";
    inner.style.transformOrigin = "top left";

    requestAnimationFrame(() => {
      const slideH = slide.clientHeight;
      const contentH = inner.scrollHeight;
      if (contentH > slideH && slideH > 0) {
        const scale = Math.max(0.45, (slideH / contentH) * 0.95);
        inner.style.transform = `scale(${scale})`;
      }
    });
  }, [current, content]);

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

  const slide = slides[current];
  const progress = totalSlides > 0 ? ((current + 1) / totalSlides) * 100 : 0;

  return (
    <div
      style={{ height: "calc(100vh - 3.5rem)" }}
      className="relative flex items-center justify-center overflow-hidden"
    >
      {/* Background orbs */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: "400px",
          height: "400px",
          top: "-100px",
          left: "-100px",
          background: "var(--accent)",
          filter: "blur(80px)",
          opacity: 0.15,
          animation: "presentation-float 10s infinite ease-in-out",
          zIndex: 0,
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: "300px",
          height: "300px",
          bottom: "-50px",
          right: "-50px",
          background: "var(--accent-2)",
          filter: "blur(80px)",
          opacity: 0.15,
          animation: "presentation-float 10s infinite ease-in-out reverse",
          zIndex: 0,
        }}
      />

      {/* Slide card */}
      <div
        ref={slideRef}
        className="relative z-10 flex flex-col justify-start items-start overflow-auto"
        style={{
          width: "80%",
          height: "80%",
          maxWidth: "1200px",
          maxHeight: "800px",
          background: "rgba(37, 42, 51, 0.6)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: "24px",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          padding: "clamp(28px, 5vw, 60px)",
          transition: "opacity 0.6s cubic-bezier(0.23,1,0.32,1), transform 0.6s cubic-bezier(0.23,1,0.32,1)",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(0,240,255,0.35) rgba(255,255,255,0.06)",
        }}
      >
        {slide && (
          <div ref={innerRef} className="w-full" style={{ transformOrigin: "top left" }}>
            {slide.title && (
              <h2
                className="mb-4 leading-tight"
                style={{
                  fontSize: slide.isTitle
                    ? "clamp(2.2rem, 5vw, 4rem)"
                    : "clamp(1.8rem, 4vw, 3rem)",
                  fontWeight: 700,
                  ...(slide.isTitle
                    ? {
                        background: "linear-gradient(135deg, #fff 0%, var(--accent) 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }
                    : {
                        color: "var(--accent)",
                        paddingBottom: "clamp(10px, 1.5vw, 15px)",
                        borderBottom: "4px solid var(--accent-2)",
                        borderBottomLeftRadius: "2px",
                        borderBottomRightRadius: "2px",
                      }),
                  maxWidth: "100%",
                  overflowWrap: "anywhere" as const,
                }}
              >
                {slide.title}
              </h2>
            )}
            {slide.content && (
              <div
                className="slide-content"
                style={{
                  fontSize: "clamp(1.1rem, 2.6vw, 1.6rem)",
                  lineHeight: 1.7,
                  color: "#d1d5db",
                  maxWidth: "100%",
                  overflowWrap: "anywhere" as const,
                }}
              >
                <MarkdownRenderer content={slide.content} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Page number */}
      <div
        className="absolute font-mono"
        style={{
          bottom: "30px",
          left: "40px",
          fontSize: "1rem",
          color: "rgba(255,255,255,0.3)",
          zIndex: 20,
        }}
      >
        {String(current + 1).padStart(2, "0")} / {String(totalSlides).padStart(2, "0")}
      </div>

      {/* Progress bar */}
      <div
        className="absolute left-0 bottom-0"
        style={{
          height: "4px",
          width: `${progress}%`,
          background: "var(--accent)",
          boxShadow: "0 0 10px var(--accent)",
          transition: "width 0.5s ease",
          zIndex: 20,
        }}
      />

      {/* Navigation buttons */}
      <div
        className="absolute flex gap-5"
        style={{ bottom: "30px", right: "40px", zIndex: 20 }}
      >
        <button
          onClick={goPrev}
          disabled={current === 0}
          className="cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "white",
            fontSize: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(5px)",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            if (current > 0) {
              e.currentTarget.style.background = "var(--accent)";
              e.currentTarget.style.color = "#000";
              e.currentTarget.style.boxShadow = "0 0 20px var(--accent)";
              e.currentTarget.style.borderColor = "transparent";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            e.currentTarget.style.color = "white";
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
          }}
        >
          ❮
        </button>
        <button
          onClick={goNext}
          disabled={current === totalSlides - 1}
          className="cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "white",
            fontSize: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(5px)",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            if (current < totalSlides - 1) {
              e.currentTarget.style.background = "var(--accent)";
              e.currentTarget.style.color = "#000";
              e.currentTarget.style.boxShadow = "0 0 20px var(--accent)";
              e.currentTarget.style.borderColor = "transparent";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            e.currentTarget.style.color = "white";
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
          }}
        >
          ❯
        </button>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes presentation-float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, 50px); }
        }
        .slide-content ul { list-style: none; padding: 0; margin: 0; }
        .slide-content li {
          margin-bottom: clamp(10px, 2vw, 20px);
          padding-left: 30px;
          position: relative;
          opacity: 0;
          transform: translateX(-20px);
          animation: slide-item-in 0.5s ease forwards;
        }
        .slide-content li::before {
          content: '>';
          position: absolute;
          left: 0;
          color: var(--accent-2);
          font-weight: bold;
        }
        .slide-content li:nth-child(1) { animation-delay: 0.2s; }
        .slide-content li:nth-child(2) { animation-delay: 0.3s; }
        .slide-content li:nth-child(3) { animation-delay: 0.4s; }
        .slide-content li:nth-child(4) { animation-delay: 0.5s; }
        .slide-content li:nth-child(5) { animation-delay: 0.6s; }
        .slide-content li:nth-child(6) { animation-delay: 0.7s; }
        .slide-content li:nth-child(7) { animation-delay: 0.8s; }
        .slide-content li:nth-child(8) { animation-delay: 0.9s; }
        @keyframes slide-item-in {
          to { opacity: 1; transform: translateX(0); }
        }
        .slide-content p.big-text,
        .slide-content > p:first-child {
          font-size: clamp(1.2rem, 3vw, 2rem);
          line-height: 1.5;
          color: #d1d5db;
        }
      `}</style>
    </div>
  );
}
