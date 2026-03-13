"use client";

import { useLang } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import { useEffect, useState } from "react";
import Link from "next/link";
import ImportModal from "@/components/layout/ImportModal";

interface ArticleItem {
  filename: string;
  path: string;
  date: string | null;
  title: string;
  category: string | null;
  size: number;
}

export default function ArchivePage() {
  const { lang } = useLang();
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [grouped, setGrouped] = useState<Record<string, ArticleItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);

  function loadArticles() {
    setLoading(true);
    fetch("/api/articles")
      .then((r) => r.json())
      .then((data) => {
        setArticles(data.articles || []);
        setGrouped(data.grouped || {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadArticles();
  }, []);

  // Refresh on content update (after import)
  useEffect(() => {
    function onUpdate() {
      loadArticles();
    }
    window.addEventListener("selfware-content-updated", onUpdate);
    return () => window.removeEventListener("selfware-content-updated", onUpdate);
  }, []);

  const sortedMonths = Object.keys(grouped).sort().reverse();

  return (
    <div className="max-w-[800px] mx-auto px-6 pb-20">
      {/* Header card with import button */}
      <div className="card p-6 mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[var(--accent)] tracking-wider uppercase mb-1">
            {t("archive.title", lang)}
          </h2>
          <p className="text-[var(--muted)] text-sm">
            {articles.length} {lang === "zh" ? "篇文章" : "articles"}
          </p>
        </div>
        <button
          onClick={() => setImportOpen(true)}
          className="px-4 py-2 rounded-xl cursor-pointer
            text-sm font-medium flex items-center gap-2
            bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)]
            text-black border-none
            hover:opacity-90 transition-opacity"
        >
          📥 {lang === "zh" ? "导入文章" : "Import Article"}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[var(--muted)] animate-pulse">
          {t("self.loading", lang)}
        </div>
      ) : articles.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-[var(--muted)] text-sm mb-4">
            {lang === "zh" ? "暂无文章，导入一篇试试？" : "No articles yet. Import one?"}
          </p>
          <button
            onClick={() => setImportOpen(true)}
            className="px-4 py-2 rounded-xl cursor-pointer
              text-sm font-medium
              bg-[var(--panel-2)] border border-[var(--border)]
              text-[var(--text)]
              hover:border-[var(--accent)]/30 transition-colors"
          >
            📥 {lang === "zh" ? "导入 Markdown" : "Import Markdown"}
          </button>
        </div>
      ) : (
        sortedMonths.map((month) => (
          <div key={month} className="mb-8">
            <h3 className="text-xs font-bold text-[var(--muted)] mb-3 px-1 uppercase tracking-wider">
              {month}
            </h3>
            <div className="space-y-2">
              {grouped[month].map((art) => (
                <Link
                  key={art.filename}
                  href={`/doc?path=${encodeURIComponent(art.path)}`}
                  className="flex items-center justify-between px-4 py-3 rounded-xl
                    bg-[var(--panel)] border border-[var(--border)]
                    text-[var(--text)] no-underline text-sm
                    transition-all hover:-translate-y-px hover:border-[var(--accent)]/30
                    hover:shadow-md group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[var(--muted)] font-mono text-xs shrink-0">
                      {art.date || "—"}
                    </span>
                    <span className="truncate group-hover:text-[var(--accent)] transition-colors">
                      {art.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {art.category && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                        {art.category}
                      </span>
                    )}
                    <span className="text-[10px] text-[var(--muted)]">
                      {art.size > 1024
                        ? `${(art.size / 1024).toFixed(1)}KB`
                        : `${art.size}B`}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}

      <ImportModal
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          loadArticles(); // Refresh after closing import
        }}
      />
    </div>
  );
}
