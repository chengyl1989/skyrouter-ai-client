#!/bin/bash
set -e

# 设置终端颜色
green='\033[0;32m'
red='\033[0;31m'
yellow='\033[0;33m'
reset='\033[0m'

# 默认配置
DEFAULT_PORT=80
CURRENT_DIR="$(pwd)"

# 函数：显示帮助信息
display_help() {
    echo -e "${green}🤖 SkyRouter AI 聊天机器人 - Docker 快速部署${reset}"
    echo -e "${green}=============================================${reset}"
    echo "用法: $0 [选项]"
    echo "选项:"
    echo "  -h, --help              显示帮助信息"
    echo "  -p, --port <端口>       指定主机端口 (默认: $DEFAULT_PORT)"
    echo "  --restart               重启服务"
    echo "  --stop                  停止服务"
    echo "  --status                查看服务状态"
    echo "  --clean                 清理所有容器、镜像和数据"
    exit 0
}

# 函数：检查环境变量配置
check_env_config() {
    echo -e "${green}🔍 检查环境配置...${reset}"
    if [ ! -f ".env.local" ]; then
        echo -e "${yellow}⚠️  .env.local 文件不存在，使用默认配置或创建配置文件${reset}"
        echo -e "${yellow}建议：复制 .env.example 到 .env.local 并根据需要修改配置${reset}"
    else
        echo -e "${green}✅ 已检测到 .env.local 配置文件${reset}"
    fi
}

# 函数：检查Docker是否安装
check_docker() {
    echo -e "${green}🔍 检查Docker环境...${reset}"
    if ! command -v docker &> /dev/null; then
        echo -e "${red}❌ Docker未安装，请先安装Docker${reset}"
        echo "安装指南: https://docs.docker.com/get-docker/"
        exit 1
    fi

    # 检查docker compose
    if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
        echo -e "${red}❌ Docker Compose未安装${reset}"
        echo "请安装Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi

    # 检查Docker服务是否运行
    if ! docker info &> /dev/null; then
        echo -e "${red}❌ Docker服务未运行。请启动Docker服务。${reset}"
        exit 1
    fi

    echo -e "${green}✅ Docker环境检查通过${reset}"
}

# 函数：检查必要文件
check_required_files() {
    echo -e "${green}🔍 检查必要文件...${reset}"
    
    if [ ! -f "Dockerfile" ]; then
        echo -e "${red}❌ 未找到Dockerfile文件${reset}"
        echo -e "${yellow}请确保在项目根目录运行此脚本${reset}"
        exit 1
    fi
    
    if [ ! -f "docker-compose.yml" ]; then
        echo -e "${red}❌ 未找到docker-compose.yml文件${reset}"
        echo -e "${yellow}请确保在项目根目录运行此脚本${reset}"
        exit 1
    fi
    
    echo -e "${green}✅ 必要文件检查通过${reset}"
}

# 函数：修改端口配置
configure_port() {
    if [ "$PORT" != "$DEFAULT_PORT" ]; then
        echo -e "${green}🔧 配置端口映射: $PORT:3000${reset}"
        
        # 备份原有的docker-compose.yml
        if [ -f "docker-compose.yml.bak" ]; then
            rm -f "docker-compose.yml.bak"
        fi
        cp "docker-compose.yml" "docker-compose.yml.bak"
        
        # 修改端口映射
        sed "s/      - \"$DEFAULT_PORT:3000\"/      - \"$PORT:3000\"/g" "docker-compose.yml.bak" > "docker-compose.yml"
    fi
}

# 函数：停止并清理旧容器
cleanup_old_containers() {
    echo -e "${yellow}🛑 清理旧容器和镜像...${reset}"
    
    # 停止并移除旧容器
    if docker compose version &> /dev/null; then
        docker compose down --remove-orphans 2>/dev/null || true
    else
        docker-compose down --remove-orphans 2>/dev/null || true
    fi

    # 清理悬空镜像（可选，节省空间）
    echo -e "${yellow}🧹 清理悬空镜像...${reset}"
    docker image prune -f 2>/dev/null || true
}

