# 开发环境配置指南

本项目使用 Dev Container 实现跨平台一致的开发环境。Windows/macOS/Linux 用户无需手动安装 Node.js、npm 等工具，只需一次性配置即可直接使用。

---

## 前置要求

### Windows

1. **安装 Docker Desktop**
   - 下载地址：https://www.docker.com/products/docker-desktop
   - 安装后启动 Docker Desktop，等待左下角状态显示 "Running"

2. **安装 Visual Studio Code**
   - 下载地址：https://code.visualstudio.com
   - 安装完成后打开 VS Code

3. **安装 Dev Containers 插件**
   - 在 VS Code 中按 `Ctrl+Shift+X` 打开扩展面板
   - 搜索 "Dev Containers"
   - 安装 Microsoft 发布的 "Dev Containers" 插件

### macOS / Linux

与 Windows 相同，安装以下三项：
1. [Docker Desktop](https://www.docker.com/products/docker-desktop)
2. [Visual Studio Code](https://code.visualstudio.com)
3. VS Code 插件 "Dev Containers"

---

## 使用方式

### 方式一：通过 VS Code 打开（推荐）

1. 用 VS Code 打开项目文件夹
2. VS Code 右下角会弹出提示：**"Reopen in Container"**
3. 点击该提示，等待容器构建完成（首次约 2-5 分钟）
4. 容器启动后，终端已处于项目环境中

### 方式二：手动触发

如果没有弹出提示：
1. 按 `F1` 或 `Ctrl+Shift+P` 打开命令面板
2. 输入 `Dev Containers: Reopen in Container`
3. 选择并等待构建完成

### 方式三：命令行直接启动

```bash
# 在项目目录下执行
code .
```

然后在 VS Code 中点击 "Reopen in Container"。

---

## 常用命令

容器内已预装 Node.js 20 和 npm，可直接使用：

```bash
# 启动开发服务器
npm run dev

# 构建项目
npm run build

# 预览构建结果
npm run preview
```

---

## 常见问题

### Q: Docker Desktop 显示 "WSL 2 installation is incomplete"

需要安装 WSL 2：
```powershell
wsl --install
```
重启电脑后再启动 Docker Desktop。

### Q: 容器构建失败或网络超时

检查 Docker Desktop 是否正常运行，或尝试配置国内镜像源加速。

### Q: 端口无法访问

Docker Desktop 默认会自动转发端口。如果 5173 无法访问：
1. 打开 Docker Desktop 设置
2. 确保 "Use the WSL 2 based engine" 已启用（Windows）

---

## 环境说明

容器内已包含：
- Node.js 20 (LTS)
- npm
- Git
- VS Code 常用插件（Vue、TypeScript、ESLint、Prettier）