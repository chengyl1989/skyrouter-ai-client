# 贡献指南

感谢您对小宿AI助手项目的关注和贡献！

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 9+
- Git

### 设置开发环境

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd chatbot
   ```

2. **自动设置开发环境**
   ```bash
   chmod +x scripts/setup-dev-env.sh
   ./scripts/setup-dev-env.sh
   ```

3. **手动设置（可选）**
   ```bash
   npm ci
   npx playwright install
   cp .env.example .env.local
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

## 📋 开发工作流

### 1. 功能开发标准流程

```bash
# 1. 创建功能分支
git checkout -b feature/your-feature-name

# 2. 开发功能
# ... 编写代码 ...

# 3. 运行完整验证
./scripts/validate-feature.sh

# 4. 提交代码
git add .
git commit -m "feat: add your feature description"

# 5. 推送分支
git push origin feature/your-feature-name

# 6. 创建Pull Request
```

### 2. 代码提交规范

使用[约定式提交](https://www.conventionalcommits.org/zh-hans/)格式：

```
<类型>[可选 作用域]: <描述>

[可选 正文]

[可选 脚注]
```

**提交类型：**
- `feat`: 新功能
- `fix`: 修复Bug
- `docs`: 文档更改
- `style`: 代码风格更改（不影响功能）
- `refactor`: 重构（既不修复bug也不添加功能）
- `test`: 添加或修改测试
- `chore`: 构建过程或辅助工具的变动

**示例：**
```bash
git commit -m "feat(image): add MJ model configuration modal"
git commit -m "fix(search): resolve endpoint validation issue"
git commit -m "docs: update development workflow"
```

## 🧪 测试规范

### 测试类型

1. **单元测试** - 测试单个组件/函数
2. **集成测试** - 测试组件间交互
3. **E2E测试** - 测试完整用户流程

### 运行测试

```bash
# 所有测试
npm run test

# 单元测试（监视模式）
npm run test:watch

# 集成测试
npm run test:integration

# E2E测试
npm run test:e2e

# 测试覆盖率
npm run test:coverage
```

### 测试要求

- 新功能必须包含单元测试
- 测试覆盖率保持在80%以上
- 关键用户流程需要E2E测试

## 🎨 代码规范

### 代码风格

- 使用TypeScript
- 遵循ESLint和Prettier配置
- 使用函数式组件和Hooks
- 优先使用组合而非继承

### 命名规范

- **文件名**: PascalCase用于组件，camelCase用于工具
- **组件**: PascalCase
- **函数/变量**: camelCase
- **常量**: UPPER_SNAKE_CASE
- **接口**: PascalCase，以I开头（可选）

### 目录结构

```
src/
├── components/     # UI组件
├── hooks/         # 自定义Hooks
├── lib/           # 工具库
├── store/         # 状态管理
├── types/         # 类型定义
└── config/        # 配置文件
```

## 🔧 开发工具

### 推荐的VSCode扩展

- ESLint
- Prettier
- TypeScript Importer
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens

### 有用的命令

```bash
# 代码检查
npm run lint
npm run type-check

# 代码格式化
npm run format

# 完整验证
npm run check-all

# 功能验证
./scripts/validate-feature.sh

# 构建验证
npm run build
```

## 📝 文档要求

### 代码文档

- 复杂函数需要JSDoc注释
- 组件需要Props类型定义
- 新功能需要更新README

### API文档

- 新增API端点需要文档
- 包含请求/响应示例
- 描述错误处理

## 🚢 部署流程

### 环境说明

- **开发环境**: 本地开发 (localhost)
- **测试环境**: 自动部署，用于测试
- **生产环境**: 手动部署，正式版本

### 部署命令

```bash
# 部署到测试环境
./scripts/deploy.sh staging

# 部署到生产环境
./scripts/deploy.sh production

# 模拟部署
./scripts/deploy.sh staging --dry-run
```

## 🐛 Bug报告

### 报告Bug时请包含：

1. **环境信息**
   - 操作系统
   - 浏览器版本
   - Node.js版本

2. **重现步骤**
   - 详细的操作步骤
   - 期望结果
   - 实际结果

3. **相关信息**
   - 错误截图
   - 控制台日志
   - 相关代码

### Bug修复流程

```bash
# 1. 创建修复分支
git checkout -b fix/bug-description

# 2. 修复Bug
# ... 编写修复代码 ...

# 3. 添加测试
# ... 编写回归测试 ...

# 4. 验证修复
./scripts/validate-feature.sh

# 5. 提交和创建PR
git commit -m "fix: resolve bug description"
```

## 🔍 代码审查

### 审查清单

- [ ] 代码符合项目规范
- [ ] 测试覆盖率足够
- [ ] 没有安全问题
- [ ] 性能影响可接受
- [ ] 文档已更新
- [ ] 向后兼容

### 提交Pull Request

1. **PR标题**: 简洁描述变更
2. **PR描述**: 包含变更详情、测试说明
3. **关联Issue**: 如果有相关Issue
4. **截图**: UI变更需要截图对比

## 📊 性能优化

### 性能要求

- 首屏加载时间 < 3秒
- API响应时间 < 1秒
- Lighthouse评分 > 90分

### 优化建议

- 使用React.memo避免不必要渲染
- 懒加载非关键组件
- 优化图片和静态资源
- 使用适当的缓存策略

## 🛡️ 安全指南

### 安全检查

- 不提交敏感信息到代码库
- 验证用户输入
- 使用HTTPS
- 定期更新依赖

### 安全工具

```bash
# 依赖安全扫描
npm audit

# 安全扫描
npm run security-audit
```

## 📞 获得帮助

- **文档**: 查看README.md和DEVELOPMENT_WORKFLOW.md
- **Issue**: 在GitHub上创建Issue
- **讨论**: 参与GitHub Discussions

## 🎉 感谢

感谢所有贡献者的辛勤工作！每一个贡献都让项目变得更好。

---

**记住**: 好的代码是写给人看的，顺便给机器执行。保持代码简洁、可读、可维护！