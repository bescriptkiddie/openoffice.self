import { NextRequest, NextResponse } from "next/server";

// Allowed domains for proxy to prevent SSRF
const ALLOWED_DOMAINS = new Set(
  (process.env.PROXY_ALLOWED_DOMAINS || "floatboat.ai,githubusercontent.com,raw.githubusercontent.com").split(",").map(d => d.trim())
);

function isDomainAllowed(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname;
    return Array.from(ALLOWED_DOMAINS).some(
      (domain) => host === domain || host.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return NextResponse.json(
      { error: "Only http(s) urls are allowed" },
      { status: 400 }
    );
  }

  if (!isDomainAllowed(url)) {
    return NextResponse.json(
      { error: "Domain not in allow list" },
      { status: 403 }
    );
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Selfware-Local-Proxy/1.0",
        Accept: "*/*",
      },
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.arrayBuffer();
    const contentType =
      res.headers.get("Content-Type") || "application/octet-stream";

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Proxy fetch failed: ${e}` },
      { status: 502 }
    );
  }
}
