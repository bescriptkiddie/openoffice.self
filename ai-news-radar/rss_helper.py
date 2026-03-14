#!/usr/bin/env python3
"""
RSS 配置助手 - 快速添加 Folo/语鲸 RSS
"""
import yaml
from pathlib import Path

CONFIG_FILE = Path("/root/clawd/ai-news-radar/rss_config.yaml")

def load_config():
    """加载配置"""
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    return {'rss_feeds': []}

def save_config(config):
    """保存配置"""
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        yaml.dump(config, f, allow_unicode=True, sort_keys=False)

def add_rss(name, url, enabled=True):
    """添加 RSS 源"""
    config = load_config()
    
    # 检查是否已存在
    for feed in config['rss_feeds']:
        if feed['url'] == url:
            print(f"⚠️  {name} 已存在")
            return
    
    config['rss_feeds'].append({
        'name': name,
        'url': url,
        'enabled': enabled
    })
    
    save_config(config)
    print(f"✅ 已添加: {name}")

def list_rss():
    """列出所有 RSS"""
    config = load_config()
    print("\n📋 当前 RSS 订阅列表:\n")
    for i, feed in enumerate(config['rss_feeds'], 1):
        status = "✅" if feed.get('enabled', True) else "❌"
        print(f"{i}. {status} {feed['name']}")
        print(f"   {feed['url']}\n")

def main():
    print("=" * 60)
    print("📝 RSS 配置助手")
    print("=" * 60)
    print()
    
    print("📌 Folo RSS 格式:")
    print("   https://rsshub.app/folo/{标签名}")
    print("   例: https://rsshub.app/folo/technology")
    print()
    
    print("📌 语鲸/微信公众号 RSS 格式:")
    print("   https://rsshub.app/wechat/ce/{biz}")
    print("   或使用 wechat2rss 服务")
    print()
    
    # 显示当前配置
    list_rss()
    
    print("\n💡 使用说明:")
    print("   直接编辑文件: /root/clawd/ai-news-radar/rss_config.yaml")
    print("   或使用 Python 添加:")
    print()
    print("   from rss_helper import add_rss")
    print("   add_rss('我的RSS', 'https://example.com/feed')")
    print()

if __name__ == '__main__':
    main()
