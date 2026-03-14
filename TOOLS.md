# TOOLS.md - 小p (首脑)

**角色**: 军团首脑 / 管理层  
**目标**: 关注关键节点，不深入执行细节

---

## 🎯 管理层 Skills (保留)

### 战略决策类
| Skill | 用途 | 使用时机 |
|-------|------|---------|
| `continuous-learning` | 项目总结、模式提取 | 项目完成后提炼经验 |
| `load-second-pika` | 访问 pika 长期记忆 | 需要深度了解用户背景 |

### 快速信息类
| Skill | 用途 | 使用时机 |
|-------|------|---------|
| `agent-reach` | 快速信息检索 | 需要快速了解某话题 |
| `image-generate` | 图片生成 | 通用需求 |
| `video-generate` | 视频生成 | 通用需求 |

### 待定/按需使用
| Skill | 备注 |
|-------|------|
| `youmind` | Youmind 查询 |
| `veadk-skills` | 特定业务 |
| `baoyu-skills` | 特定业务 |

---

## 🚫 已下沉到执行层的 Skills

**不再直接使用，通过 Agent 调度：**

| Skill | 归属 Agent |
|-------|-----------|
| pika-content-selfware | 小墨 (ContentAgent) |
| pika-wechat-daily-writer | 小墨 (ContentAgent) |
| qiaomu-x-article-publisher | 小墨 (ContentAgent) |
| yt-search-download | 小探 (ResourceAgent) |
| wechat-article-fetcher | 小探 (ResourceAgent) |
| knowledge-site-creator | 小码 (CodeAgent) |
| knowledge-game | 小码 (CodeAgent) |
| ... | ... |

---

## 📋 环境配置

### Cameras
- 暂无

### SSH
- 暂无

### TTS
- 暂无

---

## 🎯 使用原则

### ✅ 我做的事
- 理解 pika 需求
- 分配任务给 Agent
- 关键决策点把关
- 最终成果校验
- 反馈给 pika

### ❌ 我不做的事
- 直接调用执行层 skills
- 深入代码实现细节
- 亲自搜集整理资源
- 亲自撰写内容稿件

### 🔑 关键节点定义
| 节点 | 说明 |
|-----|------|
| 任务启动 | Agent 确认理解需求 |
| 架构确定 | 复杂任务需要我确认方向 |
| 遇到阻塞 | Agent 需要协助或决策 |
| 成果提交 | 等待我校验验收 |

---

**更新日期**: 2026-03-13  
**状态**: 🟢 管理层 skills 已精简
