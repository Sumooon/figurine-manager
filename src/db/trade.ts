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