#!/usr/bin/env python3
"""测试 RSS 配置加载"""

import sys
from pathlib import Path

print("Step 1: Testing RSS config loading...", flush=True)

def load_rss_config():
    """从 yaml 文件加载 RSS 配置"""
    print("Step 2: Inside load_rss_config", flush=True)
    try:
        print("Step 3: Trying to import yaml", flush=True)
        import yaml
        print("Step 4: yaml imported", flush=True)
        config_file = Path("/root/clawd/ai-news-radar/rss_config.yaml")
        print(f"Step 5: config_file path = {config_file}", flush=True)
        print(f"Step 6: config_file exists = {config_file.exists()}", flush=True)
        if config_file.exists():
            print("Step 7: Opening config file", flush=True)
            with open(config_file, 'r', encoding='utf-8') as f:
                print("Step 8: Reading config file", flush=True)
                config = yaml.safe_load(f)
                print(f"Step 9: Config loaded: {config}", flush=True)
                return config.get('rss_feeds', [])
    except Exception as e:
        print(f"⚠️ 加载 RSS 配置失败: {e}", flush=True)
    
    # 默认配置
    print("Step 10: Using default config", flush=True)
    return [
        {"name": "Folo - 科技", "url": "https://rsshub.app/folo/technology", "enabled": True},
        {"name": "Folo - AI", "url": "https://rsshub.app/folo/ai", "enabled": True},
    ]

print("Step 11: About to call load_rss_config", flush=True)
RSS_FEEDS = load_rss_config()
print(f"Step 12: RSS_FEEDS = {RSS_FEEDS}", flush=True)
print("Done!", flush=True)
