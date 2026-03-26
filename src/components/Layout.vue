<template>
  <el-container class="layout-container">
    <!-- 顶部导航 -->
    <el-header class="layout-header">
      <div class="header-brand">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-name">手办管理</span>
          <el-tag size="small" class="version-tag">v{{ version }}</el-tag>
        </div>
      </div>
      <div class="header-actions">
        <el-button class="header-btn" @click="handleSelectImageDir">
          <el-icon><FolderOpened /></el-icon>
          <span>图片目录</span>
        </el-button>
        <el-button class="header-btn" @click="showExport = true">
          <el-icon><Upload /></el-icon>
          <span>导出</span>
        </el-button>
      </div>
    </el-header>

    <el-container>
      <!-- 侧边栏 -->
      <el-aside width="200px" class="layout-aside">
        <el-menu
          :default-active="currentRoute"
          router
          class="sidebar-menu"
        >
          <el-menu-item index="/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <span>统计看板</span>
          </el-menu-item>
          <el-menu-item index="/figurines">
            <el-icon><Picture /></el-icon>
            <span>手办列表</span>
          </el-menu-item>
          <el-menu-item index="/batches">
            <el-icon><Box /></el-icon>
            <span>批次管理</span>
          </el-menu-item>
          <el-menu-item index="/trades">
            <el-icon><Money /></el-icon>
            <span>交易记录</span>
          </el-menu-item>
          <el-menu-item index="/tags">
            <el-icon><PriceTag /></el-icon>
            <span>标签管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-main class="layout-main">
        <slot />
      </el-main>
    </el-container>

    <!-- 导出弹窗 -->
    <ExportDialog v-model:visible="showExport" />
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { DataAnalysis, Picture, Box, Money, PriceTag, FolderOpened, Upload } from '@element-plus/icons-vue'
import { useImageStore } from '@/stores/image'
import ExportDialog from '@/components/ExportDialog.vue'
import pkg from '../../package.json'

const route = useRoute()
const imageStore = useImageStore()

const currentRoute = computed(() => route.path)
const showExport = ref(false)
const version = pkg.version

const handleSelectImageDir = async () => {
  const success = await imageStore.selectImageDirectory()
  if (success) {
    const count = imageStore.imageList.length
    ElMessage.success(`已加载 ${count} 张图片`)
  } else {
    ElMessage.error('加载图片失败')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
  background: var(--bg-subtle, #f8fafc);
}

.layout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
  color: #fff;
  padding: 0 24px;
  height: 60px !important;
  box-shadow: 0 4px 20px rgba(67, 56, 202, 0.25);
  position: relative;
  z-index: 100;
}

.layout-header::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  backdrop-filter: blur(8px);
}

.brand-icon svg {
  width: 20px;
  height: 20px;
}

.brand-text {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-name {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.version-tag {
  background: rgba(255, 255, 255, 0.12) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: rgba(255, 255, 255, 0.85) !important;
  font-size: 11px !important;
  padding: 2px 8px !important;
  border-radius: 20px !important;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.header-btn {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  color: #fff !important;
  border-radius: 8px !important;
  padding: 8px 16px !important;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px !important;
  transition: all var(--transition-fast, 150ms) !important;
}

.header-btn:hover {
  background: rgba(255, 255, 255, 0.18) !important;
  border-color: rgba(255, 255, 255, 0.25) !important;
  transform: translateY(-1px);
}

.layout-aside {
  background: #fff;
  border-right: 1px solid var(--gray-200, #e4e4e7);
  padding: 16px 8px;
}

.sidebar-menu {
  border: none !important;
  background: transparent !important;
}

.sidebar-menu .el-menu-item {
  border-radius: 8px !important;
  margin: 2px 0;
  height: 44px !important;
  transition: all var(--transition-fast, 150ms) !important;
}

.sidebar-menu .el-menu-item:hover {
  background: var(--primary-50, #f0f5ff) !important;
}

.sidebar-menu .el-menu-item.is-active {
  background: linear-gradient(135deg, var(--primary-500, #4440d6) 0%, var(--primary-600, #3531b5) 100%) !important;
  color: #fff !important;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(68, 64, 214, 0.3);
}

.layout-main {
  background: var(--bg-subtle, #f8fafc);
  padding: 24px;
  overflow-y: auto;
}
</style>