# 手办编辑弹窗集成交易信息 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在手办编辑弹窗中集成交易信息编辑功能，避免页面跳转

**Architecture:** 在 FigurineForm.vue 底部增加可折叠的交易信息面板，展开时加载并编辑交易记录，保存时串行保存手办和交易信息

**Tech Stack:** Vue 3 Composition API, Element Plus, Pinia, TypeScript

---

## 文件变更概览

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/stores/trade.ts` | 修改 | 新增 `getActiveTradeByFigurineId` 方法 |
| `src/components/FigurineForm.vue` | 修改 | 集成交易信息折叠面板 |

---

### Task 1: 扩展 TradeStore 方法

**Files:**
- Modify: `src/stores/trade.ts`

- [ ] **Step 1: 添加 getActiveTradeByFigurineId 方法**

在 `src/stores/trade.ts` 的 return 语句之前添加：

```typescript
async function getActiveTradeByFigurineId(figurineId: string): Promise<Trade | undefined> {
  return await tradeDb.getActiveTradeByFigurine(figurineId)
}
```

更新 return 对象，添加新方法：

```typescript
return {
  trades,
  loading,
  totalProfit,
  totalIncome,
  fetchTrades,
  addTrade,
  updateTrade,
  removeTrade,
  replaceAll,
  getActiveTradeByFigurineId
}
```

- [ ] **Step 2: 验证类型正确**

运行: `yarn build`
预期: 构建成功，无类型错误

- [ ] **Step 3: 提交**

```bash
git add src/stores/trade.ts
git commit -m "feat(trade): add getActiveTradeByFigurineId method"
```

---

### Task 2: 修改 FigurineForm 增加交易信息面板

**Files:**
- Modify: `src/components/FigurineForm.vue`

- [ ] **Step 1: 更新 imports**

修改现有的类型导入（约第121行），添加 `Trade` 类型：

```typescript
import type { Figurine, FigurineStatus, Trade } from '@/types'
```

修改现有的 calculator 导入（约第126行），添加 `calculateTradeFinancials`：

```typescript
import { calculateTotalCost, calculateTradeFinancials } from '@/utils/calculator'
```

添加 trade store 导入：

```typescript
import { useTradeStore } from '@/stores/trade'
```

修改 ElMessage 导入，添加 `ElMessageBox`：

```typescript
import { ElMessage, ElMessageBox } from 'element-plus'
```

在现有 store 声明后添加：

```typescript
const tradeStore = useTradeStore()
```

- [ ] **Step 2: 添加交易相关响应式状态**

在 `const saving = ref(false)` 之后添加：

```typescript
// 交易信息相关（el-collapse v-model 需要数组类型）
const activeCollapseNames = ref<string[]>([])
const existingTrade = ref<Trade | undefined>()

const tradeForm = ref({
  sellPrice: 0,
  xianyuFee: 0,
  actualIncome: 0,
  profit: 0,
  profitRate: 0,
  soldAt: Date.now(),
  remark: ''
})
```

- [ ] **Step 3: 添加交易面板标题计算属性**

在 `const imagePreview` 计算属性之后添加：

```typescript
const tradePanelTitle = computed(() => {
  if (existingTrade.value) {
    return `交易信息 - 已售 ¥${existingTrade.value.sellPrice}`
  }
  return '交易信息'
})

