import { NextRequest, NextResponse } from "next/server";
import { capabilitiesPayload } from "@/lib/selfware";

export async function GET(request: NextRequest) {
  const host = request.headers.get("host") || "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || "http";
  const baseUrl = `${proto}://${host}`;

  return NextResponse.json(capabilitiesPayload(baseUrl));
}
