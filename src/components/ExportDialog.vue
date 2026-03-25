<template>
  <el-dialog
    :model-value="visible"
    title="数据管理"
    width="600px"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-tabs v-model="activeTab">
      <!-- 导出 -->
      <el-tab-pane label="导出数据" name="export">
        <el-form label-width="100px">
          <el-form-item label="导出内容">
            <el-checkbox-group v-model="exportContent">
              <el-checkbox label="figurines">手办列表</el-checkbox>
              <el-checkbox label="trades">交易记录</el-checkbox>
              <el-checkbox label="batches">批次汇总</el-checkbox>
              <el-checkbox label="tags">标签</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="导出格式">
            <el-radio-group v-model="exportFormat">
              <el-radio label="excel">Excel (.xlsx)</el-radio>
              <el-radio label="csv">CSV</el-radio>
              <el-radio label="json">JSON (备份)</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 导入 -->
      <el-tab-pane label="导入数据" name="import">
        <el-alert type="warning" :closable="false" style="margin-bottom: 16px">
          导入会覆盖现有数据，请先导出备份
        </el-alert>
        <el-upload
          drag
          accept=".json"
          :auto-upload="false"
          :on-change="handleFileSelect"
          :show-file-list="false"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            拖拽 JSON 备份文件到此处，或 <em>点击选择</em>
          </div>
        </el-upload>
        <div v-if="importPreview" class="import-preview">
          <p>即将导入：</p>
          <ul>
            <li v-if="importPreview.figurines">手办: {{ importPreview.figurines.length }} 条</li>
            <li v-if="importPreview.trades">交易: {{ importPreview.trades.length }} 条</li>
            <li v-if="importPreview.batches">批次: {{ importPreview.batches.length }} 条</li>
            <li v-if="importPreview.tags">标签: {{ importPreview.tags.length }} 条</li>
          </ul>
        </div>
      </el-tab-pane>

      <!-- 批量导入 -->
      <el-tab-pane label="批量创建" name="batch">
        <el-alert type="info" :closable="false" style="margin-bottom: 16px">
          根据图片文件名自动创建手办，如 1.jpg 创建序号 1 的手办
        </el-alert>
        <el-form label-width="100px">
          <el-form-item label="默认批次">
            <el-select v-model="batchImportBatch" clearable placeholder="可选">
              <el-option
                v-for="b in batchStore.batchOptions"
                :key="b.value"
                :label="b.label"
                :value="b.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="默认状态">
            <el-select v-model="batchImportStatus">
              <el-option label="待录入" value="pending" />
              <el-option label="在售" value="selling" />
              <el-option label="囤货" value="holding" />
            </el-select>
          </el-form-item>
        </el-form>
        <div class="batch-preview">
          <p>待创建: {{ batchImportCount }} 个手办</p>
          <el-button type="primary" :disabled="batchImportCount === 0" @click="handleBatchImport">
            批量创建
          </el-button>
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">关闭</el-button>
      <el-button v-if="activeTab === 'export'" type="primary" :loading="exporting" @click="handleExport">
        导出
      </el-button>
      <el-button v-if="activeTab === 'import' && importPreview" type="primary" :loading="importing" @click="handleImport">
        确认导入
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useFigurineStore } from '@/stores/figurine'
import { useTradeStore } from '@/stores/trade'
import { useBatchStore } from '@/stores/batch'
import { useTagStore } from '@/stores/tag'
import { useImageStore } from '@/stores/image'
import { exportToExcel, exportToCSV, exportToJSON, importFromJSON } from '@/utils/export'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const figurineStore = useFigurineStore()
const tradeStore = useTradeStore()
const batchStore = useBatchStore()
const tagStore = useTagStore()
const imageStore = useImageStore()

const activeTab = ref('export')
const exportContent = ref(['figurines', 'trades', 'batches', 'tags'])
const exportFormat = ref('json')
const exporting = ref(false)
const importing = ref(false)
const importPreview = ref<any>(null)
const selectedFile = ref<File | null>(null)

// 批量导入
const batchImportBatch = ref('')
const batchImportStatus = ref<'pending' | 'selling' | 'holding'>('pending')

