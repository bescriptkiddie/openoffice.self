#!/usr/bin/env python3
"""
AI 信源搜集器 - 增强版
支持飞书推送和 RSS 接入
"""

import json
import re
import time
import hashlib
import os
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urljoin
from pathlib import Path

import requests
from bs4 import BeautifulSoup

# ========== 配置 ==========
DATA_DIR = Path("/root/clawd/ai-news-radar/data")
DATA_DIR.mkdir(parents=True, exist_ok=True)

# 飞书 Webhook（动态读取，确保 .env 已加载）
def get_feishu_config():
    """动态获取飞书配置"""
    return os.getenv('FEISHU_WEBHOOK_URL', ''), os.getenv('FEISHU_SECRET', '')

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)

# ========== 信源列表 ==========
SOURCES = {
    # === AI 垂直站 ===
    "aibase": {
        "name": "AIbase",
        "url": "https://www.aibase.com/zh",
        "type": "static",
        "enabled": True,
    },
    "waytoagi": {
        "name": "WaytoAGI",
        "url": "https://waytoagi.feishu.cn/wiki/QPe5w5g7UisbEkkow8XcDmOpn8e",
        "type": "waytoagi",
        "enabled": True,
    },

    # === 技术热榜 ===
    "hackernews": {
        "name": "Hacker News",
        "url": "https://news.ycombinator.com/",
        "type": "hackernews",
        "enabled": False,  # 连接超时
    },
    "github_trending": {
        "name": "GitHub Trending",
        "url": "https://github.com/trending",
        "type": "github",
        "enabled": True,
    },

    # === 聚合站 ===
    "techurls": {
        "name": "TechURLs",
        "url": "https://techurls.com/",
        "type": "techurls",
        "enabled": True,
    },
    "bestblogs": {
        "name": "BestBlogs",
        "url": "https://bestblogs.dev/",
        "type": "bestblogs",
        "enabled": False,  # 连接超时
    },
    "tophub": {
        "name": "今日热榜",
        "url": "https://tophub.today/",
        "type": "tophub",
        "enabled": False,  # 连接超时
    },

    # === ClawFeed API ===
    "clawfeed": {
        "name": "ClawFeed",
        "url": "https://clawfeed.kevinhe.io/api/digests",
        "type": "clawfeed",
        "enabled": True,
    },
}

