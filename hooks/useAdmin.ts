// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Tipler ───────────────────────────────────────────────────────────────────

export interface AdminStats {
  total_users:    number
  total_chefs:    number
  total_orders:   number
  pending_chefs:  number
  today_orders:   number
  active_orders:  number
  week_revenue:   number
  revenue_growth: string | null
}

export interface ChartPoint {
  date:    string
  day:     string
  count:   number
  revenue: number
}

export interface AdminUser {
  id:               string
  full_name:        string
  phone:            string
  role:             'buyer' | 'chef' | 'admin'
  is_active:        boolean
  platform_credit:  number
  created_at:       string
  chef_profiles?:   { verification_status: string; average_rating: number; total_orders: number }[]
}

export interface AdminOrder {
  id:              string
  order_number:    string
  status:          string
  payment_status:  string
  subtotal:        number
  delivery_fee:    number
  delivery_type:   string
  created_at:      string
  buyer:           { full_name: string; phone: string }
  chef:            { user: { full_name: string } }
  order_items:     { quantity: number; unit_price: number; menu_item: { name: string } }[]
}

export interface AdminChef {
  id:                   string
  bio:                  string
  kitchen_types:        string[]
  average_rating:       number
  total_orders:         number
  verification_status:  string
  is_active:            boolean
  created_at:           string
  user:                 { id: string; full_name: string; phone: string; avatar_url: string | null }
  chef_documents:       { id: string; doc_type: string; file_url: string }[]
}

// ─── useAdminStats ────────────────────────────────────────────────────────────

export function useAdminStats() {
  const [stats,   setStats]   = useState<AdminStats | null>(null)
  const [chart,   setChart]   = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { setStats(d.stats); setChart(d.chart) })
      .finally(() => setLoading(false))
  }, [])

  return { stats, chart, loading }
}

// ─── useAdminUsers ────────────────────────────────────────────────────────────

export function useAdminUsers() {
  const [users,   setUsers]   = useState<AdminUser[]>([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(false)
  const [page,    setPage]    = useState(1)
  const [filters, setFilters] = useState({ role: '', q: '', active: '' })

  const fetch_ = useCallback(async (p = page, f = filters) => {
    setLoading(true)
    const sp = new URLSearchParams({ page: String(p), limit: '20' })
    if (f.role)   sp.set('role',   f.role)
    if (f.q)      sp.set('q',      f.q)
    if (f.active) sp.set('active', f.active)

    const res = await fetch('/api/admin/users?' + sp)
    const d   = await res.json()
    setUsers(d.users ?? [])
    setTotal(d.total ?? 0)
    setLoading(false)
  }, [page, filters])

  useEffect(() => { fetch_() }, [page, filters])

  const updateFilter = (key: string, val: string) => {
    const f = { ...filters, [key]: val }
    setFilters(f); setPage(1); fetch_(1, f)
  }

  const banUser = async (user_id: string, ban: boolean) => {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, action: ban ? 'ban' : 'unban' }),
    })
    setUsers(prev => prev.map(u => u.id === user_id ? { ...u, is_active: !ban } : u))
  }

  return { users, total, loading, page, setPage, filters, updateFilter, banUser }
}

// ─── useAdminOrders ───────────────────────────────────────────────────────────

export function useAdminOrders() {
  const [orders,  setOrders]  = useState<AdminOrder[]>([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(false)
  const [page,    setPage]    = useState(1)
  const [filters, setFilters] = useState({ status: '', q: '', date_from: '', date_to: '' })

  const fetch_ = useCallback(async (p = page, f = filters) => {
    setLoading(true)
    const sp = new URLSearchParams({ page: String(p), limit: '25' })
    if (f.status)    sp.set('status',    f.status)
    if (f.q)         sp.set('q',         f.q)
    if (f.date_from) sp.set('date_from', f.date_from)
    if (f.date_to)   sp.set('date_to',   f.date_to)

    const res = await fetch('/api/admin/orders?' + sp)
    const d   = await res.json()
    setOrders(d.orders ?? [])
    setTotal(d.total  ?? 0)
    setLoading(false)
  }, [page, filters])

  useEffect(() => { fetch_() }, [page, filters])

  const updateFilter = (key: string, val: string) => {
    const f = { ...filters, [key]: val }
    setFilters(f); setPage(1); fetch_(1, f)
  }

  const cancelOrder = async (order_id: string, reason?: string) => {
    const res = await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id, action: 'cancel', reason }),
    })
    if (res.ok) setOrders(prev => prev.map(o => o.id === order_id ? { ...o, status: 'cancelled' } : o))
    return res.ok
  }

  const refundOrder = async (order_id: string, reason?: string) => {
    const res = await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id, action: 'refund', reason }),
    })
    if (res.ok) setOrders(prev => prev.map(o => o.id === order_id ? { ...o, payment_status: 'refunded' } : o))
    return res.ok
  }

  return { orders, total, loading, page, setPage, filters, updateFilter, cancelOrder, refundOrder }
}

// ─── useAdminChefs ────────────────────────────────────────────────────────────

export function useAdminChefs() {
  const [chefs,   setChefs]   = useState<AdminChef[]>([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(false)
  const [status,  setStatus]  = useState<'pending' | 'approved' | 'rejected'>('pending')

  const fetch_ = useCallback(async (s = status) => {
    setLoading(true)
    const res = await fetch(`/api/admin/chefs?status=${s}&limit=20`)
    const d   = await res.json()
    setChefs(d.chefs ?? [])
    setTotal(d.total ?? 0)
    setLoading(false)
  }, [status])

  useEffect(() => { fetch_() }, [status])

  const changeStatus = (s: typeof status) => { setStatus(s); fetch_(s) }

  const reviewChef = async (
    chef_id: string,
    action: 'approve' | 'reject' | 'suspend' | 'unsuspend',
    reason?: string
  ) => {
    const res = await fetch('/api/admin/chefs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chef_id, action, reason }),
    })
    if (res.ok) {
      setChefs(prev => prev.filter(c => c.id !== chef_id))
      setTotal(t => t - 1)
    }
    return res.ok
  }

  return { chefs, total, loading, status, changeStatus, reviewChef }
}
