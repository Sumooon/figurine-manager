import { describe, it, expect } from 'vitest'
import {
  calculateTotalCost,
  calculateXianyuFee,
  calculateActualIncome,
  calculateProfit,
  calculateProfitRate,
  calculateAverageShare,
  calculateWeightedShare,
  isProfitBelowThreshold,
  calculateTradeFinancials
} from '../calculator'

describe('calculator', () => {
  describe('calculateTotalCost', () => {
    it('should calculate total cost correctly', () => {
      expect(calculateTotalCost(100, 10, 5)).toBe(115)
      expect(calculateTotalCost(200)).toBe(200)
    })

    it('should handle decimal values', () => {
      expect(calculateTotalCost(100.50, 10.25, 5.25)).toBe(116)
    })
  })

  describe('calculateXianyuFee', () => {
    it('should calculate fee as 0.6% of price', () => {
      expect(calculateXianyuFee(100)).toBe(0.6)
      expect(calculateXianyuFee(1000)).toBe(6)
    })

    it('should return minimum 0.1 for small amounts', () => {
      expect(calculateXianyuFee(1)).toBe(0.1)
      expect(calculateXianyuFee(10)).toBe(0.1)
    })

    it('should return 0 when sellPrice is 0 (gift scenario)', () => {
      expect(calculateXianyuFee(0)).toBe(0)
      expect(calculateXianyuFee(-1)).toBe(0)
    })
  })

  describe('calculateActualIncome', () => {
    it('should calculate actual income correctly', () => {
      expect(calculateActualIncome(500, 10)).toBe(490)
      expect(calculateActualIncome(1000, 6)).toBe(994)
    })

    it('should handle zero fee', () => {
      expect(calculateActualIncome(500, 0)).toBe(500)
    })
  })

  describe('calculateProfit', () => {
    it('should calculate profit correctly', () => {
      expect(calculateProfit(500, 300)).toBe(200)
      expect(calculateProfit(100, 150)).toBe(-50)
    })
  })

  describe('calculateProfitRate', () => {
    it('should calculate profit rate correctly', () => {
      expect(calculateProfitRate(50, 100)).toBe(50)
      expect(calculateProfitRate(100, 100)).toBe(100)
    })

    it('should return 0 when cost is 0', () => {
      expect(calculateProfitRate(50, 0)).toBe(0)
    })
  })

  describe('calculateAverageShare', () => {
    it('should calculate average share', () => {
      expect(calculateAverageShare(100, 10)).toBe(10)
      expect(calculateAverageShare(150, 3)).toBe(50)
    })

    it('should return 0 when count is 0', () => {
      expect(calculateAverageShare(100, 0)).toBe(0)
    })
  })

  describe('calculateWeightedShare', () => {
    it('should calculate weighted share', () => {
      const result = calculateWeightedShare(100, [1, 1, 2])
      expect(result[0]).toBe(25)
      expect(result[1]).toBe(25)
      expect(result[2]).toBe(50)
    })

    it('should return zeros when total weight is 0', () => {
      const result = calculateWeightedShare(100, [0, 0, 0])
      expect(result).toEqual([0, 0, 0])
    })
  })

  describe('isProfitBelowThreshold', () => {
    it('should return true when below threshold', () => {
      expect(isProfitBelowThreshold(5, 10)).toBe(true)
    })

    it('should return false when above threshold', () => {
      expect(isProfitBelowThreshold(15, 10)).toBe(false)
    })

    it('should return false when equal to threshold', () => {
      expect(isProfitBelowThreshold(10, 10)).toBe(false)
    })

    it('should use default threshold of 10', () => {
      expect(isProfitBelowThreshold(5)).toBe(true)
      expect(isProfitBelowThreshold(15)).toBe(false)
    })
  })

  describe('calculateTradeFinancials', () => {
    it('should calculate all financial fields correctly', () => {
      const result = calculateTradeFinancials(500, 300)
      expect(result.xianyuFee).toBe(3)
      expect(result.actualIncome).toBe(497)
      expect(result.profit).toBe(197)
      expect(result.profitRate).toBe(65.67)
    })

    it('should handle sellPrice=0 (gift scenario)', () => {
      const result = calculateTradeFinancials(0, 100)
      expect(result.xianyuFee).toBe(0)
      expect(result.actualIncome).toBe(0)
      expect(result.profit).toBe(-100)
      expect(result.profitRate).toBe(-100)
    })
  })
})