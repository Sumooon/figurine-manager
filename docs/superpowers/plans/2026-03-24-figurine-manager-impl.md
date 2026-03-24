# 手办管理系统实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个纯前端的 Vue 3 手办管理系统，支持手办信息管理、批次费用分摊、交易记录和咸鱼集成。

**Architecture:** 采用 Vue 3 + TypeScript + Vite 架构，数据存储在 IndexedDB，使用 File System Access API 访问本地图片，Pinia 管理状态，Element Plus 提供 UI 组件。

**Tech Stack:** Vue 3.4+, TypeScript 5.0+, Vite 5.0+, Element Plus 2.x, Pinia 2.x, Vue Router 4.x, idb (IndexedDB wrapper), ExcelJS, dayjs

---

## 文件结构

```
src/
├── main.ts                      # 应用入口
├── App.vue                      # 根组件
├── router/
│   └── index.ts                 # 路由配置
├── types/
│   └── index.ts                 # 类型定义 (Batch, Figurine, Trade, Tag)
├── db/
│   ├── index.ts                 # IndexedDB 初始化与连接
│   ├── figurine.ts              # 手办 CRUD 操作
│   ├── batch.ts                 # 批次 CRUD 操作
│   ├── trade.ts                 # 交易 CRUD 操作
│   └── tag.ts                   # 标签 CRUD 操作
├── stores/
│   ├── figurine.ts              # 手办状态管理
│   ├── batch.ts                 # 批次状态管理
│   ├── trade.ts                 # 交易状态管理
│   └── image.ts                 # 图片目录状态管理
├── utils/
│   ├── calculator.ts            # 利润/成本计算
│   ├── xianyu.ts                # 咸鱼手续费计算、文案生成
│   └── export.ts                # Excel/CSV/JSON 导出
├── views/
│   ├── Dashboard.vue            # 统计看板
│   ├── FigurineList.vue         # 手办列表
│   ├── BatchManage.vue          # 批次管理
│   ├── TradeRecords.vue         # 交易记录
│   └── TagManage.vue            # 标签管理
└── components/
    ├── Layout.vue               # 布局组件
    ├── FigurineCard.vue         # 手办卡片
    ├── FigurineForm.vue         # 手办编辑表单
    ├── BatchForm.vue            # 批次表单
    ├── TradeForm.vue            # 交易表单
    ├── CostShareDialog.vue      # 费用分摊弹窗
    └── ExportDialog.vue         # 导出弹窗
```

---

## Phase 1: 基础框架

### Task 1: 项目初始化

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/App.vue`

- [ ] **Step 1: 初始化 Vite + Vue 3 + TypeScript 项目**

```bash
npm create vite@latest . -- --template vue-ts
```

- [ ] **Step 2: 安装依赖**

```bash
npm install vue-router@4 pinia element-plus dayjs idb exceljs uuid
npm install -D @types/uuid
```

- [ ] **Step 3: 配置 Vite**

修改 `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
```

- [ ] **Step 4: 验证项目启动**

```bash
npm run dev
```

Expected: 项目在 http://localhost:5173 启动成功

- [ ] **Step 5: 提交**

```bash
git add .
git commit -m "chore: init project with vite + vue3 + typescript"
```

---

### Task 2: 类型定义

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: 定义类型**

创建 `src/types/index.ts`:

```typescript
// 批次
export interface Batch {
  id: string
  name: string
  imageRange: string
  totalShipping?: number
  totalTax?: number
  shareMode: 'average' | 'custom'
  createdAt: number
}

// 手办状态
export type FigurineStatus = 'pending' | 'selling' | 'sold' | 'holding'

// 手办
export interface Figurine {
  id: string
  imageFile: string
  imageIndex: number
  name: string
  series?: string
  tagIds: string[]
  batchId?: string
  purchasePrice: number
  shippingShare?: number
  taxShare?: number
  shareWeight?: number
  totalCost: number
  status: FigurineStatus
  remark?: string
  createdAt: number
  updatedAt: number
}

// 咸鱼状态
export type XianyuStatus = 'unpublished' | 'selling' | 'sold' | 'offline'

// 交易
export interface Trade {
  id: string
  figurineId: string
  sellPrice: number
  xianyuLink?: string
  xianyuOrderId?: string
  xianyuStatus?: XianyuStatus
  xianyuBuyerId?: string
  xianyuFee?: number
  actualIncome: number
  profit: number
  profitRate: number
  buyerName?: string
  buyerContact?: string
  soldAt: number
  remark?: string
  isActive: boolean
}

// 标签
export interface Tag {
  id: string
  name: string
  color?: string
}

// 图片缓存
export interface ImageCache {
  id: string              // 图片文件名
  thumbnail: Blob         // 缩略图
  originalSize: number    // 原图大小
}

