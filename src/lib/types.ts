export type Theme = "dark" | "light" | "book";
export type Lang = "zh" | "en";

export interface ViewDef {
  name: string;
  path: string;
  icon: string;
  description?: Record<Lang, string>;
}

export const VIEWS: ViewDef[] = [
  {
    name: "Self",
    path: "/",
    icon: "🧾",
    description: { zh: "理念入口", en: "Protocol entry" },
  },
  {
    name: "Doc",
    path: "/doc",
    icon: "📄",
    description: { zh: "文档视图", en: "Document reading view" },
  },
  {
    name: "Presentation",
    path: "/presentation",
    icon: "📊",
    description: { zh: "演示视图", en: "Slide deck mode" },
  },
  {
    name: "Card",
    path: "/card",
    icon: "🃏",
    description: { zh: "卡片视图", en: "Card-based reading" },
  },
  {
    name: "Outline",
    path: "/outline",
    icon: "📝",
    description: { zh: "大纲视图", en: "Structured outline view" },
  },
  {
    name: "Mindmap",
    path: "/mindmap",
    icon: "🧠",
    description: { zh: "脑图视图", en: "Mind map visualization" },
  },
  {
    name: "Canvas",
    path: "/canvas",
    icon: "🎨",
    description: { zh: "画布视图", en: "Freeform canvas editing" },
  },
  {
    name: "Archive",
    path: "/archive",
    icon: "📚",
    description: { zh: "文章归档", en: "Article archive" },
  },
];

export interface CapabilitiesPayload {
  protocol: {
    path: string;
    translations: { lang: string; path: string }[];
  };
  canonical: {
    path: string;
    variants: { lang: string; path: string }[];
  };
  languages: { supported: string[] };
  write_scope: string[];
  confirmation_required: string[];
  agent_interaction: {
    proactive_prompting: boolean;
    no_silent_apply: boolean;
    note: string;
  };
  endpoints: Record<string, string>;
  modules: Record<string, Record<string, unknown>>;
  base_url?: string;
}

export interface ChangeRecord {
  id: string;
  timestamp: string;
  actor: string;
  intent: string;
  paths: string[];
  summary: string;
  rollback_hint: string;
}

export interface Article {
  filename: string;
  path: string;
  date: string | null;
  title: string;
  category: string | null;
  size: number;
}
