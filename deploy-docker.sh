#!/bin/bash

# SkyRouter AI Client 一键部署脚本
# 使用Docker部署应用到80端口

# 颜色定义
green='\033[0;32m'
red='\033[0;31m'
yellow='\033[0;33m'
reset='\033[0m'

# 配置选项
GITHUB_REPO="https://github.com/chengyl1989/skyrouter-ai-client.git"
PROJECT_DIR="skyrouter-ai-client"
CONTAINER_NAME="skyrouter-ai-chatbot"
PORT=80
IMAGE_NAME="skyrouter-ai-client"

# 函数：显示帮助信息
display_help() {
    echo -e "${green}SkyRouter AI Client 一键部署脚本${reset}"
    echo "用法: $0 [选项]"
    echo "选项:"
    echo "  -h, --help              显示帮助信息"
    echo "  -r, --repo <仓库URL>    指定GitHub仓库URL (默认: $GITHUB_REPO)"
    echo "  -d, --dir <目录名>      指定项目目录 (默认: $PROJECT_DIR)"
    echo "  -n, --name <容器名>     指定容器名称 (默认: $CONTAINER_NAME)"
    echo "  -p, --port <端口>       指定主机端口 (默认: $PORT)"
    echo "  --update                更新现有部署"
    echo "  --remove                移除部署"
    exit 0
}

# 函数：检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${red}错误：Docker未安装。请先安装Docker。${reset}"
        echo "安装Docker指南：https://docs.docker.com/engine/install/"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        echo -e "${red}错误：docker-compose未安装。请先安装docker-compose。${reset}"
        echo "安装docker-compose指南：https://docs.docker.com/compose/install/"
        exit 1
    fi

    # 检查Docker服务是否运行
    if ! docker info &> /dev/null; then
        echo -e "${red}错误：Docker服务未运行。请启动Docker服务。${reset}"
        exit 1
    fi
}

# 函数：克隆或更新代码
clone_or_update_code() {
    if [ -d "$PROJECT_DIR" ]; then
        echo -e "${yellow}项目目录已存在，正在更新代码...${reset}"
        cd "$PROJECT_DIR"
        git pull || {
            echo -e "${red}更新代码失败，请检查网络连接或仓库权限。${reset}"
            exit 1
        }
        cd ..
    else
        echo -e "${green}正在克隆代码仓库...${reset}"
        git clone "$GITHUB_REPO" "$PROJECT_DIR" || {
            echo -e "${red}克隆代码失败，请检查网络连接或仓库URL。${reset}"
            exit 1
        }
    fi
}

# 函数：构建并运行Docker容器
deploy() {
    echo -e "${green}正在部署应用...${reset}"
    cd "$PROJECT_DIR"

    # 备份原有的docker-compose.yml（如果有自定义修改）
    if [ -f "docker-compose.yml.bak" ]; then
        rm -f "docker-compose.yml.bak"
    fi
    if [ -f "docker-compose.yml" ]; then
        cp "docker-compose.yml" "docker-compose.yml.bak"
    fi

    # 使用sed修改docker-compose.yml中的端口配置
    if [ -f "docker-compose.yml.bak" ]; then
        sed -e "s/ports:/# ports:/g" -e "s/  - ".*:3000"/  - "$PORT:3000"/g" "docker-compose.yml.bak" > "docker-compose.yml"
    fi

    # 停止并移除旧容器（如果存在）
    if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
        echo -e "${yellow}停止并移除现有容器...${reset}"
        docker-compose down || {
            echo -e "${red}停止容器失败，请手动停止。${reset}"
            exit 1
        }
    fi

    # 构建并运行新容器
    echo -e "${green}构建并启动容器...${reset}"
    docker-compose up -d --build || {
        echo -e "${red}构建或启动容器失败，请检查错误信息。${reset}"
        exit 1
    }

    # 显示部署结果
    echo -e "${green}\n部署成功！\n${reset}"
    echo "应用已部署到 http://localhost:$PORT"
    echo -e "${yellow}提示：请确保服务器的防火墙已开放$PORT端口。${reset}"
    echo "查看容器状态：docker-compose ps"
    echo "查看容器日志：docker-compose logs -f"
    echo "停止应用：docker-compose down"
    echo "启动应用：docker-compose up -d"
}

# 函数：移除部署
remove_deployment() {
    if [ -d "$PROJECT_DIR" ]; then
        echo -e "${yellow}正在移除部署...${reset}"
        cd "$PROJECT_DIR"
        if docker-compose down; then
            cd ..
            echo -e "${green}已停止并移除容器。${reset}"
            read -p "是否删除项目代码目录? (y/n): " answer
            if [[ $answer == [Yy]* ]]; then
                rm -rf "$PROJECT_DIR"
                echo -e "${green}已删除项目代码目录。${reset}"
            fi
        else
            echo -e "${red}移除容器失败，请手动清理。${reset}"
            exit 1
        fi
    else
        echo -e "${yellow}未找到项目目录，无需移除。${reset}"
    fi
    exit 0
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -h|--help)
            display_help
            ;;
        -r|--repo)
            GITHUB_REPO="$2"
            shift
            shift
            ;;
        -d|--dir)
            PROJECT_DIR="$2"
            shift
            shift
            ;;
        -n|--name)
            CONTAINER_NAME="$2"
            shift
            shift
            ;;
        -p|--port)
            PORT="$2"
            shift
            shift
            ;;
        --update)
            ACTION="update"
            shift
            ;;
        --remove)
            remove_deployment
            ;;
        *)
            echo -e "${red}未知选项: $key${reset}"
            display_help
            ;;
    esac
done

# 执行部署流程
check_docker
clone_or_update_code
deploy