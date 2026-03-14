#!/usr/bin/env python3
"""
智能定时任务控制器
每6小时执行一次信源搜集
"""

import os
import json
from datetime import datetime, timedelta
from pathlib import Path

STATE_FILE = Path("/root/clawd/ai-news-radar/.state.json")
ENV_FILE = Path("/root/clawd/ai-news-radar/.env")
FETCH_INTERVAL_HOURS = 6

def load_env():
    """加载 .env 文件"""
    if ENV_FILE.exists():
        with open(ENV_FILE, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value

def should_run():
    """检查是否应该执行抓取"""
    if not STATE_FILE.exists():
        return True
    
    with open(STATE_FILE, 'r') as f:
        state = json.load(f)
    
    last_run = datetime.fromisoformat(state.get('last_run', '2000-01-01T00:00:00'))
    next_run = last_run + timedelta(hours=FETCH_INTERVAL_HOURS)
    
    return datetime.now() >= next_run

def update_state():
    """更新状态文件"""
    state = {
        'last_run': datetime.now().isoformat(),
        'run_count': 0
    }
    
    if STATE_FILE.exists():
        with open(STATE_FILE, 'r') as f:
            old_state = json.load(f)
            state['run_count'] = old_state.get('run_count', 0) + 1
    else:
        state['run_count'] = 1
    
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)

def check_feishu_config():
    """检查飞书配置"""
    # 加载环境变量
    load_env()
    
    webhook = os.getenv('FEISHU_WEBHOOK_URL', '')
    secret = os.getenv('FEISHU_SECRET', '')
    
    if webhook:
        print(f"✅ 飞书 Webhook 已配置")
        if secret:
            print(f"✅ 飞书 Secret 已配置")
        else:
            print(f"⚠️  飞书 Secret 未配置（部分机器人不需要）")
        return True
    else:
        print(f"⚠️  飞书 Webhook 未配置")
        print(f"   编辑 {ENV_FILE} 添加 FEISHU_WEBHOOK_URL")
        return False

def main():
    # 加载环境变量
    load_env()
    
    print("=" * 50)
    print("🤖 AI 信源搜集 - 智能控制器")
    print("=" * 50)
    print()
    
    # 检查飞书配置
    check_feishu_config()
    print()
    
    if should_run():
        print("🚀 开始执行信源搜集...")
        print()
        os.chdir('/root/clawd/ai-news-radar')
        
        # 使用虚拟环境的 python 运行
        exit_code = os.system('.venv/bin/python fetch_news.py')
        
        if exit_code == 0:
            update_state()
            print()
            print("✅ 信源搜集完成")
            
            # 读取报告
            report_file = Path('/root/clawd/ai-news-radar/data/daily_report.md')
            if report_file.exists():
                print(f"📰 报告已生成: {report_file}")
                
                # 显示简报
                with open(report_file, 'r') as f:
                    content = f.read()
                    # 提取标题行
                    for line in content.split('\n')[:5]:
                        if line.strip():
                            print(f"   {line}")
        else:
            print(f"❌ 执行失败，退出码: {exit_code}")
    else:
        # 读取上次运行时间
        if STATE_FILE.exists():
            with open(STATE_FILE, 'r') as f:
                state = json.load(f)
            last_run = datetime.fromisoformat(state.get('last_run', '2000-01-01T00:00:00'))
            next_run = last_run + timedelta(hours=FETCH_INTERVAL_HOURS)
            print(f"⏰ 下次运行时间: {next_run.strftime('%Y-%m-%d %H:%M')}")
            print(f"   上次运行: {last_run.strftime('%Y-%m-%d %H:%M')}")
        else:
            print("⏰ 等待首次运行")
    
    print()

if __name__ == '__main__':
    main()
