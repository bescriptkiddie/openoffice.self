"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useChat, useToast } from "@/lib/hooks";
import ViewSwitcher from "./ViewSwitcher";
import ThemeSwitcher from "./ThemeSwitcher";
import LangSwitcher from "./LangSwitcher";
import ChatPanel from "./ChatPanel";
import ImportModal from "./ImportModal";
import { useLang } from "@/lib/hooks";
import { t } from "@/lib/i18n";

function ExportButton() {
  const { lang } = useLang();
  const toast = useToast();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pathParam = searchParams.get("path");
  const isDocView = pathname === "/doc" && pathParam?.startsWith("content/");

  if (!isDocView) return null;

  return (
    <button
      onClick={() => {
        const url = `/api/export?path=${encodeURIComponent(pathParam!)}&format=bundle`;
        const a = document.createElement("a");
        a.href = url;
        a.download = "";
        a.click();
        toast.show(t("export.success", lang));
      }}
      className="px-3 py-1.5 rounded-md cursor-pointer
        text-[13px] font-medium flex items-center gap-1.5
        border transition-all
        bg-[var(--panel)] border-[var(--border)] text-[var(--text)]
        hover:bg-[var(--panel-2)] hover:-translate-y-px"
    >
      📤 {t("export.button", lang)}
    </button>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isOpen, setIsOpen, setSelection } = useChat();
  const { lang } = useLang();
  const [importOpen, setImportOpen] = useState(false);
  const pathname = usePathname();

  // Close chat panel on view/route change
  useEffect(() => {
    setIsOpen(false);
    setSelection("");
  }, [pathname, setIsOpen, setSelection]);

  // Text selection detection — open chat on select
  useEffect(() => {
    function handleMouseUp() {
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;
        const text = sel.toString().trim();
        if (!text) return;

        // Ignore selections inside the chat panel
        const anchor = sel.anchorNode;
        const focus = sel.focusNode;
        const panel = document.getElementById("chat-panel");
        if (panel && (panel.contains(anchor) || panel.contains(focus))) return;

        setSelection(text);
        setIsOpen(true);
      }, 150);
    }

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [setIsOpen, setSelection]);

  // Keyboard: Escape to close
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, setIsOpen]);

  return (
    <>
      {/* ── Fixed Header Bar ── */}
      <header
        className="fixed top-0 left-0 right-0 z-[10000] h-14
          bg-[var(--bg)]/80 backdrop-blur-xl
          border-b border-[var(--border)]/60
          flex items-center justify-between px-7"
      >
        {/* Left: controls */}
        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          <LangSwitcher />
          <Suspense fallback={<span className="text-sm text-[var(--muted)]">Selfware</span>}><ViewSwitcher /></Suspense>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <Suspense fallback={null}><ExportButton /></Suspense>
          <button
            onClick={() => setImportOpen(true)}
            className="px-3 py-1.5 rounded-md cursor-pointer
              text-[13px] font-medium flex items-center gap-1.5
              border transition-all
              bg-[var(--panel)] border-[var(--border)] text-[var(--text)]
              hover:bg-[var(--panel-2)] hover:-translate-y-px"
          >
            📥 {lang === "zh" ? "导入" : "Import"}
          </button>

          {isOpen && (
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 rounded-md cursor-pointer
                text-[13px] font-medium flex items-center gap-2
                border transition-all
                bg-[var(--accent)]/15 border-[var(--accent)]/30 text-[var(--accent)]"
            >
              ✨ {t("global.ai_edit", lang)}
              <span className="text-xs opacity-60">✕</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Two-column body ── */}
      <div
        className="mt-14 h-[calc(100vh-3.5rem)] overflow-hidden transition-all duration-300 ease-out"
        style={{
          display: "grid",
          gridTemplateColumns: isOpen ? "1fr 380px" : "1fr",
        }}
      >
        {/* Left: Page content — scrolls independently */}
        <main className="min-w-0 overflow-y-auto pt-6">{children}</main>

        {/* Right: Chat panel — fixed height, scrolls internally */}
        {isOpen && (
          <aside
            className="border-l border-[var(--border)] bg-[var(--bg)]
              h-full overflow-hidden
              animate-[slideInRight_0.25s_ease-out]"
          >
            <ChatPanel />
          </aside>
        )}
      </div>

      {/* Import Modal */}
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
}