// 目录句柄存储
export interface DirectoryHandleCache {
  id: 'imageDirectory'
  handle: FileSystemDirectoryHandle
}
```

- [ ] **Step 2: 提交**

```bash
git add src/types/index.ts
git commit -m "feat: add type definitions"
```

---

### Task 3: IndexedDB 初始化

**Files:**
- Create: `src/db/index.ts`

- [ ] **Step 1: 编写 IndexedDB 初始化代码**

创建 `src/db/index.ts`:

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Batch, Figurine, Trade, Tag, ImageCache, DirectoryHandleCache } from '@/types'

interface FigurineDBSchema extends DBSchema {
  figurines: {
    key: string
    value: Figurine
    indexes: { 'by-batch': string; 'by-status': string }
  }
  batches: {
    key: string
    value: Batch
  }
  trades: {
    key: string
    value: Trade
    indexes: { 'by-figurine': string }
  }
  tags: {
    key: string
    value: Tag
  }
  imageCache: {
    key: string
    value: ImageCache
  }
  directoryHandle: {
    key: string
    value: DirectoryHandleCache
  }
}

const DB_NAME = 'figurine-manager'
const DB_VERSION = 1

let dbInstance: IDBPDatabase<FigurineDBSchema> | null = null

export async function getDB(): Promise<IDBPDatabase<FigurineDBSchema>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<FigurineDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // 手办表
      if (!db.objectStoreNames.contains('figurines')) {
        const figurineStore = db.createObjectStore('figurines', { keyPath: 'id' })
        figurineStore.createIndex('by-batch', 'batchId')
        figurineStore.createIndex('by-status', 'status')
      }

      // 批次表
      if (!db.objectStoreNames.contains('batches')) {
        db.createObjectStore('batches', { keyPath: 'id' })
      }

      // 交易表
      if (!db.objectStoreNames.contains('trades')) {
        const tradeStore = db.createObjectStore('trades', { keyPath: 'id' })
        tradeStore.createIndex('by-figurine', 'figurineId')
      }

      // 标签表
      if (!db.objectStoreNames.contains('tags')) {
        db.createObjectStore('tags', { keyPath: 'id' })
      }

      // 图片缓存表
      if (!db.objectStoreNames.contains('imageCache')) {
        db.createObjectStore('imageCache', { keyPath: 'id' })
      }

      // 目录句柄表
      if (!db.objectStoreNames.contains('directoryHandle')) {
        db.createObjectStore('directoryHandle', { keyPath: 'id' })
      }
    }
  })

  return dbInstance
}
```

- [ ] **Step 2: 提交**

```bash
git add src/db/index.ts
git commit -m "feat: add indexeddb initialization"
```

---

### Task 4: 路由配置

**Files:**
- Create: `src/router/index.ts`
- Modify: `src/main.ts`
- Modify: `src/App.vue`

- [ ] **Step 1: 创建路由配置**

创建 `src/router/index.ts`:

```typescript
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/Dashboard.vue')
    },
    {
      path: '/figurines',
      name: 'Figurines',
      component: () => import('@/views/FigurineList.vue')
    },
    {
      path: '/batches',
      name: 'Batches',
      component: () => import('@/views/BatchManage.vue')
    },
    {
      path: '/trades',
      name: 'Trades',
      component: () => import('@/views/TradeRecords.vue')
    },
    {
      path: '/tags',
      name: 'Tags',
      component: () => import('@/views/TagManage.vue')
    }
  ]
})

export default router
```

- [ ] **Step 2: 更新 main.ts**

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')
```

- [ ] **Step 3: 更新 App.vue**

```vue
<template>
  <router-view />
</template>

<script setup lang="ts">
</script>
```

- [ ] **Step 4: 提交**

```bash
git add src/router/index.ts src/main.ts src/App.vue
git commit -m "feat: add router configuration"
```

---

### Task 5: 布局组件

**Files:**
- Create: `src/components/Layout.vue`

- [ ] **Step 1: 创建布局组件**

创建 `src/components/Layout.vue`:

```vue
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
```

- [ ] **Step 2: 提交**

```bash
git add src/components/Layout.vue
git commit -m "feat: add layout component"
```

---

## Phase 2: 核心数据层

### Task 6: 批次 CRUD

**Files:**
- Create: `src/db/batch.ts`
- Create: `src/stores/batch.ts`

- [ ] **Step 1: 编写批次数据库操作**

创建 `src/db/batch.ts`:

```typescript
import { v4 as uuidv4 } from 'uuid'
import { getDB } from './index'
import type { Batch } from '@/types'

export async function getAllBatches(): Promise<Batch[]> {
  const db = await getDB()
  return db.getAll('batches')
}

export async function getBatchById(id: string): Promise<Batch | undefined> {
  const db = await getDB()
  return db.get('batches', id)
}

export async function createBatch(data: Omit<Batch, 'id' | 'createdAt'>): Promise<Batch> {
  const db = await getDB()
  const batch: Batch = {
    ...data,
    id: uuidv4(),
    createdAt: Date.now()
  }
  await db.add('batches', batch)
  return batch
}

