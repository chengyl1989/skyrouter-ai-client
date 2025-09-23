# 更新日志

所有重要变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 新增
- 建立标准化开发流程和工具链
- 添加完整的测试框架 (Jest + React Testing Library + Playwright)
- 配置CI/CD流水线 (GitHub Actions)
- 创建开发环境自动化设置脚本
- 添加代码质量检查工具 (ESLint + Prettier + TypeScript)
- 实现功能验证脚本
- 配置多环境部署脚本
- 建立贡献指南和开发文档

### 改进
- 图片生成模块配置功能优化
  - 添加专业的配置模态框界面
  - 实现配置状态显示标签
  - 优化用户交互体验
  - 统一搜索模块和图片模块的配置模式

### 技术债务
- 统一项目架构和代码规范
- 建立自动化测试和部署流程
- 优化开发者体验

## [0.1.0] - 2023-XX-XX

### 新增
- 🤖 多模型聊天功能
  - 支持 MaaS 1.5 Pro, MaaS 3 Haiku, MaaS 3 Opus, MaaS 4o mini
  - 实时流式响应
  - 对话历史管理
- 🎨 图片生成功能
  - 支持 DALL-E 3 和 MaaS Image 1 模型
  - 支持 MaaS-MJ 模型（需配置专用endpoint）
  - 图片下载功能
- 🎬 视频生成功能
  - 支持多种视频生成模型
  - 文字、图片、语音多种输入方式
- 🔍 智能搜索功能
  - SmartSearch 智能搜索
  - FullTextSearch 全文搜索
  - 搜索历史管理
- ⚙️ API配置管理
  - 灵活的endpoint配置
  - 模型专用endpoint支持
  - 配置持久化存储
- 📱 响应式设计
  - 支持桌面端和移动端
  - 自适应布局
  - 移动端优化交互

### 技术特性
- ⚡ Next.js 14 + React 18 + TypeScript
- 🎨 Tailwind CSS 样式框架
- 🗄️ Zustand 状态管理
- 🔌 Axios + Fetch HTTP客户端
- 📝 React Markdown 渲染
- 🐳 Docker 部署支持

### 基础设施
- 📦 完整的项目结构
- 🔧 ESLint + Prettier 代码规范
- 📚 详细的文档说明
- 🚀 Docker 快速部署