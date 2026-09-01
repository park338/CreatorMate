# 小悠涨粉搭子

> 面向普通 KOC / 新手博主的 AI 社媒运营 Agent · 学习工作赛道

## 产品定位

帮助校园探店、本地生活、美食分享、好物种草方向的新手 KOC，通过 AI 驱动的五步运营闭环实现科学涨粉：**账号画像 → AI 诊断 → 增长规划 → 内容生成 → 数据复盘**。

## 技术栈

| 层 | 技术 | 说明 |
|----|------|------|
| 前端 | React 18 + Vite + TailwindCSS + Recharts | 五大功能页面，响应式卡片布局 |
| 后端 | Python FastAPI | 四个 AI 接口，自动 API 文档 |
| AI | DeepSeek（OpenAI 兼容协议） | 真实调用，结构化 JSON 输出 |
| 降级 | 本地规则引擎 | API 不可用时自动降级，保证 Demo 不崩 |

## 快速开始

### 一键启动

```powershell
powershell -ExecutionPolicy Bypass -File start.ps1
```

会自动启动前后端并打开浏览器。

### 手动启动

**1. 启动后端**（需要 Python 3.10+）

```powershell
cd backend
python -m venv venv          # 首次运行
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:DEEPSEEK_API_KEY="你的key"   # 如未在系统环境变量配置
uvicorn main:app --port 8000
```

**2. 启动前端**（需要 Node 18+）

```powershell
cd frontend
npm install
npm run dev
```

打开 http://localhost:5173 即可体验。

> 后端 API 文档：http://localhost:8000/docs

### Docker 生产部署

Ubuntu 服务器的镜像构建、Compose 启动、域名和 HTTPS 配置见 [DEPLOY_DOCKER.md](./DEPLOY_DOCKER.md)。

## 功能模块

### 1. 账号画像
填写平台、账号名称、内容方向、当前/目标粉丝、目标周期、近期内容表现。提供「试试校园探店示例」一键填充。

### 2. AI 诊断
接入 DeepSeek Pro 解读由规则引擎计算的定位清晰度、内容供给能力、流量触达效率、互动效率、增长动能，给出有数据依据的优先级建议。

### 3. 增长规划
阶段目标拆解、内容栏目设计、发布时间建议、互动策略、7 天内容日历。

### 4. 内容生成
选定一条选题后，AI 生成标题候选、前三秒钩子、分镜视频脚本、封面文案、话题标签、评论区互动话术。

### 5. 数据复盘
模拟发布数据（播放、点赞、收藏、评论、转粉、完播率、CTR 提升），7 天趋势图，AI 复盘原因分析 + 下一轮优化建议，形成闭环。

## 项目结构

```
Zhangfen/
├── start.ps1              # 一键启动脚本
├── backend/              # FastAPI 后端
│   ├── main.py           # 应用入口
│   ├── schemas.py        # 接口数据模型
│   ├── services/
│   │   ├── deepseek_client.py  # DeepSeek 封装
│   │   ├── prompts.py          # AI Prompt 模板
│   │   └── fallback.py         # 降级数据
│   └── routers/          # 四个 AI 接口路由
└── frontend/             # React 前端
    └── src/
        ├── pages/        # 五个功能页面
        ├── components/   # 布局/步骤条/UI组件
        ├── context/      # 全局状态管理
        └── api/          # API 封装层
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/diagnose | AI 五维诊断 |
| POST | /api/growth-plan | 增长规划 |
| POST | /api/generate-content | 内容生成 |
| POST | /api/review | 数据复盘 |
| GET  | /api/health | 健康检查 |
