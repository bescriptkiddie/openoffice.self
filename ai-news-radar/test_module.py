#!/usr/bin/env python3
"""测试 fetch_news 主函数"""

import sys
print("Before importing fetch_news", flush=True)

# Import only the module without running main
import fetch_news

print("Module imported, RSS_FEEDS length:", len(fetch_news.RSS_FEEDS), flush=True)
print("SOURCES:", list(fetch_news.SOURCES.keys()), flush=True)
print("Done!", flush=True)