const batchImportCount = computed(() => {
  return imageStore.imageList.filter(filename => {
    const indices = imageStore.parseImageName(filename)
    return indices.length > 0 && !figurineStore.figurines.some(f => f.imageFile === filename)
  }).length
})

async function handleExport() {
  if (exportContent.value.length === 0) {
    ElMessage.warning('请至少选择一项导出内容')
    return
  }

  exporting.value = true
  try {
    const data: any = {}

    if (exportContent.value.includes('figurines')) {
      data.figurines = figurineStore.figurines
    }

    if (exportContent.value.includes('trades')) {
      data.trades = tradeStore.trades
    }

    if (exportContent.value.includes('batches')) {
      data.batches = batchStore.batches
    }

    if (exportContent.value.includes('tags')) {
      data.tags = tagStore.tags
    }

    const timestamp = new Date().toISOString().slice(0, 10)
    const filename = `figurine-backup-${timestamp}`

    switch (exportFormat.value) {
      case 'excel':
        await exportToExcel(data, filename)
        break
      case 'csv':
        if (data.figurines) {
          exportToCSV(data.figurines, `${filename}-figurines`)
        }
        if (data.trades) {
          exportToCSV(data.trades, `${filename}-trades`)
        }
        break
      case 'json':
        exportToJSON(data, filename)
        break
    }

    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
    console.error(error)
  } finally {
    exporting.value = false
  }
}

async function handleFileSelect(file: any) {
  selectedFile.value = file.raw
  try {
    importPreview.value = await importFromJSON(file.raw)
    ElMessage.success('文件解析成功，请确认导入')
  } catch (error: any) {
    ElMessage.error(error.message || '解析失败')
    importPreview.value = null
  }
}

async function handleImport() {
  if (!importPreview.value) return

  try {
    await ElMessageBox.confirm('导入将覆盖现有数据，确定继续？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }

  importing.value = true
  try {
    // 将 Vue 响应式对象转换为纯 JavaScript 对象
    const data = JSON.parse(JSON.stringify(importPreview.value))

    if (data.figurines) {
      await figurineStore.replaceAll(data.figurines)
    }
    if (data.trades) {
      await tradeStore.replaceAll(data.trades)
    }
    if (data.batches) {
      await batchStore.replaceAll(data.batches)
    }
    if (data.tags) {
      await tagStore.replaceAll(data.tags)
    }

    ElMessage.success('导入成功')
    importPreview.value = null
    selectedFile.value = null
    emit('update:visible', false)
  } catch (error) {
    ElMessage.error('导入失败')
    console.error(error)
  } finally {
    importing.value = false
  }
}

async function handleBatchImport() {
  const toCreate = imageStore.imageList.filter(filename => {
    const indices = imageStore.parseImageName(filename)
    return indices.length > 0 && !figurineStore.figurines.some(f => f.imageFile === filename)
  })

  if (toCreate.length === 0) {
    ElMessage.warning('没有可创建的手办')
    return
  }

  try {
    await ElMessageBox.confirm(`将创建 ${toCreate.length} 个手办，确定继续？`, '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }

  let created = 0
  for (const filename of toCreate) {
    const indices = imageStore.parseImageName(filename)
    if (indices.length > 0) {
      await figurineStore.addFigurine({
        name: `手办 #${indices[0]}`,
        imageFile: filename,
        imageIndex: indices[0],
        series: '',
        batchId: batchImportBatch.value || undefined,
        status: batchImportStatus.value,
        purchasePrice: 0,
        shippingShare: 0,
        taxShare: 0,
        totalCost: 0,
        tagIds: [],
        remark: ''
      })
      created++
    }
  }

  ElMessage.success(`成功创建 ${created} 个手办`)
  emit('update:visible', false)
}
</script>

<style scoped>
.import-preview {
  margin-top: 16px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

.import-preview ul {
  margin: 8px 0 0;
  padding-left: 20px;
}

.batch-preview {
  text-align: center;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 4px;
}

.batch-preview p {
  margin-bottom: 12px;
  font-size: 16px;
}
</style>