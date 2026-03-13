import { NextResponse } from "next/server";
import { readTextFile } from "@/lib/selfware";

export async function GET() {
  try {
    const content = readTextFile("manifest.md");
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json(
      { error: "manifest.md not found" },
      { status: 404 }
    );
  }
}
