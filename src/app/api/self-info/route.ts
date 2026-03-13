import { NextRequest, NextResponse } from "next/server";
import {
  normalizeLang,
  canonicalPathForLang,
  readTextFile,
  sha256Text,
} from "@/lib/selfware";

export async function GET(request: NextRequest) {
  const lang = normalizeLang(request.nextUrl.searchParams.get("lang"));
  const cpath = canonicalPathForLang(lang);

  try {
    const content = readTextFile(cpath);
    return NextResponse.json({
      lang: lang || "zh",
      path: cpath,
      sha256: sha256Text(content),
      content,
    });
  } catch {
    return NextResponse.json(
      { error: `${cpath} not found` },
      { status: 404 }
    );
  }
}
