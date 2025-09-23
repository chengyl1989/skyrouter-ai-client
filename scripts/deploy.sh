#!/bin/bash

# 部署脚本
# 支持多环境部署 (staging, production)

set -e

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 显示使用说明
show_usage() {
    cat << EOF
使用方法: $0 [环境] [选项]

环境:
  staging     部署到测试环境
  production  部署到生产环境

选项:
  --dry-run   模拟部署，不执行实际操作
  --force     强制部署，跳过确认
  --help      显示此帮助信息

示例:
  $0 staging
  $0 production --dry-run
  $0 production --force
EOF
}

# 解析命令行参数
ENVIRONMENT=""
DRY_RUN=false
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        staging|production)
            ENVIRONMENT="$1"
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            echo -e "${RED}❌ 未知参数: $1${NC}"
            show_usage
            exit 1
            ;;
    esac
done

# 检查必需参数
if [ -z "$ENVIRONMENT" ]; then
    echo -e "${RED}❌ 请指定部署环境${NC}"
    show_usage
    exit 1
fi

# 环境配置
case $ENVIRONMENT in
    staging)
        DEPLOY_URL="http://localhost"
        DOCKER_TAG="staging"
        HEALTH_CHECK_URL="$DEPLOY_URL/api/health"
        ;;
    production)
        DEPLOY_URL="http://localhost"
        DOCKER_TAG="latest"
        HEALTH_CHECK_URL="$DEPLOY_URL/api/health"
        ;;
esac

echo -e "${BLUE}🚀 开始部署到 ${ENVIRONMENT} 环境${NC}"
echo "目标URL: $DEPLOY_URL"

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}⚠️  这是模拟运行，不会执行实际部署${NC}"
fi

# 确认部署
if [ "$FORCE" != true ] && [ "$DRY_RUN" != true ]; then
    echo -e "${YELLOW}⚠️  确认要部署到 ${ENVIRONMENT} 环境吗？ (y/N)${NC}"
    read -r CONFIRM
    if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
        echo "部署已取消"
        exit 0
    fi
fi

# 预部署检查
echo -e "${BLUE}🔍 执行预部署检查...${NC}"

# 检查Git状态
if [ "$ENVIRONMENT" = "production" ]; then
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" != "main" ]; then
        echo -e "${RED}❌ 生产环境只能从main分支部署，当前分支: $CURRENT_BRANCH${NC}"
        exit 1
    fi
    
    # 检查是否有未提交的更改
    if ! git diff-index --quiet HEAD --; then
        echo -e "${RED}❌ 存在未提交的更改，请先提交所有更改${NC}"
        exit 1
    fi
fi

# 运行测试和构建
if [ "$DRY_RUN" != true ]; then
    echo -e "${BLUE}🧪 运行测试...${NC}"
    npm run test -- --watchAll=false --coverage
    
    echo -e "${BLUE}🔧 运行构建...${NC}"
    npm run build
    
    echo -e "${BLUE}🔍 安全扫描...${NC}"
    npm run security-audit
fi

# Docker构建和推送
build_and_push_docker() {
    local tag="$1"
    
    echo -e "${BLUE}🐳 构建Docker镜像...${NC}"
    
    if [ "$DRY_RUN" = true ]; then
        echo "[DRY RUN] docker build -t skyrouter-ai-client:$tag ."
        echo "[DRY RUN] docker push skyrouter-ai-client:$tag"
        return
    fi
    
    docker build -t skyrouter-ai-client:$tag .
    
    # 推送到镜像仓库（如果配置了）
    if [ -n "$DOCKER_REGISTRY" ]; then
        docker tag skyrouter-ai-client:$tag $DOCKER_REGISTRY/skyrouter-ai-client:$tag
        docker push $DOCKER_REGISTRY/skyrouter-ai-client:$tag
    fi
}

# 执行部署
deploy_application() {
    echo -e "${BLUE}📦 部署应用...${NC}"
    
    if [ "$DRY_RUN" = true ]; then
        echo "[DRY RUN] 部署到 $ENVIRONMENT 环境"
        echo "[DRY RUN] 使用镜像: skyrouter-ai-client:$DOCKER_TAG"
        return
    fi
    
    case $ENVIRONMENT in
        staging)
            # 测试环境部署逻辑
            echo "部署到测试环境..."
            # 停止现有容器
            docker-compose -f docker-compose.yml down || true
            # 使用docker-compose部署
            docker-compose -f docker-compose.yml up -d --build
            ;;
        production)
            # 生产环境部署逻辑
            echo "部署到生产环境..."
            # 停止现有容器
            docker stop skyrouter-ai-chatbot || true
            docker rm skyrouter-ai-chatbot || true
            # 运行新容器
            docker run -d \
              --name skyrouter-ai-chatbot \
              -p 80:3000 \
              --restart unless-stopped \
              skyrouter-ai-client:$DOCKER_TAG
            ;;
    esac
}

