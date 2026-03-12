#!/usr/bin/env python3
"""
Convert ai-news-radar daily_report.md to self format
Usage: python3 convert_to_self.py [--date YYYY-MM-DD]
"""

import os
import re
import sys
import argparse
from datetime import datetime, timedelta
from pathlib import Path

# Paths
PROJECT_ROOT = Path("/root/clawd/openoffice.self")
AI_NEWS_DIR = Path("/root/clawd/ai-news-radar/data")
ARTICLES_DIR = PROJECT_ROOT / "content" / "articles"
CANONICAL_PATH = PROJECT_ROOT / "content" / "selfware_demo.md"

def extract_title_from_url(url, default_title):
    """Extract readable title from URL or default"""
    if not url:
        return default_title
    # Try to get last part of URL path
    try:
        from urllib.parse import urlparse
        path = urlparse(url).path
        if path:
            last_part = path.rstrip('/').split('/')[-1]
            if last_part:
                # Remove common suffixes and decode
                title = last_part.split('.')[0]  # Remove .html, .md, etc
                title = title.replace('-', ' ').replace('_', ' ')
                return title if len(title) > 3 else default_title
    except:
        pass
    return default_title

def parse_daily_report(date_str):
    """Parse daily_report.md and extract structured content"""
    report_path = AI_NEWS_DIR / "daily_report.md"
    
    if not report_path.exists():
        print(f"❌ Report not found: {report_path}")
        return None
    
    content = report_path.read_text(encoding='utf-8')
    
    # Extract metadata
    title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
    title = title_match.group(1) if title_match else "AI 信息日报"
    
    time_match = re.search(r'生成时间:\s*(\d{4}-\d{2}-\d{2})', content)
    report_date = time_match.group(1) if time_match else date_str
    
    count_match = re.search(r'总计:\s*(\d+)\s*条', content)
    total_count = int(count_match.group(1)) if count_match else 0
    
    # Parse sections and articles
    sections = []
    current_section = None
    current_articles = []
    
    lines = content.split('\n')
    for line in lines:
        line = line.strip()
        
        # Section header (##)
        if line.startswith('## ') and not line.startswith('## ['):
            if current_section and current_articles:
                sections.append({
                    'name': current_section,
                    'articles': current_articles
                })
            current_section = line[3:].strip()
            current_articles = []
        
        # Article link (- [title](url))
        elif line.startswith('- ['):
            match = re.match(r'-\s*\[(.+?)\]\((.+?)\)', line)
            if match:
                article_title = match.group(1)
                article_url = match.group(2)
                current_articles.append({
                    'title': article_title,
                    'url': article_url
                })
    
    # Add last section
    if current_section and current_articles:
        sections.append({
            'name': current_section,
            'articles': current_articles
        })
    
    return {
        'title': title,
        'date': report_date,
        'total_count': total_count,
        'sections': sections
    }

def generate_self_content(data):
    """Generate self-format markdown content"""
    date = data['date']
    title = f"每日 AI 资讯 | {date}"
    
    # YAML front matter
    front_matter = f"""---
title: "{title}"
date: "{date}"
category: "AI资讯"
tags: ["AI", "日报", "资讯"]
source: "ai-news-radar"
total_articles: {data['total_count']}
---

# {title}

> 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M')}
> 总计: {data['total_count']} 条精选资讯

---

"""
    
    # Content sections
    content_parts = [front_matter]
    
    for section in data['sections']:
        section_name = section['name']
        articles = section['articles']
        
        if not articles:
            continue
        
        content_parts.append(f"## {section_name}\n")
        content_parts.append(f"*{len(articles)} 条相关资讯*\n")
        
        for article in articles:
            content_parts.append(f"- [{article['title']}]({article['url']})")
        
        content_parts.append("\n")
    
    # Add summary section
    content_parts.append("---\n\n")
    content_parts.append("## 📊 今日要点\n\n")
    content_parts.append("今日 AI 资讯涵盖以下主题：\n\n")
    
    for section in data['sections'][:5]:  # Top 5 sections
        if section['articles']:
            content_parts.append(f"- **{section['name']}**: {len(section['articles'])} 条")
    
    content_parts.append(f"\n*共 {data['total_count']} 条精选资讯*\n")
    
    return '\n'.join(content_parts)

def save_self_article(content, date_str):
    """Save article to content/articles/"""
    filename = f"{date_str}-每日AI资讯.md"
    filepath = ARTICLES_DIR / filename
    
    # Ensure directory exists
    ARTICLES_DIR.mkdir(parents=True, exist_ok=True)
    
    filepath.write_text(content, encoding='utf-8')
    print(f"✅ Saved: {filepath}")
    return filepath

def update_canonical_index(date_str, title):
    """Update selfware_demo.md with new article link"""
    if not CANONICAL_PATH.exists():
        print(f"❌ Canonical file not found: {CANONICAL_PATH}")
        return False
    
    content = CANONICAL_PATH.read_text(encoding='utf-8')
    
    # Check if already exists
    article_link = f"articles/{date_str}-每日AI资讯.md"
    if article_link in content:
        print(f"⚠️ Article already in index: {article_link}")
        return False
    
    # Find or create articles section
    articles_section = "## 📰 AI 资讯日报\n\n"
    new_entry = f"- [{title}](articles/{date_str}-每日AI资讯.md)\n"
    
    if "## 📰 AI 资讯日报" in content:
        # Insert after the section header
        pattern = r'(## 📰 AI 资讯日报\n\n)'
        replacement = r'\1' + new_entry
        new_content = re.sub(pattern, replacement, content, count=1)
    else:
        # Add new section at the beginning
        new_section = f"{articles_section}{new_entry}\n---\n\n"
        # Insert after the first heading
        match = re.search(r'^(# .+\n)', content)
        if match:
            insert_pos = match.end()
            new_content = content[:insert_pos] + "\n" + new_section + content[insert_pos:]
        else:
            new_content = new_section + content
    
    CANONICAL_PATH.write_text(new_content, encoding='utf-8')
    print(f"✅ Updated index: {CANONICAL_PATH}")
    return True

def main():
    parser = argparse.ArgumentParser(description='Convert daily_report to self format')
    parser.add_argument('--date', help='Date in YYYY-MM-DD format (default: today)')
    args = parser.parse_args()
    
    # Get date
    if args.date:
        date_str = args.date
    else:
        # Get yesterday (since report is generated at 4am)
        yesterday = datetime.now() - timedelta(days=0)
        date_str = yesterday.strftime('%Y-%m-%d')
    
    print(f"🔄 Converting daily report for {date_str}...")
    
    # Parse report
    data = parse_daily_report(date_str)
    if not data:
        return 1
    
    print(f"📊 Found {data['total_count']} articles in {len(data['sections'])} sections")
    
    # Generate self content
    self_content = generate_self_content(data)
    
    # Save article
    article_path = save_self_article(self_content, date_str)
    
    # Update index
    title = f"每日 AI 资讯 | {date_str}"
    update_canonical_index(date_str, title)
    
    print(f"\n✨ Done! Access at: http://115.191.49.124:8888/views/self.html")
    print(f"   Article: http://115.191.49.124:8888/content/articles/{date_str}-每日AI资讯.md")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
