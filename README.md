# SkyRouter AI Client

一个功能强大的 AI 助手客户端，集成智能对话、搜索、图片生成、视频创作等多种 AI 功能。

[![Next.js](https://img.shields.io/badge/Next.js-14.0-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.2-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38bdf8)](https://tailwindcss.com/)

## ✨ 功能特性

### 🤖 智能对话
- 支持多种 MaaS 系列模型（GPT-4、Claude、Gemini等）
- 流式响应，实时显示 AI 回复
- 对话历史管理（保存、删除、切换）
- Markdown 渲染支持

### 🔍 智能搜索
- **智能搜索**: AI 语义理解，按相关度排序
- **全文搜索**: 精确关键词匹配，提供完整内容
- **高级参数**: 时间范围、结果数量、安全等级、地区设置
- **百度风格**: 清晰的搜索结果展示（标题、URL、摘要、时间）

### 🎨 图片生成
- 支持 DALL-E 3 和 MaaS Image 1 模型
- 图片预览和下载功能
- 生成历史管理

### 🎬 视频生成
- 支持多种视频生成模型
- HL 和 KL 端点配置
- 视频创作和管理

### ⚙️ 系统配置
- API 配置管理
- 端点选择和配置
- 搜索端点独立配置

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/YOUR_USERNAME/skyrouter-ai-client.git
cd skyrouter-ai-client

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

应用将在 http://localhost:3000 启动

### 配置 API

1. 点击左上角的设置按钮
2. 输入您的 API Endpoint（默认: https://genaiapi.cloudsway.net）
3. 输入您的 API Key
4. 配置各功能的专用端点（可选）
5. 点击保存

## 📊 技术架构

### 前端技术栈
- **Next.js 14**: React 全栈框架，App Router
- **React 18**: 用户界面库
- **TypeScript**: 类型安全的 JavaScript
- **Tailwind CSS**: 原子化 CSS 框架
- **Zustand**: 轻量级状态管理
- **Lucide React**: 现代图标库

### 后端 API
- **Next.js API Routes**: 服务端 API
- **OpenAI 兼容**: 标准 API 格式
- **流式响应**: Server-Sent Events
- **搜索集成**: SkyRouter 搜索服务

## 📁 项目结构

```
skyrouter-ai-client/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── chat/          # 聊天 API
│   │   ├── search/        # 搜索 API
│   │   ├── images/        # 图片生成 API
│   │   └── videos/        # 视频生成 API
│   ├── layout.tsx         # 全局布局
│   └── page.tsx          # 主页面
├── src/
│   ├── components/        # React 组件
│   │   ├── ChatInterface.tsx    # 聊天界面
│   │   ├── SearchInterface.tsx  # 搜索界面
│   │   ├── ImageGenerator.tsx   # 图片生成
│   │   └── VideoGenerator.tsx   # 视频生成
│   ├── hooks/            # 自定义 Hooks
│   ├── store/            # Zustand 状态管理
│   ├── types/            # TypeScript 类型
│   └── lib/              # 工具库
├── tests/                # 测试文件
└── docs/                 # 文档
```

## 🔧 开发指南

### 本地开发

```bash
# 开发模式
npm run dev

# 类型检查
npm run type-check

# 代码检查
npm run lint

# 格式化代码
npm run format

# 运行测试
npm run test

# 构建生产版本
npm run build
```

### Docker 部署

```bash
# 构建镜像
docker build -t skyrouter-ai-client .

# 运行容器
docker run -p 3000:3000 skyrouter-ai-client

# 或使用 docker-compose
docker-compose up
```

## 📖 API 接口

本项目基于 SkyRouter 平台的统一 API 接口：

- **聊天接口**: `POST /v1/chat/completions`
- **图片生成**: `POST /v1/images/generations`
- **搜索接口**: `GET /search/{endpoint}/smart` 或 `/full`
- **模型列表**: `GET /v1/models`

完全兼容 OpenAI API 格式。

## 🌟 使用截图

### 智能对话
![聊天界面](docs/screenshots/chat.png)

### 智能搜索
![搜索界面](docs/screenshots/search.png)

### 图片生成
![图片生成](docs/screenshots/image.png)

## 🤝 贡献指南

欢迎提交 Issues 和 Pull Requests！

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📝 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解版本更新历史。

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

- 📧 邮箱: support@skyrouter.ai
- 💬 Issue: [GitHub Issues](https://github.com/YOUR_USERNAME/skyrouter-ai-client/issues)
- 📖 文档: [项目文档](docs/)

## 🏷️ 版本信息

- **当前版本**: v1.0.0-stable
- **发布日期**: 2025-09-23
- **Git 标签**: v1.0.0-stable

---

**Made with ❤️ by SkyRouter Team**