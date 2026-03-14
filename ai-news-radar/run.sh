#!/bin/bash
# AI 信源搜集启动脚本

cd /root/clawd/ai-news-radar

# 检查虚拟环境
if [ ! -d ".venv" ]; then
    echo "❌ 虚拟环境不存在，请先安装依赖"
    exit 1
fi

# 显示配置状态
echo "=========================================="
echo "🤖 AI 信源搜集器"
echo "=========================================="
echo ""

if [ -z "$FEISHU_WEBHOOK_URL" ]; then
    echo "⚠️  飞书 Webhook 未配置"
    echo "   运行: .venv/bin/python setup_feishu.py"
else
    echo "✅ 飞书 Webhook 已配置"
fi
echo ""

# 运行抓取
echo "🚀 开始抓取信源..."
echo ""

.venv/bin/python fetch_news.py

exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo ""
    echo "✅ 完成!"
    echo ""
    echo "📄 报告位置: /root/clawd/ai-news-radar/data/daily_report.md"
else
    echo ""
    echo "❌ 执行失败，退出码: $exit_code"
fi
