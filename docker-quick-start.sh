#!/bin/bash
set -e

echo "🤖 SkyRouter AI 聊天机器人 - Docker 快速部署"
echo "============================================="

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    echo "安装指南: https://docs.docker.com/get-docker/"
    exit 1
fi

# 检查docker compose
if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装"
    echo "请安装Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker环境检查通过"

# 停止并清理旧容器
echo "🛑 清理旧容器和镜像..."
docker compose down --remove-orphans 2>/dev/null || docker-compose down --remove-orphans 2>/dev/null || true

# 清理悬空镜像（可选，节省空间）
echo "🧹 清理悬空镜像..."
docker image prune -f || true

# 构建并启动
echo "🏗️  构建并启动聊天机器人服务..."
if docker compose version &> /dev/null; then
    docker compose up --build -d
else
    docker-compose up --build -d
fi

# 等待服务启动
echo "⏳ 等待服务启动完成..."
sleep 20

# 检查健康状态
echo "🔍 检查服务健康状态..."
for i in {1..6}; do
    if curl -f http://localhost:80/api/health >/dev/null 2>&1; then
        echo "✅ 服务启动成功！"
        break
    else
        echo "⏳ 等待服务启动... ($i/6)"
        sleep 10
    fi
done

# 显示状态
echo "📊 容器状态:"
if docker compose version &> /dev/null; then
    docker compose ps
else
    docker-compose ps
fi

echo ""
echo "🎉 部署完成！"
echo "🌐 聊天机器人访问地址: http://localhost"
echo "📱 移动端访问: http://你的服务器IP"
echo ""
echo "📝 常用管理命令:"
echo "  查看实时日志: docker compose logs -f chatbot"
echo "  停止服务:     docker compose down"
echo "  重启服务:     docker compose restart"
echo "  查看状态:     docker compose ps"
echo "  进入容器:     docker compose exec chatbot sh"
echo ""
echo "🔧 故障排除:"
echo "  如果端口冲突，请修改 docker-compose.yml 中的端口映射"
echo "  如果访问失败，请检查防火墙设置"