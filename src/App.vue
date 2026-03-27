<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useImageStore } from '@/stores/image'

const imageStore = useImageStore()

onMounted(async () => {
  await imageStore.restoreDirectoryHandle()
})
</script>

<style>
/* ========== 设计系统变量 ========== */
:root {
  /* 主色调 - 薰衣草紫（温暖而现代） */
  --primary-50: #f5f3ff;
  --primary-100: #ede9fe;
  --primary-200: #ddd6fe;
  --primary-300: #c4b5fd;
  --primary-400: #a78bfa;
  --primary-500: #8b5cf6;
  --primary-600: #7c3aed;
  --primary-700: #6d28d9;
  --primary-800: #5b21b6;

  /* 功能色 */
  --success-light: #d1fae5;
  --success: #10b981;
  --success-dark: #059669;
  --warning-light: #fef3c7;
  --warning: #f59e0b;
  --warning-dark: #d97706;
  --danger-light: #fee2e2;
  --danger: #ef4444;
  --danger-dark: #dc2626;
  --info-light: #e0f2fe;
  --info: #0ea5e9;
  --info-dark: #0284c7;

  /* 中性色 - 温暖灰色 */
  --gray-25: #fefefe;
  --gray-50: #fafaf9;
  --gray-100: #f5f5f4;
  --gray-150: #ebe9e6;
  --gray-200: #e7e5e4;
  --gray-300: #d6d3d1;
  --gray-400: #a8a29e;
  --gray-500: #78716c;
  --gray-600: #57534e;
  --gray-700: #44403c;
  --gray-800: #292524;
  --gray-900: #1c1917;

  /* 背景色 */
  --bg-page: #faf9f7;
  --bg-card: #ffffff;
  --bg-elevated: #ffffff;
  --bg-subtle: #f5f4f2;

  /* 边框 */
  --border-subtle: rgba(0, 0, 0, 0.06);
  --border-default: rgba(0, 0, 0, 0.1);
  --border-strong: rgba(0, 0, 0, 0.15);

  /* 圆角 */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* 阴影 */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 12px 24px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04);
  --shadow-xl: 0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.06);
  --shadow-glow: 0 0 40px rgba(139, 92, 246, 0.15);

  /* 过渡 */
  --transition-fast: 120ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-bounce: 400ms cubic-bezier(0.34, 1.56, 0.64, 1);

  /* 间距 */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
}

/* 全局字体 */
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--bg-page);
  color: var(--gray-800);
  line-height: 1.5;
}

/* 导入 Inter 字体 */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* ========== Element Plus 全局覆盖 ========== */

/* 按钮 */
.el-button {
  border-radius: var(--radius-sm) !important;
  font-weight: 500 !important;
  font-size: 14px !important;
  transition: all var(--transition-fast) !important;
  border: 1px solid transparent !important;
}

.el-button:hover {
  transform: translateY(-1px);
}

.el-button:active {
  transform: translateY(0);
}

.el-button--primary {
  background: var(--primary-500) !important;
  border-color: var(--primary-500) !important;
  box-shadow: 0 1px 3px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
}

.el-button--primary:hover {
  background: var(--primary-600) !important;
  border-color: var(--primary-600) !important;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
}

.el-button--primary:active {
  background: var(--primary-700) !important;
}

.el-button--danger {
  background: var(--danger) !important;
  border-color: var(--danger) !important;
  box-shadow: 0 1px 3px rgba(239, 68, 68, 0.3) !important;
}

.el-button--danger:hover {
  background: var(--danger-dark) !important;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35) !important;
}

.el-button--success {
  background: var(--success) !important;
  border-color: var(--success) !important;
  box-shadow: 0 1px 3px rgba(16, 185, 129, 0.3) !important;
}

.el-button--default {
  background: var(--bg-card) !important;
  border-color: var(--gray-200) !important;
  color: var(--gray-700) !important;
}

.el-button--default:hover {
  background: var(--gray-50) !important;
  border-color: var(--gray-300) !important;
  color: var(--gray-800) !important;
  box-shadow: var(--shadow-sm) !important;
}

.el-button.is-plain.el-button--primary {
  background: var(--primary-50) !important;
  border-color: var(--primary-200) !important;
  color: var(--primary-600) !important;
  box-shadow: none !important;
}

.el-button.is-plain.el-button--primary:hover {
  background: var(--primary-100) !important;
  border-color: var(--primary-300) !important;
}

.el-button.is-plain.el-button--danger {
  background: var(--danger-light) !important;
  border-color: #fecaca !important;
  color: var(--danger-dark) !important;
  box-shadow: none !important;
}

.el-button.is-link {
  padding: 4px 8px !important;
  height: auto !important;
  color: var(--primary-500) !important;
}

.el-button.is-link:hover {
  background: var(--primary-50) !important;
  color: var(--primary-600) !important;
  transform: none;
}

