#!/usr/bin/env python3
"""
生成 Folo 订阅链接和配置
"""

# 用户的 8 个公众号
accounts = [
    "小互AI",
    "记忆承载",
    "jackywine", 
    "花叔",
    "数字生命卡兹克",
    "归藏的AI工具箱",
    "一支烟花AI",
    "向阳乔木"
]

print("=" * 70)
print("🎯 Folo 快速订阅指南")
print("=" * 70)
print()

print("📌 方法：一键搜索订阅")
print("-" * 70)
print()

for i, acc in enumerate(accounts, 1):
    search_url = f"https://follow.is/?search={acc}"
    print(f"{i}. {acc}")
    print(f"   点击订阅: {search_url}")
    print()

print("=" * 70)
print("📋 订阅步骤")
print("=" * 70)
print()
print("1. 登录 Folo: https://follow.is")
print("2. 复制上面的链接，在浏览器中打开")
print("3. 点击「订阅」按钮")
print("4. 订阅完成后，在「订阅管理」中找到该公众号")
print("5. 点击 RSS 图标，复制 RSS 链接")
print("6. 把链接发给我，我帮你更新配置")
print()

print("=" * 70)
print("⚡ 快捷方式（全部打开）")
print("=" * 70)
print()
print("你可以直接复制下面的命令在终端运行，一次性打开所有搜索页面：")
print()
print('```bash')
for acc in accounts:
    print(f'open "https://follow.is/?search={acc}"')
print('sleep 2')
print('```')
print()
print("或者手动逐个点击上面的链接订阅")
print()
