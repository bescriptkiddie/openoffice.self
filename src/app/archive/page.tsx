"use client";

import { useLang } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import ImportModal from "@/components/layout/ImportModal";

interface ArticleItem {
  filename: string;
  path: string;
  date: string | null;
  title: string;
  category: string | null;
  size: number;
  total_articles?: number;
}

const WEEKDAYS_ZH = ["一", "二", "三", "四", "五", "六", "日"];
const WEEKDAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function weekdayOffsetMondayFirst(year: number, month: number): number {
  const jsDay = new Date(year, month - 1, 1).getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function formatMonth(monthKey: string, lang: string): string {
  const [year, month] = monthKey.split("-");
  return lang === "zh"
    ? `${year}年${Number(month)}月`
    : `${new Date(Number(year), Number(month) - 1).toLocaleString("en-US", { month: "long" })} ${year}`;
}

export default function ArchivePage() {
  const { lang } = useLang();
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [grouped, setGrouped] = useState<Record<string, ArticleItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);

  const loadArticles = useCallback(() => {
    setLoading(true);
    fetch("/api/articles")
      .then((r) => r.json())
      .then((data) => {
        setArticles(data.articles || []);
        setGrouped(data.grouped || {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  useEffect(() => {
    const onUpdate = () => loadArticles();
    window.addEventListener("selfware-content-updated", onUpdate);
    return () => window.removeEventListener("selfware-content-updated", onUpdate);
  }, [loadArticles]);

  const sortedMonths = useMemo(
    () => Object.keys(grouped).filter((k) => k !== "_imported").sort().reverse(),
    [grouped]
  );

  const todayStr = useMemo(() => getTodayString(), []);
  const weekdays = lang === "zh" ? WEEKDAYS_ZH : WEEKDAYS_EN;

  return (
    <div
      style={{
        minHeight: "calc(100vh - 3.5rem)",
        background: "var(--bg)",
        backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        overflowY: "auto",
      }}
    >
      <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "40px 24px 72px" }}>
        {/* Hero section */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: "24px",
            marginBottom: "24px",
          }}
        >
          <div className="card" style={{ padding: "30px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--accent)",
                marginBottom: "16px",
                fontWeight: 700,
              }}
            >
              {lang === "zh" ? "内容日历" : "Content Calendar"}
            </div>
            <h1
              style={{
                margin: "0 0 12px",
                fontSize: "clamp(2rem, 4vw, 3.2rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
                color: "var(--text)",
              }}
            >
              {lang === "zh" ? "内容日历" : "Content Calendar"}
            </h1>
            <div style={{ color: "var(--muted)", fontSize: "1.02rem", lineHeight: 1.8 }}>
              {lang === "zh"
                ? "按月份查看每天生成的文章。有内容的日期会直接高亮，点进具体日期，就能打开当天的 self 文章。"
                : "Browse articles by month. Highlighted dates have content—click to open the article."}
            </div>
            <button
              onClick={() => setImportOpen(true)}
              className="cursor-pointer"
              style={{
                marginTop: "20px",
                padding: "10px 20px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 600,
                border: "none",
                background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                color: "#081018",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              📥 {lang === "zh" ? "导入文章" : "Import Article"}
            </button>
          </div>

          <div
            className="card"
            style={{
              padding: "24px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px",
              alignContent: "start",
            }}
          >
            <MiniStat
              label={lang === "zh" ? "文章总数" : "Total Articles"}
              value={String(articles.length)}
              accent
            />
            <MiniStat
              label={lang === "zh" ? "覆盖月份" : "Months"}
              value={String(sortedMonths.length)}
              accent
            />
            <MiniStat
              label={lang === "zh" ? "最近更新" : "Latest"}
              value={
                articles[0]
                  ? `${articles[0].date || "—"} · ${articles[0].title}`
                  : lang === "zh" ? "暂无" : "None"
              }
              small
            />
            <MiniStat
              label={lang === "zh" ? "浏览方式" : "Browse Mode"}
              value={lang === "zh" ? "月历视图优先" : "Calendar-first view"}
              small
            />
          </div>
        </section>

        {/* Calendar */}
        <section className="card" style={{ padding: "24px", marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            <div style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
              {lang === "zh"
                ? "先看月份，再扫日期，最后点开正文。"
                : "Scan months, then dates, then click to read."}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <LegendItem
                active={false}
                text={lang === "zh" ? "无文章" : "No article"}
              />
              <LegendItem
                active
                text={lang === "zh" ? "有文章，可点击" : "Has article"}
              />
            </div>
          </div>

          {loading ? (
            <div
              style={{
                padding: "28px",
                borderRadius: "16px",
                background: "var(--panel-2)",
                border: "1px solid var(--border)",
                textAlign: "center",
                lineHeight: 1.8,
              }}
            >
              {t("self.loading", lang)}
            </div>
          ) : sortedMonths.length === 0 ? (
            <div
              style={{
                padding: "28px",
                borderRadius: "16px",
                background: "var(--panel-2)",
                border: "1px solid var(--border)",
                textAlign: "center",
                lineHeight: 1.8,
              }}
            >
              {lang === "zh"
                ? "还没有可展示的日报。先导入文章，再回来这里按日期浏览。"
                : "No articles yet. Import some and browse by date."}
            </div>
          ) : (
            <div style={{ display: "grid", gap: "24px" }}>
              {sortedMonths.map((monthKey) => {
                const monthArticles = grouped[monthKey] || [];
                const [yearStr, monthStr] = monthKey.split("-");
                const year = Number(yearStr);
                const month = Number(monthStr);
                const totalDays = daysInMonth(year, month);
                const offset = weekdayOffsetMondayFirst(year, month);
                const articleMap = new Map(
                  monthArticles
                    .filter((a) => a.date)
                    .map((a) => [a.date, a])
                );

                return (
                  <div
                    key={monthKey}
                    className="card"
                    style={{ padding: "22px" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                        gap: "16px",
                        marginBottom: "18px",
                      }}
                    >
                      <div>
                        <h2
                          style={{
                            margin: 0,
                            fontSize: "1.4rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          {formatMonth(monthKey, lang)}
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              minWidth: "42px",
                              height: "28px",
                              padding: "0 10px",
                              borderRadius: "999px",
                              background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                              color: "#081018",
                              fontSize: "0.82rem",
                              fontWeight: 800,
                            }}
                          >
                            {monthArticles.length}
                          </span>
                        </h2>
                        <div style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: "4px" }}>
                          {lang === "zh"
                            ? `本月已有 ${monthArticles.length} 篇日报归档`
                            : `${monthArticles.length} articles archived`}
                        </div>
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{monthKey}</div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                        gap: "10px",
                      }}
                    >
                      {weekdays.map((d) => (
                        <div
                          key={d}
                          style={{
                            textAlign: "center",
                            color: "var(--muted)",
                            fontSize: "0.78rem",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            paddingBottom: "4px",
                          }}
                        >
                          {d}
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                        gap: "10px",
                      }}
                    >
                      {Array.from({ length: offset }).map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          style={{
                            minHeight: "86px",
                            borderRadius: "18px",
                            border: "1px solid var(--border)",
                            background: "var(--panel-3)",
                            opacity: 0.32,
                          }}
                        />
                      ))}

                      {Array.from({ length: totalDays }).map((_, idx) => {
                        const day = idx + 1;
                        const date = `${monthKey}-${String(day).padStart(2, "0")}`;
                        const article = articleMap.get(date);
                        const isToday = date === todayStr;

                        if (!article) {
                          return (
                            <div
                              key={date}
                              style={{
                                minHeight: "106px",
                                borderRadius: "18px",
                                border: "1px solid var(--border)",
                                background: "var(--panel-3)",
                                padding: "12px",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                gap: "10px",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                                <div style={{ fontSize: "1.05rem", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
                                  {day}
                                </div>
                                {isToday && <TodayBadge lang={lang} />}
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                <span
                                  style={{
                                    padding: "3px 7px",
                                    borderRadius: "999px",
                                    background: "var(--panel)",
                                    border: "1px solid var(--border)",
                                    fontSize: "0.72rem",
                                    color: "var(--muted)",
                                  }}
                                >
                                  {lang === "zh" ? "暂无内容" : "No content"}
                                </span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <Link
                            key={date}
                            href={`/doc?path=${encodeURIComponent(article.path)}`}
                            style={{ textDecoration: "none", color: "inherit", display: "block" }}
                          >
                            <div
                              style={{
                                minHeight: "106px",
                                borderRadius: "18px",
                                border: "1px solid var(--border)",
                                background: "linear-gradient(180deg, var(--panel-2), rgba(0,240,255,0.06))",
                                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                                padding: "12px",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                gap: "10px",
                                transition: "0.2s ease",
                                cursor: "pointer",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-2px)";
                                e.currentTarget.style.borderColor = "var(--accent)";
                                e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,240,255,0.10)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.borderColor = "var(--border)";
                                e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.04)";
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                                <div style={{ fontSize: "1.05rem", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
                                  {day}
                                </div>
                                {isToday ? (
                                  <TodayBadge lang={lang} />
                                ) : (
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      padding: "4px 8px",
                                      borderRadius: "999px",
                                      background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                                      color: "#081018",
                                      fontSize: "0.72rem",
                                      fontWeight: 800,
                                    }}
                                  >
                                    {lang === "zh" ? "已生成" : "Generated"}
                                  </span>
                                )}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.83rem",
                                  lineHeight: 1.45,
                                  color: "var(--text)",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                {article.title || (lang === "zh" ? "当日文章" : "Today's article")}
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", color: "var(--muted)", fontSize: "0.72rem" }}>
                                {article.category && (
                                  <span
                                    style={{
                                      padding: "3px 7px",
                                      borderRadius: "999px",
                                      background: "var(--panel)",
                                      border: "1px solid var(--border)",
                                    }}
                                  >
                                    {article.category}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <ImportModal
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          loadArticles();
        }}
      />
    </div>
  );
}

function MiniStat({
  label,
  value,
  accent,
  small,
}: {
  label: string;
  value: string;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--panel-2)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "16px 18px",
        minHeight: "104px",
      }}
    >
      <div
        style={{
          color: "var(--muted)",
          fontSize: "12px",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "8px",
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: small ? "0.98rem" : "1.6rem",
          fontWeight: small ? 500 : 800,
          color: small ? "var(--text)" : "var(--accent)",
          lineHeight: small ? 1.6 : 1.2,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function TodayBadge({ lang }: { lang: string }) {
  return (
    <span
      style={{
        fontSize: "0.68rem",
        color: "var(--good)",
        border: "1px solid rgba(34,197,94,0.25)",
        background: "rgba(34,197,94,0.08)",
        padding: "3px 7px",
        borderRadius: "999px",
      }}
    >
      {lang === "zh" ? "今天" : "Today"}
    </span>
  );
}

function LegendItem({ active, text }: { active: boolean; text: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        color: "var(--muted)",
        fontSize: "0.85rem",
        padding: "8px 12px",
        borderRadius: "999px",
        border: "1px solid var(--border)",
        background: "var(--panel-2)",
      }}
    >
      <span
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "999px",
          background: active
            ? "linear-gradient(135deg, var(--accent), var(--accent-2))"
            : "var(--panel-3)",
          border: active ? "none" : "1px solid var(--border)",
          boxShadow: active ? "0 0 0 4px rgba(0,240,255,0.08)" : "none",
        }}
      />
      {text}
    </div>
  );
}
