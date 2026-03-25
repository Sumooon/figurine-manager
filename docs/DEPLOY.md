# 部署指南

## 自动构建

项目已配置 GitHub Actions，每次 push 到 main 分支会自动构建并推送到阿里云镜像仓库。

---

## NAS 部署步骤

### 1. 创建图片目录

在 NAS 文件管理器中创建图片存储目录：

```
/volume1/figurine-images/
```

（路径根据你的 NAS 实际情况调整）

### 2. 上传图片

将手办图片上传到该目录，命名规则：
- `1.jpg` - 对应序号 1 的手办
- `2-5.jpg` - 对应序号 2-5 的手办
- `10.jpg` - 对应序号 10 的手办

### 3. 运行容器

**SSH 方式**：
```bash
docker run -d \
  -p 3000:80 \
  -v /volume1/figurine-images:/images:ro \
  --name figurine-manager \
  crpi-8j31e52y8cdre6l3.cn-beijing.personal.cr.aliyuncs.com/figurine/figurine-manager:latest
```

**关键参数说明**：
| 参数 | 说明 |
|------|------|
| `-p 3000:80` | 端口映射，主机端口:容器端口 |
| `-v /volume1/figurine-images:/images:ro` | 挂载 NAS 图片目录到容器内 |
| `:ro` | 只读挂载，保护图片安全 |

### 4. 访问应用

浏览器打开：`http://NAS_IP:3000`

---

## 更新镜像

```bash
# 拉取最新镜像
docker pull crpi-8j31e52y8cdre6l3.cn-beijing.personal.cr.aliyuncs.com/figurine/figurine-manager:latest

# 停止并删除旧容器
docker stop figurine-manager
docker rm figurine-manager

# 重新运行（记得带上挂载参数）
docker run -d \
  -p 3000:80 \
  -v /volume1/figurine-images:/images:ro \
  --name figurine-manager \
  crpi-8j31e52y8cdre6l3.cn-beijing.personal.cr.aliyuncs.com/figurine/figurine-manager:latest
```

---

## GitHub Secrets 配置

需要在 GitHub 上配置阿里云镜像仓库凭据：

1. 打开 https://github.com/Sumooon/figurine-manager/settings/secrets/actions
2. 添加两个 Repository secrets：

| Name | Value |
|------|-------|
| `ALIYUN_REGISTRY_USERNAME` | `sumooon` |
| `ALIYUN_REGISTRY_PASSWORD` | 阿里云 Registry 登录密码 |

---

## 外网访问方案

| 方案 | 说明 | 推荐度 |
|------|------|--------|
| **绿联云 DDNS** | NAS 自带，控制台开启即可 | ⭐⭐⭐ 首选 |
| **Tailscale** | 组建虚拟局域网，手机也能访问 | ⭐⭐⭐ 安全免费 |

### 绿联云 DDNS

1. NAS 控制台 → 设置 → 网络 → 远程访问
2. 开启绿联云服务，获得 `xxx.ugnas.com` 域名
3. 路由器端口转发：外网 3000 → NAS 内网 3000

### Tailscale

1. NAS 应用中心安装 Tailscale
2. 登录账号
3. 手机/电脑也安装并登录同一账号
4. 访问 `http://NAS_TAILSCALE_IP:3000`