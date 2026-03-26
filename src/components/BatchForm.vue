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
function parseImageRange(range: string): number[] {
  const indices: number[] = []
  const parts = range.split(',').map(p => p.trim())

  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(n => parseInt(n.trim()))
      for (let i = start; i <= end; i++) {
        indices.push(i)
      }
    } else {
      indices.push(parseInt(part))
    }
  }

  return indices
}

function handleClose() {
  emit('update:visible', false)
  resetForm()
}

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid) return

  saving.value = true
  try {
    const indices = parseImageRange(form.value.imageRange)

    if (isEdit.value && props.batch) {
      await batchStore.updateBatch(props.batch.id, form.value)

      // 更新手办关联：将范围内的手办关联到此批次
      const figurinesToLink = figurineStore.figurines.filter(
        f => indices.includes(f.imageIndex) && f.batchId !== props.batch!.id
      )

      if (figurinesToLink.length > 0) {
        const ids = figurinesToLink.map(f => f.id)
        await figurineStore.batchUpdate(ids, { batchId: props.batch.id })
        ElMessage.success(`保存成功，关联 ${figurinesToLink.length} 个新手办`)
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
        ElMessage.success(`添加成功，已关联 ${figurinesToLink.length} 个手办`)
      } else {
        ElMessage.success('添加成功')
      }
    }

    emit('saved')
    handleClose()
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