// @ts-nocheck
/**
 * useChefDashboard
 * Chef dashboard için Realtime veri yönetimi.
 *
 * - İlk yükleme: API'den tam veri
 * - Supabase Realtime: orders tablosu değişince anında yenile
 */
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { DashboardData } from '@/types/dashboard'

interface UseChefDashboardReturn {
  data:       DashboardData | null
  isLoading:  boolean
  error:      string | null
  refresh:    () => Promise<void>
  updateOrderStatus: (orderId: string, action: string) => Promise<{ success: boolean; error?: string }>
  toggleOpen: (isOpen: boolean) => Promise<void>
}

export function useChefDashboard(): UseChefDashboardReturn {
  const [data,      setData]      = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const mountedRef = useRef(true)
  const supabase   = getSupabaseBrowserClient()

  // ── Veri çek ──────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    setError(null)

    try {
      const res  = await fetch('/api/chef/dashboard')
      const json = await res.json()

      if (!res.ok) throw new Error(json.error ?? 'Veri alınamadı')
      if (mountedRef.current) setData(json)
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Bağlantı hatası')
      }
    } finally {
      if (mountedRef.current && !silent) setIsLoading(false)
    }
  }, [])

  const refresh = useCallback(() => fetchData(false), [fetchData])

  // ── Sipariş durumu güncelle ────────────────────────────────────────────────
  const updateOrderStatus = useCallback(async (
    orderId: string,
    action:  string,
    cancellationNote?: string
  ) => {
    const res = await fetch('/api/chef/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, action, cancellationNote }),
    })
    const json = await res.json()

    if (res.ok) {
      await fetchData(true)
    }

    return { success: res.ok, error: json.error }
  }, [fetchData])

  // ── Açık/kapalı toggle ────────────────────────────────────────────────────
  const toggleOpen = useCallback(async (isOpen: boolean) => {
    setData(prev => prev ? {
      ...prev,
      stats: { ...prev.stats, is_open: isOpen }
    } : prev)

    await fetch('/api/chef/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_open: isOpen }),
    })
  }, [])

  // ── İlk yükleme ───────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true
    fetchData()

    return () => {
      mountedRef.current = false
    }
  }, [fetchData])

  // ── Supabase Realtime ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!data?.stats.chef_id) return

    const chefId = data.stats.chef_id

    const channel = supabase
      .channel(`chef-dashboard-${chefId}`)
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'orders',
          filter: `chef_id=eq.${chefId}`,
        },
        (payload) => {
          console.log('📦 Realtime order change:', payload.eventType)
          fetchData(true)
        }
      )
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'menu_items',
          filter: `chef_id=eq.${chefId}`,
        },
        () => fetchData(true)
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime bağlantısı kuruldu')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [data?.stats.chef_id, supabase, fetchData])

  return { data, isLoading, error, refresh, updateOrderStatus, toggleOpen }
}