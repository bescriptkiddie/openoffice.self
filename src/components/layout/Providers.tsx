"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import type { Theme, Lang } from "@/lib/types";
import { ThemeContext, LangContext, ToastContext, ChatContext } from "@/lib/hooks";

function detectLang(): Lang {
  if (typeof window === "undefined") return "zh";
  const url = new URLSearchParams(window.location.search);
  const fromUrl = url.get("lang");
  if (fromUrl === "en") return "en";
  if (fromUrl === "zh") return "zh";

  const saved = localStorage.getItem("selfware-lang");
  if (saved === "en") return "en";
  if (saved === "zh") return "zh";

  const navLangs = [...(navigator.languages || []), navigator.language].filter(
    Boolean
  );
  for (const n of navLangs) {
    if (n.startsWith("en")) return "en";
    if (n.startsWith("zh")) return "zh";
  }
  return "zh";
}

export default function Providers({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [lang, setLangState] = useState<Lang>("zh");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSelection, setChatSelection] = useState("");

  useEffect(() => {
    const savedTheme =
      (localStorage.getItem("selfware-theme") as Theme) || "book";
    setThemeState(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    const detectedLang = detectLang();
    setLangState(detectedLang);
    document.documentElement.lang = detectedLang === "zh" ? "zh-CN" : "en";

    setMounted(true);
  }, []);


  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem("selfware-theme", t);
    document.documentElement.setAttribute("data-theme", t);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("selfware-lang", l);
    document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
    const url = new URL(window.location.href);
    url.searchParams.set("lang", l);
    window.history.replaceState({}, "", url.toString());
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 1600);
  }, []);

  // Prevent flash of unstyled content
  if (!mounted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#1a1e23",
        }}
      />
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <LangContext.Provider value={{ lang, setLang }}>
        <ToastContext.Provider value={{ show: showToast }}>
          <ChatContext.Provider
            value={{
              isOpen: chatOpen,
              setIsOpen: setChatOpen,
              selection: chatSelection,
              setSelection: setChatSelection,
            }}
          >
            {children}
            {toastMsg && (
              <div
                className="fixed left-1/2 bottom-6 -translate-x-1/2 z-[2147483647]
                  px-4 py-2.5 rounded-full font-bold text-sm shadow-lg
                  bg-[var(--accent)] text-black
                  animate-[slideUp_0.25s_cubic-bezier(0.16,1,0.3,1)]"
              >
                {toastMsg}
              </div>
            )}
          </ChatContext.Provider>
        </ToastContext.Provider>
      </LangContext.Provider>
    </ThemeContext.Provider>
  );
}
