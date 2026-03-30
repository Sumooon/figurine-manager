import type { Trade } from '@/types'

/**
 * 计算总成本
 */
export function calculateTotalCost(
  purchasePrice: number,
  shippingShare: number = 0,
  taxShare: number = 0
): number {
  return Math.round((purchasePrice + shippingShare + taxShare) * 100) / 100
}

/**
 * 计算咸鱼手续费
 * 卖出价为0时（如送人）不产生手续费
 */
export function calculateXianyuFee(sellPrice: number): number {
  if (sellPrice <= 0) return 0
  const fee = sellPrice * 0.006
  return Math.max(0.1, Math.round(fee * 100) / 100)
}

/**
 * 计算实际收入
 */
export function calculateActualIncome(sellPrice: number, xianyuFee: number = 0): number {
  return Math.round((sellPrice - xianyuFee) * 100) / 100
}

/**
 * 计算利润
 */
export function calculateProfit(actualIncome: number, totalCost: number): number {
  return Math.round((actualIncome - totalCost) * 100) / 100
}

/**
 * 计算利润率
 */
export function calculateProfitRate(profit: number, totalCost: number): number {
  if (totalCost === 0) return 0
  return Math.round((profit / totalCost) * 10000) / 100
}

/**
 * 创建交易记录时计算所有财务字段
 */
export function calculateTradeFinancials(
  sellPrice: number,
  totalCost: number,
  hasXianyuFee: boolean = true
): Pick<Trade, 'xianyuFee' | 'actualIncome' | 'profit' | 'profitRate'> {
  const xianyuFee = hasXianyuFee ? calculateXianyuFee(sellPrice) : 0
  const actualIncome = calculateActualIncome(sellPrice, xianyuFee)
  const profit = calculateProfit(actualIncome, totalCost)
  const profitRate = calculateProfitRate(profit, totalCost)

  return { xianyuFee, actualIncome, profit, profitRate }
}

/**
 * 费用均摊计算
 */
export function calculateAverageShare(totalAmount: number, count: number): number {
  if (count === 0) return 0
  return Math.round((totalAmount / count) * 100) / 100
}

/**
 * 费用按权重分摊
 */
export function calculateWeightedShare(
  totalAmount: number,
  weights: number[]
): number[] {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  if (totalWeight === 0) return weights.map(() => 0)

  return weights.map(w =>
    Math.round((totalAmount * w / totalWeight) * 100) / 100
  )
}

/**
 * 判断利润率是否低于阈值
 */
export function isProfitBelowThreshold(profitRate: number, threshold: number = 10): boolean {
  return profitRate < threshold
}