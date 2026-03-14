# Folo 和 语鲸 RSS 获取指南

## 🎯 Folo RSS 获取

### 方式 1: 官方 RSSHub（推荐）

Folo 本身支持 RSSHub，可以直接使用以下格式：

```
https://rsshub.app/folo/{username}/{listId}
```

**获取步骤：**

1. 打开 Folo 网站: https://follow.is
2. 登录你的账号
3. 点击左侧的「列表」或「标签」
4. 找到你想订阅的列表，点击分享按钮
5. 复制列表 ID（通常是类似 `technology`、`ai`、`programming` 这样的标签名）

**常用 RSSHub Folo 源：**

```yaml
rss_feeds:
  - name: "Folo - 科技"
    url: "https://rsshub.app/folo/technology"
    enabled: true
    
  - name: "Folo - AI"
    url: "https://rsshub.app/folo/ai"
    enabled: true
    
  - name: "Folo - 编程"
    url: "https://rsshub.app/folo/programming"
    enabled: true
    
  - name: "Folo - 设计"
    url: "https://rsshub.app/folo/design"
    enabled: false
```

### 方式 2: 个人订阅 OPML 导出

1. 登录 Folo
2. 进入「设置」→「数据导出」
3. 下载 OPML 文件
4. 用文本编辑器打开，提取 RSS 链接

---

## 🐳 语鲸 RSS 获取

语鲸是一个微信公众号聚合平台，需要先获取订阅链接。

### 获取步骤：

1. **登录语鲸**
   - 打开: https://yuque.com （语雀）
   - 或使用语鲸小程序

2. **关注公众号**
   - 在语鲸中搜索你想关注的公众号
   - 点击「订阅」

3. **获取 RSS 链接**
   
   语鲸的 RSS 格式通常是这样的：
   ```
   https://rsshub.app/wechat/mp/{biz}
   ```
   
   或者通过语雀的 RSS：
   ```
   https://www.yuque.com/{user}/{repo}/atom
   ```

### 常用语鲸 RSS（通过 RSSHub）

```yaml
rss_feeds:
  # 一些热门的 AI/科技公众号
  - name: "量子位"
    url: "https://rsshub.app/wechat/mp/MzIzOTU0NTc0OQ=="
    enabled: true
    
  - name: "机器之心"
    url: "https://rsshub.app/wechat/mp/MzA3MzI4MjgzMw=="
    enabled: true
    
  - name: "InfoQ"
    url: "https://rsshub.app/wechat/mp/MzI0Njg4Nzg2MA=="
    enabled: true
    
  - name: "阮一峰的网络日志"
    url: "https://rsshub.app/wechat/mp/MzI0MjQ1NTMxMg=="
    enabled: true
```

---

## 🔧 快速配置方法

### 方法 1: 直接编辑配置文件

编辑 `/root/clawd/ai-news-radar/rss_config.yaml`：

```yaml
rss_feeds:
  # Folo 源
  - name: "Folo - 科技"
    url: "https://rsshub.app/folo/technology"
    enabled: true
    
  - name: "Folo - AI"
    url: "https://rsshub.app/folo/ai"
    enabled: true
    
  # 语鲸/公众号源
  - name: "量子位"
    url: "https://rsshub.app/wechat/mp/MzIzOTU0NTc0OQ=="
    enabled: true
    
  - name: "机器之心"
    url: "https://rsshub.app/wechat/mp/MzA3MzI4MjgzMw=="
    enabled: true
```

### 方法 2: 使用命令行工具

```bash
# 进入项目目录
cd /root/clawd/ai-news-radar

# 手动添加 RSS 到配置文件
.venv/bin/python -c "
import yaml

# 读取现有配置
with open('rss_config.yaml', 'r') as f:
    config = yaml.safe_load(f)

# 添加新 RSS
config['rss_feeds'].extend([
    {'name': 'Folo - 科技', 'url': 'https://rsshub.app/folo/technology', 'enabled': True},
    {'name': 'Folo - AI', 'url': 'https://rsshub.app/folo/ai', 'enabled': True},
])

# 保存
with open('rss_config.yaml', 'w') as f:
    yaml.dump(config, f, allow_unicode=True, sort_keys=False)

print('✅ RSS 配置已更新')
"
```

---

## 📝 获取 RSS 链接的其他方法

### 1. RSSHub 文档
查看 RSSHub 官方文档获取各种 RSS 源：
- https://docs.rsshub.app

### 2. 微信公众号 RSS
如果 RSSHub 的微信源不稳定，可以使用：
- **Wechat2RSS**: https://wechat2rss.xlab.app
- **Feeddd**: https://feeddd.org

### 3. 自己搭建 RSSHub（高级）
如果有服务器，可以自己搭建 RSSHub 服务：
```bash
docker run -d --name rsshub -p 1200:1200 diygod/rsshub
```

---

## ✅ 测试 RSS 源

添加完 RSS 后，可以测试是否可用：

```bash
# 测试单个 RSS
curl -s "https://rsshub.app/folo/technology" | head -50

# 或者直接运行抓取脚本
cd /root/clawd/ai-news-radar
.venv/bin/python fetch_news.py
```

---

## 💡 推荐订阅列表

根据你的需求，推荐订阅以下 RSS：

**AI 相关：**
- Folo - AI 标签
- 机器之心
- 量子位
- PaperWeekly

**技术开发：**
- Folo - 编程标签
- GitHub Trending
- InfoQ
- 开源中国

**产品/创业：**
- 36氪
- 虎嗅
- 少数派

需要我帮你直接把这些 RSS 添加到配置文件吗？
