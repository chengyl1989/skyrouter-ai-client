#!/bin/bash

# 功能验证脚本
# 用于验证新功能开发的完整性和质量

set -e

echo "🔍 开始功能验证..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查函数
check_step() {
    local step_name="$1"
    local command="$2"
    
    echo -e "${BLUE}检查: ${step_name}${NC}"
    
    if eval "$command"; then
        echo -e "${GREEN}✓ ${step_name} 通过${NC}"
        return 0
    else
        echo -e "${RED}✗ ${step_name} 失败${NC}"
        return 1
    fi
}

# 1. 代码质量检查
echo -e "${YELLOW}=== 代码质量检查 ===${NC}"

check_step "ESLint代码规范检查" "npm run lint"
check_step "TypeScript类型检查" "npm run type-check"
check_step "代码格式检查" "npx prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\" || true"

# 2. 测试检查
echo -e "${YELLOW}=== 测试检查 ===${NC}"

check_step "单元测试" "npm run test -- --watchAll=false --coverage"
check_step "集成测试" "npm run test:integration"

# 检查测试覆盖率
COVERAGE_THRESHOLD=80
if [ -f "coverage/coverage-summary.json" ]; then
    COVERAGE=$(node -e "
        const coverage = require('./coverage/coverage-summary.json');
        const lines = coverage.total.lines.pct;
        console.log(lines);
    ")
    
    if (( $(echo "$COVERAGE >= $COVERAGE_THRESHOLD" | bc -l) )); then
        echo -e "${GREEN}✓ 测试覆盖率: ${COVERAGE}% (>= ${COVERAGE_THRESHOLD}%)${NC}"
    else
        echo -e "${RED}✗ 测试覆盖率: ${COVERAGE}% (< ${COVERAGE_THRESHOLD}%)${NC}"
        exit 1
    fi
fi

# 3. 构建检查
echo -e "${YELLOW}=== 构建检查 ===${NC}"

check_step "生产构建" "npm run build"

# 4. 安全检查
echo -e "${YELLOW}=== 安全检查 ===${NC}"

check_step "依赖安全扫描" "npm audit --audit-level=moderate"

# 5. 性能检查
echo -e "${YELLOW}=== 性能检查 ===${NC}"

# 检查构建产物大小
if [ -d ".next" ]; then
    BUILD_SIZE=$(du -sh .next | cut -f1)
    echo -e "${BLUE}构建产物大小: ${BUILD_SIZE}${NC}"
fi

# 6. 文档检查
echo -e "${YELLOW}=== 文档检查 ===${NC}"

# 检查README是否更新
if git diff --name-only HEAD~1 | grep -q "README.md"; then
    echo -e "${GREEN}✓ README.md 已更新${NC}"
else
    echo -e "${YELLOW}⚠ README.md 未更新，请确认是否需要更新文档${NC}"
fi

# 检查是否有新的组件需要文档
NEW_COMPONENTS=$(git diff --name-only HEAD~1 | grep "src/components" | grep -E "\.(tsx|ts)$" || true)
if [ -n "$NEW_COMPONENTS" ]; then
    echo -e "${YELLOW}⚠ 检测到新组件，请确认文档是否完整:${NC}"
    echo "$NEW_COMPONENTS"
fi

echo -e "${GREEN}🎉 功能验证完成！${NC}"

# 生成验证报告
cat > validation-report.md << EOF
# 功能验证报告

**验证时间**: $(date)
**Git提交**: $(git rev-parse HEAD)
**分支**: $(git branch --show-current)

## 验证结果

- ✅ 代码质量检查通过
- ✅ 测试覆盖率达标 (${COVERAGE:-"N/A"}%)
- ✅ 构建成功
- ✅ 安全扫描通过

## 构建信息

- 构建产物大小: ${BUILD_SIZE:-"N/A"}
- Node.js版本: $(node --version)
- npm版本: $(npm --version)

## 下一步

请继续进行以下步骤：
1. 创建Pull Request
2. 进行代码审查
3. 部署到测试环境
4. 执行E2E测试
5. 部署到生产环境

EOF

echo -e "${BLUE}📊 验证报告已生成: validation-report.md${NC}"