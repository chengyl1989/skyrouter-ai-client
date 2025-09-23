# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine AS base

# 安装必要的系统依赖
RUN apk add --no-cache libc6-compat curl wget

# 设置工作目录
WORKDIR /app

# 依赖安装阶段
FROM base AS deps

# 复制package文件
COPY package.json package-lock.json* ./

# 如果package-lock.json不存在或不同步，则使用npm install创建新的lock文件
# 否则使用npm ci进行干净安装
RUN if [ ! -f package-lock.json ]; then \
        npm install --only=production --ignore-scripts && \
        npm cache clean --force; \
    else \
        npm ci --only=production --ignore-scripts && \
        npm cache clean --force; \
    fi

# 构建阶段
FROM base AS builder
WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules

# 复制源代码
COPY . .

# 设置构建环境变量
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 安装构建依赖并构建应用
# 如果package-lock.json不存在或不同步，则使用npm install
# 否则使用npm ci进行干净安装
RUN if [ ! -f package-lock.json ]; then \
        npm install --include=dev --ignore-scripts && \
        npm run build && \
        npm prune --production; \
    else \
        npm ci --include=dev --ignore-scripts && \
        npm run build && \
        npm prune --production; \
    fi

# 生产运行阶段
FROM base AS runner
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 创建运行用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 创建必要的目录
RUN mkdir -p .next public data logs && \
    chown -R nextjs:nodejs .next data logs

# 复制构建产物
# 自动利用输出跟踪来减少镜像大小
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 创建健康检查脚本
RUN echo '#!/bin/sh\nwget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1' > /app/healthcheck.sh && \
    chmod +x /app/healthcheck.sh && \
    chown nextjs:nodejs /app/healthcheck.sh

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD /app/healthcheck.sh

# 启动应用
CMD ["node_modules/.bin/next", "start"]