const profitClass = computed(() =>
  tradeForm.value.profit >= 0 ? 'profit-positive' : 'profit-negative'
)
```

- [ ] **Step 4: 添加交易面板展开时的数据加载逻辑**

在现有 watch 之后添加新的 watch：

```typescript
watch(activeCollapseNames, async (names) => {
  if (names.includes('trade') && props.figurine) {
    await tradeStore.fetchTrades()
    const trade = await tradeStore.getActiveTradeByFigurineId(props.figurine.id)
    existingTrade.value = trade

    if (trade) {
      tradeForm.value = {
        sellPrice: trade.sellPrice,
        xianyuFee: trade.xianyuFee || 0,
        actualIncome: trade.actualIncome,
        profit: trade.profit,
        profitRate: trade.profitRate,
        soldAt: trade.soldAt,
        remark: trade.remark || ''
      }
    } else {
      resetTradeForm()
    }
  }
})
```

添加 resetTradeForm 函数：

```typescript
function resetTradeForm() {
  tradeForm.value = {
    sellPrice: 0,
    xianyuFee: 0,
    actualIncome: 0,
    profit: 0,
    profitRate: 0,
    soldAt: Date.now(),
    remark: ''
  }
}
```

- [ ] **Step 5: 添加交易利润重新计算函数**

在 resetTradeForm 之后添加：

```typescript
function recalculateTrade() {
  if (tradeForm.value.sellPrice > 0 && props.figurine) {
    const financials = calculateTradeFinancials(tradeForm.value.sellPrice, props.figurine.totalCost)
    tradeForm.value.xianyuFee = financials.xianyuFee
    tradeForm.value.actualIncome = financials.actualIncome
    tradeForm.value.profit = financials.profit
    tradeForm.value.profitRate = financials.profitRate
  }
}
```

- [ ] **Step 6: 添加删除交易函数**

在 recalculateTrade 之后添加：

```typescript
async function handleDeleteTrade() {
  if (!existingTrade.value) return

  try {
    await ElMessageBox.confirm(
      '确定删除该交易记录吗？删除后手办状态将改为"在售"。',
      '确认删除',
      { type: 'warning' }
    )

    await tradeStore.removeTrade(existingTrade.value.id)

    // 更新手办状态为"在售"
    if (props.figurine) {
      await figurineStore.updateFigurine(props.figurine.id, { status: 'selling' })
    }

    existingTrade.value = undefined
    resetTradeForm()

    ElMessage.success('删除成功')
    emit('saved')
  } catch {
    // 用户取消
  }
}
```

- [ ] **Step 7: 修改 handleSubmit 函数，集成交易保存逻辑**

替换现有的 handleSubmit 函数：

```typescript
async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid) return

  saving.value = true
  try {
    const data = {
      ...form.value,
      totalCost: totalCost.value
    }

    // 1. 保存手办信息
    if (isEdit.value && props.figurine) {
      await figurineStore.updateFigurine(props.figurine.id, data)
    } else {
      await figurineStore.addFigurine({
        ...data,
        imageIndex: 1
      } as any)
    }

    // 2. 如果交易面板展开且有卖出价，保存交易信息
    if (activeCollapseNames.value.includes('trade') && tradeForm.value.sellPrice > 0 && props.figurine) {
      const tradeData = {
        figurineId: props.figurine.id,
        ...tradeForm.value,
        isActive: true
      }

      try {
        if (existingTrade.value) {
          await tradeStore.updateTrade(existingTrade.value.id, tradeData)
        } else {
          await tradeStore.addTrade(tradeData as Omit<Trade, 'id'>)
        }

        // 交易保存成功，更新手办状态为"已出"
        await figurineStore.updateFigurine(props.figurine.id, { status: 'sold' })
      } catch (error) {
        ElMessage.error('手办保存成功，但交易保存失败')
        emit('saved')
        handleClose()
        return
      }
    }

    ElMessage.success('保存成功')
    emit('saved')
    handleClose()
  } finally {
    saving.value = false
  }
}
```

- [ ] **Step 8: 修改 handleClose 函数，重置交易相关状态**

替换现有的 handleClose 函数：

```typescript
function handleClose() {
  emit('update:visible', false)
  resetForm()
  existingTrade.value = undefined
  resetTradeForm()
  activeCollapseNames.value = []
}
```

- [ ] **Step 9: 修改模板，增加交易信息折叠面板**

将弹窗宽度从 `width="600px"` 改为 `width="800px"`。

在 `</el-form>` 标签之后、`<template #footer>` 之前添加：

```vue
<!-- 交易信息折叠面板 -->
<el-collapse v-model="activeCollapseNames" class="trade-collapse">
  <el-collapse-item :title="tradePanelTitle" name="trade">
    <el-form label-width="100px">
      <el-form-item label="卖出价">
        <el-input-number
          v-model="tradeForm.sellPrice"
          :min="0"
          :precision="2"
          @change="recalculateTrade"
        />
      </el-form-item>

      <el-form-item label="总成本">
        <span>¥{{ (figurine?.totalCost ?? totalCost).toFixed(2) }}</span>
      </el-form-item>

      <el-form-item label="咸鱼手续费">
        <span>¥{{ tradeForm.xianyuFee?.toFixed(2) || '0.00' }}</span>
      </el-form-item>

      <el-form-item label="实际收入">
        <span>¥{{ tradeForm.actualIncome?.toFixed(2) || '0.00' }}</span>
      </el-form-item>

      <el-form-item label="利润">
        <span :class="profitClass">
          ¥{{ tradeForm.profit?.toFixed(2) || '0.00' }} ({{ tradeForm.profitRate?.toFixed(1) || 0 }}%)
        </span>
      </el-form-item>

      <el-form-item label="卖出时间">
        <el-date-picker
          v-model="tradeForm.soldAt"
          type="datetime"
          placeholder="选择时间"
          value-format="timestamp"
        />
      </el-form-item>

      <el-form-item label="备注">
        <el-input v-model="tradeForm.remark" type="textarea" :rows="2" />
      </el-form-item>

      <el-form-item v-if="existingTrade">
        <el-button type="danger" plain @click="handleDeleteTrade">
          删除交易
        </el-button>
      </el-form-item>
    </el-form>
  </el-collapse-item>
</el-collapse>
```

- [ ] **Step 10: 添加交易面板样式**

在 `<style scoped>` 中添加：

```css
.trade-collapse {
  margin-top: 16px;
  border-top: 1px solid #eee;
  padding-top: 16px;
}

.profit-positive {
  color: #67c23a;
  font-weight: bold;
}

.profit-negative {
  color: #f56c6c;
  font-weight: bold;
}
```

- [ ] **Step 11: 验证构建**

运行: `yarn build`
预期: 构建成功，无类型错误

- [ ] **Step 12: 提交**

```bash
git add src/components/FigurineForm.vue
git commit -m "feat: integrate trade info panel into figurine form"
```

---

### Task 3: 更新版本号

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 更新版本号**

将 `version` 从 `1.3.2` 改为 `1.3.3`

- [ ] **Step 2: 提交**

```bash
git add package.json
git commit -m "chore: bump version to 1.3.3"
```

---

### Task 4: 最终验证

- [ ] **Step 1: 运行开发服务器验证功能**

运行: `yarn dev`
预期: 服务启动成功

手动验证：
1. 打开手办列表，编辑一个手办
2. 展开"交易信息"面板
3. 输入卖出价，验证利润自动计算
4. 保存，验证手办状态变为"已出"
5. 再次编辑，验证交易信息正确回显
6. 点击"删除交易"，验证删除成功且状态变为"在售"

- [ ] **Step 2: 推送到远程**

```bash
git push
```