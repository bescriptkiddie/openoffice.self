"use client";

import { useLang, useContent } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";

type SplitMode = "single" | "auto" | "hr";
type CardTheme = "apple-light" | "apple-dark" | "instagram" | "notebook" | "popart";

interface CardThemeDef {
  id: CardTheme;
  name: string;
  swatches: string[];
}

const CARD_THEMES: CardThemeDef[] = [
  { id: "apple-light", name: "Apple Notes (Light)", swatches: ["#ffffff", "#f8c744"] },
  { id: "apple-dark", name: "Apple Notes (Dark)", swatches: ["#1c1c1e", "#ffd60a"] },
  { id: "instagram", name: "Instagram", swatches: ["#ffffff", "#E1306C"] },
  { id: "notebook", name: "Coil Notebook", swatches: ["#fffbf0", "#d35400"] },
  { id: "popart", name: "Pop Art", swatches: ["#ffeb3b", "#000000"] },
];

const SIZE_PRESETS = [
  { label: "小红书 440×586", w: 440, h: 586 },
  { label: "长图 800×1200", w: 800, h: 1200 },
  { label: "Instagram 1080×1080", w: 1080, h: 1080 },
  { label: "Instagram 1080×1350", w: 1080, h: 1350 },
  { label: "Story 1080×1920", w: 1080, h: 1920 },
  { label: "横版 1200×628", w: 1200, h: 628 },
];

function splitCards(md: string, mode: SplitMode): string[] {
  const normalized = (md || "").replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [""];

  if (mode === "single") return [normalized];

  if (mode === "auto") {
    const parts: string[] = [];
    let current: string[] = [];
    for (const line of normalized.split("\n")) {
      if (line.match(/^##\s+/) && current.length > 0) {
        parts.push(current.join("\n").trim());
        current = [];
      }
      current.push(line);
    }
    if (current.length) parts.push(current.join("\n").trim());
    return parts.filter(Boolean);
  }

  const parts = normalized.split(/(?:^|\n)\s*-{3,}\s*(?=\n|$)/g);
  return parts.map((s) => s.trim()).filter(Boolean);
}

function getCardThemeStyles(theme: CardTheme): React.CSSProperties {
  switch (theme) {
    case "apple-light":
      return {
        background: "#ffffff",
        color: "#333333",
        fontFamily: '"PingFang SC", -apple-system, "system-ui", "Hiragino Sans GB", "Segoe UI", "Microsoft YaHei", Arial, sans-serif',
      };
    case "apple-dark":
      return {
        background: "#1c1c1e",
        color: "#ffffff",
        fontFamily: '"PingFang SC", -apple-system, "system-ui", "Hiragino Sans GB", "Segoe UI", "Microsoft YaHei", Arial, sans-serif',
      };
    case "instagram":
      return {
        background: "#ffffff",
        color: "#262626",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        borderTop: "6px solid transparent",
        borderImage: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%) 1",
      };
    case "notebook":
      return {
        backgroundColor: "#fffbf0",
        backgroundImage: "linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px)",
        backgroundSize: "100% 32px",
        color: "#2c3e50",
        fontFamily: '"Courier New", Courier, monospace',
      };
    case "popart":
      return {
        background: "#ffeb3b",
        color: "#000",
        fontFamily: '"Impact", "Arial Black", sans-serif',
        border: "4px solid #000",
        boxShadow: "8px 8px 0 #000",
        borderRadius: "0",
      };
    default:
      return { background: "#ffffff", color: "#333" };
  }
}

