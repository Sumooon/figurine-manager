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

  async function replaceAll(data: Tag[]) {
    await tagDb.clearAllTags()
    for (const item of data) {
      await tagDb.createTag(item)
    }
    tags.value = data
  }

  return { tags, tagOptions, fetchTags, addTag, updateTag, removeTag, replaceAll }
})