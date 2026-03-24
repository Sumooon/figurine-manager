# 部署指南

## 方式一：Docker 部署（推荐）

### 1. 构建镜像

在项目根目录创建 `Dockerfile`：

```dockerfile
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
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. 创建 nginx.conf

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 3. 构建并运行

```bash
# 构建镜像
docker build -t figurine-manager .

# 运行容器
docker run -d -p 8080:80 --name figurine-manager figurine-manager
```

### 4. NAS Docker 部署

大多数 NAS（群晖、威联通）都支持 Docker：

1. 将镜像推送到 Docker Hub 或私有仓库
2. 在 NAS 的 Docker/Container Station 中拉取并运行
3. 映射端口到 NAS 的某个端口

---

## 方式二：静态文件部署

如果 NAS 支持 Web Server（如群晖 Web Station）：

```bash
# 本地构建
npm run build

# 将 dist 目录上传到 NAS 的 web 目录
```

---

## 外网访问方案

| 方案 | 说明 | 适用场景 |
|------|------|----------|
| **NAS 自带 DDNS** | 群晖/威联通都有 DDNS 服务 | 最简单，品牌 NAS 首选 |
| **Tailscale/ZeroTier** | 组建虚拟局域网 | 安全，无需公网 IP |
| **frp/ngrok** | 内网穿透工具 | 有公网服务器时使用 |
| **Cloudflare Tunnel** | 免费，无需公网 IP | 推荐，安全且免费 |

### Cloudflare Tunnel 配置示例

```bash
# 在 NAS 上安装 cloudflared
docker run -d --name cloudflared \
  cloudflare/cloudflared:latest tunnel --no-autoupdate run --token <YOUR_TOKEN>
```

在 Cloudflare Zero Trust 控制台创建 Tunnel，获取 token 即可。