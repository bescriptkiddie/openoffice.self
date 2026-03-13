import { NextRequest, NextResponse } from "next/server";
import { normalizeLang, canonicalPathForLang, writeTextFile } from "@/lib/selfware";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const content = data.content;
    const lang = normalizeLang(data.lang) || normalizeLang(request.nextUrl.searchParams.get("lang"));

    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "Invalid payload: missing 'content' string" },
        { status: 400 }
      );
    }

    const cpath = canonicalPathForLang(lang);
    writeTextFile(cpath, content);

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
