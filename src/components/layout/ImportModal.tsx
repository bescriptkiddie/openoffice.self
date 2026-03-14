"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLang, useToast } from "@/lib/hooks";
import { t } from "@/lib/i18n";

interface Props {
  open: boolean;
  onClose: () => void;
}

type SaveTarget = "canonical" | "article";

export default function ImportModal({ open, onClose }: Props) {
  const { lang } = useLang();
  const toast = useToast();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [filename, setFilename] = useState("");
  const [saveAs, setSaveAs] = useState<SaveTarget>("article");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.name.endsWith(".md")) {
        toast.show(lang === "zh" ? "仅支持 .md 文件" : "Only .md files supported");
        return;
      }

      setFilename(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setContent((ev.target?.result as string) || "");
      };
      reader.readAsText(file);
    },
    [lang, toast]
  );

  async function handleImport() {
    if (!content.trim()) {
      toast.show(lang === "zh" ? "请输入或上传内容" : "Please enter or upload content");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          filename: filename || "imported.md",
          lang,
          saveAs,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      toast.show(lang === "zh" ? "导入成功" : "Import successful");

      // Notify content update
      window.dispatchEvent(
        new CustomEvent("selfware-content-updated", { detail: "refresh" })
      );

      onClose();
      router.push(`/doc?path=${encodeURIComponent(data.path)}`);
    } catch (err) {
      setResult(
        `❌ ${err instanceof Error ? err.message : String(err)}`
      );
      toast.show(lang === "zh" ? "导入失败" : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setContent("");
    setFilename("");
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[20000]"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          z-[20001] w-[640px] max-w-[90vw] max-h-[85vh]
          bg-[var(--bg)] border border-[var(--border)] rounded-2xl
          shadow-[0_25px_60px_rgba(0,0,0,0.5)] flex flex-col
          animate-[fadeIn_0.2s_ease]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
          <div>
            <h2 className="text-base font-bold text-[var(--text)]">
              {lang === "zh" ? "📥 导入 Markdown" : "📥 Import Markdown"}
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {lang === "zh"
                ? "上传或粘贴 Markdown，AI 将按 Selfware 协议转化"
                : "Upload or paste Markdown, AI will convert following Selfware protocol"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--text)] text-xl
              bg-transparent border-none cursor-pointer px-2 py-1 rounded
              hover:bg-[var(--panel-2)] transition-colors"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* File upload area */}
          <div>
            <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-2 block">
              {lang === "zh" ? "上传 .md 文件" : "Upload .md file"}
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[var(--border)] rounded-xl
                px-4 py-6 text-center cursor-pointer
                hover:border-[var(--accent)]/40 hover:bg-[var(--panel-2)]
                transition-colors"
            >
              <div className="text-2xl mb-1">📄</div>
              <div className="text-sm text-[var(--muted)]">
                {filename ? (
                  <span className="text-[var(--accent)] font-medium">{filename}</span>
                ) : lang === "zh" ? (
                  "点击选择 .md 文件"
                ) : (
                  "Click to select .md file"
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Or divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs text-[var(--muted)]">
              {lang === "zh" ? "或者" : "OR"}
            </span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          {/* Paste area */}
          <div>
            <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-2 block">
              {lang === "zh" ? "粘贴 Markdown 内容" : "Paste Markdown content"}
            </label>
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (!filename) setFilename("pasted-content.md");
              }}
              rows={8}
              placeholder={
                lang === "zh"
                  ? "在此粘贴 Markdown 内容..."
                  : "Paste your Markdown content here..."
              }
              className="w-full rounded-xl border border-[var(--border)]
                bg-[var(--panel)] text-[var(--text)] px-4 py-3
                text-sm font-mono leading-relaxed resize-y outline-none
                focus:border-[var(--accent)]/30
                placeholder:text-[var(--muted)]/40"
            />
          </div>

          {/* Save target */}
          <div>
            <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-2 block">
              {lang === "zh" ? "保存为" : "Save as"}
            </label>
            <div className="flex gap-2">
              {(
                [
                  {
                    id: "article" as SaveTarget,
                    label: lang === "zh" ? "📚 文章" : "📚 Article",
                    desc:
                      lang === "zh"
                        ? "保存到 content/articles/"
                        : "Save to content/articles/",
                  },
                  {
                    id: "canonical" as SaveTarget,
                    label: lang === "zh" ? "📄 主文档" : "📄 Canonical",
                    desc:
                      lang === "zh"
                        ? "替换 selfware_demo.md"
                        : "Replace selfware_demo.md",
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSaveAs(opt.id)}
                  className={`flex-1 px-3 py-2.5 rounded-xl text-left cursor-pointer
                    border transition-colors
                    ${
                      saveAs === opt.id
                        ? "bg-[var(--accent)]/12 border-[var(--accent)]/30 text-[var(--accent)]"
                        : "bg-[var(--panel)] border-[var(--border)] text-[var(--text)] hover:bg-[var(--panel-2)]"
                    }`}
                >
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-[10px] text-[var(--muted)] mt-0.5">
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Filename */}
          {saveAs === "article" && (
            <div>
              <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-2 block">
                {lang === "zh" ? "文件名" : "Filename"}
              </label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="my-article.md"
                className="w-full rounded-lg border border-[var(--border)]
                  bg-[var(--panel)] text-[var(--text)] px-3 py-2
                  text-sm outline-none focus:border-[var(--accent)]/30"
              />
            </div>
          )}

          {/* Result */}
          {result && (
            <div
              className={`px-4 py-3 rounded-xl text-sm ${
                result.startsWith("✅")
                  ? "bg-[var(--good)]/10 text-[var(--good)] border border-[var(--good)]/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              {result}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)] shrink-0">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg text-xs font-medium
              text-[var(--muted)] hover:text-[var(--text)]
              bg-transparent border border-[var(--border)]
              cursor-pointer hover:bg-[var(--panel-2)] transition-colors"
          >
            {lang === "zh" ? "重置" : "Reset"}
          </button>

          <button
            onClick={handleImport}
            disabled={loading || !content.trim()}
            className="px-5 py-2 rounded-lg text-sm font-medium
              bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)]
              text-black cursor-pointer
              hover:opacity-90 transition-opacity
              disabled:opacity-40 disabled:cursor-not-allowed
              flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                {lang === "zh" ? "AI 转化中..." : "Converting..."}
              </>
            ) : (
              <>
                🪄 {lang === "zh" ? "导入并转化" : "Import & Convert"}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
