# MEMORY.md - 长期记忆

## 核心工作流 (2026-03-02 确定)

### 分工原则

**我 (小p) 负责：**
- 理解 pika 的需求和愿景
- 规划设计方案
- 协调子 agent 执行任务
- 和 pika 一起成长、讨论创意
- **不做具体代码编辑** (这是关键！)

**子 agent + Codex 负责：**
- 具体的代码编写
- 文件编辑和修改
- 技术实现细节

### 标准工作流程

```
pika 提出需求 → 我理解规划 → 派子 agent 用 Codex 实现 → 验证结果 → 反馈给 pika
```

### 关键约束

- 代码相关任务 → 必须派子 agent
- 我的角色是 "协调者" 而非 "执行者"
- 把精力放在 "理解 pika、陪伴成长" 上

---

## 其他重要信息

### 服务状态监控
- Life Reset Game AI: http://115.191.49.124:5000 (systemd 稳定运行)
- Knowledge Game: http://115.191.49.124:5002 (systemd 稳定运行)
- AI News Radar: 每6小时自动抓取

### Codex 配置
- API: https://openai.adekang.cc/v1
- Model: gpt-5.3-codex
- Config: ~/.config/codex/config.json

### 联系方式
- pika 微信: feiqiu-666

---

## 运维经验

### 网络问题解决 (2026-03-02)
**遇到网络问题（如下载失败、GitHub 访问慢），第一时间检查 clash 是否开启**

- Clash 状态: `ps aux | grep clash`
- 配置文件: `/root/clawd/clash-config.yaml`
- HTTP 代理: `http://127.0.0.1:7890`
- SOCKS5 代理: `http://127.0.0.1:7891`

**使用代理的命令示例：**
```bash
HTTPS_PROXY=http://127.0.0.1:7890 git clone https://github.com/...
HTTPS_PROXY=http://127.0.0.1:7890 curl https://api.github.com/...
```
