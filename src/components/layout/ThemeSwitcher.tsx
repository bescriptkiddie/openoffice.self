"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/lib/hooks";
import type { Theme } from "@/lib/types";

const THEMES: { id: Theme; name: string; color: string; border: string }[] = [
  { id: "dark", name: "Dark", color: "#1a1e23", border: "#444" },
  { id: "light", name: "Light", color: "#ffffff", border: "#ccc" },
  { id: "book", name: "Book", color: "#f4eec0", border: "#d7d3b0" },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = THEMES.find((t) => t.id === theme) || THEMES[0];

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
        className="w-[18px] h-[18px] rounded-full cursor-pointer 
          border-2 transition-all hover:scale-110 shadow-sm"
        style={{
          backgroundColor: current.color,
          borderColor: current.border,
        }}
        aria-label="Switch theme"
      />

      {open && (
        <div
          className="absolute top-full left-[-6px] mt-3 
            bg-[var(--panel)] backdrop-blur-xl
            p-2 rounded-[20px] border border-[var(--border)]
            flex flex-col gap-2 shadow-lg z-[10002]
            animate-[fadeIn_0.2s_ease]"
        >
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTheme(t.id);
                setOpen(false);
              }}
              className="w-5 h-5 rounded-full cursor-pointer 
                border border-[var(--border)] transition-transform
                hover:scale-120 relative group"
              style={{ backgroundColor: t.color, borderColor: t.border }}
              title={t.name}
            >
              <span
                className="absolute left-[140%] top-1/2 -translate-y-1/2
                  bg-black/80 text-white px-2 py-1 rounded text-[10px]
                  whitespace-nowrap opacity-0 pointer-events-none
                  group-hover:opacity-100 transition-opacity"
              >
                {t.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
