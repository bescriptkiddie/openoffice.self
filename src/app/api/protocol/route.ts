import { NextRequest, NextResponse } from "next/server";
import {
  normalizeLang,
  protocolPathForLang,
  readTextFile,
  sha256Text,
} from "@/lib/selfware";

export async function GET(request: NextRequest) {
  const lang = normalizeLang(request.nextUrl.searchParams.get("lang"));
  const ppath = protocolPathForLang(lang);

  try {
    const content = readTextFile(ppath);
    return NextResponse.json({
      lang: lang || "zh",
      path: ppath,
      sha256: sha256Text(content),
      content,
    });
  } catch {
    return NextResponse.json(
      { error: `${ppath} not found` },
      { status: 404 }
    );
  }
}
