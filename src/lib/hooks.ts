"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { Theme, Lang } from "./types";

// ─── Theme Context ───
interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
}
export const ThemeContext = createContext<ThemeCtx>({
  theme: "dark",
  setTheme: () => {},
});
export function useTheme() {
  return useContext(ThemeContext);
}

// ─── Lang Context ───
interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
}
export const LangContext = createContext<LangCtx>({
  lang: "zh",
  setLang: () => {},
});
export function useLang() {
  return useContext(LangContext);
}

// ─── Content fetching ───
// Reads from ?path= if present, otherwise canonical file
export function useContent(lang: Lang) {
  const [content, setContent] = useState<string>("");
  const [contentPath, setContentPath] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      // Check URL for ?path= parameter
      const urlParams = new URLSearchParams(window.location.search);
      const pathParam = urlParams.get("path");

      let url: string;
      if (pathParam && pathParam.startsWith("content/")) {
        url = `/api/content?path=${encodeURIComponent(pathParam)}`;
      } else {
        url = `/api/content?lang=${lang}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setContent(data.content || "");
      setContentPath(data.path || "");
    } catch (e) {
      console.error("Failed to fetch content:", e);
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return { content, setContent, contentPath, loading, refetch: fetchContent };
}

// Helper: get current ?path= from URL
export function useContentPath(): string | null {
  const [path, setPath] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPath(params.get("path"));
  }, []);
  return path;
}

// ─── Toast ───
interface ToastCtx {
  show: (msg: string) => void;
}
export const ToastContext = createContext<ToastCtx>({ show: () => {} });
export function useToast() {
  return useContext(ToastContext);
}

// ─── Chat Context ───
interface ChatCtx {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  selection: string;
  setSelection: (s: string) => void;
}
export const ChatContext = createContext<ChatCtx>({
  isOpen: false,
  setIsOpen: () => {},
  selection: "",
  setSelection: () => {},
});
export function useChat() {
  return useContext(ChatContext);
}