export async function updateBatch(id: string, data: Partial<Batch>): Promise<void> {
  const db = await getDB()
  const existing = await db.get('batches', id)
  if (!existing) throw new Error('Batch not found')
  await db.put('batches', { ...existing, ...data })
}

export async function deleteBatch(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('batches', id)
}
```

- [ ] **Step 2: 编写批次状态管理**

创建 `src/stores/batch.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Batch } from '@/types'
import * as batchDb from '@/db/batch'

export const useBatchStore = defineStore('batch', () => {
  const batches = ref<Batch[]>([])
  const loading = ref(false)

  const batchOptions = computed(() =>
    batches.value.map(b => ({ label: b.name, value: b.id }))
  )

  async function fetchBatches() {
    loading.value = true
    try {
      batches.value = await batchDb.getAllBatches()
    } finally {
      loading.value = false
    }
  }

  async function addBatch(data: Omit<Batch, 'id' | 'createdAt'>) {
    const batch = await batchDb.createBatch(data)
    batches.value.push(batch)
    return batch
  }

  async function updateBatch(id: string, data: Partial<Batch>) {
    await batchDb.updateBatch(id, data)
    const index = batches.value.findIndex(b => b.id === id)
    if (index !== -1) {
      batches.value[index] = { ...batches.value[index], ...data }
    }
  }

  async function removeBatch(id: string) {
    await batchDb.deleteBatch(id)
    batches.value = batches.value.filter(b => b.id !== id)
  }

  return {
    batches,
    loading,
    batchOptions,
    fetchBatches,
    addBatch,
    updateBatch,
    removeBatch
  }
})
```

- [ ] **Step 3: 提交**

```bash
git add src/db/batch.ts src/stores/batch.ts
git commit -m "feat: add batch crud and store"
```

---

### Task 7: 标签 CRUD

**Files:**
- Create: `src/db/tag.ts`
- Create: `src/stores/tag.ts`

- [ ] **Step 1: 编写标签数据库操作**

创建 `src/db/tag.ts`:

```typescript
import { v4 as uuidv4 } from 'uuid'
import { getDB } from './index'
import type { Tag } from '@/types'

export async function getAllTags(): Promise<Tag[]> {
  const db = await getDB()
  return db.getAll('tags')
}

export async function createTag(data: Omit<Tag, 'id'>): Promise<Tag> {
  const db = await getDB()
  const tag: Tag = { ...data, id: uuidv4() }
  await db.add('tags', tag)
  return tag
}

export async function updateTag(id: string, data: Partial<Tag>): Promise<void> {
  const db = await getDB()
  const existing = await db.get('tags', id)
  if (!existing) throw new Error('Tag not found')
  await db.put('tags', { ...existing, ...data })
}

export async function deleteTag(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('tags', id)
}
```

- [ ] **Step 2: 编写标签状态管理**

创建 `src/stores/tag.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Tag } from '@/types'
import * as tagDb from '@/db/tag'

export const useTagStore = defineStore('tag', () => {
  const tags = ref<Tag[]>([])

  const tagOptions = computed(() =>
    tags.value.map(t => ({ label: t.name, value: t.id, color: t.color }))
  )

  async function fetchTags() {
    tags.value = await tagDb.getAllTags()
  }

  async function addTag(data: Omit<Tag, 'id'>) {
    const tag = await tagDb.createTag(data)
    tags.value.push(tag)
    return tag
  }

  async function updateTag(id: string, data: Partial<Tag>) {
    await tagDb.updateTag(id, data)
    const index = tags.value.findIndex(t => t.id === id)
    if (index !== -1) {
      tags.value[index] = { ...tags.value[index], ...data }
    }
  }

  async function removeTag(id: string) {
    await tagDb.deleteTag(id)
    tags.value = tags.value.filter(t => t.id !== id)
  }

  return { tags, tagOptions, fetchTags, addTag, updateTag, removeTag }
})
```

- [ ] **Step 3: 提交**

```bash
git add src/db/tag.ts src/stores/tag.ts
git commit -m "feat: add tag crud and store"
```

---

### Task 8: 手办 CRUD

**Files:**
- Create: `src/db/figurine.ts`
- Create: `src/stores/figurine.ts`

- [ ] **Step 1: 编写手办数据库操作**

创建 `src/db/figurine.ts`:

```typescript
import { v4 as uuidv4 } from 'uuid'
import { getDB } from './index'
import type { Figurine, FigurineStatus } from '@/types'

export async function getAllFigurines(): Promise<Figurine[]> {
  const db = await getDB()
  return db.getAll('figurines')
}

export async function getFigurineById(id: string): Promise<Figurine | undefined> {
  const db = await getDB()
  return db.get('figurines', id)
}

export async function getFigurinesByBatch(batchId: string): Promise<Figurine[]> {
  const db = await getDB()
  return db.getAllFromIndex('figurines', 'by-batch', batchId)
}

export async function getFigurinesByStatus(status: FigurineStatus): Promise<Figurine[]> {
  const db = await getDB()
  return db.getAllFromIndex('figurines', 'by-status', status)
}