# 加载 RSS 配置
def load_rss_config():
    """从 yaml 文件加载 RSS 配置"""
    try:
        import yaml
        config_file = Path("/root/clawd/ai-news-radar/rss_config.yaml")
        if config_file.exists():
            with open(config_file, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
                return config.get('rss_feeds', [])
    except Exception as e:
        print(f"⚠️ 加载 RSS 配置失败: {e}")
    
    # 默认配置
    return [
        {"name": "Folo - 科技", "url": "https://rsshub.app/folo/technology", "enabled": True},
        {"name": "Folo - AI", "url": "https://rsshub.app/folo/ai", "enabled": True},
    ]

RSS_FEEDS = load_rss_config()

# ========== 抓取函数 ==========

def fetch_with_retry(url, headers=None, timeout=10):
    """带重试的 HTTP 请求"""
    if headers is None:
        headers = {"User-Agent": USER_AGENT}
    
    for attempt in range(2):
        try:
            resp = requests.get(url, headers=headers, timeout=(5, timeout))
            if resp.status_code == 200:
                return resp.text
            time.sleep(0.5)
        except requests.exceptions.ConnectTimeout:
            print(f"⚠️ 连接超时: {url[:50]}...")
            return None
        except requests.exceptions.ReadTimeout:
            print(f"⚠️ 读取超时: {url[:50]}...")
            return None
        except Exception as e:
            if attempt == 1:
                print(f"❌ 请求失败 {url[:50]}...: {type(e).__name__}")
                return None
            time.sleep(0.5)
    return None


def parse_hackernews(html):
    """解析 Hacker News"""
    items = []
    soup = BeautifulSoup(html, 'html.parser')
    
    for item in soup.select('.athing')[:15]:
        try:
            title_elem = item.select_one('.titleline > a')
            if not title_elem:
                continue
            
            title = title_elem.get_text(strip=True)
            url = title_elem.get('href', '')
            
            # 相对路径转绝对路径
            if url.startswith('item?'):
                url = urljoin('https://news.ycombinator.com/', url)
            
            items.append({
                "title": title,
                "url": url,
                "source": "Hacker News",
                "site_id": "hackernews",
            })
        except Exception as e:
            continue
    
    return items


def parse_github_trending(html):
    """解析 GitHub Trending"""
    items = []
    soup = BeautifulSoup(html, 'html.parser')
    
    for article in soup.select('article.Box-row')[:15]:
        try:
            link_elem = article.select_one('h2 a')
            if not link_elem:
                continue
            
            repo = link_elem.get_text(strip=True).replace('\n', '').replace(' ', '')
            url = urljoin('https://github.com/', link_elem.get('href', ''))
            desc_elem = article.select_one('p[class*="color-fg-muted"]')
            desc = desc_elem.get_text(strip=True) if desc_elem else ""
            
            items.append({
                "title": f"{repo}: {desc}" if desc else repo,
                "url": url,
                "source": "GitHub Trending",
                "site_id": "github_trending",
            })
        except Exception as e:
            continue
    
    return items


def parse_techurls(html):
    """解析 TechURLs"""
    items = []
    soup = BeautifulSoup(html, 'html.parser')
    
    for item in soup.select('.story')[:15]:
        try:
            title_elem = item.select_one('.title a')
            if not title_elem:
                continue
            
            title = title_elem.get_text(strip=True)
            url = title_elem.get('href', '')
            source_elem = item.select_one('.source')
            source = source_elem.get_text(strip=True) if source_elem else "TechURLs"
            
            items.append({
                "title": title,
                "url": url,
                "source": source,
                "site_id": "techurls",
            })
        except Exception as e:
            continue
    
    return items


def parse_bestblogs(html):
    """解析 BestBlogs"""
    items = []
    soup = BeautifulSoup(html, 'html.parser')
    base_url = "https://bestblogs.dev"
    
    for article in soup.select('article')[:15]:
        try:
            link_elem = article.select_one('a[href]')
            title_elem = article.select_one('h2, h3, .title, a[data-title]')
            
            if not link_elem:
                continue
            
            # 尝试多种方式获取标题
            title = ""
            if title_elem:
                title = title_elem.get_text(strip=True)
            if not title:
                title = link_elem.get_text(strip=True)
            if not title:
                title = link_elem.get('data-title', '')
            if not title:
                title = link_elem.get('title', '')
            
            url = link_elem.get('href', '')
            # 处理相对路径
            if url and url.startswith('/'):
                url = base_url + url
            elif url and not url.startswith('http'):
                url = base_url + '/' + url
            
            if title and url:
                items.append({
                    "title": title,
                    "url": url,
                    "source": "BestBlogs",
                    "site_id": "bestblogs",
                })
        except Exception as e:
            continue
    
    return items


def fetch_rss_feed(feed_info):
    """抓取 RSS 源"""
    try:
        import feedparser
    except ImportError:
        print(f"⚠️ 未安装 feedparser，跳过 RSS 源: {feed_info['name']}")
        return []

    try:
        print(f"📡 抓取 RSS: {feed_info['name']}...")

        # 使用 requests 获取内容，带严格超时
        headers = {"User-Agent": USER_AGENT}
        resp = requests.get(feed_info['url'], headers=headers, timeout=(5, 10))
        if resp.status_code != 200:
            print(f"⚠️ RSS 返回非200状态码: {resp.status_code}")
            return []

        # 解析 RSS 内容
        feed = feedparser.parse(resp.content)
        items = []

        for entry in feed.entries[:10]:  # 每个 RSS 源取前10条
            item = {
                "title": entry.get('title', '无标题'),
                "url": entry.get('link', ''),
                "source": feed_info['name'],
                "site_id": f"rss_{hash(feed_info['url']) & 0xFFFF}",
                "published": entry.get('published', ''),
            }
            items.append(item)

        print(f"✅ {feed_info['name']}: {len(items)} 条")
        return items
    except requests.exceptions.ConnectTimeout:
        print(f"⚠️ RSS 连接超时: {feed_info['name']}")
        return []
    except requests.exceptions.ReadTimeout:
        print(f"⚠️ RSS 读取超时: {feed_info['name']}")
        return []
    except Exception as e:
        print(f"❌ RSS 抓取失败 {feed_info['name']}: {type(e).__name__}")
        return []


def fetch_clawfeed():
    """抓取 ClawFeed API"""
    print("📡 抓取: ClawFeed...")
    
    try:
        # 使用代理访问
        proxies = {
            "http": "http://127.0.0.1:7890",
            "https": "http://127.0.0.1:7890"
        }
        
        resp = requests.get("https://clawfeed.kevinhe.io/api/digests", 
                          proxies=proxies, timeout=30)
        if resp.status_code == 200:
            data = resp.json()
            items = []
            
            for item in data[:10]:  # 取最新的10条
                item_type = item.get('type', 'unknown')
                created_at = item.get('created_at', '')
                content = item.get('content', '')
                
                # 解析标题
                title = "ClawFeed 资讯"
                if content:
                    lines = content.split('\n')
                    for line in lines:
                        line = line.strip()
                        if line.startswith('# '):
                            title = line[2:100]
                            break
                        elif line and not line.startswith('##') and len(line) > 10:
                            title = line[:80] + ('...' if len(line) > 80 else '')
                            break
                
                items.append({
                    "title": f"[{item_type.upper()}] {title}",
                    "url": "https://clawfeed.kevinhe.io/",
                    "source": "ClawFeed",
                    "site_id": "clawfeed",
                })
            
            return items
        else:
            print(f"⚠️ ClawFeed API 返回状态码: {resp.status_code}")
            return []
    except Exception as e:
        print(f"❌ ClawFeed 抓取失败: {e}")
        return []


def fetch_source(source_id, source_config):
    """抓取单个信源"""
    print(f"📡 抓取: {source_config['name']}...")
    
    try:
        parser_type = source_config.get('type', 'static')
        
        # ClawFeed 使用 API 抓取
        if parser_type == 'clawfeed':
            return fetch_clawfeed()
        
        html = fetch_with_retry(source_config['url'])
        if not html:
            return []
        
        if parser_type == 'hackernews':
            return parse_hackernews(html)
        elif parser_type == 'github':
            return parse_github_trending(html)
        elif parser_type == 'techurls':
            return parse_techurls(html)
        elif parser_type == 'bestblogs':
            return parse_bestblogs(html)
        else:
            # 通用抓取
            return []
            
    except Exception as e:
        print(f"❌ {source_config['name']} 失败: {e}")
        return []


# ========== 去重与处理 ==========

def deduplicate_items(items):
    """根据 URL 去重"""
    seen = set()
    unique = []
    
    for item in items:
        url = item.get('url', '')
        # 规范化 URL
        url = re.sub(r'#.*$', '', url)  # 去掉锚点
        url = re.sub(r'\?utm_.*$', '', url)  # 去掉 UTM 参数
        
        if url and url not in seen:
            seen.add(url)
            unique.append(item)
    
    return unique


def generate_id(item):
    """生成唯一 ID"""
    content = f"{item.get('title', '')}{item.get('url', '')}"
    return hashlib.md5(content.encode()).hexdigest()[:12]


def enrich_items(items):
    """丰富条目信息"""
    now = datetime.now().isoformat()
    enriched = []
    
    for item in items:
        item['id'] = generate_id(item)
        item['fetched_at'] = now
        enriched.append(item)
    
    return enriched


# ========== 飞书推送 ==========

def gen_feishu_sign(timestamp, secret):
    """生成飞书签名"""
    import hmac
    import hashlib
    import base64
    string_to_sign = f"{timestamp}\n{secret}"
    hmac_code = hmac.new(string_to_sign.encode("utf-8"), digestmod=hashlib.sha256).digest()
    sign = base64.b64encode(hmac_code).decode('utf-8')
    return sign


def send_feishu_notification(title, elements):
    """发送飞书通知 - 使用 Card 元素格式确保链接可点击"""
    webhook_url, secret = get_feishu_config()
    
    if not webhook_url:
        print("⚠️ 未配置飞书 Webhook，跳过推送")
        return False
    
    try:
        import time
        
        timestamp = int(time.time())
        
        # 构建卡片内容
        card_content = {
            "header": {
                "title": {
                    "tag": "plain_text",
                    "content": title
                },
                "template": "blue"
            },
            "elements": elements if isinstance(elements, list) else [
                {
                    "tag": "div",
                    "text": {
                        "tag": "lark_md",
                        "content": str(elements)
                    }
                }
            ]
        }
        
        # 如果有密钥，生成签名
        if secret:
            sign = gen_feishu_sign(timestamp, secret)
            payload = {
                "timestamp": str(timestamp),
                "sign": sign,
                "msg_type": "interactive",
                "card": card_content
            }
        else:
            # 无签名版本
            payload = {
                "msg_type": "interactive",
                "card": card_content
            }
        
        resp = requests.post(
            webhook_url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if resp.status_code == 200:
            result = resp.json()
            if result.get('code') == 0:
                print("✅ 飞书推送成功")
                return True
            else:
                print(f"❌ 飞书推送失败: {result}")
                return False
        else:
            print(f"❌ 飞书推送失败: {resp.status_code} - {resp.text}")
            return False
            
    except Exception as e:
        print(f"❌ 飞书推送异常: {e}")
        return False


def format_feishu_content(items):
    """格式化飞书消息内容 - 使用飞书 Card 元素确保链接可点击"""
    # 按来源分组
    by_source = {}
    for item in items:
        source = item.get('source', '未知')
        if source not in by_source:
            by_source[source] = []
        by_source[source].append(item)
    
    elements = []
    
    # 添加标题
    elements.append({
        "tag": "div",
        "text": {
            "tag": "lark_md",
            "content": f"**📊 共 {len(items)} 条资讯**"
        }
    })
    
    # 为每个信源创建折叠区块
    for source, source_items in sorted(by_source.items()):
        # 来源标题
        elements.append({
            "tag": "div",
            "text": {
                "tag": "lark_md",
                "content": f"\n**📰 {source}**"
            }
        })
        
        # 该来源的新闻列表
        news_list = []
        for item in source_items[:5]:  # 每个来源最多5条
            title = item.get('title', '无标题')
            url = item.get('url', '')
            if url:
                # 使用飞书的 a 标签格式
                news_list.append(f"• [{title}]({url})")
            else:
                news_list.append(f"• {title}")
        
        elements.append({
            "tag": "div",
            "text": {
                "tag": "lark_md",
                "content": "\n".join(news_list)
            }
        })
    
    return elements


# ========== 主流程 ==========

def fetch_all_sources():
    """并发抓取所有信源"""
    all_items = []

    # 1. 抓取网页源（只抓取启用的）
    enabled_sources = {sid: scfg for sid, scfg in SOURCES.items() if scfg.get('enabled', True)}

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {
            executor.submit(fetch_source, sid, scfg): sid
            for sid, scfg in enabled_sources.items()
        }

        for future in as_completed(futures):
            sid = futures[future]
            try:
                items = future.result()
                all_items.extend(items)
                print(f"✅ {SOURCES[sid]['name']}: {len(items)} 条")
            except Exception as e:
                print(f"❌ {SOURCES[sid]['name']}: 错误 {e}")
    
    # 2. 抓取 RSS 源
    for feed in RSS_FEEDS:
        if feed.get('enabled', True):
            items = fetch_rss_feed(feed)
            all_items.extend(items)
    
    return all_items


def save_results(items):
    """保存结果"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # 最新数据
    latest_file = DATA_DIR / 'latest.json'
    with open(latest_file, 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    
    # 归档
    archive_file = DATA_DIR / f'archive_{timestamp}.json'
    with open(archive_file, 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    
    return latest_file, archive_file


def generate_markdown_report(items, output_file=None):
    """生成 Markdown 报告"""
    if output_file is None:
        output_file = DATA_DIR / 'daily_report.md'
    
    now = datetime.now().strftime('%Y-%m-%d %H:%M')
    
    # 按来源分组
    by_source = {}
    for item in items:
        source = item.get('source', '未知')
        if source not in by_source:
            by_source[source] = []
        by_source[source].append(item)
    
    md = f"""# 📰 AI 信息日报

> 生成时间: {now}
> 总计: {len(items)} 条

---

"""
    
    for source, source_items in sorted(by_source.items()):
        md += f"## {source}\n\n"
        for item in source_items[:10]:  # 每个来源最多10条
            title = item.get('title', '无标题')
            url = item.get('url', '')
            md += f"- [{title}]({url})\n"
        md += "\n"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(md)
    
    return output_file


def main():
    print("=" * 60)
    print("🚀 AI 信源搜集器 - 增强版")
    print("=" * 60)
    print()
    
    # 1. 抓取所有信源
    print("📡 开始抓取信源...\n")
    items = fetch_all_sources()
    
    if not items:
        print("❌ 未抓取到任何数据")
        return
    
    print(f"\n📊 原始数据: {len(items)} 条")
    
    # 2. 去重
    items = deduplicate_items(items)
    print(f"📊 去重后: {len(items)} 条")
    
    # 3. 丰富数据
    items = enrich_items(items)
    
    # 4. 保存
    latest_file, archive_file = save_results(items)
    print(f"\n💾 已保存:")
    print(f"   - 最新: {latest_file}")
    print(f"   - 归档: {archive_file}")
    
    # 5. 生成报告
    report_file = generate_markdown_report(items)
    print(f"   - 报告: {report_file}")
    
    # 6. 飞书推送
    webhook_url, _ = get_feishu_config()
    if webhook_url:
        title = f"📰 AI 信息日报 - {datetime.now().strftime('%m/%d %H:%M')}"
        content = format_feishu_content(items)
        send_feishu_notification(title, content)
    
    print("\n✅ 完成!")
    
    return items


if __name__ == "__main__":
    main()
