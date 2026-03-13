import { NextResponse } from "next/server";
import { listArticles } from "@/lib/selfware";

export async function GET() {
  try {
    const result = listArticles();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
