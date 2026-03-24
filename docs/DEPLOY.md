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

### 4. 绿联 NAS Docker 部署

绿联 NAS 使用 UGOS Pro 系统，支持 Docker 容器：

#### 步骤一：构建并推送镜像

```bash
# 本地构建
docker build -t figurine-manager .

# 登录 Docker Hub
docker login

# 打标签并推送（替换为你的 Docker Hub 用户名）
docker tag figurine-manager YOUR_USERNAME/figurine-manager:latest
docker push YOUR_USERNAME/figurine-manager:latest
```

#### 步骤二：NAS 上拉取镜像

1. 打开绿联 NAS 控制台
2. 进入 **应用中心** → **Docker**
3. 点击 **镜像** → **拉取镜像**
4. 输入 `YOUR_USERNAME/figurine-manager:latest`
5. 等待拉取完成

#### 步骤三：创建容器

1. 在镜像列表中点击 **创建容器**
2. 配置如下：

| 配置项 | 值 |
|--------|-----|
| 容器名称 | figurine-manager |
| 端口映射 | 8080:80 |
| 重启策略 | 总是重启 |

3. 点击 **创建** 并启动

#### 步骤四：访问测试

- 内网访问：`http://NAS_IP:8080`

---

## 方式二：静态文件部署

绿联 NAS 支持通过文件管理器上传静态文件：

```bash
# 本地构建
npm run build
```

将 `dist` 目录内容上传到 NAS，但需要额外配置 Web Server，不如 Docker 方便。

---

## 外网访问方案

| 方案 | 说明 | 推荐度 |
|------|------|--------|
| **绿联云 DDNS** | NAS 自带，控制台开启即可 | ⭐⭐⭐ 首选 |
| **Tailscale** | 组建虚拟局域网，手机也能访问 | ⭐⭐⭐ 安全免费 |
| **Cloudflare Tunnel** | 免费，无需公网 IP | ⭐⭐ 需要有域名 |

### 绿联云 DDNS（推荐）

1. 登录绿联 NAS 控制台
2. 进入 **设置** → **网络** → **远程访问**
3. 开启 **绿联云服务**
4. 绑定绿联账号后，会获得 `xxx.ugnas.com` 域名
5. 在路由器上做端口转发：外网 8080 → NAS 内网 8080

### Tailscale（无需公网 IP）

1. 绿联 NAS 应用中心安装 Tailscale
2. 登录 Tailscale 账号
3. 手机/电脑也安装 Tailscale 并登录同一账号
4. 访问 `http://NAS_TAILSCALE_IP:8080`