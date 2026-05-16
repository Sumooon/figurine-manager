import { API_BASE, API_KEY } from './index'

// 统计数据
export interface DashboardStats {
  totalCost: number
  totalIncome: number
  totalProfit: number
  avgProfitRate: number
  statusCounts: Record<string, number>
}

/**
 * 获取 Dashboard 统计数据
 * 调用 PostgREST RPC 函数
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const url = `${API_BASE}/rpc/get_dashboard_stats`

  // 只在有 API_KEY 时才添加认证 header
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (API_KEY) {
    headers['apikey'] = API_KEY
    headers['Authorization'] = `Bearer ${API_KEY}`
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
  })

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`)
  }

  return res.json()
}