"use client";

import { useLang, useContent, useToast } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import { useEffect, useState } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";

export default function DocPage() {
  const { lang } = useLang();
  const { content, loading, refetch } = useContent(lang);
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    function onContentUpdated(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === "string") refetch();
    }
    window.addEventListener("selfware-content-updated", onContentUpdated);
    return () =>
      window.removeEventListener("selfware-content-updated", onContentUpdated);
  }, [refetch]);

  async function handleSave() {
    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editText, lang }),
      });
      if (res.ok) {
        toast.show(t("global.saved_source", lang));
        setEditing(false);
        refetch();
      } else {
        toast.show(t("global.save_failed", lang));
      }
    } catch {
      toast.show(t("global.save_failed", lang));
    }
  }

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto px-6 py-10">
        <div className="animate-pulse text-[var(--muted)]">
          {t("self.loading", lang)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto px-6 pb-20">
      {/* Edit Source toggle */}
      <div className="flex justify-end mb-4 gap-2">
        {editing ? (
          <>
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 rounded-md text-xs font-medium
                bg-[var(--panel)] border border-[var(--border)] text-[var(--muted)]
                cursor-pointer hover:text-[var(--text)] transition-colors"
            >
              {t("global.close", lang)}
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 rounded-md text-xs font-medium
                bg-[var(--accent)] text-black cursor-pointer
                hover:opacity-90 transition-opacity"
            >
              {t("global.save_changes", lang)}
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              setEditText(content);
              setEditing(true);
            }}
            className="px-3 py-1.5 rounded-md text-xs font-medium
              bg-[var(--panel)] border border-[var(--border)] text-[var(--muted)]
              cursor-pointer hover:text-[var(--text)] transition-colors"
          >
            {t("global.edit_source", lang)}
          </button>
        )}
      </div>

      {editing ? (
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="w-full min-h-[70vh] p-4 rounded-xl
            bg-[var(--panel)] border border-[var(--border)]
            text-[var(--text)] font-mono text-sm leading-relaxed
            resize-y outline-none focus:border-[var(--accent)]/30"
        />
      ) : (
        <div className="card p-8 lg:p-12">
          <MarkdownRenderer content={content} />
        </div>
      )}
    </div>
  );
}