export async function createFigurine(data: Omit<Figurine, 'id' | 'createdAt' | 'updatedAt'>): Promise<Figurine> {
  const db = await getDB()
  const now = Date.now()
  const figurine: Figurine = {
    ...data,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now
  }
  await db.add('figurines', figurine)
  return figurine
}

export async function updateFigurine(id: string, data: Partial<Figurine>): Promise<void> {
  const db = await getDB()
  const existing = await db.get('figurines', id)
  if (!existing) throw new Error('Figurine not found')
  await db.put('figurines', {
    ...existing,
    ...data,
    updatedAt: Date.now()
  })
}

export async function deleteFigurine(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('figurines', id)
}

export async function batchUpdateFigurines(ids: string[], data: Partial<Figurine>): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('figurines', 'readwrite')
  const now = Date.now()

  for (const id of ids) {
    const existing = await tx.store.get(id)
    if (existing) {
      await tx.store.put({ ...existing, ...data, updatedAt: now })
    }
  }

  await tx.done
}
```

- [ ] **Step 2: 编写手办状态管理**

创建 `src/stores/figurine.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Figurine, FigurineStatus } from '@/types'
import * as figurineDb from '@/db/figurine'

export const useFigurineStore = defineStore('figurine', () => {
  const figurines = ref<Figurine[]>([])
  const loading = ref(false)

  // 统计
  const statusCounts = computed(() => {
    const counts: Record<FigurineStatus, number> = {
      pending: 0,
      selling: 0,
      sold: 0,
      holding: 0
    }
    figurines.value.forEach(f => counts[f.status]++)
    return counts
  })

  async function fetchFigurines() {
    loading.value = true
    try {
      figurines.value = await figurineDb.getAllFigurines()
    } finally {
      loading.value = false
    }
  }

  async function addFigurine(data: Omit<Figurine, 'id' | 'createdAt' | 'updatedAt'>) {
    const figurine = await figurineDb.createFigurine(data)
    figurines.value.push(figurine)
    return figurine
  }

  async function updateFigurine(id: string, data: Partial<Figurine>) {
    await figurineDb.updateFigurine(id, data)
    const index = figurines.value.findIndex(f => f.id === id)
    if (index !== -1) {
      figurines.value[index] = { ...figurines.value[index], ...data, updatedAt: Date.now() }
    }
  }

  async function removeFigurine(id: string) {
    await figurineDb.deleteFigurine(id)
    figurines.value = figurines.value.filter(f => f.id !== id)
  }

  async function batchUpdate(ids: string[], data: Partial<Figurine>) {
    await figurineDb.batchUpdateFigurines(ids, data)
    const now = Date.now()
    figurines.value = figurines.value.map(f =>
      ids.includes(f.id) ? { ...f, ...data, updatedAt: now } : f
    )
  }

  return {
    figurines,
    loading,
    statusCounts,
    fetchFigurines,
    addFigurine,
    updateFigurine,
    removeFigurine,
    batchUpdate
  }
})
```

- [ ] **Step 3: 提交**

```bash
git add src/db/figurine.ts src/stores/figurine.ts
git commit -m "feat: add figurine crud and store"
```

---

### Task 9: 交易 CRUD

**Files:**
- Create: `src/db/trade.ts`
- Create: `src/stores/trade.ts`

- [ ] **Step 1: 编写交易数据库操作**

创建 `src/db/trade.ts`:

```typescript
import { v4 as uuidv4 } from 'uuid'
import { getDB } from './index'
import type { Trade } from '@/types'

export async function getAllTrades(): Promise<Trade[]> {
  const db = await getDB()
  return db.getAll('trades')
}

export async function getTradeById(id: string): Promise<Trade | undefined> {
  const db = await getDB()
  return db.get('trades', id)
}

export async function getTradesByFigurine(figurineId: string): Promise<Trade[]> {
  const db = await getDB()
  return db.getAllFromIndex('trades', 'by-figurine', figurineId)
}

export async function getActiveTradeByFigurine(figurineId: string): Promise<Trade | undefined> {
  const trades = await getTradesByFigurine(figurineId)
  return trades.find(t => t.isActive)
}

export async function createTrade(data: Omit<Trade, 'id'>): Promise<Trade> {
  const db = await getDB()
  const trade: Trade = { ...data, id: uuidv4() }
  await db.add('trades', trade)
  return trade
}

export async function updateTrade(id: string, data: Partial<Trade>): Promise<void> {
  const db = await getDB()
  const existing = await db.get('trades', id)
  if (!existing) throw new Error('Trade not found')
  await db.put('trades', { ...existing, ...data })
}

export async function deleteTrade(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('trades', id)
}

