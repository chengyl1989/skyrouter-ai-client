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
echo "🚀 SkyRouter AI 聊天机器人 - 生产环境部署脚本 v1.0"
echo "================================================================"
echo -e "${NC}"

# 检查是否为root用户
if [[ $EUID -eq 0 ]]; then
   log_warning "不建议以root用户运行此脚本"
   read -p "是否继续? (y/N): " -n 1 -r
   echo
   if [[ ! $REPLY =~ ^[Yy]$ ]]; then
       exit 1
   fi
fi

# 读取配置
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env"
BACKUP_DIR="./backups"
LOG_DIR="./logs"

# 检查必要文件
log_step "检查部署文件..."
required_files=("$COMPOSE_FILE" "Dockerfile" "package.json")
for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        log_error "缺少必要文件: $file"
        exit 1
    fi
done

# 检查环境变量文件
if [[ ! -f "$ENV_FILE" ]]; then
    log_warning "未找到 $ENV_FILE 文件"
    if [[ -f ".env.example" ]]; then
        log_info "发现 .env.example 文件，正在复制..."
        cp .env.example $ENV_FILE
        log_warning "请编辑 $ENV_FILE 文件配置生产环境变量"
        read -p "按Enter键继续..." -r
    else
        log_error "请创建 $ENV_FILE 文件"
        exit 1
    fi
fi

log_success "文件检查完成"

# 检查Docker环境
log_step "检查Docker环境..."
if ! command -v docker &> /dev/null; then
    log_error "Docker未安装"
    exit 1
fi

COMPOSE_CMD=""
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    log_error "Docker Compose未安装"
    exit 1
fi

log_success "Docker环境检查通过"

# 创建必要目录
log_step "创建目录结构..."
mkdir -p "$BACKUP_DIR" "$LOG_DIR" config nginx/ssl nginx/logs temp

# 设置权限
chmod 755 "$BACKUP_DIR" "$LOG_DIR"
chmod 700 config nginx/ssl

log_success "目录创建完成"

# 备份现有数据
if docker volume ls | grep -q skyrouter-chatbot-data; then
    log_step "备份现有数据..."
    BACKUP_FILE="$BACKUP_DIR/production_backup_$(date +%Y%m%d_%H%M%S).tar.gz"

    docker run --rm \
        -v skyrouter-chatbot-data:/data:ro \
        -v "$(pwd)/$BACKUP_DIR":/backup \
        alpine tar czf "/backup/$(basename $BACKUP_FILE)" -C /data .

    log_success "数据已备份到 $BACKUP_FILE"
fi

# 停止现有服务
log_step "停止现有服务..."
$COMPOSE_CMD -f "$COMPOSE_FILE" down --remove-orphans || true

# 清理旧资源
log_step "清理Docker资源..."
docker system prune -f
docker volume prune -f

# 构建和部署
log_step "构建并部署生产服务..."
$COMPOSE_CMD -f "$COMPOSE_FILE" up --build -d

# 等待服务启动
log_step "等待服务启动..."
sleep 60

# 健康检查
log_step "健康检查..."
HEALTH_CHECK_COUNT=0
MAX_ATTEMPTS=20

while [ $HEALTH_CHECK_COUNT -lt $MAX_ATTEMPTS ]; do
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health || echo "000")

    if [ "$HTTP_STATUS" = "200" ]; then
        log_success "健康检查通过！"
        break
    elif [ $HEALTH_CHECK_COUNT -eq $((MAX_ATTEMPTS - 1)) ]; then
        log_error "健康检查失败"
        echo "容器状态："
        $COMPOSE_CMD -f "$COMPOSE_FILE" ps
        echo "容器日志："
        $COMPOSE_CMD -f "$COMPOSE_FILE" logs --tail=50 chatbot
        exit 1
    else
        HEALTH_CHECK_COUNT=$((HEALTH_CHECK_COUNT + 1))
        log_info "等待服务启动... ($HEALTH_CHECK_COUNT/$MAX_ATTEMPTS) HTTP:$HTTP_STATUS"
        sleep 15
    fi
done

# 最终检查
log_step "最终状态检查..."
echo "容器状态："
$COMPOSE_CMD -f "$COMPOSE_FILE" ps

echo "服务端口："
netstat -tlnp | grep :80 || echo "端口80未监听"

echo "磁盘使用："
df -h

echo "内存使用："
free -h

# 生成部署报告
DEPLOY_REPORT="deployment-report-$(date +%Y%m%d_%H%M%S).txt"
cat > "$DEPLOY_REPORT" << EOF
SkyRouter AI 聊天机器人生产部署报告
====================================
部署时间: $(date)
部署环境: 生产环境
Docker版本: $(docker --version)
Compose文件: $COMPOSE_FILE

容器状态:
$($COMPOSE_CMD -f "$COMPOSE_FILE" ps)

系统资源:
CPU: $(nproc) 核心
内存: $(free -h | awk 'NR==2{print $2}')
磁盘: $(df -h / | awk 'NR==2{print $2}')

网络配置:
端口映射: 80:3000
健康检查: http://localhost/api/health

日志位置:
应用日志: $LOG_DIR/
容器日志: docker logs skyrouter-ai-chatbot

管理命令:
查看状态: $COMPOSE_CMD -f $COMPOSE_FILE ps
查看日志: $COMPOSE_CMD -f $COMPOSE_FILE logs -f chatbot
重启服务: $COMPOSE_CMD -f $COMPOSE_FILE restart chatbot
停止服务: $COMPOSE_CMD -f $COMPOSE_FILE down
EOF

log_success "部署报告已保存到 $DEPLOY_REPORT"

echo ""
echo -e "${GREEN}"
echo "🎉🎉🎉 生产环境部署完成！🎉🎉🎉"
echo ""
echo "🌐 访问信息："
echo "   服务地址: http://$(hostname -I | awk '{print $1}')"
echo "   健康检查: http://$(hostname -I | awk '{print $1}')/api/health"
echo ""
echo "📊 监控信息："
echo "   查看状态: $COMPOSE_CMD -f $COMPOSE_FILE ps"
echo "   实时日志: $COMPOSE_CMD -f $COMPOSE_FILE logs -f chatbot"
echo "   资源使用: docker stats"
echo ""
echo "🔧 管理命令："
echo "   重启服务: $COMPOSE_CMD -f $COMPOSE_FILE restart"
echo "   停止服务: $COMPOSE_CMD -f $COMPOSE_FILE down"
echo "   更新服务: $COMPOSE_CMD -f $COMPOSE_FILE up --build -d"
echo ""
echo "📁 重要目录："
echo "   日志目录: $LOG_DIR/"
echo "   备份目录: $BACKUP_DIR/"
echo "   配置目录: ./config/"
echo ""
echo "⚠️  生产环境注意事项："
echo "   1. 定期备份数据卷"
echo "   2. 监控系统资源使用"
echo "   3. 检查日志文件大小"
echo "   4. 配置SSL证书（如需要）"
echo "   5. 设置防火墙规则"
echo -e "${NC}"

# 可选：启动监控
read -p "是否启用监控和Nginx代理? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_step "启用扩展服务..."
    $COMPOSE_CMD -f "$COMPOSE_FILE" --profile with-monitoring --profile with-nginx up -d
    log_success "扩展服务已启用"
fi

log_success "部署完成！请检查服务状态并进行必要的配置调整。"