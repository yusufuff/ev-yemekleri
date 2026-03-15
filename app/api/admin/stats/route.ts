import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({
    total_users: 1240, total_chefs: 84, total_orders: 4820,
    pending_chefs: 3, today_orders: 47, active_orders: 12,
    week_revenue: 18450, revenue_growth: '+23%',
    chart: [
      { date: '2025-03-09', day: 'Pzt', count: 38, revenue: 2100 },
      { date: '2025-03-10', day: 'Sal', count: 52, revenue: 2800 },
      { date: '2025-03-11', day: 'Çar', count: 41, revenue: 2200 },
      { date: '2025-03-12', day: 'Per', count: 67, revenue: 3600 },
      { date: '2025-03-13', day: 'Cum', count: 71, revenue: 3900 },
      { date: '2025-03-14', day: 'Cmt', count: 58, revenue: 3150 },
      { date: '2025-03-15', day: 'Paz', count: 47, revenue: 2700 },
    ],
  })
}