// 将同一手办的其他交易设为非活跃
export async function deactivateOtherTrades(figurineId: string, excludeId: string): Promise<void> {
  const db = await getDB()
  const trades = await getTradesByFigurine(figurineId)
  const tx = db.transaction('trades', 'readwrite')

  for (const trade of trades) {
    if (trade.id !== excludeId && trade.isActive) {
      await tx.store.put({ ...trade, isActive: false })
    }
  }

  await tx.done
}
```

- [ ] **Step 2: 编写交易状态管理**

创建 `src/stores/trade.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Trade } from '@/types'
import * as tradeDb from '@/db/trade'

export const useTradeStore = defineStore('trade', () => {
  const trades = ref<Trade[]>([])
  const loading = ref(false)

  // 统计
  const totalProfit = computed(() =>
    trades.value.reduce((sum, t) => sum + t.profit, 0)
  )

  const totalIncome = computed(() =>
    trades.value.reduce((sum, t) => sum + t.actualIncome, 0)
  )

  async function fetchTrades() {
    loading.value = true
    try {
      trades.value = await tradeDb.getAllTrades()
    } finally {
      loading.value = false
    }
  }

  async function addTrade(data: Omit<Trade, 'id'>) {
    const trade = await tradeDb.createTrade(data)
    if (data.isActive) {
      await tradeDb.deactivateOtherTrades(data.figurineId, trade.id)
    }
    trades.value.push(trade)
    return trade
  }

  async function updateTrade(id: string, data: Partial<Trade>) {
    const existing = trades.value.find(t => t.id === id)
    await tradeDb.updateTrade(id, data)

    if (data.isActive && existing) {
      await tradeDb.deactivateOtherTrades(existing.figurineId, id)
    }

    const index = trades.value.findIndex(t => t.id === id)
    if (index !== -1) {
      trades.value[index] = { ...trades.value[index], ...data }
    }
  }

  async function removeTrade(id: string) {
    await tradeDb.deleteTrade(id)
    trades.value = trades.value.filter(t => t.id !== id)
  }

  return {
    trades,
    loading,
    totalProfit,
    totalIncome,
    fetchTrades,
    addTrade,
    updateTrade,
    removeTrade
  }
})
```

- [ ] **Step 3: 提交**

```bash
git add src/db/trade.ts src/stores/trade.ts
git commit -m "feat: add trade crud and store"
```

---

## Phase 3: 工具函数

### Task 10: 利润计算工具

**Files:**
- Create: `src/utils/calculator.ts`

- [ ] **Step 1: 编写计算工具函数**

创建 `src/utils/calculator.ts`:

```typescript
import type { Figurine, Trade } from '@/types'

/**
 * 计算总成本
 */
export function calculateTotalCost(
  purchasePrice: number,
  shippingShare: number = 0,
  taxShare: number = 0
): number {
  return Math.round((purchasePrice + shippingShare + taxShare) * 100) / 100
}

/**
 * 计算咸鱼手续费
 */
export function calculateXianyuFee(sellPrice: number): number {
  const fee = sellPrice * 0.006
  return Math.max(0.1, Math.round(fee * 100) / 100)
}

/**
 * 计算实际收入
 */
export function calculateActualIncome(sellPrice: number, xianyuFee: number = 0): number {
  return Math.round((sellPrice - xianyuFee) * 100) / 100
}

/**
 * 计算利润
 */
export function calculateProfit(actualIncome: number, totalCost: number): number {
  return Math.round((actualIncome - totalCost) * 100) / 100
}

/**
 * 计算利润率
 */
export function calculateProfitRate(profit: number, totalCost: number): number {
  if (totalCost === 0) return 0
  return Math.round((profit / totalCost) * 10000) / 100
}

/**
 * 创建交易记录时计算所有财务字段
 */
export function calculateTradeFinancials(
  sellPrice: number,
  totalCost: number,
  hasXianyuFee: boolean = true
): Pick<Trade, 'xianyuFee' | 'actualIncome' | 'profit' | 'profitRate'> {
  const xianyuFee = hasXianyuFee ? calculateXianyuFee(sellPrice) : 0
  const actualIncome = calculateActualIncome(sellPrice, xianyuFee)
  const profit = calculateProfit(actualIncome, totalCost)
  const profitRate = calculateProfitRate(profit, totalCost)

  return { xianyuFee, actualIncome, profit, profitRate }
}

/**
 * 费用均摊计算
 */
export function calculateAverageShare(totalAmount: number, count: number): number {
  if (count === 0) return 0
  return Math.round((totalAmount / count) * 100) / 100
}

/**
 * 费用按权重分摊
 */
export function calculateWeightedShare(
  totalAmount: number,
  weights: number[]
): number[] {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  if (totalWeight === 0) return weights.map(() => 0)

  return weights.map(w =>
    Math.round((totalAmount * w / totalWeight) * 100) / 100
  )
}

/**
 * 判断利润率是否低于阈值
 */
