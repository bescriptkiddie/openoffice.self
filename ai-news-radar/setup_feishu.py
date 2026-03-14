#!/usr/bin/env python3
"""
飞书推送配置助手
"""
import os

print("=" * 60)
print("🤖 AI 信源搜集器 - 飞书配置")
print("=" * 60)
print()

print("📋 配置步骤：")
print()
print("1️⃣  创建飞书群聊（或选择已有群）")
print("2️⃣  进入群设置 → 群机器人 → 添加机器人")
print("3️⃣  选择「自定义机器人」")
print("4️⃣  复制 Webhook URL")
print()

print("💻 配置环境变量：")
print()
print("方式一 - 临时设置（当前会话有效）：")
print("export FEISHU_WEBHOOK_URL='你的Webhook URL'")
print()
print("方式二 - 永久设置（推荐）：")
print("编辑 ~/.bashrc 或 ~/.zshrc，添加：")
print("export FEISHU_WEBHOOK_URL='你的Webhook URL'")
print()
print("然后运行：source ~/.bashrc")
print()

print("📁 当前环境变量状态：")
webhook = os.getenv('FEISHU_WEBHOOK_URL', '')
if webhook:
    print(f"✅ 已配置: {webhook[:30]}...{webhook[-10:]}")
else:
    print("❌ 未配置 FEISHU_WEBHOOK_URL")

print()
print("📝 配置 RSS 源：")
print("编辑文件: /root/clawd/ai-news-radar/rss_config.yaml")
print("添加你的 RSS 订阅链接")
print()