# 健康检查
health_check() {
    echo -e "${BLUE}🏥 执行健康检查...${NC}"
    
    if [ "$DRY_RUN" = true ]; then
        echo "[DRY RUN] 健康检查: $HEALTH_CHECK_URL"
        return
    fi
    
    # 等待服务启动
    sleep 30
    
    # 检查服务健康状态
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo "健康检查尝试 $attempt/$max_attempts"
        
        if curl -f -s "$HEALTH_CHECK_URL" > /dev/null; then
            echo -e "${GREEN}✅ 服务健康检查通过${NC}"
            return 0
        fi
        
        echo "健康检查失败，等待重试..."
        sleep 10
        ((attempt++))
    done
    
    echo -e "${RED}❌ 健康检查失败，部署可能有问题${NC}"
    return 1
}

# 回滚函数
rollback() {
    echo -e "${YELLOW}🔄 执行回滚...${NC}"
    
    if [ "$DRY_RUN" = true ]; then
        echo "[DRY RUN] 回滚到上一版本"
        return
    fi
    
    # 这里添加回滚逻辑
    case $ENVIRONMENT in
        staging)
            echo "回滚测试环境..."
            # 停止当前容器并启动之前的版本
            docker-compose -f docker-compose.yml down
            docker run -d \
              --name skyrouter-ai-chatbot \
              -p 80:3000 \
              --restart unless-stopped \
              skyrouter-ai-client:previous || \
            docker run -d \
              --name skyrouter-ai-chatbot \
              -p 80:3000 \
              --restart unless-stopped \
              skyrouter-ai-client:latest
            ;;
        production)
            echo "回滚生产环境..."
            # 停止当前容器
            docker stop skyrouter-ai-chatbot || true
            docker rm skyrouter-ai-chatbot || true
            # 启动之前的版本
            docker run -d \
              --name skyrouter-ai-chatbot \
              -p 80:3000 \
              --restart unless-stopped \
              skyrouter-ai-client:previous || \
            docker run -d \
              --name skyrouter-ai-chatbot \
              -p 80:3000 \
              --restart unless-stopped \
              skyrouter-ai-client:latest
            ;;
    esac
}

# 部署后通知
send_notification() {
    local status="$1"
    local message="$2"
    
    echo -e "${BLUE}📢 发送部署通知...${NC}"
    
    if [ "$DRY_RUN" = true ]; then
        echo "[DRY RUN] 通知: $message"
        return
    fi
    
    # 这里可以添加通知逻辑，例如发送到Slack、钉钉等
    # curl -X POST -H 'Content-type: application/json' \
    #   --data "{\"text\":\"$message\"}" \
    #   "$SLACK_WEBHOOK_URL"
    
    echo "部署通知: $message"
}

# 生成部署报告
generate_report() {
    local status="$1"
    local start_time="$2"
    local end_time="$3"
    
    cat > "deploy-report-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).md" << EOF
# 部署报告

**环境**: $ENVIRONMENT
**时间**: $(date)
**状态**: $status
**Git提交**: $(git rev-parse HEAD)
**分支**: $(git branch --show-current)
**部署用时**: $((end_time - start_time))秒

## 部署信息

- 目标URL: $DEPLOY_URL
- Docker标签: $DOCKER_TAG
- 健康检查URL: $HEALTH_CHECK_URL

## 验证步骤

- [ ] 应用正常启动
- [ ] 健康检查通过
- [ ] 核心功能测试
- [ ] 性能监控检查

EOF
}

# 主部署流程
main() {
    local start_time=$(date +%s)
    local status="失败"
    
    trap 'handle_error $?' EXIT
    
    # 构建和推送
    build_and_push_docker "$DOCKER_TAG"
    
    # 部署应用
    deploy_application
    
    # 健康检查
    if health_check; then
        status="成功"
        echo -e "${GREEN}🎉 部署成功完成！${NC}"
        send_notification "success" "✅ $ENVIRONMENT 环境部署成功"
    else
        echo -e "${RED}❌ 部署失败，开始回滚...${NC}"
        rollback
        send_notification "failed" "❌ $ENVIRONMENT 环境部署失败，已执行回滚"
        exit 1
    fi
    
    local end_time=$(date +%s)
    generate_report "$status" "$start_time" "$end_time"
    
    echo -e "${BLUE}📊 部署报告已生成${NC}"
    echo -e "${GREEN}🔗 应用地址: $DEPLOY_URL${NC}"
}

# 错误处理
handle_error() {
    local exit_code=$1
    if [ $exit_code -ne 0 ]; then
        echo -e "${RED}❌ 部署过程中发生错误${NC}"
        send_notification "error" "⚠️ $ENVIRONMENT 环境部署过程中发生错误"
    fi
}

# 运行主流程
main "$@"