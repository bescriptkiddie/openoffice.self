#!/usr/bin/env python3
"""
ClawFeed API 信源抓取模块
接入 https://clawfeed.kevinhe.io/api/digests
"""

import json
import os
from datetime import datetime
from pathlib import Path
import requests

# API 配置
CLAWFEED_API = "https://clawfeed.kevinhe.io/api/digests"
DATA_DIR = Path("/root/clawd/ai-news-radar/data")

# 代理配置（如果需要）
PROXY = {
    "http": "http://127.0.0.1:7890",
    "https": "http://127.0.0.1:7890"
}

def fetch_clawfeed():
    """抓取 ClawFeed 最新资讯"""
    print("📡 抓取: ClawFeed...")
    
    try:
        resp = requests.get(CLAWFEED_API, proxies=PROXY, timeout=30)
        if resp.status_code == 200:
            data = resp.json()
            items = []
            
            for item in data:
                item_type = item.get('type', 'unknown')
                created_at = item.get('created_at', '')
                content = item.get('content', '')
                
                # 解析标题（从 content 中提取第一行）
                title = "ClawFeed 资讯"
                if content:
                    lines = content.split('\n')
                    for line in lines:
                        line = line.strip()
                        if line and not line.startswith('#') and len(line) > 10:
                            title = line[:80] + ('...' if len(line) > 80 else '')
                            break
                        elif line.startswith('# '):
                            title = line[2:100]
                            break
                
                # 构建 URL（基于 created_at 和 type）
                if isinstance(created_at, str) and 'T' in created_at:
                    date_str = created_at.split('T')[0]
                else:
                    date_str = str(created_at)
                
                url = f"https://clawfeed.kevinhe.io/"
                
                items.append({
                    "title": f"[{item_type.upper()}] {title}",
                    "url": url,
                    "source": "ClawFeed",
                    "site_id": "clawfeed",
                    "type": item_type,
                    "created_at": created_at,
                    "content_preview": content[:500] if content else "",
                })
            
            print(f"✅ ClawFeed: {len(items)} 条")
            return items
        else:
            print(f"❌ ClawFeed API 返回状态码: {resp.status_code}")
            return []
    except Exception as e:
        print(f"❌ ClawFeed 抓取失败: {e}")
        return []

def save_clawfeed_to_data(items):
    """保存 ClawFeed 数据到数据目录"""
    if not items:
        return
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_file = DATA_DIR / f"clawfeed_{timestamp}.json"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    
    print(f"💾 ClawFeed 数据已保存: {output_file}")
    return output_file

def get_clawfeed_for_report(limit=10):
    """获取用于日报的 ClawFeed 内容"""
    items = fetch_clawfeed()
    
    # 按类型分组，优先取最新的
    daily_items = [i for i in items if i.get('type') == 'daily'][:1]
    h4_items = [i for i in items if i.get('type') == '4h'][:4]
    weekly_items = [i for i in items if i.get('type') == 'weekly'][:1]
    
    # 合并并按时间排序
    selected = daily_items + h4_items + weekly_items
    
    return selected[:limit]

if __name__ == "__main__":
    items = fetch_clawfeed()
    if items:
        save_clawfeed_to_data(items)
        print(f"\n抓取完成，共 {len(items)} 条资讯")
        
        # 显示前3条
        print("\n=== 最新资讯预览 ===")
        for item in items[:3]:
            print(f"\n{item['title']}")
            print(f"  类型: {item['type']}")
            print(f"  时间: {item['created_at']}")
            print(f"  预览: {item['content_preview'][:100]}...")
    else:
        print("未获取到数据")
