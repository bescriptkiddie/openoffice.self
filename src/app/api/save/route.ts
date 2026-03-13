import { NextRequest, NextResponse } from "next/server";
import {
  normalizeLang,
  canonicalPathForLang,
  writeTextFile,
  writeChangeRecord,
  memoryPathForFile,
} from "@/lib/selfware";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const content = data.content;
    const customPath: string | undefined = data.path;
    const lang =
      normalizeLang(data.lang) ||
      normalizeLang(request.nextUrl.searchParams.get("lang"));

    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "Invalid payload: missing 'content' string" },
        { status: 400 }
      );
    }

    let cpath: string;
    if (customPath && customPath.startsWith("content/")) {
      cpath = customPath;
    } else {
      cpath = canonicalPathForLang(lang);
    }

    writeTextFile(cpath, content);

    // Protocol 10.3: every content change MUST generate a Change Record
    const nowTs = new Date().toISOString().replace(/\.\d+Z$/, "Z");
    const tag = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace("T", "-")
      .slice(0, 15);

    const changeYaml = `id: "chg-${tag}-save"
timestamp: "${nowTs}"
actor: "user"
intent: "manual_save"
paths:
  - "${cpath}"
  - "${memoryPathForFile(cpath)}"
summary: "User saved content via editor."
rollback_hint: "git checkout -- ${cpath}"`;

    try {
      writeChangeRecord(changeYaml, cpath);
    } catch (memErr) {
      console.error("Warning: failed to write change record:", memErr);
    }

    return NextResponse.json({
      status: "success",
      lang: lang || "zh",
      path: cpath,
    });
  } catch (e) {
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