.el-button.is-link.el-button--danger {
  color: var(--danger) !important;
}

.el-button.is-link.el-button--danger:hover {
  background: var(--danger-light) !important;
  color: var(--danger-dark) !important;
}

/* 卡片 */
.el-card {
  border: none !important;
  border-radius: var(--radius-md) !important;
  box-shadow: var(--shadow-sm) !important;
  background: var(--bg-card) !important;
  transition: all var(--transition-normal) !important;
}

.el-card:hover {
  box-shadow: var(--shadow-md) !important;
}

/* 标签 */
.el-tag {
  border-radius: var(--radius-xs) !important;
  font-weight: 500 !important;
  border: none !important;
}

.el-tag--primary {
  background: var(--primary-100) !important;
  color: var(--primary-700) !important;
}

.el-tag--success {
  background: var(--success-light) !important;
  color: var(--success-dark) !important;
}

.el-tag--warning {
  background: var(--warning-light) !important;
  color: var(--warning-dark) !important;
}

.el-tag--danger {
  background: var(--danger-light) !important;
  color: var(--danger-dark) !important;
}

.el-tag--info {
  background: var(--gray-100) !important;
  color: var(--gray-600) !important;
}

/* 输入框 */
.el-input__wrapper {
  border-radius: var(--radius-sm) !important;
  box-shadow: none !important;
  border: 1px solid var(--gray-200) !important;
  background: var(--bg-card) !important;
  transition: all var(--transition-fast) !important;
}

.el-input__wrapper:hover {
  border-color: var(--gray-300) !important;
}

.el-input__wrapper.is-focus {
  border-color: var(--primary-400) !important;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
}

.el-select .el-input__wrapper {
  border-radius: var(--radius-sm) !important;
}

/* 表格 */
.el-table {
  border-radius: var(--radius-md) !important;
  overflow: hidden;
  border: 1px solid var(--gray-150) !important;
}

.el-table th.el-table__cell {
  background: var(--gray-50) !important;
  font-weight: 600 !important;
  color: var(--gray-700) !important;
  border-bottom: 1px solid var(--gray-150) !important;
}

.el-table td.el-table__cell {
  border-bottom: 1px solid var(--gray-100) !important;
}

.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell {
  background: var(--gray-50) !important;
}

.el-table__row:hover > td.el-table__cell {
  background: var(--primary-50) !important;
}

/* 弹窗 */
.el-dialog {
  border-radius: var(--radius-lg) !important;
  overflow: hidden;
  box-shadow: var(--shadow-xl) !important;
}

.el-dialog__header {
  padding: 20px 24px 16px !important;
  border-bottom: 1px solid var(--gray-100);
  margin-right: 0 !important;
}

.el-dialog__title {
  font-weight: 600 !important;
  font-size: 17px !important;
  color: var(--gray-800) !important;
}

.el-dialog__body {
  padding: 20px 24px !important;
}

.el-dialog__footer {
  padding: 16px 24px 20px !important;
  border-top: 1px solid var(--gray-100);
}

/* 消息框 */
.el-message-box {
  border-radius: var(--radius-lg) !important;
  padding: 24px !important;
  box-shadow: var(--shadow-xl) !important;
}

/* 表单 */
.el-form-item__label {
  font-weight: 500 !important;
  color: var(--gray-700) !important;
}

/* 分页 */
.el-pagination {
  gap: 4px !important;
}

.el-pager li {
  border-radius: var(--radius-sm) !important;
  min-width: 36px;
  height: 36px;
  line-height: 36px;
  font-weight: 500;
  transition: all var(--transition-fast) !important;
}

.el-pager li.is-active {
  background: var(--primary-500) !important;
  color: #fff !important;
}

.el-pager li:hover {
  color: var(--primary-500) !important;
}

/* 空状态 */
.el-empty {
  padding: 40px 0 !important;
}

.el-empty__description {
  color: var(--gray-400) !important;
}

/* 分割线 */
.el-divider {
  border-color: var(--gray-150) !important;
}

.el-divider__text {
  color: var(--gray-500) !important;
  font-weight: 500 !important;
  font-size: 13px !important;
}

/* 单选框组 */
.el-radio-group {
  gap: 8px;
}

.el-radio-button__inner {
  border-radius: var(--radius-sm) !important;
  border: 1px solid var(--gray-200) !important;
  padding: 8px 16px !important;
  font-weight: 500 !important;
  transition: all var(--transition-fast) !important;
}

.el-radio-button__original-radio:checked + .el-radio-button__inner {
  background: var(--primary-500) !important;
  border-color: var(--primary-500) !important;
  box-shadow: none !important;
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--gray-300);
  border-radius: var(--radius-full);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--gray-400);
}

/* 页面过渡 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 选中文字 */
::selection {
  background: var(--primary-200);
  color: var(--primary-800);
}
</style>