export function isProfitBelowThreshold(profitRate: number, threshold: number = 10): boolean {
  return profitRate < threshold
}
```

- [ ] **Step 2: 提交**

```bash
git add src/utils/calculator.ts
git commit -m "feat: add calculator utilities"
```

---

### Task 11: 咸鱼工具

**Files:**
- Create: `src/utils/xianyu.ts`

- [ ] **Step 1: 编写咸鱼工具函数**

创建 `src/utils/xianyu.ts`:

```typescript
import type { Figurine } from '@/types'

/**
 * 生成咸鱼发布文案
 */
export function generateXianyuDescription(figurine: Figurine): string {
  const lines: string[] = []

  lines.push(`【${figurine.name}】`)
  lines.push('📦 状态：全新未拆，盒况良好')

  if (figurine.series) {
    lines.push(`✨ 系列：${figurine.series}`)
  }

  lines.push(`💰 入手价${figurine.totalCost}元，现特价出！`)
  lines.push('📍 发货：包全国包邮')

  return lines.join('\n')
}

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * 打开链接
 */
export function openLink(url: string): void {
  if (url) {
    window.open(url, '_blank')
  }
}

/**
 * 验证咸鱼链接
 */
export function isValidXianyuLink(url: string): boolean {
  return url.includes('goofish.com') || url.includes('2.taobao.com')
}
```

- [ ] **Step 2: 提交**

```bash
git add src/utils/xianyu.ts
git commit -m "feat: add xianyu utilities"
```

---

### Task 12: 导出工具

**Files:**
- Create: `src/utils/export.ts`

- [ ] **Step 1: 编写导出工具函数**

创建 `src/utils/export.ts`:

```typescript
import ExcelJS from 'exceljs'
import type { Figurine, Trade, Batch, Tag } from '@/types'

/**
 * 导出为 Excel
 */
export async function exportToExcel(
  data: {
    figurines?: Figurine[]
    trades?: Trade[]
    batches?: Batch[]
  },
  filename: string = 'figurine-export'
): Promise<void> {
  const workbook = new ExcelJS.Workbook()

  // 手办列表 Sheet
  if (data.figurines?.length) {
    const sheet = workbook.addWorksheet('手办列表')
    sheet.columns = [
      { header: '名称', key: 'name' },
      { header: '图片文件', key: 'imageFile' },
      { header: '系列', key: 'series' },
      { header: '状态', key: 'status' },
      { header: '买入价', key: 'purchasePrice' },
      { header: '运费分摊', key: 'shippingShare' },
      { header: '税费分摊', key: 'taxShare' },
      { header: '总成本', key: 'totalCost' },
      { header: '备注', key: 'remark' }
    ]
    sheet.addRows(data.figurines)
  }

  // 交易记录 Sheet
  if (data.trades?.length) {
    const sheet = workbook.addWorksheet('交易记录')
    sheet.columns = [
      { header: '手办ID', key: 'figurineId' },
      { header: '卖出价', key: 'sellPrice' },
      { header: '咸鱼手续费', key: 'xianyuFee' },
      { header: '实际收入', key: 'actualIncome' },
      { header: '利润', key: 'profit' },
      { header: '利润率', key: 'profitRate' },
      { header: '买家', key: 'buyerName' },
      { header: '卖出时间', key: 'soldAt' }
    ]
    sheet.addRows(data.trades)
  }

  // 批次 Sheet
  if (data.batches?.length) {
    const sheet = workbook.addWorksheet('批次')
    sheet.columns = [
      { header: '名称', key: 'name' },
      { header: '图片范围', key: 'imageRange' },
      { header: '总运费', key: 'totalShipping' },
      { header: '总税费', key: 'totalTax' }
    ]
    sheet.addRows(data.batches)
  }

  // 下载文件
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  downloadBlob(blob, `${filename}.xlsx`)
}

/**
 * 导出为 JSON
 */
export function exportToJSON(
  data: object,
  filename: string = 'figurine-backup'
): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  downloadBlob(blob, `${filename}.json`)
}

/**
 * 导出为 CSV
 */
export function exportToCSV(
  items: object[],
  filename: string = 'figurine-export'
): void {
  if (!items.length) return

  const headers = Object.keys(items[0])
  const rows = [
    headers.join(','),
    ...items.map(item =>
      headers.map(h => {
        const val = (item as any)[h]
        return typeof val === 'string' && val.includes(',')
          ? `"${val}"`
          : val ?? ''
      }).join(',')
    )
  ]

  const csv = '\uFEFF' + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  downloadBlob(blob, `${filename}.csv`)
}

