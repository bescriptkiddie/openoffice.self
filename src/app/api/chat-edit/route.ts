import { NextRequest, NextResponse } from "next/server";
import {
  normalizeLang,
  canonicalPathForLang,
  protocolPathForLang,
  readTextFile,
  writeTextFile,
  writeChangeRecord,
} from "@/lib/selfware";

const LLM_BASE_URL = (
  process.env.SELFWARE_LLM_BASE_URL || "https://api.stepfun.com/v1"
).replace(/\/+$/, "");
const LLM_MODEL = process.env.SELFWARE_LLM_MODEL || "step-3.5-flash";
const LLM_API_KEY = process.env.SELFWARE_LLM_API_KEY || "";

const REPLY_DELIMITER = "===REPLY===";
const CHANGE_RECORD_DELIMITER = "===CHANGE_RECORD===";

function stripMarkdownFences(text: string): string {
  let s = (text || "").trim();
  if (s.startsWith("```")) {
    const lines = s.split("\n");
    lines.shift();
    while (lines.length && lines[lines.length - 1].trim().startsWith("```")) {
      lines.pop();
    }
    return lines.join("\n").trim();
  }
  return s;
}

function parseEditResponse(raw: string): {
  content: string;
  reply: string;
  changeYaml: string;
} {
  let content = raw.trim();
  let reply = "";
  let changeYaml = "";

  if (content.includes(CHANGE_RECORD_DELIMITER)) {
    const parts = content.split(CHANGE_RECORD_DELIMITER);
    content = parts[0];
    changeYaml = parts[1].trim();
  }
  if (content.includes(REPLY_DELIMITER)) {
    const parts = content.split(REPLY_DELIMITER);
    content = parts[0];
    reply = parts[1].trim();
  }

  return { content: content.trim(), reply, changeYaml };
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const instruction = data.instruction;
    const selection = data.selection || "";
    const history = data.history || [];
    const customPath = data.path || null;
    const lang =
      normalizeLang(data.lang) ||
      normalizeLang(request.nextUrl.searchParams.get("lang")) ||
      "zh";

    if (typeof instruction !== "string" || !instruction.trim()) {
      return NextResponse.json(
        { error: "Invalid payload: missing 'instruction' string" },
        { status: 400 }
      );
    }

    // Determine which file to edit
    let cpath: string;
    if (customPath && customPath.startsWith("content/")) {
      cpath = customPath;
    } else {
      cpath = canonicalPathForLang(lang);
    }

    const ppath = protocolPathForLang(lang);
    const currentContent = readTextFile(cpath);
    const protocolText = readTextFile(ppath);

    const nowTs = new Date().toISOString().replace(/\.\d+Z$/, "Z");
    const tag = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace("T", "-")
      .slice(0, 15);

    const systemPrompt = `You are Selfware Edit Copilot. You modify ONLY the canonical content file, never the protocol file. Follow the Selfware protocol exactly: canonical content is the authority for instance data; writes must stay within content scope; preserve structure unless the user explicitly asks to restructure.

MEMORY MODULE (Section 10.3):
Every change to canonical content MUST be accompanied by a Change Record. You are responsible for generating this record — the server will write it to content/memory/changes.md.

RESPONSE FORMAT (MANDATORY — three sections separated by exact delimiters):

1. Output the FULL updated canonical markdown content.
2. On a new line, output exactly: ===REPLY===
   Then write a brief conversational reply (1-3 sentences) in the user's language describing what you changed.
3. On a new line, output exactly: ===CHANGE_RECORD===
   Then output a YAML block (no fences) for the Change Record with these fields:
   id: "chg-${tag}-chat_edit"
   timestamp: "${nowTs}"
   actor: "user+agent"
   intent: (the user's instruction, concise)
   paths: (list of affected file paths)
   summary: (human-readable summary of what changed and why)
   rollback_hint: "git checkout -- <paths>"

If no changes are needed, still output the original content, then ===REPLY=== explaining why, then ===CHANGE_RECORD=== with intent stating no changes were made.${
      selection
        ? " The user has selected a specific passage from the document. Focus your edit on or around that selected text according to the user's instruction. Keep all other parts of the document unchanged unless the instruction explicitly says otherwise."
        : ""
    }`;

    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    if (Array.isArray(history)) {
      for (const h of history) {
        if (
          (h.role === "user" || h.role === "assistant") &&
          typeof h.text === "string" &&
          h.text
        ) {
          messages.push({ role: h.role, content: h.text });
        }
      }
    }

    const userParts = [`Language: ${lang}`];
    if (selection) userParts.push(`Selected text:\n"""${selection}"""`);
    userParts.push(`User instruction:\n${instruction}`);
    userParts.push(`Relevant Selfware protocol:\n${protocolText}`);
    userParts.push(`Current canonical content:\n${currentContent}`);
    messages.push({ role: "user", content: userParts.join("\n\n") });

    // Call LLM
    const payload = {
      model: LLM_MODEL,
      messages,
      temperature: 0.2,
    };

    const llmRes = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(120000),
    });

    const llmData = await llmRes.json();
    let rawOutput =
      llmData?.choices?.[0]?.message?.content || "";
    rawOutput = stripMarkdownFences(rawOutput);

    if (!rawOutput.trim()) {
      throw new Error("Model returned empty content");
    }

    const { content: updatedContent, reply, changeYaml } =
      parseEditResponse(rawOutput);

    if (!updatedContent) {
      throw new Error("Model returned empty content after parsing");
    }

    writeTextFile(cpath, updatedContent);

    try {
      writeChangeRecord(changeYaml);
    } catch (memErr) {
      console.error("Warning: failed to write change record:", memErr);
    }

    return NextResponse.json({
      status: "success",
      mode: "chat_edit",
      lang,
      path: cpath,
      instruction,
      reply,
      content: updatedContent,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
