// @ts-nocheck
/**
 * Admin API route'ları
 *
 * GET  /api/admin/stats          — Dashboard özet kartları
 * GET  /api/admin/users          — Kullanıcı listesi (sayfalı + filtre)
 * GET  /api/admin/orders         — Sipariş listesi (sayfalı + filtre)
 * GET  /api/admin/chefs/pending  — Onay bekleyen aşçılar
 */

// ── Ortak yardımcı ────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return null
  }
  return user
}

// ── GET /api/admin/stats ──────────────────────────────────────────────────────

export async function getAdminStats() {
  const supabase = await getSupabaseServerClient()
  const today    = new Date().toISOString().slice(0, 10)   // YYYY-MM-DD
  const weekAgo  = new Date(Date.now() - 7 * 86400000).toISOString()

  const [
    { count: totalUsers },
    { count: totalChefs },
    { count: totalOrders },
    { count: pendingChefs },
    { count: todayOrders },
    { data: revenueData },
    { count: openDisputes },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('chef_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('chef_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', today),
    supabase.from('orders').select('subtotal').eq('payment_status', 'paid').gte('created_at', weekAgo),
    supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'open').catch(() => ({ count: 0 })),
  ])

  const weekRevenue = (revenueData ?? []).reduce((s: number, r: any) => s + (r.subtotal ?? 0), 0)

  return {
    total_users:    totalUsers    ?? 0,
    total_chefs:    totalChefs    ?? 0,
    total_orders:   totalOrders   ?? 0,
    pending_chefs:  pendingChefs  ?? 0,
    today_orders:   todayOrders   ?? 0,
    week_revenue:   weekRevenue,
    open_disputes:  openDisputes  ?? 0,
  }
}
