<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '编辑批次' : '新增批次'"
    width="500px"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="批次名称" prop="name">
        <el-input v-model="form.name" placeholder="如: 2024-01 日本代购" />
      </el-form-item>

      <el-form-item label="图片范围" prop="imageRange">
        <el-input v-model="form.imageRange" placeholder="如: 1-85 或 1-3,7-9,15" />
        <div class="form-tip">支持连续范围(1-10)和单个数字(1,3,5)，可混合使用</div>
      </el-form-item>

      <el-form-item label="总运费">
        <el-input-number v-model="form.totalShipping" :min="0" :precision="2" />
      </el-form-item>

      <el-form-item label="总税费">
        <el-input-number v-model="form.totalTax" :min="0" :precision="2" />
      </el-form-item>

      <el-form-item label="分摊方式" prop="shareMode">
        <el-radio-group v-model="form.shareMode">
          <el-radio label="average">按数量均摊</el-radio>
          <el-radio label="custom">自定义比例</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSubmit">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { Batch } from '@/types'
import { useBatchStore } from '@/stores/batch'
import { useFigurineStore } from '@/stores/figurine'
import { calculateAverageShare, calculateTotalCost } from '@/utils/calculator'

const props = defineProps<{
  visible: boolean
  batch?: Batch
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  saved: []
}>()

const batchStore = useBatchStore()
const figurineStore = useFigurineStore()

const formRef = ref<FormInstance>()
const saving = ref(false)

const isEdit = computed(() => !!props.batch)

