import { useFigurineStore } from '@/stores/figurine'
import { useTradeStore } from '@/stores/trade'

/**
 * 数据迁移：修复老数据
 * - 根据交易记录更新手办状态为"已出"
 */
export async function migrateData() {
  const figurineStore = useFigurineStore()
  const tradeStore = useTradeStore()

  await Promise.all([
    figurineStore.fetchFigurines(),
    tradeStore.fetchTrades()
  ])

  // 找出有交易记录但状态不是"已出"的手办
  const soldFigurineIds = new Set(tradeStore.trades.map(t => t.figurineId))

  for (const figurine of figurineStore.figurines) {
    if (soldFigurineIds.has(figurine.id) && figurine.status !== 'sold') {
      console.log(`Migrating figurine ${figurine.name} to sold status`)
      await figurineStore.updateFigurine(figurine.id, { status: 'sold' })
    }
  }

  console.log('Data migration completed')
}