import { v4 as uuidv4 } from 'uuid'
import { getDB, toPlainObject } from './index'
import type { Tag } from '@/types'

export async function getAllTags(): Promise<Tag[]> {
  const db = await getDB()
  return db.getAll('tags')
}

export async function createTag(data: Omit<Tag, 'id'>): Promise<Tag> {
  const db = await getDB()
  const plainData = toPlainObject(data)
  const tag: Tag = { ...plainData, id: uuidv4() }
  await db.add('tags', tag)
  return tag
}

export async function updateTag(id: string, data: Partial<Tag>): Promise<void> {
  const db = await getDB()
  const existing = await db.get('tags', id)
  if (!existing) throw new Error('Tag not found')
  const plainData = toPlainObject(data)
  await db.put('tags', { ...existing, ...plainData })
}

export async function deleteTag(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('tags', id)
}

export async function clearAllTags(): Promise<void> {
  const db = await getDB()
  await db.clear('tags')
}

export async function importTag(tag: Tag): Promise<void> {
  const db = await getDB()
  const data = toPlainObject(tag)
  await db.put('tags', data)
}