/**
 * 下载 Blob
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 2: 提交**

```bash
git add src/utils/export.ts
git commit -m "feat: add export utilities"
```

---

## Phase 4: 图片处理

### Task 13: 图片目录状态管理

**Files:**
- Create: `src/stores/image.ts`

- [ ] **Step 1: 编写图片状态管理**

创建 `src/stores/image.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getDB } from '@/db/index'

export const useImageStore = defineStore('image', () => {
  const directoryHandle = ref<FileSystemDirectoryHandle | null>(null)
  const imageFiles = ref<Map<string, File>>(new Map())
  const thumbnailCache = ref<Map<string, Blob>>(new Map())
  const loading = ref(false)

  /**
   * 选择图片目录
   */
  async function selectImageDirectory(): Promise<boolean> {
    try {
      const handle = await (window as any).showDirectoryPicker()
      directoryHandle.value = handle

      // 保存句柄到 IndexedDB
      const db = await getDB()
      await db.put('directoryHandle', { id: 'imageDirectory', handle })

      // 扫描图片文件
      await scanImages()

      return true
    } catch (error) {
      console.error('Failed to select directory:', error)
      return false
    }
  }

  /**
   * 扫描目录中的图片文件
   */
  async function scanImages(): Promise<void> {
    if (!directoryHandle.value) return

    loading.value = true
    imageFiles.value.clear()

    try {
      for await (const entry of directoryHandle.value.values()) {
        if (entry.kind === 'file' && isImageFile(entry.name)) {
          const file = await entry.getFile()
          imageFiles.value.set(entry.name, file)
        }
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 解析图片文件名，提取手办序号
   */
  function parseImageName(filename: string): number[] {
    const name = filename.replace(/\.[^.]+$/, '')

    // 匹配 "1" 或 "1-5" 或 "10-15" 格式
    const match = name.match(/^(\d+)(?:-(\d+))?$/)
    if (!match) return []

    const start = parseInt(match[1], 10)
    const end = match[2] ? parseInt(match[2], 10) : start

    if (start > end) return []

    const indices: number[] = []
    for (let i = start; i <= end; i++) {
      indices.push(i)
    }
    return indices
  }

  /**
   * 获取图片缩略图
   */
  async function getThumbnail(filename: string): Promise<Blob | null> {
    // 检查缓存
    if (thumbnailCache.value.has(filename)) {
      return thumbnailCache.value.get(filename)!
    }

    const file = imageFiles.value.get(filename)
    if (!file) return null

    // 生成缩略图
    const thumbnail = await generateThumbnail(file)
    if (thumbnail) {
      thumbnailCache.value.set(filename, thumbnail)

      // 保存到 IndexedDB
      const db = await getDB()
      await db.put('imageCache', { id: filename, thumbnail, originalSize: file.size })
    }

    return thumbnail
  }

  /**
   * 生成缩略图
   */
  async function generateThumbnail(file: File, size: number = 200): Promise<Blob | null> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size

        const ctx = canvas.getContext('2d')!
        const scale = Math.min(size / img.width, size / img.height)
        const w = img.width * scale
        const h = img.height * scale
        const x = (size - w) / 2
        const y = (size - h) / 2

        ctx.fillStyle = '#f0f0f0'
        ctx.fillRect(0, 0, size, size)
        ctx.drawImage(img, x, y, w, h)

        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8)
      }
      img.onerror = () => resolve(null)
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * 获取原图 URL
   */
  function getImageUrl(filename: string): string | null {
    const file = imageFiles.value.get(filename)
    return file ? URL.createObjectURL(file) : null
  }

  /**
   * 恢复目录句柄
   */
  async function restoreDirectoryHandle(): Promise<boolean> {
    try {
      const db = await getDB()
      const stored = await db.get('directoryHandle', 'imageDirectory')

      if (stored?.handle) {
        // 验证权限
        const permission = await (stored.handle as any).queryPermission()
        if (permission === 'granted') {
          directoryHandle.value = stored.handle
          await scanImages()
          return true
        }
      }
    } catch (error) {
      console.error('Failed to restore directory handle:', error)
    }
    return false
  }

  return {
    directoryHandle,
    imageFiles,
    thumbnailCache,
    loading,
    selectImageDirectory,
    scanImages,
    parseImageName,
    getThumbnail,
    getImageUrl,
    restoreDirectoryHandle
  }
})

