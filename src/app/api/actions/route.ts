import { NextResponse } from "next/server";
import { readTextFile, fileExists } from "@/lib/selfware";

const ACTIONS_PATH = "content/memory/actions.md";

export async function GET() {
  if (!fileExists(ACTIONS_PATH)) {
    return NextResponse.json({ content: "", exists: false });
  }

  const content = readTextFile(ACTIONS_PATH);
  return NextResponse.json({ content, exists: true });
}
