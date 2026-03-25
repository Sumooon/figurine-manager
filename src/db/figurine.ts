import { v4 as uuidv4 } from 'uuid'
import { getDB, toPlainObject } from './index'
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
  // 转换为纯对象
  const plainData = toPlainObject(data)
  const figurine: Figurine = {
    ...plainData,
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
  // 转换为纯对象，解决 Vue 响应式数组无法序列化的问题
  const plainData = toPlainObject(data)
  await db.put('figurines', {
    ...existing,
    ...plainData,
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
  const plainData = toPlainObject(data)

  for (const id of ids) {
    const existing = await tx.store.get(id)
    if (existing) {
      await tx.store.put({ ...existing, ...plainData, updatedAt: now })
    }
  }

  await tx.done
}

export async function clearAllFigurines(): Promise<void> {
  const db = await getDB()
  await db.clear('figurines')
}

export async function importFigurine(figurine: Figurine): Promise<void> {
  const db = await getDB()
  const data = toPlainObject(figurine)
  await db.put('figurines', data)
}