# Figurine Manager

手办管理系统 - 记录手办采购成本、销售利润，支持图片管理和数据统计。

## 架构

```
┌─────────────────────────────────────────────────────────────┐
│  NAS Docker 环境                                             │
│                                                              │
│  figurine-manager (前端镜像)                                 │
│  ├── nginx (端口 80 → NAS 端口 32301)                        │
│  │   ├── /api/* → 代理到 postgrest:3000                      │
│  │   └── /images/* → NAS 图片目录                            │
│  │   └── /* → Vue 前端静态文件                               │
│                                                              │
│  postgrest (REST API 服务)                                   │
│  ├── 端口 3000 → NAS 端口 3000                               │
│  └── 连接 dev-postgres 数据库                                │
│                                                              │
│  dev-postgres (PostgreSQL 数据库)                            │
│  ├── 端口 5432 → NAS 端口 43637                              │
│  └── 存储手办、交易、批次、标签等业务数据                     │
│                                                              │
│  /volume1/figurine-images (NAS 图片目录)                     │
│  └── 挂载到容器 /images 目录                                 │
└─────────────────────────────────────────────────────────────┘
```

| 容器 | 镜像 | 用途 |
|------|------|------|
| figurine-manager | 阿里云镜像仓库 | Vue 前端 + Nginx 反向代理 |
| postgrest | postgrest/postgrest:latest | REST API，提供数据库访问接口 |
| dev-postgres | postgres:15-alpine | PostgreSQL 数据库，存储业务数据 |

## 功能

- 手办信息管理（名称、系列、成本、状态）
- 交易记录（售价、利润、利润率计算）
- 批次管理（批量入库）
- 标签分类
- 图片管理（NAS 目录挂载）
- 数据统计 Dashboard

## 开发

详见 [docs/SETUP.md](docs/SETUP.md)

## 部署

详见 [docs/DEPLOY.md](docs/DEPLOY.md)