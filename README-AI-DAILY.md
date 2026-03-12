# AI 资讯日报 → Self 格式 自动化方案

## ✅ 已完成

### 1. 转换脚本
- **路径**: `/root/clawd/openoffice.self/scripts/convert_to_self.py`
- **功能**: 将 `ai-news-radar/data/daily_report.md` 转换为 self 格式
- **输出**: `content/articles/YYYY-MM-DD-每日AI资讯.md`

### 2. 自动更新索引
- 每次转换后自动更新 `content/selfware_demo.md`
- 在文章中添加链接索引

### 3. 定时任务脚本
- **路径**: `/root/clawd/openoffice.self/scripts/daily_convert.sh`
- **计划**: 每天 5:00 AM 自动执行

## 📂 文件结构

```
openoffice.self/
├── content/
│   ├── selfware_demo.md          # 主索引（已更新）
│   └── articles/                 # 日报文章目录
│       └── 2026-03-12-每日AI资讯.md
├── scripts/
│   ├── convert_to_self.py        # 转换脚本
│   └── daily_convert.sh          # 定时任务脚本
└── server.py                     # HTTP 服务
```

## 🌐 访问地址

- **主控制台**: http://115.191.49.124:8888/views/self.html
- **今日文章**: http://115.191.49.124:8888/content/articles/2026-03-12-每日AI资讯.md

## 🔄 手动执行

```bash
# 转换今天的报告
cd /root/clawd/openoffice.self
python3 scripts/convert_to_self.py

# 转换指定日期的报告
python3 scripts/convert_to_self.py --date 2026-03-11
```

## 📝 文章格式

转换后的文章包含：
- **YAML Front Matter**: 标题、日期、分类、标签
- **结构化内容**: 按信源分类的资讯列表
- **统计信息**: 总计条数、各分类数量
- **原文链接**: 保留所有原始链接

## 🚀 下一步建议

1. **添加 cron 定时任务**（已提供脚本，需手动添加到 crontab）
2. **创建更多视图**: 可以为日报定制专门的 card/mindmap 视图
3. **添加全文搜索**: 在 self.html 中集成搜索功能
4. **历史归档**: 自动归档超过 30 天的文章

## 🛠 技术细节

- **模型**: GPT-5.4 (通过 Clawdbot)
- **运行时**: Python 3 (零依赖)
- **协议**: Selfware Protocol v0.1
- **内容源**: ai-news-radar daily_report.md
