#!/usr/bin/env python3
"""
测试飞书推送 - 使用正确签名
"""
import os
import requests
import time
import hmac
import hashlib
import base64

# 从 .env 加载
env_file = "/root/clawd/ai-news-radar/.env"
if os.path.exists(env_file):
    with open(env_file, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key] = value

WEBHOOK_URL = os.getenv('FEISHU_WEBHOOK_URL', '')
SECRET = os.getenv('FEISHU_SECRET', '')

if not WEBHOOK_URL:
    print("❌ 未配置 FEISHU_WEBHOOK_URL")
    exit(1)

def gen_sign(timestamp, secret):
    """生成飞书签名"""
    string_to_sign = f"{timestamp}\n{secret}"
    hmac_code = hmac.new(string_to_sign.encode("utf-8"), digestmod=hashlib.sha256).digest()
    sign = base64.b64encode(hmac_code).decode('utf-8')
    return sign

print(f"🚀 正在测试飞书推送...")
print(f"📎 Webhook: {WEBHOOK_URL[:50]}...")
print(f"🔑 Secret: {'已配置' if SECRET else '未配置'}")
print()

timestamp = int(time.time())
sign = gen_sign(timestamp, SECRET)

# 构建消息体
card = {
    "timestamp": str(timestamp),
    "sign": sign,
    "msg_type": "interactive",
    "card": {
        "header": {
            "title": {
                "tag": "plain_text",
                "content": "🎉 AI 信源搜集器 - 测试消息"
            },
            "template": "green"
        },
        "elements": [
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": "**✅ 飞书推送配置成功！**\n\n📰 现在可以正常接收 AI 资讯日报了\n\n⏰ 每6小时自动推送一次"
                }
            }
        ]
    }
}

try:
    resp = requests.post(
        WEBHOOK_URL,
        json=card,
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    
    if resp.status_code == 200:
        result = resp.json()
        if result.get('code') == 0:
            print("✅ 飞书推送成功！请检查群聊消息")
        else:
            print(f"❌ 飞书返回错误: {result}")
    else:
        print(f"❌ 推送失败: {resp.status_code} - {resp.text}")
        
except Exception as e:
    print(f"❌ 推送异常: {e}")