export default function CardPage() {
  const { lang } = useLang();
  const { content, setContent, contentPath, loading, refetch } = useContent(lang);

  const [mode, setMode] = useState<SplitMode>("hr");
  const [cardTheme, setCardTheme] = useState<CardTheme>("apple-light");
  const [cardW, setCardW] = useState(440);
  const [cardH, setCardH] = useState(586);
  const [zoom, setZoom] = useState(100);
  const [fontSize, setFontSize] = useState(16);
  const [selectedCard, setSelectedCard] = useState(0);
  const [editorText, setEditorText] = useState("");
  const [saving, setSaving] = useState(false);

  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditorText(content);
  }, [content]);

  const cards = useMemo(() => splitCards(editorText, mode), [editorText, mode]);

  const modes: { id: SplitMode; label: string }[] = [
    { id: "single", label: lang === "zh" ? "长图文" : "Longform" },
    { id: "auto", label: lang === "zh" ? "标题拆分" : "By Heading" },
    { id: "hr", label: lang === "zh" ? "横线拆分" : "By Separator" },
  ];

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editorText, lang, path: contentPath }),
      });
      if (res.ok) {
        setContent(editorText);
      }
    } catch (e) {
      console.error("Save failed:", e);
    } finally {
      setSaving(false);
    }
  }, [editorText, lang, contentPath, setContent]);

  const handleSizePreset = useCallback((preset: string) => {
    const found = SIZE_PRESETS.find((p) => `${p.w}x${p.h}` === preset);
    if (found) {
      setCardW(found.w);
      setCardH(found.h);
    }
  }, []);

  if (loading) {
    return (
      <div
        style={{ height: "calc(100vh - 3.5rem)" }}
        className="flex items-center justify-center"
      >
        <div className="animate-pulse text-[var(--muted)]">
          {t("self.loading", lang)}
        </div>
      </div>
    );
  }

  const zoomScale = zoom / 100;

  return (
    <div
      style={{
        height: "calc(100vh - 3.5rem)",
        display: "grid",
        gridTemplateColumns: "420px 1fr 340px",
        overflow: "hidden",
        background: "transparent",
      }}
    >
      {/* Left: Editor */}
      <section
        style={{
          borderRight: "1px solid var(--border)",
          background: "var(--panel)",
          backdropFilter: "blur(18px)",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <button
            onClick={() => {
              setEditorText(content);
              refetch();
            }}
            className="cursor-pointer"
            style={{
              flex: 1,
              background: "var(--panel-2)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              padding: "7px 10px",
              borderRadius: "8px",
              fontSize: "12px",
              textAlign: "center",
              transition: "all 0.2s",
            }}
          >
            Reload
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="cursor-pointer"
            style={{
              flex: 1,
              background: "var(--text)", // High contrast action
              border: "1px solid var(--text)",
              color: "var(--bg)", // Inverse text
              padding: "7px 10px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 600,
              textAlign: "center",
              opacity: saving ? 0.5 : 1,
              transition: "all 0.2s",
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
        <textarea
          ref={editorRef}
          value={editorText}
          onChange={(e) => setEditorText(e.target.value)}
          spellCheck={false}
          style={{
            flex: 1,
            width: "100%",
            boxSizing: "border-box",
            border: "none",
            outline: "none",
            resize: "none",
            padding: "18px",
            background: "transparent",
            color: "var(--text)",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            lineHeight: 1.65,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            tabSize: 2,
            overflow: "auto",
          }}
        />
      </section>

      {/* Center: Card Preview */}
      <main style={{ position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "42px 40px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "40px",
              alignItems: "center",
              transform: `scale(${zoomScale})`,
              transformOrigin: "top center",
            }}
          >
            {cards.map((cardContent, i) => (
              <div
                key={i}
                onClick={() => setSelectedCard(i)}
                style={{
                  width: cardW,
                  height: mode === "single" ? "auto" : cardH,
                  minHeight: mode === "single" ? cardH : undefined,
                  boxSizing: "border-box",
                  borderRadius: cardTheme === "popart" ? "0" : "20px",
                  overflow: "hidden",
                  boxShadow:
                    i === selectedCard
                      ? "0 20px 60px -10px rgba(0,0,0,0.3)"
                      : "0 10px 30px -10px rgba(0,0,0,0.1)",
                  outline: i === selectedCard ? "4px solid var(--accent-2)" : "none",
                  outlineOffset: "4px",
                  cursor: "pointer",
                  transition: "box-shadow 0.3s, transform 0.3s, outline 0.2s",
                  padding: cardTheme === "instagram" ? "0" : "20px",
                  fontSize: `${fontSize}px`,
                  lineHeight: "1.75",
                  ...getCardThemeStyles(cardTheme),
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {cardTheme === "instagram" && (
                  <div
                    style={{
                      height: "6px",
                      background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                    }}
                  />
                )}
                <div style={{ padding: cardTheme === "instagram" ? "24px" : "0" }}>
                  <MarkdownRenderer content={cardContent} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Right: Controls */}
      <aside
        style={{
          borderLeft: "1px solid var(--border)",
          background: "var(--panel)",
          backdropFilter: "blur(22px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: "var(--muted)",
            }}
          >
            {lang === "zh" ? "控制面板" : "Controls"}
          </span>
          <button
            onClick={() => {
              /* placeholder export */
            }}
            className="cursor-pointer"
            style={{
              background: "var(--panel-2)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              padding: "6px 10px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            Export ▾
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "16px",
            boxSizing: "border-box",
          }}
        >
          {/* Mode */}
          <Section title={lang === "zh" ? "模式" : "Mode"}>
            <div style={{ display: "flex", gap: "6px", background: "var(--panel-2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "4px" }}>
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className="cursor-pointer"
                  style={{
                    border: "none",
                    background: m.id === mode ? "var(--bg)" : "transparent",
                    color: m.id === mode ? "var(--text)" : "var(--muted)",
                    padding: "6px 8px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 500,
                    boxShadow: m.id === mode ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    flex: 1,
                    textAlign: "center",
                    transition: "all 0.2s",
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Size */}
          <Section title={lang === "zh" ? "尺寸" : "Size"}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "11px", color: "var(--muted)" }}>
                  {lang === "zh" ? "宽度" : "Width"}
                </label>
                <input
                  type="number"
                  min={240}
                  value={cardW}
                  onChange={(e) => setCardW(Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "11px", color: "var(--muted)" }}>
                  {lang === "zh" ? "高度" : "Height"}
                </label>
                <input
                  type="number"
                  min={240}
                  value={cardH}
                  onChange={(e) => setCardH(Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
            </div>
            <div style={{ marginTop: "12px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "11px", color: "var(--muted)" }}>
                {lang === "zh" ? "选择尺寸" : "Preset Size"}
              </label>
              <select
                onChange={(e) => handleSizePreset(e.target.value)}
                value={`${cardW}x${cardH}`}
                style={{ ...inputStyle, width: "100%", cursor: "pointer" }}
              >
                {SIZE_PRESETS.map((p) => (
                  <option key={`${p.w}x${p.h}`} value={`${p.w}x${p.h}`}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginTop: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <label style={{ fontSize: "11px", color: "var(--muted)" }}>
                  {lang === "zh" ? "缩放" : "Zoom"}
                </label>
                <span style={{ color: "var(--muted)", fontSize: "11px" }}>{zoom}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={200}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ width: "100%", marginTop: "6px", accentColor: "var(--text)" }}
              />
            </div>
          </Section>

          {/* Typography */}
          <Section title={lang === "zh" ? "字体" : "Typography"}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <label style={{ fontSize: "11px", color: "var(--muted)" }}>
                {lang === "zh" ? "字号" : "Font Size"}
              </label>
              <span style={{ color: "var(--muted)", fontSize: "11px" }}>{fontSize}px</span>
            </div>
            <input
              type="range"
              min={12}
              max={26}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={{ width: "100%", marginTop: "6px", accentColor: "var(--text)" }}
            />
          </Section>

          {/* Theme */}
          <Section title={lang === "zh" ? "卡片主题" : "Card Theme"}>
            <p style={{ marginTop: "4px", marginBottom: "12px", color: "var(--muted)", fontSize: "12px" }}>
              {lang === "zh"
                ? "点击选择卡片样式。"
                : "Click to select card style."}
            </p>
            <div className="flex flex-col gap-2">
              {CARD_THEMES.map((th) => (
                <div
                  key={th.id}
                  onClick={() => setCardTheme(th.id)}
                  className="cursor-pointer transition-all"
                  style={{
                    border: `1px solid ${th.id === cardTheme ? "var(--text)" : "var(--border)"}`,
                    background: th.id === cardTheme ? "var(--panel-2)" : "transparent",
                    borderRadius: "8px",
                    padding: "10px 12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 500, color: "var(--text)", fontSize: "13px" }}>
                      {th.name}
                    </span>
                    <div style={{ display: "flex", gap: "4px" }}>
                      {th.swatches.map((sw, i) => (
                        <div
                          key={i}
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            background: sw,
                            border: "1px solid rgba(0,0,0,0.1)",
                            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.05)",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </aside>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--bg)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  borderRadius: "6px",
  padding: "6px 10px",
  fontSize: "13px",
  width: "100%",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        background: "var(--panel-3)",
        borderRadius: "10px",
        padding: "14px",
        marginBottom: "16px",
      }}
    >
      <h3
        style={{
          margin: "0 0 10px",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "1px",
          textTransform: "uppercase",
          color: "var(--muted)",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}
