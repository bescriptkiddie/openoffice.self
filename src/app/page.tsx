"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import { VIEWS } from "@/lib/types";
import Link from "next/link";

export default function SelfPage() {
  const { lang } = useLang();
  const [selfData, setSelfData] = useState<{
    path: string;
    sha256: string;
    content: string;
  } | null>(null);
  const [caps, setCaps] = useState<Record<string, unknown> | null>(null);
  const [manifest, setManifest] = useState<string>("");

  useEffect(() => {
    fetch(`/api/self-info?lang=${lang}`)
      .then((r) => r.json())
      .then(setSelfData)
      .catch(console.error);
    fetch("/api/capabilities")
      .then((r) => r.json())
      .then(setCaps)
      .catch(console.error);
    fetch("/api/manifest")
      .then((r) => r.json())
      .then((d) => setManifest(d.content || ""))
      .catch(console.error);
  }, [lang]);

  const viewCards = VIEWS.filter((v) => v.path !== "/" && v.path !== "/archive");
  const prompts = [1, 2, 3, 4, 5].map((i) => t(`self.prompt.${i}`, lang));

  return (
    <div className="max-w-[1200px] mx-auto px-6 pb-18">
      {/* Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6 mb-6">
        {/* Main */}
        <div className="card p-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-transparent">
            Selfware
          </h1>
          <p className="text-xs text-[var(--muted)] font-mono tracking-wide mb-4">
            A FILE IS AN APP. EVERYTHING IS A FILE.
          </p>
          <p className="text-[var(--muted)] text-sm leading-relaxed mb-6">
            {t("self.subtitle", lang)}
          </p>

          {/* View Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {viewCards.map((v) => (
              <Link
                key={v.path}
                href={v.path}
                className="flex items-center gap-3 px-4 py-3 rounded-xl
                  bg-[var(--panel-2)] border border-[var(--border)]
                  text-[var(--text)] no-underline text-sm font-medium
                  transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/30
                  hover:shadow-md"
              >
                <span className="text-lg">{v.icon}</span>
                <div>
                  <div>{v.name}</div>
                  <div className="text-[10px] text-[var(--muted)]">
                    {v.description?.[lang] || ""}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Side - Instance Status */}
        <div className="card p-6">
          <h2 className="text-sm font-bold text-[var(--accent)] tracking-wider uppercase mb-4">
            {t("self.instance_status", lang)}
          </h2>

          {selfData ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Protocol</span>
                <span className="font-mono text-xs">selfware.md</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Canonical</span>
                <span className="font-mono text-xs">{selfData.path}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">SHA-256</span>
                <span className="font-mono text-[10px] text-[var(--muted)] max-w-[180px] truncate">
                  {selfData.sha256}
                </span>
              </div>
              {caps && (
                <>
                  <hr className="border-[var(--border)]" />
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Write Scope</span>
                    <span className="font-mono text-xs">
                      {(caps as Record<string, unknown>).write_scope
                        ? String(
                            (caps as Record<string, string[]>).write_scope
                          )
                        : "content/"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Git</span>
                    <span className="font-mono text-xs">
                      {(
                        (caps as Record<string, Record<string, Record<string, unknown>>>)
                          .modules?.local_git as Record<string, unknown>
                      )?.is_repo
                        ? `✅ ${(caps as Record<string, Record<string, Record<string, unknown>>>).modules?.local_git?.branch || ""}`
                        : "❌ Not initialized"}
                    </span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-[var(--muted)] text-sm animate-pulse">
              {t("self.loading", lang)}
            </p>
          )}
        </div>
      </div>

      {/* Capabilities & AI Interaction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-6">
          <h2 className="text-sm font-bold text-[var(--accent)] tracking-wider uppercase mb-4">
            {t("self.capabilities", lang)}
          </h2>
          {caps ? (
            <pre className="text-xs font-mono text-[var(--muted)] overflow-auto max-h-[300px] leading-relaxed">
              {JSON.stringify(caps, null, 2)}
            </pre>
          ) : (
            <p className="text-[var(--muted)] text-sm animate-pulse">
              {t("self.loading", lang)}
            </p>
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-sm font-bold text-[var(--accent)] tracking-wider uppercase mb-4">
            {t("self.try_ask", lang)}
          </h2>
          <div className="space-y-2.5">
            {prompts.map((p, i) => (
              <div
                key={i}
                className="px-4 py-2.5 rounded-xl bg-[var(--panel-2)] border border-[var(--border)]
                  text-sm text-[var(--muted)] font-mono cursor-default
                  hover:border-[var(--accent)]/20 transition-colors"
              >
                {p}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manifest */}
      <div className="card p-6">
        <h2 className="text-sm font-bold text-[var(--accent)] tracking-wider uppercase mb-4">
          {t("self.manifest", lang)}
        </h2>
        <pre className="text-xs font-mono text-[var(--muted)] overflow-auto max-h-[400px] leading-relaxed whitespace-pre-wrap">
          {manifest || t("self.loading", lang)}
        </pre>
      </div>
    </div>
  );
}