const form = ref({
  name: '',
  imageRange: '',
  totalShipping: 0,
  totalTax: 0,
  shareMode: 'average' as 'average' | 'custom'
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入批次名称', trigger: 'blur' }],
  imageRange: [{ required: true, message: '请输入图片范围', trigger: 'blur' }],
  shareMode: [{ required: true, message: '请选择分摊方式', trigger: 'change' }]
}

watch([() => props.visible, () => props.batch], ([visible, batch]) => {
  if (visible && batch) {
    form.value = {
      name: batch.name,
      imageRange: batch.imageRange,
      totalShipping: batch.totalShipping || 0,
      totalTax: batch.totalTax || 0,
      shareMode: batch.shareMode
    }
  } else if (!visible) {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  form.value = {
    name: '',
    imageRange: '',
    totalShipping: 0,
    totalTax: 0,
    shareMode: 'average'
  }
}

// 解析图片范围，如 "1-85" 或 "1,3,5-10"
function parseImageRange(range: string): { indices: number[]; error?: string } {
  const indices: number[] = []
  const parts = range.split(',').map(p => p.trim()).filter(p => p)

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map(s => s.trim())

      // 校验格式
      if (!startStr || !endStr) {
        return { indices: [], error: `范围格式错误: "${part}"，应为 "起始-结束"` }
      }

      const start = parseInt(startStr)
      const end = parseInt(endStr)

      // 校验是否为有效数字
      if (isNaN(start) || isNaN(end)) {
        return { indices: [], error: `范围包含无效数字: "${part}"` }
      }

      // 校验范围有效性
      if (start > end) {
        return { indices: [], error: `范围起始大于结束: "${part}"` }
      }

      if (start < 1) {
        return { indices: [], error: `范围起始必须大于 0: "${part}"` }
      }

      for (let i = start; i <= end; i++) {
        if (!indices.includes(i)) {
          indices.push(i)
        }
      }
    } else {
      const num = parseInt(part)

      // 校验是否为有效数字
      if (isNaN(num)) {
        return { indices: [], error: `无效数字: "${part}"` }
      }

      if (num < 1) {
        return { indices: [], error: `数字必须大于 0: "${part}"` }
      }

      if (!indices.includes(num)) {
        indices.push(num)
      }
    }
  }

  return { indices: indices.sort((a, b) => a - b) }
}

function handleClose() {
  emit('update:visible', false)
  resetForm()
}

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid) return

  // 验证图片范围格式
  const { indices, error } = parseImageRange(form.value.imageRange)
  if (error) {
    ElMessage.error(error)
    return
  }

  if (indices.length === 0) {
    ElMessage.error('请输入有效的图片范围')
    return
  }

  saving.value = true
  try {
    const totalShipping = form.value.totalShipping || 0
    const totalTax = form.value.totalTax || 0

    if (isEdit.value && props.batch) {
      await batchStore.updateBatch(props.batch.id, form.value)

      // 更新手办关联
      // 1. 将范围内的手办关联到此批次
      const figurinesToLink = figurineStore.figurines.filter(
        f => indices.includes(f.imageIndex) && f.batchId !== props.batch!.id
      )
      // 2. 将不在范围内的手办解除关联
      const figurinesToUnlink = figurineStore.figurines.filter(
        f => !indices.includes(f.imageIndex) && f.batchId === props.batch!.id
      )

      // 3. 当前批次内所有手办（用于费用分摊）
      const currentFigurines = figurineStore.figurines.filter(
        f => indices.includes(f.imageIndex)
      )

      const hasChanges = figurinesToLink.length > 0 || figurinesToUnlink.length > 0

      // 解除关联：清除费用分摊信息
      if (figurinesToUnlink.length > 0) {
        const updates = figurinesToUnlink.map(f => ({
          id: f.id,
          data: {
            batchId: undefined,
            shippingShare: 0,
            taxShare: 0,
            shareWeight: 1,
            totalCost: calculateTotalCost(f.purchasePrice, 0, 0)
          }
        }))
        await Promise.all(updates.map(u => figurineStore.updateFigurine(u.id, u.data)))
      }

      // 更新关联
      if (figurinesToLink.length > 0) {
        await figurineStore.batchUpdate(figurinesToLink.map(f => f.id), { batchId: props.batch.id })
      }

      // 重新计算费用分摊（如果有费用且手办数量变化）
      if ((totalShipping > 0 || totalTax > 0) && hasChanges && currentFigurines.length > 0) {
        const shippingShare = calculateAverageShare(totalShipping, currentFigurines.length)
        const taxShare = calculateAverageShare(totalTax, currentFigurines.length)

        const updates = currentFigurines.map(f => ({
          id: f.id,
          data: {
            shippingShare,
            taxShare,
            shareWeight: 1,
            totalCost: calculateTotalCost(f.purchasePrice, shippingShare, taxShare)
          }
        }))
        await Promise.all(updates.map(u => figurineStore.updateFigurine(u.id, u.data)))
      }

      if (hasChanges) {
        ElMessage.success(`保存成功，已更新手办关联并重新计算费用分摊`)
      } else {
        ElMessage.success('保存成功')
      }
    } else {
      const batch = await batchStore.addBatch(form.value)

      // 自动关联图片范围内的手办
      const figurinesToLink = figurineStore.figurines.filter(
        f => indices.includes(f.imageIndex)
      )

      if (figurinesToLink.length > 0) {
        const ids = figurinesToLink.map(f => f.id)
        await figurineStore.batchUpdate(ids, { batchId: batch.id })

        // 如果有费用，自动计算分摊
        if (totalShipping > 0 || totalTax > 0) {
          const shippingShare = calculateAverageShare(totalShipping, figurinesToLink.length)
          const taxShare = calculateAverageShare(totalTax, figurinesToLink.length)

          const updates = figurinesToLink.map(f => ({
            id: f.id,
            data: {
              shippingShare,
              taxShare,
              shareWeight: 1,
              totalCost: calculateTotalCost(f.purchasePrice, shippingShare, taxShare)
            }
          }))
          await Promise.all(updates.map(u => figurineStore.updateFigurine(u.id, u.data)))
        }

        ElMessage.success(`添加成功，已关联 ${figurinesToLink.length} 个手办`)
      } else {
        ElMessage.success('添加成功')
      }
    }

    emit('saved')
    handleClose()
  } catch (error) {
    ElMessage.error('保存失败，请重试')
    console.error('BatchForm submit error:', error)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>