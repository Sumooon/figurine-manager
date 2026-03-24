<template>
  <el-dialog
    :model-value="visible"
    title="导出数据"
    width="500px"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form label-width="100px">
      <el-form-item label="导出内容">
        <el-checkbox-group v-model="exportContent">
          <el-checkbox label="figurines">手办列表</el-checkbox>
          <el-checkbox label="trades">交易记录</el-checkbox>
          <el-checkbox label="batches">批次汇总</el-checkbox>
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

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="exporting" @click="handleExport">
        导出
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useFigurineStore } from '@/stores/figurine'
import { useTradeStore } from '@/stores/trade'
import { useBatchStore } from '@/stores/batch'
import { exportToExcel, exportToCSV, exportToJSON } from '@/utils/export'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const figurineStore = useFigurineStore()
const tradeStore = useTradeStore()
const batchStore = useBatchStore()

const exportContent = ref(['figurines', 'trades', 'batches'])
const exportFormat = ref('excel')
const exporting = ref(false)

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

    const timestamp = new Date().toISOString().slice(0, 10)
    const filename = `figurine-export-${timestamp}`

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
    emit('update:visible', false)
  } catch (error) {
    ElMessage.error('导出失败')
    console.error(error)
  } finally {
    exporting.value = false
  }
}
</script>