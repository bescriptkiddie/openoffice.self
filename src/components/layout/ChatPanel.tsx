"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useLang, useToast, useChat } from "@/lib/hooks";
import { t } from "@/lib/i18n";

interface ChatMessage {
  role: "user" | "ai";
  text: string;
  selection?: string;
}

export default function ChatPanel() {
  const { lang } = useLang();
  const toast = useToast();
  const { selection, setSelection, setIsOpen } = useChat();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    });
  }, []);

  // Auto-focus input when panel mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function sendMessage() {
    const instruction = input.trim();
    if (!instruction) return;

    const sel = selection;
    setMessages((prev) => [
      ...prev,
      { role: "user", text: instruction, selection: sel },
    ]);
    setInput("");
    setSelection("");
    setLoading(true);
    scrollToBottom();

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const contentPath = urlParams.get("path") || undefined;

      const res = await fetch("/api/chat-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction,
          selection: sel,
          lang,
          path: contentPath,
          history: messages.map((m) => ({
            role: m.role === "ai" ? "assistant" : "user",
            text: m.text,
          })),
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (typeof data.content === "string") {
        window.dispatchEvent(
          new CustomEvent("selfware-content-updated", {
            detail: data.content,
          })
        );
        setMessages((prev) => [
          ...prev,
          { role: "ai", text: data.reply || t("chat.edit_applied", lang) },
        ]);
        toast.show(t("chat.applied", lang));
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "ai", text: t("chat.unexpected_format", lang) },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: `${t("chat.request_failed", lang)}: ${err instanceof Error ? err.message : "unknown"}`,
        },
      ]);
      toast.show(t("chat.failed", lang));
    } finally {
      setLoading(false);
      scrollToBottom();
      inputRef.current?.focus();
    }
  }

  return (
    <div id="chat-panel" className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-4 py-3 border-b border-[var(--border)]
          flex justify-between items-center bg-[var(--panel-3)] shrink-0"
      >
        <span className="text-[12px] font-bold text-[var(--accent)] tracking-wider uppercase">
          {t("chat.title", lang)}
        </span>
        <button
          onClick={() => setIsOpen(false)}
          className="bg-transparent border-none text-[var(--muted)]
            text-lg cursor-pointer px-1.5 py-0.5 leading-none rounded
            hover:text-[var(--text)] hover:bg-[var(--panel-2)] transition-colors"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div
        ref={messagesRef}
        className="flex-1 overflow-y-auto px-3 pt-3 pb-2 flex flex-col gap-2.5"
      >
        {messages.length === 0 && !loading && (
          <div className="text-center py-8 text-[var(--muted)] text-[13px] leading-relaxed">
            <div className="text-[24px] mb-2">✨</div>
            <div className="whitespace-pre-line">
              {t("chat.empty", lang)}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[92%] px-3 py-2 rounded-xl text-[13px]
              leading-relaxed whitespace-pre-wrap break-words
              ${
                msg.role === "user"
                  ? "self-end bg-gradient-to-br from-[var(--accent)]/18 to-[var(--accent-2)]/14 border border-[var(--accent)]/15 text-[var(--text)]"
                  : "self-start bg-[var(--panel-2)] border border-[var(--border)] text-[var(--text)]"
              }`}
          >
            {msg.role === "user" && msg.selection && (
              <span className="block border-l-2 border-[var(--accent)]/50 pl-2 mb-1.5 text-[var(--muted)] text-[11px] italic max-h-[50px] overflow-hidden">
                {msg.selection.length > 100
                  ? msg.selection.slice(0, 100) + "…"
                  : msg.selection}
              </span>
            )}
            {msg.text}
          </div>
        ))}

        {loading && (
          <div className="self-start text-[var(--muted)] italic px-3 py-1 text-[13px]">
            {t("chat.thinking", lang)}...
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-[var(--border)] px-3 pt-2.5 pb-3 bg-[var(--panel-3)] shrink-0">
        {/* Selection quote */}
        {selection && (
          <div className="border-l-2 border-[var(--accent)] pl-2 py-1.5 pr-2 mb-2 bg-[var(--accent)]/6 rounded-r-lg relative">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] mb-0.5">
              {t("chat.selected_text", lang)}
            </div>
            <div className="text-[11px] text-[var(--muted)] leading-relaxed max-h-[42px] overflow-hidden line-clamp-2">
              {selection}
            </div>
            <button
              onClick={() => setSelection("")}
              className="absolute top-1 right-1 bg-transparent border-none
                text-[var(--muted)] cursor-pointer text-sm leading-none rounded
                hover:text-[var(--text)]"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                sendMessage();
              }
            }}
            rows={1}
            spellCheck={false}
            placeholder={t("chat.placeholder", lang)}
            className="flex-1 min-h-[36px] max-h-[100px] rounded-lg
              border border-[var(--border)] bg-black/10
              text-[var(--text)] px-3 py-2 resize-none outline-none
              text-[13px] leading-relaxed overflow-y-auto
              focus:border-[var(--accent)]/30
              placeholder:text-[var(--muted)]/50"
            style={{ fontFamily: "inherit" }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="w-9 h-9 rounded-lg border-none shrink-0
              bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)]
              text-black text-base font-bold cursor-pointer
              flex items-center justify-center
              transition-all hover:-translate-y-px
              hover:shadow-[0_4px_12px_var(--accent)/30]
              disabled:opacity-40 disabled:cursor-not-allowed
              disabled:transform-none disabled:shadow-none"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
