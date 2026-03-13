import { NextRequest, NextResponse } from "next/server";
import {
  normalizeLang,
  canonicalPathForLang,
  readTextFile,
  sha256Text,
} from "@/lib/selfware";

export async function GET(request: NextRequest) {
  const lang = normalizeLang(request.nextUrl.searchParams.get("lang"));
  const url =
    request.nextUrl.searchParams.get("url") ||
    "https://floatboat.ai/selfware.md";

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return NextResponse.json(
      { error: "Only http(s) urls are allowed" },
      { status: 400 }
    );
  }

  const cpath = canonicalPathForLang(lang);
  let localContent: string;
  try {
    localContent = readTextFile(cpath);
  } catch {
    return NextResponse.json({ error: `${cpath} not found` }, { status: 404 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Selfware-Local-UpdateCheck/0.1",
        Accept: "text/markdown,*/*",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json({
        source_url: url,
        checked_at: new Date().toISOString(),
        local: { path: cpath, sha256: sha256Text(localContent) },
        remote: { status: res.status },
        has_update: null,
        error: `HTTP Error ${res.status}`,
      });
    }

    const remoteText = await res.text();
    const localSha = sha256Text(localContent);
    const remoteSha = sha256Text(remoteText);

    return NextResponse.json({
      source_url: url,
      checked_at: new Date().toISOString(),
      local: { path: cpath, sha256: localSha },
      remote: {
        status: res.status,
        sha256: remoteSha,
        etag: res.headers.get("ETag"),
        last_modified: res.headers.get("Last-Modified"),
      },
      has_update: localSha !== remoteSha,
      note: "Applying updates MUST require explicit user confirmation.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Update check failed: ${e}` },
      { status: 502 }
    );
  }
}
