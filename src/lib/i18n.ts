import type { Lang } from "./types";

const I18N: Record<Lang, Record<string, string>> = {
  en: {
    "global.edit_source": "Edit Source",
    "global.close": "Close",
    "global.save_changes": "Save Changes",
    "global.saving": "Saving...",
    "global.saved_source": "Saved source",
    "global.save_failed": "Save failed",
    "global.ai_edit": "AI Edit",

    "self.subtitle":
      "Welcome to your Selfware space. This isn't just a document — it's a living \"file as software\" artifact. You can build anything on top of this protocol.",
    "self.instance_status": "Instance Status",
    "self.capabilities": "Capabilities & AI Interaction",
    "self.try_ask": "Try asking Agent:",
    "self.manifest": "Manifest Declaration",
    "self.loading": "Loading...",
    "self.prompt.1": '"Enable Git and commit current changes"',
    "self.prompt.2": '"Export this document as a .self package"',
    "self.prompt.3": '"Analyze the current content and generate a new dashboard view"',
    "self.prompt.4": '"Check if there\'s a new version of the Selfware protocol"',
    "self.prompt.5": '"Extract all TODOs into a task list"',

    "nav.view_switcher": "View",
    "nav.theme": "Theme",
    "nav.lang": "Language",

    "chat.title": "AI // SELFWARE EDIT",
    "chat.placeholder": "Enter edit instruction...",
    "chat.empty": "Select text from the article, or type an instruction to let AI modify the document following Selfware protocol",
    "chat.thinking": "AI is modifying following Selfware protocol",
    "chat.applied": "AI edit applied",
    "chat.failed": "AI edit failed",
    "chat.selected_text": "Selected text",
    "chat.edit_applied": "✅ Edit applied",
    "chat.unexpected_format": "⚠️ Model returned unexpected format",
    "chat.request_failed": "❌ Request failed",

    "doc.title": "Document View",
    "outline.title": "Outline View",
    "mindmap.title": "Mindmap View",
    "canvas.title": "Canvas View",
    "presentation.title": "Presentation View",
    "card.title": "Card View",
    "archive.title": "Article Archive",

    "export.button": "Export .self",
    "export.with_memory": "Export .self",
    "export.success": "Exporting .self package...",
    "export.failed": "Export failed",
  },
  zh: {
    "global.edit_source": "编辑源码",
    "global.close": "关闭",
    "global.save_changes": "保存修改",
    "global.saving": "保存中...",
    "global.saved_source": "已保存",
    "global.save_failed": "保存失败",
    "global.ai_edit": "AI 编辑",

    "self.subtitle":
      "欢迎来到你的 Selfware 空间。这不只是一份文档——它是一个活的「文件即软件」制品。你可以在这个协议之上构建任何东西。",
    "self.instance_status": "实例状态",
    "self.capabilities": "能力声明 & AI 交互",
    "self.try_ask": "试试让 Agent：",
    "self.manifest": "清单声明",
    "self.loading": "加载中...",
    "self.prompt.1": '"启用 Git 并提交当前更改"',
    "self.prompt.2": '"将这个文档导出为 .self 包"',
    "self.prompt.3": '"分析当前内容并生成新的仪表盘视图"',
    "self.prompt.4": '"检查是否有 Selfware 协议的新版本"',
    "self.prompt.5": '"提取所有 TODO 整理为任务列表"',

    "nav.view_switcher": "视图",
    "nav.theme": "主题",
    "nav.lang": "语言",

    "chat.title": "AI // SELFWARE 编辑",
    "chat.placeholder": "输入编辑指令…",
    "chat.empty": "选中文章中的文字，或直接输入指令\n让 AI 按 Selfware 协议修改文档",
    "chat.thinking": "AI 正在按 Selfware 协议修改",
    "chat.applied": "AI 编辑已应用",
    "chat.failed": "AI 编辑失败",
    "chat.selected_text": "选中文本",
    "chat.edit_applied": "✅ 已应用修改",
    "chat.unexpected_format": "⚠️ 模型返回了意外的格式",
    "chat.request_failed": "❌ 请求失败",

    "doc.title": "文档视图",
    "outline.title": "大纲视图",
    "mindmap.title": "脑图视图",
    "canvas.title": "画布视图",
    "presentation.title": "演示视图",
    "card.title": "卡片视图",
    "archive.title": "文章归档",

    "export.button": "导出 .self",
    "export.with_memory": "导出 .self",
    "export.success": "正在导出 .self 容器...",
    "export.failed": "导出失败",
  },
};

export function t(key: string, lang: Lang = "zh"): string {
  return I18N[lang]?.[key] || I18N.zh[key] || key;
}
