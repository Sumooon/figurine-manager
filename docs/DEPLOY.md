# 部署指南

## 自动构建

项目已配置 GitHub Actions，每次 push 到 main 分支会自动构建并推送到 GitHub Packages。

### NAS 上使用

1. 打开绿联 NAS Docker 应用
2. 拉取镜像：`ghcr.io/sumooon/figurine-manager:main`
3. 创建容器，端口映射 `8080:80`
4. 访问 `http://NAS_IP:8080`

> GitHub Packages 镜像默认私有，首次拉取需要登录：
>
> ```bash
> docker login ghcr.io
> # 用户名：Sumooon
> # 密码：GitHub Personal Access Token（需要 read:packages 权限）
> ```
>
> Token 创建地址：https://github.com/settings/tokens

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