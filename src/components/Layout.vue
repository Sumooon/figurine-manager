<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside width="220px" class="layout-aside">
      <!-- Logo -->
      <div class="sidebar-header">
        <div class="brand-logo">
          <div class="logo-icon">
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
      </div>

      <!-- 导航菜单 -->
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

      <!-- 底部操作 -->
      <div class="sidebar-footer">
        <el-button class="footer-btn" @click="showExport = true">
          <el-icon><Download /></el-icon>
          <span>导出数据</span>
        </el-button>
      </div>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <!-- 顶部栏 -->
      <el-header class="layout-header">
        <div class="header-left">
          <!-- 面包屑或标题可以放这里 -->
        </div>
        <div class="header-right">
          <el-button class="header-btn" @click="handleSelectImageDir">
            <el-icon><FolderOpened /></el-icon>
            <span>图片目录</span>
          </el-button>
        </div>
      </el-header>

      <!-- 内容区 -->
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
import { DataAnalysis, Picture, Box, Money, PriceTag, FolderOpened, Download } from '@element-plus/icons-vue'
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
  background: var(--bg-page);
}

/* 侧边栏 */
.layout-aside {
  background: #fff;
  border-right: 1px solid var(--gray-150);
  display: flex;
  flex-direction: column;
  position: relative;
}

.sidebar-header {
  padding: 20px 16px;
  border-bottom: 1px solid var(--gray-100);
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
  border-radius: 12px;
  color: #fff;
}

.logo-icon svg {
  width: 22px;
  height: 22px;
}

.brand-text {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--gray-800);
  letter-spacing: -0.01em;
}

.version-tag {
  background: var(--gray-100) !important;
  border: none !important;
  color: var(--gray-500) !important;
  font-size: 10px !important;
  padding: 2px 6px !important;
  border-radius: var(--radius-xs) !important;
}

/* 菜单 */
.sidebar-menu {
  flex: 1;
  border: none !important;
  background: transparent !important;
  padding: 12px 8px;
}

.sidebar-menu .el-menu-item {
  border-radius: var(--radius-sm) !important;
  margin: 2px 0;
  height: 44px !important;
  transition: all var(--transition-fast) !important;
  color: var(--gray-600) !important;
}

.sidebar-menu .el-menu-item:hover {
  background: var(--gray-50) !important;
  color: var(--gray-800) !important;
}

.sidebar-menu .el-menu-item.is-active {
  background: var(--primary-50) !important;
  color: var(--primary-600) !important;
  font-weight: 500;
}

.sidebar-menu .el-menu-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: var(--primary-500);
  border-radius: 0 2px 2px 0;
}

/* 底部 */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--gray-100);
}

.footer-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--gray-50) !important;
  border: 1px solid var(--gray-200) !important;
  color: var(--gray-600) !important;
  border-radius: var(--radius-sm) !important;
  transition: all var(--transition-fast) !important;
}

.footer-btn:hover {
  background: var(--gray-100) !important;
  border-color: var(--gray-300) !important;
  color: var(--gray-800) !important;
}

/* 顶部栏 */
.layout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 0 24px;
  height: 56px !important;
  border-bottom: 1px solid var(--gray-150);
}

.header-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--gray-50) !important;
  border: 1px solid var(--gray-200) !important;
  color: var(--gray-600) !important;
  border-radius: var(--radius-sm) !important;
  font-size: 13px !important;
  transition: all var(--transition-fast) !important;
}

.header-btn:hover {
  background: var(--gray-100) !important;
  border-color: var(--gray-300) !important;
  color: var(--gray-800) !important;
}

/* 主内容区 */
.layout-main {
  background: var(--bg-page);
  padding: 24px;
  overflow-y: auto;
}
</style>