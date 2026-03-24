<template>
  <el-container class="layout-container">
    <!-- 顶部导航 -->
    <el-header class="layout-header">
      <div class="header-title">📦 手办管理系统</div>
      <div class="header-actions">
        <el-button @click="handleSelectImageDir">📷 设置图片目录</el-button>
        <el-button @click="handleExport">📤 导出</el-button>
      </div>
    </el-header>

    <el-container>
      <!-- 侧边栏 -->
      <el-aside width="200px" class="layout-aside">
        <el-menu
          :default-active="currentRoute"
          router
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
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { DataAnalysis, Picture, Box, Money, PriceTag } from '@element-plus/icons-vue'

const route = useRoute()
const currentRoute = computed(() => route.path)

const handleSelectImageDir = () => {
  // TODO: 实现图片目录选择
}

const handleExport = () => {
  // TODO: 实现导出功能
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.layout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #409eff;
  color: #fff;
}

.header-title {
  font-size: 18px;
  font-weight: bold;
}

.layout-aside {
  background: #fff;
  border-right: 1px solid #e6e6e6;
}

.layout-main {
  background: #f5f5f5;
  padding: 20px;
}
</style>