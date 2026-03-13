"use client";

import { useState, useRef, useEffect } from "react";
import { useLang } from "@/lib/hooks";
import type { Lang } from "@/lib/types";

const LANGS: { id: Lang; label: string }[] = [
  { id: "zh", label: "中文" },
  { id: "en", label: "EN" },
];

export default function LangSwitcher() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGS.find((l) => l.id === lang) || LANGS[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative flex items-center">
      <button
        onClick={() => setOpen(!open)}
        className="bg-[var(--panel)] border border-[var(--border)]
          text-[var(--text)] px-2.5 py-1.5 rounded-[10px] cursor-pointer
          text-xs font-bold tracking-wide inline-flex items-center gap-2
          shadow-sm transition-all hover:-translate-y-px
          hover:border-[var(--accent)]/35"
      >
        {current.label}
        <span className="opacity-65 text-[10px]">▼</span>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-3
            bg-[var(--panel)] backdrop-blur-xl
            p-2 rounded-2xl border border-[var(--border)]
            flex flex-col gap-1.5 shadow-lg z-[10002] min-w-[110px]
            animate-[fadeIn_0.2s_ease]"
        >
          {LANGS.map((l) => (
            <button
              key={l.id}
              onClick={() => {
                setLang(l.id);
                setOpen(false);
              }}
              className={`bg-transparent border border-[var(--border)]
                text-[var(--text)] px-2.5 py-2 rounded-xl cursor-pointer
                text-xs font-semibold text-left transition-all
                hover:bg-[var(--panel-2)]
                ${
                  l.id === lang
                    ? "bg-[var(--accent)]/12 border-[var(--accent)]/22 text-[var(--accent)]"
                    : ""
                }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
