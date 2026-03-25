# 构建阶段
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 创建图片目录
RUN mkdir -p /images && chmod 755 /images

# 让 nginx 以 root 用户运行（解决挂载目录权限问题）
RUN sed -i 's/user  nginx/user  root/' /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]