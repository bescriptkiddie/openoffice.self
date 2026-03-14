# HEARTBEAT.md

# Keep this file empty (or with only comments) to skip heartbeat API calls.
# Add tasks below when you want the agent to check something periodically.

## AI 信源搜集定时任务

请运行以下命令检查并执行信源搜集（每6小时自动执行一次）：

```bash
cd /root/clawd/ai-news-radar && .venv/bin/python smart_fetch.py
```

如果显示 "🚀 开始执行信源搜集..."，则执行完成后：
1. 读取 data/daily_report.md 
2. 总结今日 AI 资讯要点
3. 发送飞书通知（如果配置了webhook）

如果显示 "⏰ 下次运行时间"，则跳过本次执行
