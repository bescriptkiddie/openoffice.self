# 🤖 AI 信源搜集器

基于 AI News Radar 的简化版信息聚合工具，支持飞书推送和 RSS 接入。

## 📁 项目结构

```
ai-news-radar/
├── fetch_news.py          # 主抓取脚本
├── smart_fetch.py         # 智能定时控制器
├── setup_feishu.py        # 飞书配置向导
├── run.sh                 # 运行脚本
├── requirements.txt       # Python依赖
├── rss_config.yaml        # RSS订阅配置
├── .venv/                 # Python虚拟环境
├── data/                  # 数据目录
│   ├── latest.json        # 最新数据
│   ├── daily_report.md    # 日报
│   └── archive_*.json     # 归档
└── logs/                  # 日志目录
```

## 🚀 快速开始

### 1. 手动运行

```bash
cd /root/clawd/ai-news-radar
.venv/bin/python fetch_news.py
```

### 2. 智能定时运行（推荐）

```bash
cd /root/clawd/ai-news-radar
.venv/bin/python smart_fetch.py
```

## 📱 飞书推送配置

### 步骤 1: 获取 Webhook URL

1. 创建飞书群聊（或选择已有群）
2. 进入群设置 → 群机器人 → 添加机器人
3. 选择「自定义机器人」
4. 复制 Webhook URL

### 步骤 2: 配置环境变量

**临时设置（当前会话有效）：**
```bash
export FEISHU_WEBHOOK_URL='https://open.feishu.cn/open-apis/bot/v2/hook/xxxx'
```

**永久设置（推荐）：**
编辑 `~/.bashrc`，添加：
```bash
export FEISHU_WEBHOOK_URL='https://open.feishu.cn/open-apis/bot/v2/hook/xxxx'
```

然后运行：
```bash
source ~/.bashrc
```

### 步骤 3: 测试推送

```bash
cd /root/clawd/ai-news-radar
.venv/bin/python fetch_news.py
```

## 📡 RSS 订阅配置

编辑 `rss_config.yaml` 文件，添加你需要的 RSS 源：

```yaml
rss_feeds:
  - name: "Folo - 科技"
    url: "https://rsshub.app/folo/technology"
    enabled: true
    
  - name: "语鲸 - AI前线"
    url: "https://rsshub.app/yuque/ai-frontier"
    enabled: true
```

### 常用 RSS 源

- **Folo**: https://rsshub.app/folo/technology
- **InfoQ**: https://www.infoq.cn/feed
- **36氪**: https://36kr.com/feed
- **少数派**: https://sspai.com/feed
- **Hacker News**: https://news.ycombinator.com/rss

### Folo/语鲸 RSS 获取

1. **Folo**: 登录 https://follow.is → 选择标签 → 复制 RSS 链接
2. **语鲸**: 登录 https://yuque.com → 选择公众号 → 获取 RSS 链接

## ⏰ 定时任务

### 方式 1: 通过 HEARTBEAT（推荐）

已配置在 `HEARTBEAT.md` 中，每6小时自动检查并执行：

```bash
cd /root/clawd/ai-news-radar && .venv/bin/python smart_fetch.py
```

### 方式 2: 通过 Cron（Linux）

```bash
# 编辑 crontab
crontab -e

# 添加定时任务（每6小时执行一次）
0 */6 * * * cd /root/clawd/ai-news-radar && /root/clawd/ai-news-radar/.venv/bin/python smart_fetch.py >> /root/clawd/ai-news-radar/logs/cron.log 2>&1
```

## 📊 数据来源

当前支持以下信源：

| 信源 | 类型 | 状态 |
|------|------|------|
| BestBlogs | 聚合站 | ✅ 可用 |
| Hacker News | 技术热榜 | ⚠️ 网络限制 |
| GitHub Trending | 代码趋势 | ⚠️ 网络限制 |
| TechURLs | 聚合站 | 待测试 |
| 今日热榜 | 中文热榜 | 待测试 |
| RSS 订阅 | 自定义 | 配置后可用 |

## 🔧 故障排除

### 1. 飞书推送失败

- 检查 `FEISHU_WEBHOOK_URL` 是否正确设置
- 检查 webhook URL 是否包含密钥
- 检查飞书机器人是否被移除

### 2. RSS 抓取失败

- 检查 RSS 链接是否可访问
- 检查是否安装了 feedparser: `.venv/bin/pip install feedparser`
- 部分 RSS 源可能需要代理

### 3. 网络超时

部分海外网站（如 GitHub、Hacker News）可能因网络限制无法访问，这是正常现象。

## 📝 更新日志

### 2026-02-24
- ✅ 基础信源抓取
- ✅ 飞书推送支持
- ✅ RSS 订阅支持
- ✅ 智能定时任务
- ✅ 数据去重
- ✅ Markdown 报告生成

## 🎯 下一步优化

- [ ] 添加更多信源（Product Hunt、V2EX 等）
- [ ] AI 摘要生成
- [ ] 关键词过滤
- [ ] 重要资讯标记
- [ ] 数据库存储
- [ ] Web 界面

## 📞 支持

如有问题，请检查日志文件：`/root/clawd/ai-news-radar/logs/`
