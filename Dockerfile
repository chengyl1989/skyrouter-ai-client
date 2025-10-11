# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine AS base

# 安装必要的系统依赖（解决libc兼容问题）
RUN apk add --no-cache libc6-compat curl wget

# 设置工作目录
WORKDIR /app

# 依赖安装阶段（仅安装生产依赖，减小构建体积）
FROM base AS deps
COPY package.json package-lock.json* ./

# 安装生产依赖（忽略脚本，加快速度）
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# 构建阶段（编译TypeScript、生成Next.js产物）
FROM base AS builder
WORKDIR /app

# 复制依赖（从deps阶段）
COPY --from=deps /app/node_modules ./node_modules

# 复制源代码（确保.gitignore排除不必要文件）
COPY . .

# 设置构建环境变量（禁用遥测、指定生产环境）
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 安装构建依赖并构建应用（保留public目录在standalone中）
RUN npm ci --include=dev --ignore-scripts && \
    npm run build

# 生产运行阶段（最终镜像，仅包含必要文件）
FROM base AS runner
WORKDIR /app

# 设置运行环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 创建非root用户（安全最佳实践）
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 创建必要目录（数据、日志存储）
RUN mkdir -p .next data logs && \
    chown -R nextjs:nodejs .next data logs

# 复制构建产物（适配standalone模式）
# 1. 复制完整standalone目录（包含public、node_modules、server.js）
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# 2. 复制静态资源（.next/static，standalone中可能不包含最新版本）
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 创建健康检查脚本（监控服务可用性）
RUN echo '#!/bin/sh\nwget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1' > /app/healthcheck.sh && \
    chmod +x /app/healthcheck.sh && \
    chown nextjs:nodejs /app/healthcheck.sh

# 切换到非root用户（避免权限风险）
USER nextjs

# 暴露端口（与环境变量PORT一致）
EXPOSE 3000

# 健康检查配置（定期检测服务状态）
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD /app/healthcheck.sh

# 启动应用（使用standalone生成的server.js，性能更优）
CMD ["node", "server.js"]