# SkyRouter AI 聊天机器人 - Docker 部署指南

## 🚀 一键快速部署

### 前提条件
- 安装 Docker (>= 20.10)
- 安装 Docker Compose (>= 2.0)
- 至少 2GB 可用内存
- 端口 80 可用

### 快速启动

```bash
# 1. 克隆项目（如果还没有）
git clone <你的项目地址>
cd chatbot

# 2. 给启动脚本添加执行权限
chmod +x docker-quick-start.sh

# 3. 一键部署
./docker-quick-start.sh
```

部署完成后，访问 `http://localhost` 即可使用聊天机器人！

## 📁 Docker 文件说明

- `Dockerfile` - 应用容器构建文件
- `docker-compose.yml` - 服务编排配置
- `docker-quick-start.sh` - 一键部署脚本
- `.dockerignore` - Docker构建时忽略的文件

## 🛠️ 手动部署步骤

如果不使用一键脚本，也可以手动执行：

```bash
# 1. 构建镜像
docker compose build

# 2. 启动服务
docker compose up -d

# 3. 查看状态
docker compose ps

# 4. 查看日志
docker compose logs -f chatbot
```

## 📊 服务管理命令

```bash
# 查看容器状态
docker compose ps

# 查看实时日志
docker compose logs -f chatbot

# 重启服务
docker compose restart

# 停止服务
docker compose down

# 重新构建并启动
docker compose up --build -d

# 进入容器内部
docker compose exec chatbot sh

# 清理所有容器和镜像
docker compose down --remove-orphans
docker system prune -af
```

## 🔧 配置自定义

### 修改端口
编辑 `docker-compose.yml` 文件：
```yaml
ports:
  - "8080:3000"  # 将外部端口改为8080（容器内部仍使用3000）
```

### 环境变量
在 `docker-compose.yml` 中添加环境变量：
```yaml
environment:
  - NODE_ENV=production
  - API_ENDPOINT=https://your-api-endpoint.com
  - PORT=3000
```

### 数据持久化
如需持久化数据，取消注释 `docker-compose.yml` 中的 volumes 部分。

## 🐛 故障排除

### 端口冲突
```bash
# 检查端口占用
lsof -i :80

# 或者修改docker-compose.yml中的端口映射
```

### 构建失败
```bash
# 清理Docker缓存重新构建
docker builder prune -af
docker compose build --no-cache
```

### 内存不足
```bash
# 检查系统资源
docker system df
docker system prune -af
```

### 服务无法访问
1. 检查防火墙设置
2. 确认端口映射正确
3. 查看容器日志排查错误

## 📈 生产环境部署建议

1. **反向代理**: 使用 Nginx 或 Traefik
2. **HTTPS**: 配置 SSL/TLS 证书
3. **监控**: 添加健康检查和日志收集
4. **备份**: 定期备份重要数据
5. **更新**: 建立CI/CD流程

## 🔒 安全建议

1. 不要在生产环境暴露容器端口到公网
2. 使用非root用户运行容器
3. 定期更新基础镜像
4. 配置适当的防火墙规则

## 📞 技术支持

如遇到问题，请：
1. 查看容器日志: `docker compose logs -f chatbot`
2. 检查容器状态: `docker compose ps`
3. 提交Issue并附上错误日志