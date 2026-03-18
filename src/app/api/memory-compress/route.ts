import { NextRequest, NextResponse } from "next/server";
import {
  parseChangeRecords,
  appendPhaseSummary,
  readTextFile,
  writeChangeRecord,
} from "@/lib/selfware";

const LLM_BASE_URL = (
  process.env.SELFWARE_LLM_BASE_URL || "https://api.stepfun.com/v1"
).replace(/\/+$/, "");
const LLM_MODEL = process.env.SELFWARE_LLM_MODEL || "step-3.5-flash";
const LLM_API_KEY = process.env.SELFWARE_LLM_API_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const lang: string = body.lang || "zh";

    const records = parseChangeRecords();
    if (records.length < 3) {
      return NextResponse.json(
        { error: lang === "zh" ? "变更记录不足 3 条，无需压缩" : "Less than 3 change records, compression not needed" },
        { status: 400 }
      );
    }

    let currentCanonical = "";
    try {
      const cpath = lang === "en" ? "content/selfware_demo.en.md" : "content/selfware_demo.md";
      currentCanonical = readTextFile(cpath).slice(0, 3000);
    } catch {
      // OK
    }

    const recordsText = records
      .map((r) => `[${r.timestamp}] ${r.id}\n  actor: ${r.actor}\n  intent: ${r.intent}\n  summary: ${r.summary}\n  paths: ${r.paths.join(", ")}`)
      .join("\n\n");

    const firstTs = records[0].timestamp;
    const lastTs = records[records.length - 1].timestamp;
    const firstDate = firstTs.slice(0, 10);
    const lastDate = lastTs.slice(0, 10);

    const systemPrompt = `你是 Selfware 记忆压缩引擎。你的任务是将一段时间内的细碎变更记录压缩为一条阶段性摘要。

灵感来源：类似 Transformer 中的 Block Attention Residuals——块内细节可按需展开，跨块只保留摘要表示。

## 输出格式（严格遵守）

直接输出以下 YAML（不要用 code fence 包裹）：

phase_id: "phase-${firstDate.replace(/-/g, "")}-${lastDate.replace(/-/g, "")}"
period: "${firstDate} ~ ${lastDate}"
changes_compressed: ${records.length}
summary: "（用 2-4 句话概括这个阶段发生了什么，重点是架构变化和功能演进，不是逐条复述）"
key_decisions:
  - "决策 1（保留对未来有影响的决策）"
  - "决策 2"
retained_context:
  - "仍然有效的约束或规则（Agent 接手时必须知道的）"
deprecated:
  - "已过时或被后续变更替代的内容（如果没有就写 none）"
detail_ref: "${records[0].id} ~ ${records[records.length - 1].id}"

## 压缩原则

1. **过滤标准**：这个信息如果丢失，下次遇到类似情况会不会重蹈覆辙？会→保留为 key_decisions。不会→压缩掉。
2. **retained_context**：仍然有效的规则、约束、架构决策。这是 Agent 接手时的"必读"。
3. **deprecated**：被后续变更覆盖或不再适用的内容。
4. **summary 不是变更列表**：是对这个阶段的**语义级概括**，像写给接手同事的交接摘要。
5. 使用中文输出。

## 禁止

- 不要逐条复述变更记录
- 不要添加变更记录中没有的信息
- 不要输出 YAML 以外的内容`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      {
        role: "user" as const,
        content: `以下是需要压缩的 ${records.length} 条变更记录（时间范围 ${firstDate} ~ ${lastDate}）：\n\n${recordsText}\n\n${currentCanonical ? `当前文档状态摘要（前 3000 字）：\n${currentCanonical}` : ""}`,
      },
    ];

    const llmRes = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(120000),
    });

    const llmData = await llmRes.json();

    if (!llmRes.ok) {
      const errMsg = llmData?.error?.message || llmData?.message || JSON.stringify(llmData);
      throw new Error(`LLM API error (${llmRes.status}): ${errMsg}`);
    }

    let rawOutput = llmData?.choices?.[0]?.message?.content || "";

    if (rawOutput.trimStart().startsWith("```")) {
      const lines = rawOutput.split("\n");
      lines.shift();
      while (lines.length && lines[lines.length - 1].trim().startsWith("```")) {
        lines.pop();
      }
      rawOutput = lines.join("\n");
    }

    if (!rawOutput.trim()) {
      throw new Error("LLM returned empty content");
    }

    const phaseIdMatch = rawOutput.match(/phase_id:\s*['"]?(.+?)['"]?\s*$/m);
    const phaseId = phaseIdMatch ? phaseIdMatch[1].replace(/['"]/g, "") : `phase-${firstDate}-${lastDate}`;

    appendPhaseSummary(`## ${phaseId}\n\n\`\`\`yaml\n${rawOutput.trim()}\n\`\`\``);

    const nowTs = new Date().toISOString().replace(/\.\d+Z$/, "Z");
    const tag = new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);
    writeChangeRecord(
      `id: "chg-${tag}-compress"\ntimestamp: "${nowTs}"\nactor: "user+agent"\nintent: "memory_compress"\npaths:\n  - "content/memory/summaries.md"\nsummary: "压缩 ${records.length} 条变更记录为阶段摘要 ${phaseId}（${firstDate} ~ ${lastDate}）"\nrollback_hint: "git checkout -- content/memory/summaries.md"`
    );

    return NextResponse.json({
      status: "success",
      phaseId,
      recordsCompressed: records.length,
      period: `${firstDate} ~ ${lastDate}`,
      summary: rawOutput.trim(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Compress failed: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 }
    );
  }
}
