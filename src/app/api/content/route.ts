import { NextRequest, NextResponse } from "next/server";
import { normalizeLang, canonicalPathForLang, readTextFile } from "@/lib/selfware";

export async function GET(request: NextRequest) {
  const customPath = request.nextUrl.searchParams.get("path");
  const lang = normalizeLang(request.nextUrl.searchParams.get("lang"));

  // If a specific path is requested (e.g. content/articles/xxx.md)
  if (customPath) {
    // Security: only allow reading from content/ directory
    if (!customPath.startsWith("content/")) {
      return NextResponse.json(
        { error: "Read access restricted to content/ directory" },
        { status: 403 }
      );
    }

    try {
      const content = readTextFile(customPath);
      return NextResponse.json({
        path: customPath,
        content,
      });
    } catch {
      return NextResponse.json(
        { error: `${customPath} not found` },
        { status: 404 }
      );
    }
  }

  // Default: read canonical file
  const cpath = canonicalPathForLang(lang);
  try {
    const content = readTextFile(cpath);
    return NextResponse.json({
      lang: lang || "zh",
      path: cpath,
      content,
    });
  } catch {
    return NextResponse.json(
      { error: `${cpath} not found` },
      { status: 404 }
    );
  }
}
