"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { VIEWS } from "@/lib/types";

export default function ViewSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Preserve ?path= across view switches
  const contentPath = searchParams.get("path");
  const isCustomContent = !!contentPath;

  // Build href with preserved path param
  function viewHref(viewPath: string): string {
    if (contentPath) {
      // Self (/) doesn't support ?path — skip it
      if (viewPath === "/") return "/";
      // Archive doesn't render content
      if (viewPath === "/archive") return "/archive";
      return `${viewPath}?path=${encodeURIComponent(contentPath)}`;
    }
    return viewPath;
  }

  // Derive display name from path param
  const contentName = contentPath
    ? contentPath
        .replace("content/articles/", "")
        .replace("content/", "")
        .replace(".md", "")
    : null;

  const activeView =
    VIEWS.find((v) =>
      v.path === "/"
        ? pathname === "/"
        : pathname.startsWith(v.path)
    ) || VIEWS[0];

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
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-base font-medium 
          text-[var(--text)] hover:text-[var(--accent)] transition-all
          cursor-pointer bg-transparent border-none outline-none"
      >
        <span className="font-bold tracking-wide">Selfware</span>
        <span className="opacity-30 font-light mx-0.5">//</span>
        <span className="font-normal opacity-90">
          {activeView.name.toUpperCase()}
        </span>
        {isCustomContent && (
          <>
            <span className="opacity-30 font-light mx-0.5">//</span>
            <span className="font-normal text-[var(--accent)] text-sm max-w-[150px] truncate">
              {contentName}
            </span>
          </>
        )}
        <span
          className={`text-[10px] opacity-60 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        >
          ▼
        </span>
      </button>

      {open && (
        <ul
          className="absolute top-full left-[-10px] mt-4 min-w-[220px]
            bg-[var(--panel)] backdrop-blur-2xl
            border border-[var(--border)] rounded-2xl p-2
            shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_10px_15px_-3px_rgba(0,0,0,0.1),0_20px_40px_rgba(0,0,0,0.4)]
            z-[10001] list-none
            animate-[fadeIn_0.2s_ease]"
        >
          {VIEWS.map((v) => {
            const isCurrent =
              v.path === "/"
                ? pathname === "/"
                : pathname.startsWith(v.path);
            return (
              <li key={v.path}>
                <Link
                  href={viewHref(v.path)}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-[10px]
                    text-sm font-medium no-underline transition-all
                    ${
                      isCurrent
                        ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                        : "text-[var(--muted)] hover:bg-[var(--panel-2)] hover:text-[var(--text)] hover:translate-x-1"
                    }`}
                >
                  <span className="text-base w-5 text-center">{v.icon}</span>
                  {v.name}
                </Link>
              </li>
            );
          })}

          {/* Show "back to canonical" link if viewing custom content */}
          {isCustomContent && (
            <>
              <li className="my-1 mx-3 h-px bg-[var(--border)]" />
              <li>
                <Link
                  href={pathname}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 rounded-[10px]
                    text-xs font-medium no-underline transition-all
                    text-[var(--muted)] hover:bg-[var(--panel-2)] hover:text-[var(--text)]"
                >
                  <span className="text-base w-5 text-center">🏠</span>
                  Back to canonical
                </Link>
              </li>
            </>
          )}
        </ul>
      )}
    </div>
  );
}
