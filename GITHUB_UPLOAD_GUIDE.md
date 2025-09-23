# GitHub上传指南

## 快速上传步骤

### 方法1: 使用命令行上传

1. **创建GitHub仓库**（在网页上操作）
   - 访问 https://github.com
   - 点击 "+" → "New repository"
   - 仓库名: `skyrouter-ai-client`
   - 描述: `AI助手客户端 - 支持智能对话、搜索、图片生成等功能`
   - 选择 Public 或 Private
   - 不要勾选任何初始化选项

2. **连接并推送**（在项目目录运行）
   ```bash
   # 添加远程仓库（替换YOUR_USERNAME为你的GitHub用户名）
   git remote add origin https://github.com/YOUR_USERNAME/skyrouter-ai-client.git

   # 推送到GitHub
   git branch -M main
   git push -u origin main

   # 推送标签
   git push origin --tags
   ```

### 方法2: 使用GitHub Desktop

1. 下载并安装 GitHub Desktop
2. 点击 "Add an Existing Repository"
3. 选择项目文件夹
4. 点击 "Publish repository"

### 方法3: 使用GitHub CLI (推荐)

```bash
# 安装GitHub CLI后
gh auth login
gh repo create skyrouter-ai-client --public --source=. --remote=origin --push
```

## 项目信息

- **项目名称**: SkyRouter AI Client
- **版本**: v1.0.0-stable
- **描述**: 集成智能对话、搜索、图片生成、视频创作等功能的AI助手平台
- **技术栈**: Next.js 14 + React 18 + TypeScript + Tailwind CSS

## 仓库建议设置

- **主题标签**: `ai`, `nextjs`, `typescript`, `chatbot`, `search`, `image-generation`
- **许可证**: MIT License
- **分支保护**: 启用main分支保护
- **GitHub Pages**: 可选择部署演示站点

## 注意事项

1. 确保 `.env` 文件已在 `.gitignore` 中排除
2. 敏感信息请使用环境变量
3. 定期更新 README.md 和版本文档
4. 使用标签管理版本发布

## 后续维护

- 新功能开发使用分支: `git checkout -b feature/new-feature`
- 定期推送: `git push origin main`
- 版本发布: `git tag v1.x.x && git push origin --tags`