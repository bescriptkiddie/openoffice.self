import { NextRequest, NextResponse } from "next/server";
import { readTextFile, memoryPathForFile, fileExists } from "@/lib/selfware";

interface ChangeRecord {
  id: string;
  timestamp: string;
  actor: string;
  intent: string;
  paths: string[];
  summary: string;
  rollback_hint: string;
}

function parseChanges(raw: string): ChangeRecord[] {
  const records: ChangeRecord[] = [];
  // Split by yaml blocks
  const blocks = raw.split(/```yaml\s*\n/);

  for (const block of blocks) {
    const end = block.indexOf("```");
    if (end === -1) continue;
    const yaml = block.slice(0, end).trim();
    if (!yaml.includes("id:")) continue;

    const get = (key: string): string => {
      const m = yaml.match(new RegExp(`^${key}:\\s*"?(.+?)"?\\s*$`, "m"));
      return m ? m[1].replace(/^"(.*)"$/, "$1") : "";
    };

    const pathsMatch = yaml.match(/paths:\s*\n((?:\s+-\s+.+\n?)*)/);
    let paths: string[] = [];
    if (pathsMatch) {
      paths = pathsMatch[1]
        .split("\n")
        .map((l) => l.replace(/^\s*-\s*"?/, "").replace(/"?\s*$/, ""))
        .filter(Boolean);
    } else {
      // Inline array format: paths: ["a", "b"]
      const inline = yaml.match(/paths:\s*\[([^\]]*)\]/);
      if (inline) {
        paths = inline[1].split(",").map((s) => s.trim().replace(/"/g, "")).filter(Boolean);
      }
    }

    const record: ChangeRecord = {
      id: get("id"),
      timestamp: get("timestamp"),
      actor: get("actor"),
      intent: get("intent"),
      paths,
      summary: get("summary"),
      rollback_hint: get("rollback_hint"),
    };

    if (record.id) records.push(record);
  }

  return records.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function GET(request: NextRequest) {
  try {
    const contentPath = request.nextUrl.searchParams.get("path") || "";
    const memPath = contentPath ? memoryPathForFile(contentPath) : "content/memory/changes.md";

    if (!fileExists(memPath)) {
      return NextResponse.json({ total: 0, changes: [], memoryPath: memPath });
    }

    const raw = readTextFile(memPath);
    const changes = parseChanges(raw).filter((c) => !c.timestamp.includes("YYYY"));
    return NextResponse.json({
      total: changes.length,
      changes,
      memoryPath: memPath,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e), total: 0, changes: [] }, { status: 500 });
  }
}
