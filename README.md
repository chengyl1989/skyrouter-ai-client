# SkyRouter AI Client

一个简单的 AI 客户端，用于调用 SkyRouter 平台的多种 AI 模型，支持聊天和图片生成功能。

## 功能特性

- 🤖 **多模型聊天**: 支持 MaaS 系列模型进行对话
- 🎨 **图片生成**: 支持 DALL-E 3 和 MaaS Image 1 模型生成图片
- 💬 **流式响应**: 实时显示 AI 回复内容
- 📚 **对话管理**: 创建、保存、删除对话记录
- 🎯 **简单易用**: 只需配置 API endpoint 和 API key 即可使用

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost 启动

### 3. 配置 API

1. 点击左上角的设置按钮
2. 输入您的 API Endpoint（默认: https://genaiapi.cloudsway.net）
3. 输入您的 API Key
4. 点击保存

### 4. 开始使用

- **聊天功能**: 选择"聊天"标签，选择模型，输入消息开始对话
- **图片生成**: 选择"生图"标签，选择模型，输入描述生成图片

## 支持的模型

### 聊天模型
- MaaS 1.5 Pro
- MaaS 3 Haiku
- MaaS 3 Opus
- MaaS 4o mini

### 图片生成模型
- MaaS Dall-E-3
- MaaS Image 1

## 技术栈

- **前端框架**: Next.js 14 + React 18
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **HTTP 客户端**: Axios + Fetch
- **UI 图标**: Lucide React
- **Markdown 渲染**: React Markdown

## 项目结构

```
src/
├── components/          # UI 组件
│   ├── ApiConfig.tsx   # API 配置组件
│   ├── ChatInterface.tsx # 聊天界面
│   └── ImageGenerator.tsx # 图片生成组件
├── lib/                # 工具库
│   └── api.ts         # API 客户端
├── store/             # 状态管理
│   └── useStore.ts    # Zustand store
├── types/             # TypeScript 类型定义
│   └── index.ts
└── globals.css        # 全局样式
```

## API 接口说明

本项目基于 SkyRouter 平台的统一 API 接口：

- **聊天接口**: `POST /v1/chat/completions`
- **图片生成**: `POST /v1/images/generations`
- **模型列表**: `GET /v1/models`

完全兼容 OpenAI API 格式。

## 开发说明

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### 环境要求

- Node.js 18+
- npm 或 yarn

## 许可证

MIT License