import { v4 as uuidv4 } from 'uuid'
import { apiGet, apiGetPaginated, apiPost, apiPatch, apiDel, buildQuery, toPlainObject, type PaginatedResult } from './index'
import type { Trade } from '@/types'

// 筛选参数
export interface TradeFilter {
  startDate?: number
  endDate?: number
  search?: string  // 手办名称搜索
}

// 分页参数
export interface PaginationParams {
  page: number
  pageSize: number
}

// 交易（带手办名称）
export interface TradeWithFigurineName extends Trade {
  figurineName: string
}

function fromDB(row: any): Trade {
  return {
    id: row.id,
    figurineId: row.figurine_id,
    sellPrice: parseFloat(row.sell_price) || 0,
    xianyuLink: row.xianyu_link,
    xianyuOrderId: row.xianyu_order_id,
    xianyuStatus: row.xianyu_status,
    xianyuBuyerId: row.xianyu_buyer_id,
    xianyuFee: parseFloat(row.xianyu_fee) || 0,
    actualIncome: parseFloat(row.actual_income) || 0,
    profit: parseFloat(row.profit) || 0,
    profitRate: parseFloat(row.profit_rate) || 0,
    buyerName: row.buyer_name,
    buyerContact: row.buyer_contact,
    soldAt: new Date(row.sold_at).getTime(),
    remark: row.remark,
    isActive: row.is_active ?? true,
  }
}

// 从数据库转换（带手办名称）
function fromDBWithFigurineName(row: any): TradeWithFigurineName {
  return {
    ...fromDB(row),
    figurineName: row.figurines?.name || '未知',
  }
}

function toDB(data: Partial<Trade>): any {
  const result: any = {}
  if (data.figurineId !== undefined) result.figurine_id = data.figurineId
  if (data.sellPrice !== undefined) result.sell_price = data.sellPrice
  if (data.xianyuLink !== undefined) result.xianyu_link = data.xianyuLink
  if (data.xianyuOrderId !== undefined) result.xianyu_order_id = data.xianyuOrderId
  if (data.xianyuStatus !== undefined) result.xianyu_status = data.xianyuStatus
  if (data.xianyuBuyerId !== undefined) result.xianyu_buyer_id = data.xianyuBuyerId
  if (data.xianyuFee !== undefined) result.xianyu_fee = data.xianyuFee
  if (data.actualIncome !== undefined) result.actual_income = data.actualIncome
  if (data.profit !== undefined) result.profit = data.profit
  if (data.profitRate !== undefined) result.profit_rate = data.profitRate
  if (data.buyerName !== undefined) result.buyer_name = data.buyerName
  if (data.buyerContact !== undefined) result.buyer_contact = data.buyerContact
  if (data.soldAt !== undefined) result.sold_at = new Date(data.soldAt).toISOString()
  if (data.remark !== undefined) result.remark = data.remark
  if (data.isActive !== undefined) result.is_active = data.isActive
  return result
}

export async function getAllTrades(): Promise<Trade[]> {
  const rows = await apiGet<any[]>('/trades' + buildQuery({ order: 'sold_at.desc' }))
  return rows.map(fromDB)
}

// 分页查询交易（带手办名称）
export async function getTradesPaginated(
  pagination: PaginationParams,
  filter?: TradeFilter
): Promise<PaginatedResult<TradeWithFigurineName>> {
  const { page, pageSize } = pagination
  const offset = (page - 1) * pageSize

  // PostgREST 关联查询：获取交易及关联的手办名称
  const params: Record<string, string> = {
    select: 'id,figurine_id,sell_price,xianyu_link,xianyu_order_id,xianyu_status,xianyu_buyer_id,xianyu_fee,actual_income,profit,profit_rate,buyer_name,buyer_contact,sold_at,remark,is_active,figurines(name)',
    order: 'sold_at.desc',
    limit: String(pageSize),
    offset: String(offset),
  }

  // 日期范围筛选
  if (filter?.startDate) {
    params['sold_at'] = `gte.${new Date(filter.startDate).toISOString()}`
  }
  if (filter?.endDate) {
    const existing = params['sold_at']
    if (existing) {
      params['sold_at'] = `${existing},lte.${new Date(filter.endDate).toISOString()}`
    } else {
      params['sold_at'] = `lte.${new Date(filter.endDate).toISOString()}`
    }
  }

  const result = await apiGetPaginated<any[]>('/trades' + buildQuery(params))
  return {
    data: result.data.map(fromDBWithFigurineName),
    total: result.total,
  }
}

export async function getTradeById(id: string): Promise<Trade | undefined> {
  const rows = await apiGet<any[]>('/trades' + buildQuery({ id: `eq.${id}` }))
  return rows[0] ? fromDB(rows[0]) : undefined
}

export async function getTradesByFigurine(figurineId: string): Promise<Trade[]> {
  const rows = await apiGet<any[]>('/trades' + buildQuery({ figurine_id: `eq.${figurineId}` }))
  return rows.map(fromDB)
}

export async function getActiveTradeByFigurine(figurineId: string): Promise<Trade | undefined> {
  const rows = await apiGet<any[]>('/trades' + buildQuery({
    figurine_id: `eq.${figurineId}`,
    is_active: 'eq.true'
  }))
  return rows[0] ? fromDB(rows[0]) : undefined
}

export async function createTrade(data: Omit<Trade, 'id'>): Promise<Trade> {
  const id = uuidv4()
  const plainData = toPlainObject(data)
  const row = await apiPost('/trades', {
    id,
    ...toDB(plainData),
  })
  return fromDB(row)
}

export async function updateTrade(id: string, data: Partial<Trade>): Promise<void> {
  const plainData = toPlainObject(data)
  await apiPatch('/trades' + buildQuery({ id: `eq.${id}` }), toDB(plainData))
}

export async function deleteTrade(id: string): Promise<void> {
  await apiDel('/trades' + buildQuery({ id: `eq.${id}` }))
}

// 将同一手办的其他交易设为非活跃
export async function deactivateOtherTrades(figurineId: string, excludeId: string): Promise<void> {
  await apiPatch('/trades' + buildQuery({
    figurine_id: `eq.${figurineId}`,
    id: `not.eq.${excludeId}`,
    is_active: 'eq.true'
  }), { is_active: false })
}

export async function clearAllTrades(): Promise<void> {
  await apiDel('/trades')
}

export async function importTrade(trade: Trade): Promise<void> {
  const data = toPlainObject(trade)
  await apiPost('/trades', {
    id: data.id,
    ...toDB(data),
  })
}

// 搜索手办（用于选择手办弹窗）
export async function searchFigurines(keyword: string): Promise<Array<{ id: string; name: string }>> {
  if (!keyword || keyword.length < 1) return []

  const rows = await apiGet<any[]>(
    '/figurines' + buildQuery({
      select: 'id,name',
      name: `ilike.%${keyword}%`,
      limit: '20',
    })
  )
  return rows.map(r => ({ id: r.id, name: r.name }))
}