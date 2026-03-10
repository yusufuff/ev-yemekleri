/**
 * Chef Dashboard Types
 * 009_views.sql'deki chef_dashboard_stats view'ına karşılık gelir.
 */

export interface DashboardStats {
  chef_id:            string
  user_id:            string
  is_open:            boolean
  avg_rating:         number | null
  total_reviews:      number
  total_orders:       number
  badge:              'new' | 'trusted' | 'master' | 'chef'
  today_order_count:  number
  today_earning:      number
  pending_count:      number
  active_count:       number
  week_earning:       number
  month_earning:      number
  pending_balance:    number
  unanswered_reviews: number
}

export interface DashboardOrder {
  id:              string
  order_number:    string
  status:          string
  delivery_type:   'pickup' | 'delivery'
  total_amount:    number
  chef_earning:    number
  items_summary:   string
  buyer_name:      string
  buyer_phone:     string
  buyer_district:  string | null
  age_minutes:     number
  created_at:      string
  confirmed_at:    string | null
  preparing_at:    string | null
  ready_at:        string | null
  on_way_at:       string | null
  delivered_at:    string | null
  notes:           string | null
}

export interface EarningsDay {
  day:          string   // 'YYYY-MM-DD'
  order_count:  number
  earning:      number
}

export interface StockItem {
  id:              string
  name:            string
  category:        string
  price:           number
  daily_stock:     number | null
  remaining_stock: number | null
  is_active:       boolean
}

export interface DashboardData {
  stats:           DashboardStats
  pendingOrders:   DashboardOrder[]
  activeOrders:    DashboardOrder[]
  recentOrders:    DashboardOrder[]
  earningsByDay:   EarningsDay[]
  stockItems:      StockItem[]
  chefName:        string
}