function isImageFile(filename: string): boolean {
  const ext = filename.toLowerCase().split('.').pop()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')
}
```

- [ ] **Step 2: 提交**

```bash
git add src/stores/image.ts
git commit -m "feat: add image store with thumbnail generation"
```

---

## Phase 5: 页面实现

### Task 14: 统计看板页面

**Files:**
- Create: `src/views/Dashboard.vue`

- [ ] **Step 1: 创建统计看板页面**

创建 `src/views/Dashboard.vue`:

```vue
<template>
  <Layout>
    <div class="dashboard">
      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stat-cards">
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="stat-card">
              <div class="stat-label">总投入</div>
              <div class="stat-value expense">¥ {{ totalCost.toFixed(2) }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="stat-card">
              <div class="stat-label">总收益</div>
              <div class="stat-value income">¥ {{ totalIncome.toFixed(2) }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="stat-card">
              <div class="stat-label">总利润</div>
              <div class="stat-value profit">¥ {{ totalProfit.toFixed(2) }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="stat-card">
              <div class="stat-label">平均利润率</div>
              <div class="stat-value rate">{{ avgProfitRate.toFixed(1) }}%</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 库存状态 -->
      <el-card class="status-card">
        <template #header>
          <span>库存状态</span>
        </template>
        <div class="status-list">
          <span class="status-item">
            <el-tag type="primary">在售</el-tag>
            <span class="count">{{ figurineStore.statusCounts.selling }}</span>
          </span>
          <span class="status-item">
            <el-tag type="success">已出</el-tag>
            <span class="count">{{ figurineStore.statusCounts.sold }}</span>
          </span>
          <span class="status-item">
            <el-tag type="warning">囤货</el-tag>
            <span class="count">{{ figurineStore.statusCounts.holding }}</span>
          </span>
          <span class="status-item">
            <el-tag type="info">待录入</el-tag>
            <span class="count">{{ figurineStore.statusCounts.pending }}</span>
          </span>
        </div>
      </el-card>

      <!-- 最近交易 -->
      <el-card class="recent-trades">
        <template #header>
          <span>最近交易</span>
        </template>
        <el-table :data="recentTrades" style="width: 100%">
          <el-table-column prop="soldAt" label="时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.soldAt) }}
            </template>
          </el-table-column>
          <el-table-column prop="figurineName" label="手办" />
          <el-table-column prop="sellPrice" label="卖出价" width="120">
            <template #default="{ row }">
              ¥{{ row.sellPrice }}
            </template>
          </el-table-column>
          <el-table-column prop="profit" label="利润" width="120">
            <template #default="{ row }">
              <span :class="row.profit >= 0 ? 'profit-text' : 'loss-text'">
                {{ row.profit >= 0 ? '+' : '' }}¥{{ row.profit }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import Layout from '@/components/Layout.vue'
import { useFigurineStore } from '@/stores/figurine'
import { useTradeStore } from '@/stores/trade'
import dayjs from 'dayjs'

const figurineStore = useFigurineStore()
const tradeStore = useTradeStore()

const totalCost = computed(() =>
  figurineStore.figurines.reduce((sum, f) => sum + f.totalCost, 0)
)

const totalIncome = computed(() => tradeStore.totalIncome)
const totalProfit = computed(() => tradeStore.totalProfit)

const avgProfitRate = computed(() => {
  const trades = tradeStore.trades.filter(t => t.isActive)
  if (trades.length === 0) return 0
  return trades.reduce((sum, t) => sum + t.profitRate, 0) / trades.length
})

const recentTrades = computed(() => {
  const trades = [...tradeStore.trades]
    .sort((a, b) => b.soldAt - a.soldAt)
    .slice(0, 10)

  return trades.map(t => {
    const figurine = figurineStore.figurines.find(f => f.id === t.figurineId)
    return {
      ...t,
      figurineName: figurine?.name || '未知'
    }
  })
})

function formatDate(timestamp: number): string {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm')
}

onMounted(async () => {
  await Promise.all([
    figurineStore.fetchFigurines(),
    tradeStore.fetchTrades()
  ])
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stat-cards .stat-card {
  text-align: center;
  padding: 10px 0;
}

.stat-label {
  color: #909399;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
}

.stat-value.expense { color: #f56c6c; }
.stat-value.income { color: #67c23a; }
.stat-value.profit { color: #409eff; }
.stat-value.rate { color: #e6a23c; }

.status-card .status-list {
  display: flex;
  gap: 30px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-item .count {
  font-size: 18px;
  font-weight: bold;
}

.profit-text { color: #67c23a; }
.loss-text { color: #f56c6c; }
</style>
```

- [ ] **Step 2: 提交**

```bash
git add src/views/Dashboard.vue
git commit -m "feat: add dashboard page"
```

---

### Task 15: 手办列表页面

**Files:**
- Create: `src/views/FigurineList.vue`
- Create: `src/components/FigurineCard.vue`
- Create: `src/components/FigurineForm.vue`

这些页面组件较大，建议分为多个子任务并行实现。

---

## 后续任务

由于篇幅限制，以下任务以列表形式列出：

- Task 16: 手办卡片组件 (FigurineCard.vue)
- Task 17: 手办编辑表单 (FigurineForm.vue)
- Task 18: 批次管理页面 (BatchManage.vue)
- Task 19: 批次表单组件 (BatchForm.vue)
- Task 20: 费用分摊弹窗 (CostShareDialog.vue)
- Task 21: 交易记录页面 (TradeRecords.vue)
- Task 22: 交易表单组件 (TradeForm.vue)
- Task 23: 标签管理页面 (TagManage.vue)
- Task 24: 导出弹窗 (ExportDialog.vue)
- Task 25: 集成测试与优化

---

## 执行建议

本计划适合使用 **Agent Team** 并行开发，建议分组：

1. **数据层组** (Task 6-9): 批次、标签、手办、交易的 CRUD
2. **工具函数组** (Task 10-12): 计算器、咸鱼、导出工具
3. **图片处理组** (Task 13): 图片目录管理和缩略图
4. **UI组件组** (Task 14-24): 各页面和组件

每组可独立开发，最后集成测试。