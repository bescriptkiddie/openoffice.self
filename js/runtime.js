(function () {
  const SUPPORTED_LANGS = ["zh", "en"];
  const I18N = {
    en: {
      // Global
      "global.edit_source": "Edit Source",
      "global.close": "Close",
      "global.save_changes": "Save Changes",
      "global.saving": "Saving...",
      "global.saved_source": "Saved source",
      "global.save_failed": "Save failed",
      "global.source_markdown": "SOURCE // MARKDOWN",

      // Self view
      "self.subtitle_html": [
        "Welcome to your <strong>Selfware</strong> space.<br>",
        "This isn’t just a document — it’s a living <strong>“file as software”</strong> artifact.<br>",
        "You can build anything on top of this protocol: a knowledge base, analytics dashboard, personal assistant, and more.<br>",
        "No complex coding required: open this repo in an Agent and <strong>iterate by conversation</strong> — update content, upgrade capabilities, enable Git versioning, or even turn on Discovery for self‑evolution.",
      ].join(""),
      "self.desc.doc": "Document reading view",
      "self.desc.presentation": "Slide deck mode",
      "self.desc.outline": "Structured outline view",
      "self.desc.card": "Card-based reading",
      "self.desc.mindmap": "Mind map visualization",
      "self.desc.canvas": "Freeform canvas editing",
      "self.instance_status": "Instance Status",
      "self.capabilities": "Capabilities & AI Interaction",
      "self.try_ask": "Try asking Agent:",
      "self.manifest": "Manifest Declaration",
      "self.loading_instance": "Loading instance data...",
      "self.loading_caps": "Loading capabilities...",
      "self.prompt.1": "“Enable Git and commit current changes”",
      "self.prompt.2": "“Export this document as a .self package”",
      "self.prompt.3": "“Analyze the current content and generate a new dashboard view”",
      "self.prompt.4": "“Check if there’s a new version of the Selfware protocol”",
      "self.prompt.5": "“Extract all TODOs into a task list”",

      // Canvas view
      "canvas.btn_link": "Link",
      "canvas.btn_reset": "Reset",
      "canvas.toast_updated": "View updated",
      "canvas.toast_source_selected": "Source selected: ",
      "canvas.toast_link_added": "Link added",
      "canvas.toast_save_failed": "Save failed",
      "canvas.toast_link_deleted": "Semantic link deleted",
      "canvas.toast_link_not_found": "Could not find link in source",
      "canvas.md_link_text": "See",

      // Card view (selected)
      "card.mode.single": "Longform",
      "card.mode.auto": "Split by headings",
      "card.mode.hr": "Split by separator",
      "card.split_hint": "Split by headings: split cards by H2 (##). Split by separator: split cards by `---`.",
      "card.width": "Width",
      "card.height": "Height",
      "card.size": "Size",
      "card.auto_zoom": "Auto zoom",
      "card.auto_zoom_hint": "Fit preview width automatically; slider acts as a fine-tune multiplier.",
      "card.font": "Font",
      "card.font_zh_system": "Chinese system",
      "card.font_size": "Font size",
      "card.theme": "Theme",
      "card.theme_hint": "Built-in themes. Click the dots to switch styles. You can ask the Agent to modify or create new themes.",
      "card.theme_system": "System theme",
      "card.memo": "Memo",
      "card.dblclick_edit": "Double-click to edit",
      "card.size.xhs": "Xiaohongshu 440×586",
      "card.size.long": "Long image 800×1200",
      "card.size.landscape": "Landscape 1200×628",
    },
    zh: {
      // leave empty; zh uses existing literals in HTML
    },
  };

  function normalizeLang(input) {
    if (!input) return null;
    const raw = String(input).trim().toLowerCase();
    if (raw === "zh" || raw.startsWith("zh-")) return "zh";
    if (raw === "en" || raw.startsWith("en-")) return "en";
    return null;
  }

  function detectInitialLang() {
    const urlLang = new URLSearchParams(window.location.search).get("lang");
    const fromUrl = normalizeLang(urlLang);
    if (fromUrl) return fromUrl;

    const saved = normalizeLang(window.localStorage.getItem("selfware-lang"));
    if (saved) return saved;

    const navs = []
      .concat(navigator.languages || [])
      .concat([navigator.language, navigator.userLanguage])
      .filter(Boolean);
    for (const n of navs) {
      const v = normalizeLang(n);
      if (v) return v;
    }
    return "zh";
  }

  function withLang(urlOrPath, lang) {
    const language = normalizeLang(lang) || window.selfwareLang || "zh";
    const url = new URL(urlOrPath, window.location.href);
    url.searchParams.set("lang", language);
    return url.pathname + url.search + url.hash;
  }

  function setDocumentLang(lang) {
    const language = normalizeLang(lang) || "zh";
    const html = document.documentElement;
    if (!html) return;
    html.setAttribute("lang", language === "zh" ? "zh-CN" : "en");
  }

  function patchInternalHtmlLinks(lang) {
    const language = normalizeLang(lang) || window.selfwareLang || "zh";
    const anchors = document.querySelectorAll("a[href]");
    anchors.forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (!href) return;
      if (href.startsWith("#")) return;
      if (/^[a-zA-Z]+:\/\//.test(href)) return;
      if (!href.includes(".html")) return;
      try {
        a.setAttribute("href", withLang(href, language));
      } catch {}
    });
  }

  function setLang(lang, opts) {
    const options = opts || { reload: true };
    const language = normalizeLang(lang) || "zh";
    window.selfwareLang = language;
    window.localStorage.setItem("selfware-lang", language);
    setDocumentLang(language);
    patchInternalHtmlLinks(language);

    if (options.reload) {
      window.location.href = withLang(window.location.pathname + window.location.search + window.location.hash, language);
    } else {
      const url = new URL(window.location.href);
      url.searchParams.set("lang", language);
      window.history.replaceState({}, "", url.toString());
    }
  }

  const initial = detectInitialLang();
  window.selfwareLang = initial;
  window.selfwareSupportedLangs = SUPPORTED_LANGS.slice();
  window.selfwareWithLang = (u) => withLang(u, window.selfwareLang);
  window.selfwareSetLang = (l, o) => setLang(l, o);
  window.selfwareT = (key, fallback) => {
    const language = window.selfwareLang || "zh";
    const dict = I18N[language] || {};
    const val = dict[key];
    if (typeof val === "string" && val.length) return val;
    if (typeof fallback === "string") return fallback;
    return key;
  };
  window.selfwareApplyText = (selector, key, fallback) => {
    try {
      const el = document.querySelector(selector);
      if (el) el.textContent = window.selfwareT(key, fallback || el.textContent);
    } catch {}
  };
  window.selfwareApplyHtml = (selector, key, fallback) => {
    try {
      const el = document.querySelector(selector);
      if (el) el.innerHTML = window.selfwareT(key, fallback || el.innerHTML);
    } catch {}
  };

  // If no explicit lang is present in the URL, make the detected language visible in the URL.
  // This improves shareability and keeps navigation consistent across views.
  try {
    const url = new URL(window.location.href);
    if (!normalizeLang(url.searchParams.get("lang"))) {
      if (initial !== "zh") {
        url.searchParams.set("lang", initial);
        window.history.replaceState({}, "", url.toString());
      }
    }
  } catch {}

  // Apply immediately
  setDocumentLang(initial);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => patchInternalHtmlLinks(initial), { once: true });
  } else {
    patchInternalHtmlLinks(initial);
  }
})();
