# 部署指南

## 自动构建

项目已配置 GitHub Actions，每次 push 到 main 分支会自动构建并推送到阿里云镜像仓库。

### NAS 上直接使用

1. 打开绿联 NAS Docker 应用
2. 拉取镜像：`registry.cn-beijing.aliyuncs.com/figurine/figurine-manager:latest`
3. 创建容器，端口映射 `8080:80`
4. 访问 `http://NAS_IP:8080`

**国内访问快，无需翻墙。**

---

## 首次配置（仅需一次）

需要在 GitHub 上配置阿里云镜像仓库凭据：

### 1. 获取阿里云访问凭证

1. 打开 https://cr.console.aliyun.com
2. 左侧菜单点击 **访问凭证**
3. 查看 **用户名**（通常是阿里云账号全名）
4. 如果没设置过密码，点击 **设置 Registry 登录密码**

### 2. 配置 GitHub Secrets

1. 打开 https://github.com/Sumooon/figurine-manager/settings/secrets/actions
2. 点击 **New repository secret**，添加两个：

| Name | Value |
|------|-------|
| `ALIYUN_REGISTRY_USERNAME` | 阿里云镜像仓库用户名 |
| `ALIYUN_REGISTRY_PASSWORD` | Registry 登录密码 |

3. 点击 **Add secret** 保存

配置完成后，每次 push 代码会自动构建镜像。

---

## 外网访问方案

| 方案 | 说明 | 推荐度 |
|------|------|--------|
| **绿联云 DDNS** | NAS 自带，控制台开启即可 | ⭐⭐⭐ 首选 |
| **Tailscale** | 组建虚拟局域网，手机也能访问 | ⭐⭐⭐ 安全免费 |

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