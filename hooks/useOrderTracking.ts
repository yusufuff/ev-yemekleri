// @ts-nocheck
'use client'

/**
 * useOrderTracking — Supabase Realtime ile sipariş durumunu canlı takip eder.
 * Wireframe'deki "Canlı Takip" sayfasının backend bağlantısı.
 */
import { useEffect, useState, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { OrderStatus } from '@/types/database'

interface OrderState {
  id:             string
  status:         OrderStatus
  order_number:   string
  estimated_time: number | null  // dakika
}

interface UseOrderTrackingReturn {
  order:   OrderState | null
  loading: boolean
  error:   string | null
}

export function useOrderTracking(orderId: string): UseOrderTrackingReturn {
  const [order, setOrder]   = useState<OrderState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  const supabase = getSupabaseBrowserClient()

  const fetchOrder = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('orders')
      .select('id, status, order_number')
      .eq('id', orderId)
      .single()

    if (err) { setError('Sipariş bilgisi alınamadı.'); return }
    setOrder(data as OrderState)
    setLoading(false)
  }, [orderId, supabase])

  useEffect(() => {
    fetchOrder()

    // Realtime subscription
    const channel = supabase
      .channel(`order:${orderId}`)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder(prev => ({
            ...prev!,
            status: payload.new.status as OrderStatus,
          }))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orderId, fetchOrder, supabase])

  return { order, loading, error }
}

// ─── Durum açıklamaları ───────────────────────────────────────────────────────

export const ORDER_STATUS_LABELS: Record<OrderStatus, { label: string; icon: string }> = {
  pending:   { label: 'Onay Bekleniyor', icon: '⏳' },
  confirmed: { label: 'Onaylandı',       icon: '✅' },
  preparing: { label: 'Hazırlanıyor',    icon: '👨‍🍳' },
  ready:     { label: 'Hazır',           icon: '📦' },
  on_way:    { label: 'Yolda',           icon: '🛵' },
  delivered: { label: 'Teslim Edildi',   icon: '✅' },
  cancelled: { label: 'İptal Edildi',    icon: '❌' },
}

export const ORDER_STEPS: OrderStatus[] = [
  'pending', 'confirmed', 'preparing', 'on_way', 'delivered',
]
