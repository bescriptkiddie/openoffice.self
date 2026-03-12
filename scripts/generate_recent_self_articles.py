#!/usr/bin/env python3
"""Generate recent self-format AI daily articles from ai-news-radar archive JSON files.

Usage:
  python3 scripts/generate_recent_self_articles.py --days 5
  python3 scripts/generate_recent_self_articles.py --start 2026-03-08 --end 2026-03-12
"""

import argparse
import json
import re
from collections import OrderedDict
from datetime import datetime, timedelta
from pathlib import Path

PROJECT_ROOT = Path("/root/clawd/openoffice.self")
AI_NEWS_DIR = Path("/root/clawd/ai-news-radar/data")
ARTICLES_DIR = PROJECT_ROOT / "content" / "articles"
CANONICAL_PATH = PROJECT_ROOT / "content" / "selfware_demo.md"


def update_canonical_index(date_str: str, title: str):
    if not CANONICAL_PATH.exists():
        print(f"❌ Canonical file not found: {CANONICAL_PATH}")
        return False

    content = CANONICAL_PATH.read_text(encoding="utf-8")
    article_link = f"articles/{date_str}-每日AI资讯.md"
    if article_link in content:
        print(f"⚠️ Already indexed: {article_link}")
        return False

    articles_section = "## 📰 AI 资讯日报\n\n"
    new_entry = f"- [{title}](articles/{date_str}-每日AI资讯.md)\n"

    if articles_section in content:
        pattern = r'(## 📰 AI 资讯日报\n\n)'
        new_content = re.sub(pattern, r'\1' + new_entry, content, count=1)
    else:
        new_section = f"{articles_section}{new_entry}\n---\n\n"
        match = re.search(r'^(# .+\n)', content)
        if match:
            insert_pos = match.end()
            new_content = content[:insert_pos] + "\n" + new_section + content[insert_pos:]
        else:
            new_content = new_section + content

    CANONICAL_PATH.write_text(new_content, encoding="utf-8")
    print(f"✅ Indexed: {article_link}")
    return True


def latest_archives_by_date():
    mapping = {}
    for path in sorted(AI_NEWS_DIR.glob("archive_*.json")):
        m = re.match(r"archive_(\d{8})_(\d{6})\.json$", path.name)
        if not m:
            continue
        ymd = m.group(1)
        hhmmss = m.group(2)
        date_str = f"{ymd[:4]}-{ymd[4:6]}-{ymd[6:8]}"
        prev = mapping.get(date_str)
        if prev is None or path.name > prev.name:
            mapping[date_str] = path
    return mapping


def load_archive(path: Path):
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError(f"Archive is not a list: {path}")
    return data


def group_items(items):
    grouped = OrderedDict()
    for item in items:
        if not isinstance(item, dict):
            continue
        source = (item.get("source") or "未分类").strip()
        title = (item.get("title") or "Untitled").strip()
        url = (item.get("url") or "").strip()
        if not title or not url:
            continue
        grouped.setdefault(source, []).append({"title": title, "url": url})
    return grouped


def build_content(date_str: str, archive_path: Path, grouped: OrderedDict):
    total = sum(len(v) for v in grouped.values())
    title = f"每日 AI 资讯 | {date_str}"
    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M")

    parts = [
        "---",
        f'title: "{title}"',
        f'date: "{date_str}"',
        'category: "AI资讯"',
        'tags: ["AI", "日报", "资讯", "self"]',
        'source: "ai-news-radar archive"',
        f'archive_file: "{archive_path.name}"',
        f'total_articles: {total}',
        "---",
        "",
        f"# {title}",
        "",
        f"> 生成时间: {generated_at}",
        f"> 数据归档: {archive_path.name}",
        f"> 总计: {total} 条精选资讯",
        "",
        "---",
        "",
    ]

    for source, articles in grouped.items():
        parts.append(f"## {source}")
        parts.append("")
        parts.append(f"*{len(articles)} 条相关资讯*")
        parts.append("")
        for article in articles:
            parts.append(f"- [{article['title']}]({article['url']})")
        parts.append("")

    parts.extend([
        "---",
        "",
        "## 📊 今日要点",
        "",
        "今日 AI 资讯按信息源归档如下：",
        "",
    ])
    for source, articles in grouped.items():
        parts.append(f"- **{source}**：{len(articles)} 条")
    parts.extend(["", f"*共 {total} 条精选资讯*", ""])

    return "\n".join(parts)


def save_article(date_str: str, content: str):
    ARTICLES_DIR.mkdir(parents=True, exist_ok=True)
    path = ARTICLES_DIR / f"{date_str}-每日AI资讯.md"
    path.write_text(content, encoding="utf-8")
    print(f"✅ Saved: {path}")
    return path


def select_dates(args, all_dates):
    available = sorted(all_dates)
    if args.start and args.end:
        return [d for d in available if args.start <= d <= args.end]
    days = args.days or 5
    return available[-days:]


def main():
    parser = argparse.ArgumentParser(description="Generate recent self-format daily articles from archives")
    parser.add_argument("--days", type=int, default=5, help="How many recent dates to generate")
    parser.add_argument("--start", help="Start date YYYY-MM-DD")
    parser.add_argument("--end", help="End date YYYY-MM-DD")
    args = parser.parse_args()

    archives = latest_archives_by_date()
    if not archives:
        print("❌ No archive files found")
        return 1

    dates = select_dates(args, archives.keys())
    if not dates:
        print("❌ No matching dates found")
        return 1

    print("📦 Selected dates:", ", ".join(dates))

    for date_str in dates:
        archive_path = archives[date_str]
        items = load_archive(archive_path)
        grouped = group_items(items)
        content = build_content(date_str, archive_path, grouped)
        save_article(date_str, content)
        update_canonical_index(date_str, f"每日 AI 资讯 | {date_str}")

    print("\n✨ Done")
    print("🌐 Archive page: http://115.191.49.124:8888/views/archive.html")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
