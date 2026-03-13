"use client";

import { useLang, useToast } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import Link from "next/link";

function exportWithMemory(path: string) {
  const url = `/api/export?path=${encodeURIComponent(path)}&format=bundle`;
  const a = document.createElement("a");
  a.href = url;
  a.download = "";
  a.click();
}

export default function ArticlePage() {
  const { lang } = useLang();
  const toast = useToast();
  const params = useParams();
  const slug = params.slug as string;
  const [content, setContent] = useState("");
  const [articlePath, setArticlePath] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const filename = `${decodeURIComponent(slug)}.md`;
    fetch("/api/articles")
      .then((r) => r.json())
      .then((data) => {
        const article = (data.articles || []).find(
          (a: { filename: string }) => a.filename === filename
        );
        if (article) {
          setArticlePath(article.path);
          return fetch(
            `/api/content?path=${encodeURIComponent(article.path)}`
          );
        }
        throw new Error("Article not found");
      })
      .then((r) => r.json())
      .then((data) => setContent(data.content || ""))
      .catch(() => setContent("# Article not found"))
      .finally(() => setLoading(false));
  }, [slug]);

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
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/archive"
          className="inline-flex items-center gap-1 text-sm text-[var(--muted)]
            no-underline hover:text-[var(--accent)] transition-colors"
        >
          ← {lang === "zh" ? "返回归档" : "Back to archive"}
        </Link>
        {articlePath && (
          <button
            onClick={() => {
              exportWithMemory(articlePath);
              toast.show(t("export.success", lang));
            }}
            className="px-3 py-1.5 rounded-md text-xs font-medium
              bg-[var(--panel)] border border-[var(--border)] text-[var(--muted)]
              cursor-pointer hover:text-[var(--text)] transition-colors
              flex items-center gap-1"
          >
            📤 {t("export.with_memory", lang)}
          </button>
        )}
      </div>
      <div className="card p-8 lg:p-12">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
}
