# SkyRouter AI Chatbot 部署指南

## 🚀 一键Docker部署

### 前置要求
- Linux服务器 (Ubuntu 20.04+ 推荐)
- Docker 20.10+
- Docker Compose 2.0+
- 至少2GB RAM
- 至少10GB硬盘空间

### 快速部署

1. **下载项目**
```bash
git clone <your-repo-url>
cd chatbot
```

2. **运行一键部署脚本**
```bash
chmod +x deploy.sh
./deploy.sh
```

3. **访问应用**
打开浏览器访问: `http://your-server-ip`

### 部署脚本命令

```bash
./deploy.sh          # 一键部署
./deploy.sh stop     # 停止服务
./deploy.sh restart  # 重启服务
./deploy.sh logs     # 查看日志
./deploy.sh status   # 查看状态
./deploy.sh clean    # 清理所有资源
./deploy.sh help     # 显示帮助
```

## 🛠️ 手动部署

### 1. 构建镜像
```bash
docker-compose build
```

### 2. 启动服务
```bash
docker-compose up -d
```

### 3. 查看日志
```bash
docker-compose logs -f
```

### 4. 停止服务
```bash
docker-compose down
```

## 🔧 配置说明

### 环境变量
- `NODE_ENV`: 运行环境 (production)
- `PORT`: 应用端口 (3000)

### 端口配置
- 外部访问端口: 80
- 容器内部端口: 3000
- 可在 `docker-compose.yml` 中修改端口映射

### 健康检查
应用包含健康检查机制，会自动检测服务状态并重启异常容器。

## 📊 监控和维护

### 查看容器状态
```bash
docker-compose ps
```

### 查看资源使用
```bash
docker stats
```

### 更新应用
```bash
./deploy.sh clean  # 清理旧版本
./deploy.sh        # 重新部署
```

## 🔒 安全建议

1. **反向代理**: 建议使用Nginx作为反向代理
2. **HTTPS**: 配置SSL证书
3. **防火墙**: 限制端口访问
4. **定期更新**: 保持Docker镜像最新

### Nginx配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🐛 故障排除

### 常见问题

1. **端口占用**
```bash
sudo lsof -i :80
sudo kill -9 <PID>
```

2. **Docker权限问题**
```bash
sudo usermod -aG docker $USER
newgrp docker
```

3. **磁盘空间不足**
```bash
docker system prune -a -f
```

4. **查看详细日志**
```bash
./deploy.sh logs
```

### 服务重启
如果服务异常，可以重启:
```bash
./deploy.sh restart
```

## 📈 性能优化

1. **资源限制**: 在docker-compose.yml中设置内存和CPU限制
2. **缓存优化**: 启用浏览器缓存
3. **CDN**: 使用CDN加速静态资源

## 🔄 备份和恢复

### 备份配置
```bash
# 备份用户数据 (如果有数据库)
docker exec container_name mysqldump -u root -p database > backup.sql
```

### 数据恢复
```bash
# 恢复数据
docker exec -i container_name mysql -u root -p database < backup.sql
```

## 📞 技术支持

如遇问题，请查看:
1. 应用日志: `./deploy.sh logs`
2. Docker日志: `docker-compose logs`
3. 系统日志: `journalctl -u docker`

---

**部署成功后访问 http://your-server 开始使用 SkyRouter AI Chatbot!**