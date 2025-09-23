#!/bin/bash

# 开发环境设置脚本
# 用于初始化和配置开发环境

set -e

echo "🚀 设置开发环境..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查Node.js版本
check_node_version() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装，请先安装 Node.js 18+${NC}"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${RED}❌ Node.js 版本过低 (当前: v$NODE_VERSION)，需要 v18+${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Node.js 版本: $(node -v)${NC}"
}

# 检查npm版本
check_npm_version() {
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm 未安装${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ npm 版本: $(npm -v)${NC}"
}

# 安装依赖
install_dependencies() {
    echo -e "${BLUE}📦 安装项目依赖...${NC}"
    npm ci
    
    echo -e "${BLUE}🎭 安装Playwright浏览器...${NC}"
    npx playwright install
    
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
}

# 设置Git hooks
setup_git_hooks() {
    echo -e "${BLUE}🔧 设置Git hooks...${NC}"
    
    # 创建pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "🔍 运行pre-commit检查..."

# 运行lint检查
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Lint检查失败，请修复后再提交"
    exit 1
fi

# 运行类型检查
npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ TypeScript类型检查失败，请修复后再提交"
    exit 1
fi

# 运行测试
npm run test -- --watchAll=false --passWithNoTests
if [ $? -ne 0 ]; then
    echo "❌ 测试失败，请修复后再提交"
    exit 1
fi

echo "✅ Pre-commit检查通过"
EOF

    chmod +x .git/hooks/pre-commit
    echo -e "${GREEN}✅ Git hooks 设置完成${NC}"
}

# 创建环境配置文件
setup_env_files() {
    echo -e "${BLUE}📝 创建环境配置文件...${NC}"
    
    # 创建.env.local示例
    if [ ! -f ".env.local" ]; then
        cat > .env.local << 'EOF'
# 本地开发环境配置
NEXT_PUBLIC_API_ENDPOINT=https://genaiapi.cloudsway.net
NEXT_PUBLIC_APP_VERSION=0.1.0
NEXT_PUBLIC_APP_NAME=小宿AI助手

# 开发模式配置
NODE_ENV=development
NEXT_PUBLIC_DEBUG=true

# 可选：API密钥（建议通过UI配置）
# NEXT_PUBLIC_DEFAULT_API_KEY=your-api-key-here
EOF
        echo -e "${GREEN}✅ 创建 .env.local 文件${NC}"
    else
        echo -e "${YELLOW}⚠ .env.local 已存在，跳过创建${NC}"
    fi
    
    # 创建.env.example
    cat > .env.example << 'EOF'
# 示例环境配置文件
# 复制此文件为 .env.local 并填入实际值

# API配置
NEXT_PUBLIC_API_ENDPOINT=https://genaiapi.cloudsway.net
NEXT_PUBLIC_APP_VERSION=0.1.0
NEXT_PUBLIC_APP_NAME=小宿AI助手

# 开发配置
NODE_ENV=development
NEXT_PUBLIC_DEBUG=true

# API密钥（可选，建议通过UI配置）
# NEXT_PUBLIC_DEFAULT_API_KEY=your-api-key-here
EOF
}

# 创建开发者文档
create_dev_docs() {
    echo -e "${BLUE}📚 创建开发者文档...${NC}"
    
    if [ ! -f "CONTRIBUTING.md" ]; then
        cat > CONTRIBUTING.md << 'EOF'
# 贡献指南

感谢您对小宿AI助手项目的关注！

## 开发环境设置

1. 克隆项目到本地
2. 运行 `./scripts/setup-dev-env.sh` 设置开发环境
3. 运行 `npm run dev` 启动开发服务器

## 开发流程

请参考 [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) 了解详细的开发流程。

### 快速开始

1. 创建功能分支: `git checkout -b feature/your-feature-name`
2. 开发新功能
3. 运行验证脚本: `./scripts/validate-feature.sh`
4. 提交代码: `git commit -m "feat: your feature description"`
5. 创建Pull Request

## 代码规范

- 使用TypeScript
- 遵循ESLint规则
- 保持测试覆盖率 >= 80%
- 使用语义化提交信息

## 测试

- 单元测试: `npm run test`
- 集成测试: `npm run test:integration`
- E2E测试: `npm run test:e2e`

## 构建和部署

- 本地构建: `npm run build`
- 类型检查: `npm run type-check`
- 代码检查: `npm run lint`
EOF
        echo -e "${GREEN}✅ 创建 CONTRIBUTING.md${NC}"
    fi
}

# 验证安装
validate_installation() {
    echo -e "${BLUE}🔍 验证安装...${NC}"
    
    # 检查基本命令
    npm run lint --silent
    npm run type-check --silent
    npm run test -- --watchAll=false --passWithNoTests --silent
    npm run build --silent
    
    echo -e "${GREEN}✅ 安装验证成功${NC}"
}

# 显示后续步骤
show_next_steps() {
    echo -e "${GREEN}🎉 开发环境设置完成！${NC}"
    echo ""
    echo -e "${BLUE}📋 接下来你可以:${NC}"
    echo "1. 运行开发服务器: npm run dev"
    echo "2. 运行测试: npm run test"
    echo "3. 查看开发流程: cat DEVELOPMENT_WORKFLOW.md"
    echo "4. 开始开发新功能: git checkout -b feature/your-feature"
    echo ""
    echo -e "${YELLOW}📖 重要文档:${NC}"
    echo "- 开发工作流: DEVELOPMENT_WORKFLOW.md"
    echo "- 贡献指南: CONTRIBUTING.md"
    echo "- 项目文档: README.md"
    echo ""
    echo -e "${BLUE}🛠 有用的命令:${NC}"
    echo "- npm run check-all        # 运行所有检查"
    echo "- ./scripts/validate-feature.sh # 验证功能完整性"
    echo "- npm run test:watch       # 监视模式运行测试"
    echo "- npm run dev              # 启动开发服务器"
}

# 主执行流程
main() {
    echo -e "${BLUE}🏗 小宿AI助手 - 开发环境设置${NC}"
    echo ""
    
    check_node_version
    check_npm_version
    install_dependencies
    setup_git_hooks
    setup_env_files
    create_dev_docs
    validate_installation
    show_next_steps
}

# 运行主流程
main "$@"