# 函数：完全清理（容器、镜像、数据）
full_cleanup() {
    echo -e "${yellow}🧹 执行完全清理...${reset}"
    
    # 停止并移除容器
    if docker compose version &> /dev/null; then
        docker compose down -v --remove-orphans
    else
        docker-compose down -v --remove-orphans
    fi
    
    # 清理镜像
    echo -e "${yellow}🧹 清理容器镜像...${reset}"
    docker rmi skyrouter-ai-client-chatbot 2>/dev/null || true
    
    # 清理悬空镜像
    echo -e "${yellow}🧹 清理悬空镜像...${reset}"
    docker image prune -af
    
    # 清理悬空卷
    echo -e "${yellow}🧹 清理悬空卷...${reset}"
    docker volume prune -f
    
    echo -e "${green}✅ 完全清理完成${reset}"
}

# 函数：构建并启动服务
build_and_start() {
    echo -e "${green}🏗️  构建并启动聊天机器人服务...${reset}"
    if docker compose version &> /dev/null; then
        docker compose up --build -d
    else
        docker-compose up --build -d
    fi

    # 等待服务启动
    echo -e "${yellow}⏳ 等待服务启动完成...${reset}"
    sleep 20

    # 检查健康状态
    echo -e "${green}🔍 检查服务健康状态...${reset}"
    for i in {1..6}; do
        if curl -f http://localhost:$PORT/api/health >/dev/null 2>&1; then
            echo -e "${green}✅ 服务启动成功！${reset}"
            break
        else
            echo -e "${yellow}⏳ 等待服务启动... ($i/6)${reset}"
            sleep 10
        fi
    done

    # 显示状态
    echo -e "${green}📊 容器状态:${reset}"
    if docker compose version &> /dev/null; then
        docker compose ps
    else
        docker-compose ps
    fi
}

# 函数：重启服务
restart_service() {
    echo -e "${green}🔄 重启聊天机器人服务...${reset}"
    if docker compose version &> /dev/null; then
        docker compose restart
    else
        docker-compose restart
    fi
    echo -e "${green}✅ 服务重启成功！${reset}"
}

# 函数：停止服务
stop_service() {
    echo -e "${yellow}🛑 停止聊天机器人服务...${reset}"
    if docker compose version &> /dev/null; then
        docker compose down
    else
        docker-compose down
    fi
    echo -e "${green}✅ 服务已停止${reset}"
}

# 函数：显示服务状态
show_status() {
    echo -e "${green}📊 聊天机器人服务状态:${reset}"
    if docker compose version &> /dev/null; then
        docker compose ps
    else
        docker-compose ps
    fi
}

# 函数：显示完成信息
display_completion_info() {
    echo ""
    echo -e "${green}🎉 部署完成！${reset}"
    echo -e "${green}🌐 聊天机器人访问地址: http://localhost:$PORT${reset}"
    echo -e "${green}📱 移动端访问: http://你的服务器IP:$PORT${reset}"
    echo ""
    echo -e "${green}📝 常用管理命令:${reset}"
    echo "  查看实时日志: docker compose logs -f chatbot"
    echo "  停止服务:     docker compose down"
    echo "  重启服务:     docker compose restart"
    echo "  查看状态:     docker compose ps"
    echo "  进入容器:     docker compose exec chatbot sh"
    echo ""
    echo -e "${green}🔧 故障排除:${reset}"
    echo "  如果端口冲突，请使用 -p 参数指定其他端口"
    echo "  如果访问失败，请检查防火墙设置"
    echo "  如需完全清理环境，请使用 --clean 参数"
}

# 解析命令行参数
PORT=$DEFAULT_PORT
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help) display_help;;
        -p|--port) PORT="$2"; shift 2;;
        --restart) RESTART=true; shift;;
        --stop) STOP=true; shift;;
        --status) STATUS=true; shift;;
        --clean) CLEAN=true; shift;;
        *) echo -e "${red}未知选项: $1${reset}"; display_help;;
    esac
done

# 主逻辑

# 处理特殊命令
if [ "$STATUS" = true ]; then
    show_status
    exit 0
fi

if [ "$STOP" = true ]; then
    stop_service
    exit 0
fi

if [ "$RESTART" = true ]; then
    restart_service
    exit 0
fi

if [ "$CLEAN" = true ]; then
    full_cleanup
    exit 0
fi

# 普通部署流程
check_docker
check_required_files
check_env_config
configure_port
cleanup_old_containers
build_and_start
display_completion_info