# SkyRouter AI Client 部署指南

## 一键部署脚本使用说明

本项目提供了一个一键部署脚本 `deploy-docker.sh`，可以帮助您在远程服务器上快速部署应用。以下是详细的使用说明：

### 前提条件

在使用脚本之前，请确保您的服务器已安装以下软件：

- Docker：[安装指南](https://docs.docker.com/engine/install/)
- Docker Compose：[安装指南](https://docs.docker.com/compose/install/)
- Git

### 使用步骤

1. **将脚本上传到服务器**
   
   使用SCP、SFTP或其他工具将`deploy-docker.sh`脚本上传到您的服务器。

2. **设置脚本执行权限**
   
   ```bash
   chmod +x deploy-docker.sh
   ```

3. **运行一键部署脚本**
   
   ```bash
   ./deploy-docker.sh
   ```
   
   这将自动克隆代码仓库、构建Docker镜像并启动容器，应用将部署在80端口。

### 脚本选项

脚本支持以下选项来自定义部署配置：

```bash
./deploy-docker.sh [选项]
```

可用选项：

- `-h, --help`：显示帮助信息
- `-r, --repo <仓库URL>`：指定GitHub仓库URL（默认：https://github.com/chengyl1989/skyrouter-ai-client.git）
- `-d, --dir <目录名>`：指定项目目录（默认：skyrouter-ai-client）
- `-n, --name <容器名>`：指定容器名称（默认：skyrouter-ai-chatbot）
- `-p, --port <端口>`：指定主机端口（默认：80）
- `--update`：更新现有部署
- `--remove`：移除部署

### 示例

- **指定不同的端口**：
  ```bash
  ./deploy-docker.sh -p 8080
  ```

- **更新现有部署**：
  ```bash
  ./deploy-docker.sh --update
  ```

- **移除部署**：
  ```bash
  ./deploy-docker.sh --remove
  ```

## 手动部署方法

如果您希望手动部署而不使用一键脚本，可以按照以下步骤操作：

1. **克隆代码仓库**
   
   ```bash
   git clone https://github.com/chengyl1989/skyrouter-ai-client.git
   cd skyrouter-ai-client
   ```

2. **使用Docker Compose构建和启动容器**
   
   ```bash
   docker-compose up -d --build
   ```
   
   应用将部署在80端口。

3. **查看容器状态**
   
   ```bash
   docker-compose ps
   ```

4. **查看应用日志**
   
   ```bash
   docker-compose logs -f
   ```

## 环境变量配置

应用支持通过环境变量进行配置。您可以在`docker-compose.yml`文件中修改环境变量部分：

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - NEXT_TELEMETRY_DISABLED=1
  - HOSTNAME=0.0.0.0
  # 添加其他环境变量
```

## 数据持久化

应用的数据存储在Docker卷`skyrouter-chatbot-data`中，日志存储在宿主机的`./logs`目录。

## 常见问题排查

1. **端口冲突**：如果80端口已被占用，可以修改`docker-compose.yml`文件中的端口映射：
   ```yaml
   ports:
     - "8080:3000"  # 将8080替换为可用端口
   ```

2. **防火墙设置**：确保服务器的防火墙已开放相应的端口：
   ```bash
   # 对于Ubuntu/Debian
   ufw allow 80/tcp
   
   # 对于CentOS/RHEL
   firewall-cmd --zone=public --add-port=80/tcp --permanent
   firewall-cmd --reload
   ```

3. **容器无法启动**：检查Docker日志以获取详细错误信息：
   ```bash
   docker-compose logs -f
   ```

4. **健康检查失败**：如果健康检查失败，可能是应用启动时间过长，可以调整`docker-compose.yml`中的`start_period`参数。

## 访问应用

部署成功后，您可以通过以下方式访问应用：

- 通过服务器IP地址：`http://服务器IP地址`
- 如果配置了域名：`http://您的域名`

## 停止和重启应用

- **停止应用**：
  ```bash
  docker-compose down
  ```

- **重启应用**：
  ```bash
  docker-compose restart
  ```

- **更新并重启应用**：
  ```bash
  git pull
  docker-compose down
  docker-compose up -d --build
  ```