"use client";

import { useLang } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import Link from "next/link";

export default function ArticlePage() {
  const { lang } = useLang();
  const params = useParams();
  const slug = params.slug as string;
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const filename = `${decodeURIComponent(slug)}.md`;
    // Read article content via a simple fetch to content API
    // We'll use the articles list to find the path, then fetch raw
    fetch("/api/articles")
      .then((r) => r.json())
      .then((data) => {
        const article = (data.articles || []).find(
          (a: { filename: string }) => a.filename === filename
        );
        if (article) {
          // Read article content from canonical content API won't work here
          // since articles aren't canonical. Use a direct read approach.
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
      <Link
        href="/archive"
        className="inline-flex items-center gap-1 text-sm text-[var(--muted)]
          no-underline hover:text-[var(--accent)] transition-colors mb-4"
      >
        ← {lang === "zh" ? "返回归档" : "Back to archive"}
      </Link>
      <div className="card p-8 lg:p-12">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
}
