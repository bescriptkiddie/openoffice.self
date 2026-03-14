#!/usr/bin/env python3
"""
添加用户关注的公众号 RSS - 实用版
"""
import yaml
from pathlib import Path

CONFIG_FILE = Path("/root/clawd/ai-news-radar/rss_config.yaml")

def load_config():
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    return {'rss_feeds': []}

def save_config(config):
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        yaml.dump(config, f, allow_unicode=True, sort_keys=False)

def main():
    print("=" * 60)
    print("📱 添加微信公众号 RSS")
    print("=" * 60)
    print()
    
    # 用户关注的公众号
    accounts = [
        "小互AI",
        "记忆承载", 
        "jackywine",
        "花叔",
        "数字生命卡兹克",
        "归藏的AI工具箱",
        "一支烟花AI",
        "向阳乔木"
    ]
    
    print("📋 你想添加的公众号:")
    for i, acc in enumerate(accounts, 1):
        print(f"   {i}. {acc}")
    print()
    
    print("=" * 60)
    print("🔧 获取 RSS 的三种方法")
    print("=" * 60)
    print()
    
    print("【方法 1】使用 Folo（推荐）")
    print("-" * 60)
    print("Folo 支持直接搜索并订阅公众号：")
    print("1. 打开 https://follow.is")
    print("2. 搜索公众号名称")
    print("3. 点击订阅")
    print("4. Folo 会自动生成 RSS 链接")
    print()
    print("生成的 RSS 格式:")
    print("   https://rsshub.app/folo/xxx")
    print()
    
    print("【方法 2】使用语鲸")
    print("-" * 60)
    print("语鲸是微信公众号聚合平台：")
    print("1. 打开语鲸小程序或网站")
    print("2. 搜索公众号并关注")
    print("3. 在「我的订阅」中找到 RSS 链接")
    print()
    
    print("【方法 3】使用 wechat2rss")
    print("-" * 60)
    print("wechat2rss 收录了大量公众号：")
    print("网址: https://wechat2rss.xlab.app")
    print()
    print("步骤：")
    print("1. 访问 https://wechat2rss.xlab.app")
    print("2. 搜索你想订阅的公众号")
    print("3. 复制 RSS 链接")
    print()
    
    print("=" * 60)
    print("📝 快速配置模板")
    print("=" * 60)
    print()
    
    # 生成配置模板
    config = load_config()
    
    print("已为你生成配置模板，请根据实际情况修改 URL：")
    print()
    print("```yaml")
    print("  # 你的公众号订阅")
    for acc in accounts:
        # 使用占位符
        safe_name = acc.replace(' ', '').replace('/', '')
        print(f"  - name: \"{acc}\"")
        print(f"    url: \"https://rsshub.app/folo/{safe_name}\"  # 请替换为实际 RSS 链接")
        print(f"    enabled: true")
    print("```")
    print()
    
    print("=" * 60)
    print("✅ 添加到配置文件")
    print("=" * 60)
    print()
    
    # 添加占位符到配置（默认禁用，需要用户手动修改 URL）
    added = 0
    for acc in accounts:
        exists = any(f.get('name') == acc for f in config['rss_feeds'])
        if not exists:
            safe_name = acc.replace(' ', '').replace('/', '')
            config['rss_feeds'].append({
                'name': acc,
                'url': f'https://PLACEHOLDER_UPDATE_ME/{safe_name}',
                'enabled': False,  # 默认禁用，需要用户更新 URL
                'note': '请替换为实际的 RSS 链接'
            })
            added += 1
    
    if added > 0:
        save_config(config)
        print(f"✅ 已添加 {added} 个占位符到配置文件")
        print()
    
    print("📄 配置文件位置:")
    print(f"   {CONFIG_FILE}")
    print()
    print("🚀 使用方法：")
    print("   1. 通过 Folo/wechat2rss 获取 RSS 链接")
    print("   2. 编辑配置文件，替换 PLACEHOLDER 链接")
    print("   3. 将 enabled: false 改为 enabled: true")
    print("   4. 运行抓取脚本测试")
    print()

if __name__ == '__main__':
    main()
