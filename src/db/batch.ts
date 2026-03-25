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

export async function clearAllBatches(): Promise<void> {
  const db = await getDB()
  await db.clear('batches')
}