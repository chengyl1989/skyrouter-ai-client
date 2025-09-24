#!/bin/bash
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 日志函数
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_step() { echo -e "${PURPLE}🔄 $1${NC}"; }

echo -e "${CYAN}"
echo "================================================================"
echo "🤖 SkyRouter AI 聊天机器人 - Docker 快速部署脚本 v1.1"
echo "================================================================"
echo -e "${NC}"

# 检查系统要求
log_step "检查系统环境..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    log_error "Docker未安装，请先安装Docker"
    echo "安装指南: https://docs.docker.com/get-docker/"
    exit 1
fi

# 检查Docker版本
DOCKER_VERSION=$(docker --version | grep -oE '[0-9]+\.[0-9]+' | head -1)
log_info "Docker版本: $DOCKER_VERSION"

# 检查docker compose
COMPOSE_CMD=""
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
    COMPOSE_VERSION=$(docker compose version --short)
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
    COMPOSE_VERSION=$(docker-compose version --short)
else
    log_error "Docker Compose未安装"
    echo "请安装Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

log_info "Docker Compose版本: $COMPOSE_VERSION"
log_success "Docker环境检查通过"

# 检查端口占用
log_step "检查端口占用情况..."
if lsof -i :80 &> /dev/null; then
    log_warning "端口80被占用，如果部署失败请修改docker-compose.yml中的端口映射"
else
    log_success "端口80可用"
fi

# 检查系统资源
log_step "检查系统资源..."
if command -v free &> /dev/null; then
    MEMORY=$(free -m | awk 'NR==2{print $2}')
    if [ $MEMORY -lt 1024 ]; then
        log_warning "系统内存较低 (${MEMORY}MB)，建议至少1GB内存"
    else
        log_success "系统内存充足 (${MEMORY}MB)"
    fi
fi

# 创建必要的目录
log_step "创建必要的目录..."
mkdir -p logs backups temp
log_success "目录创建完成"

# 停止并清理旧容器
log_step "清理旧容器和资源..."
$COMPOSE_CMD down --remove-orphans 2>/dev/null || true

# 备份旧数据（如果存在）
if docker volume ls | grep -q chatbot-data; then
    log_step "备份现有数据..."
    BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
    docker run --rm -v chatbot-data:/data -v $(pwd)/backups:/backup alpine \
        tar czf /backup/${BACKUP_NAME}.tar.gz -C /data . || true
    log_success "数据已备份到 backups/${BACKUP_NAME}.tar.gz"
fi

# 清理悬空镜像和容器
log_step "清理无用的Docker资源..."
docker container prune -f || true
docker image prune -f || true
docker network prune -f || true
log_success "资源清理完成"

# 构建前检查
log_step "检查构建依赖..."
if [ ! -f "package.json" ]; then
    log_error "package.json文件不存在，请确保在项目根目录执行此脚本"
    exit 1
fi

if [ ! -f "next.config.js" ]; then
    log_error "next.config.js文件不存在"
    exit 1
fi

if [ ! -f "Dockerfile" ]; then
    log_error "Dockerfile文件不存在"
    exit 1
fi

log_success "构建依赖检查通过"

# 构建并启动
log_step "构建并启动聊天机器人服务..."
echo "这可能需要几分钟时间，请耐心等待..."

# 显示构建进度
$COMPOSE_CMD up --build -d 2>&1 | while IFS= read -r line; do
    echo "   $line"
done

if [ $? -eq 0 ]; then
    log_success "容器构建和启动成功"
else
    log_error "容器启动失败，请检查错误信息"
    exit 1
fi

# 等待服务启动
log_step "等待服务启动完成..."
sleep 30

# 检查容器状态
log_step "检查容器运行状态..."
if ! $COMPOSE_CMD ps | grep -q "Up"; then
    log_error "容器未正常启动"
    echo "容器日志："
    $COMPOSE_CMD logs --tail=50 chatbot
    exit 1
fi

# 等待健康检查
log_step "等待健康检查通过..."
HEALTH_CHECK_COUNT=0
MAX_ATTEMPTS=12

while [ $HEALTH_CHECK_COUNT -lt $MAX_ATTEMPTS ]; do
    if curl -f -s http://localhost:80/api/health > /dev/null 2>&1; then
        log_success "服务健康检查通过！"
        break
    elif [ $HEALTH_CHECK_COUNT -eq $((MAX_ATTEMPTS - 1)) ]; then
        log_error "健康检查超时，服务可能未正常启动"
        echo "尝试访问: http://localhost:80"
        echo "容器状态："
        $COMPOSE_CMD ps
        echo "最近日志："
        $COMPOSE_CMD logs --tail=20 chatbot
        exit 1
    else
        HEALTH_CHECK_COUNT=$((HEALTH_CHECK_COUNT + 1))
        log_info "等待健康检查通过... ($HEALTH_CHECK_COUNT/$MAX_ATTEMPTS)"
        sleep 10
    fi
done

# 最终检查
log_step "执行最终检查..."
CONTAINER_STATUS=$($COMPOSE_CMD ps -q chatbot | xargs docker inspect --format='{{.State.Status}}')
if [ "$CONTAINER_STATUS" = "running" ]; then
    log_success "容器运行状态正常"
else
    log_warning "容器状态异常: $CONTAINER_STATUS"
fi

# 显示详细状态
echo ""
echo -e "${CYAN}📊 部署状态报告${NC}"
echo "================================"
$COMPOSE_CMD ps

# 显示资源使用情况
echo ""
echo -e "${CYAN}💾 资源使用情况${NC}"
echo "================================"
if command -v docker &> /dev/null; then
    echo "容器资源使用："
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null || echo "无法获取资源信息"
fi

echo ""
echo -e "${GREEN}"
echo "🎉🎉🎉 部署完成！🎉🎉🎉"
echo ""
echo "🌐 访问地址："
echo "   本地访问: http://localhost"
echo "   局域网访问: http://$(hostname -I | awk '{print $1}') (如果防火墙允许)"
echo ""
echo "📝 管理命令："
echo "   查看实时日志: $COMPOSE_CMD logs -f chatbot"
echo "   停止服务:     $COMPOSE_CMD down"
echo "   重启服务:     $COMPOSE_CMD restart chatbot"
echo "   查看状态:     $COMPOSE_CMD ps"
echo "   进入容器:     $COMPOSE_CMD exec chatbot sh"
echo "   查看资源:     docker stats"
echo ""
echo "🔧 故障排除："
echo "   查看详细日志: $COMPOSE_CMD logs --tail=100 chatbot"
echo "   重新构建:     $COMPOSE_CMD up --build -d"
echo "   完全重置:     $COMPOSE_CMD down -v && docker system prune -f"
echo ""
echo "📁 相关文件："
echo "   日志目录: ./logs/"
echo "   备份目录: ./backups/"
echo "   配置文件: ./docker-compose.yml"
echo -e "${NC}"

# 保存部署信息
cat > deployment-info.txt << EOF
SkyRouter AI 聊天机器人部署信息
==============================
部署时间: $(date)
Docker版本: $DOCKER_VERSION
Compose版本: $COMPOSE_VERSION
访问地址: http://localhost
容器名称: skyrouter-ai-chatbot

管理命令:
- 查看日志: $COMPOSE_CMD logs -f chatbot
- 停止服务: $COMPOSE_CMD down
- 重启服务: $COMPOSE_CMD restart chatbot
EOF

log_success "部署信息已保存到 deployment-info.txt"