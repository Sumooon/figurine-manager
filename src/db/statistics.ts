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
 * 调用 Supabase RPC 函数
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const url = `${API_BASE}/rpc/get_dashboard_stats`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': API_KEY,
      'Authorization': `Bearer ${API_KEY}`,
    },
  })

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`)
  }

  return res.json()
}