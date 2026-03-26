<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useImageStore } from '@/stores/image'

const imageStore = useImageStore()

onMounted(async () => {
  // 恢复图片目录句柄
  await imageStore.restoreDirectoryHandle()
})
</script>

<style>
/* 全局设计系统变量 */
:root {
  /* 主色调 - 深邃蓝紫 */
  --primary-50: #f0f5ff;
  --primary-100: #e0eaff;
  --primary-200: #c7d7fe;
  --primary-500: #4440d6;
  --primary-600: #3531b5;
  --primary-700: #2a278f;

  /* 功能色 */
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
  --info: #6b7280;

  /* 中性色 */
  --gray-50: #fafafa;
  --gray-100: #f4f4f5;
  --gray-200: #e4e4e7;
  --gray-300: #d4d4d8;
  --gray-400: #a1a1aa;
  --gray-500: #71717a;
  --gray-600: #52525b;
  --gray-700: #3f3f46;
  --gray-800: #27272a;
  --gray-900: #18181b;

  /* 背景 */
  --bg-subtle: #f8fafc;
  --bg-card: #ffffff;

  /* 圆角 */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;

  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.12);

  /* 过渡 */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* 全局字体优化 */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ========== Element Plus 按钮优化 ========== */

/* 基础按钮样式 */
.el-button {
  border-radius: var(--radius-sm) !important;
  font-weight: 500 !important;
  transition: all var(--transition-fast) !important;
}

.el-button:hover {
  transform: translateY(-1px);
}

.el-button:active {
  transform: translateY(0);
}

/* Primary 按钮 - 渐变效果 */
.el-button--primary {
  background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%) !important;
  border: none !important;
  box-shadow: 0 2px 8px rgba(68, 64, 214, 0.35) !important;
}

.el-button--primary:hover {
  background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-700) 100%) !important;
  box-shadow: 0 4px 12px rgba(68, 64, 214, 0.45) !important;
}

.el-button--primary:active {
  box-shadow: 0 1px 4px rgba(68, 64, 214, 0.3) !important;
}

/* Danger 按钮 */
.el-button--danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
  border: none !important;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.35) !important;
}

.el-button--danger:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.45) !important;
}

/* Success 按钮 */
.el-button--success {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%) !important;
  border: none !important;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.35) !important;
}

/* Warning 按钮 */
.el-button--warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
  border: none !important;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.35) !important;
}

/* Default 按钮 */
.el-button:not(.el-button--primary):not(.el-button--danger):not(.el-button--success):not(.el-button--warning):not(.el-button--info):not(.el-button--text):not(.is-link) {
  background: #fff !important;
  border: 1px solid var(--gray-200) !important;
  color: var(--gray-700) !important;
}

.el-button:not(.el-button--primary):not(.el-button--danger):not(.el-button--success):not(.el-button--warning):not(.el-button--info):not(.el-button--text):not(.is-link):hover {
  background: var(--gray-50) !important;
  border-color: var(--gray-300) !important;
  color: var(--gray-800) !important;
  box-shadow: var(--shadow-sm) !important;
}

/* Plain 按钮 */
.el-button.is-plain {
  background: rgba(255, 255, 255, 0.8) !important;
}

.el-button--primary.is-plain {
  background: var(--primary-50) !important;
  color: var(--primary-600) !important;
  border: 1px solid var(--primary-200) !important;
  box-shadow: none !important;
}

.el-button--primary.is-plain:hover {
  background: var(--primary-100) !important;
  border-color: var(--primary-300) !important;
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm) !important;
}

.el-button--danger.is-plain {
  background: #fef2f2 !important;
  color: #dc2626 !important;
  border: 1px solid #fecaca !important;
  box-shadow: none !important;
}

.el-button--danger.is-plain:hover {
  background: #fee2e2 !important;
  border-color: #fca5a5 !important;
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm) !important;
}

/* Link 按钮 */
.el-button.is-link {
  padding: 4px 8px !important;
  height: auto !important;
}

.el-button.is-link:hover {
  background: var(--gray-100) !important;
  transform: none;
}

.el-button--primary.is-link {
  color: var(--primary-500) !important;
}

.el-button--danger.is-link {
  color: #dc2626 !important;
}

/* 小按钮 */
.el-button--small {
  padding: 6px 12px !important;
  font-size: 12px !important;
}

/* 按钮组间距 */
.el-button + .el-button {
  margin-left: 8px;
}

/* ========== Element Plus 卡片优化 ========== */

.el-card {
  border: none !important;
  border-radius: var(--radius-md) !important;
  box-shadow: var(--shadow-sm) !important;
  transition: box-shadow var(--transition-normal), transform var(--transition-normal) !important;
}

.el-card:hover {
  box-shadow: var(--shadow-md) !important;
}

/* ========== Element Plus 标签优化 ========== */

.el-tag {
  border-radius: var(--radius-sm) !important;
  font-weight: 500 !important;
}

/* ========== Element Plus 输入框优化 ========== */

.el-input__wrapper {
  border-radius: var(--radius-sm) !important;
  transition: all var(--transition-fast) !important;
}

.el-select .el-input__wrapper {
  border-radius: var(--radius-sm) !important;
}

.el-input__wrapper:hover {
  box-shadow: 0 0 0 1px var(--gray-300) !important;
}

.el-input__wrapper.is-focus {
  box-shadow: 0 0 0 2px var(--primary-500) !important;
}

/* ========== Element Plus 表格优化 ========== */

.el-table {
  border-radius: var(--radius-md) !important;
  overflow: hidden;
}

.el-table th.el-table__cell {
  background: var(--gray-50) !important;
  font-weight: 600 !important;
  color: var(--gray-700) !important;
}

.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell {
  background: var(--gray-50) !important;
}

.el-table__row:hover > td.el-table__cell {
  background: var(--primary-50) !important;
}

/* 表格内按钮优化 */
.el-table .el-button.is-link {
  padding: 4px 8px !important;
  border-radius: 4px !important;
}

.el-table .el-button.is-link:hover {
  background: var(--gray-100) !important;
}

/* ========== Element Plus 弹窗优化 ========== */

.el-dialog {
  border-radius: var(--radius-lg) !important;
  overflow: hidden;
}

.el-dialog__header {
  padding: 20px 24px 16px !important;
  border-bottom: 1px solid var(--gray-100);
}

.el-dialog__title {
  font-weight: 600 !important;
  font-size: 16px !important;
  color: var(--gray-800) !important;
}

.el-dialog__body {
  padding: 20px 24px !important;
}

.el-dialog__footer {
  padding: 16px 24px 20px !important;
  border-top: 1px solid var(--gray-100);
}

/* ========== Element Plus 消息框优化 ========== */

.el-message-box {
  border-radius: var(--radius-lg) !important;
  padding: 24px !important;
}

/* ========== Element Plus 表单优化 ========== */

.el-form-item__label {
  font-weight: 500 !important;
  color: var(--gray-700) !important;
}

/* 页面过渡 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>