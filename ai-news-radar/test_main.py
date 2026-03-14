#!/usr/bin/env python3
"""测试 fetch_news main 函数"""

import sys
print("Before importing fetch_news", flush=True)

import fetch_news
print("Module imported", flush=True)

# Try calling fetch_all_sources
print("\nCalling fetch_all_sources()...", flush=True)
try:
    items = fetch_news.fetch_all_sources()
    print(f"Got {len(items)} items", flush=True)
except Exception as e:
    print(f"Error: {e}", flush=True)

print("Done!", flush=True)
