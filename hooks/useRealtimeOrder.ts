// @ts-nocheck
'use client'

/**
 * useRealtimeOrder
 * ─────────────────
 * Tek bir siparişi Supabase Realtime üzerinden dinler.
 * Durum değişikliklerini (status, timestamps) anlık yansıtır.
 * Bağlantı kesilirse otomatik yeniden bağlanır.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Order, OrderStatus } from '@/types/database'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ── Sipariş adımları ──────────────────────────────────────────────────────────

export const ORDER_STEPS: {
  status:  OrderStatus
  emoji:   string
  label:   string
  desc:    string
}[] = [
  { status: 'pending',   emoji: '📋', label: 'Sipariş Alındı',   desc: 'Aşçı onayı bekleniyor…'          },
  { status: 'confirmed', emoji: '✅', label: 'Onaylandı',         desc: 'Aşçı siparişi kabul etti'        },
  { status: 'preparing', emoji: '👩‍🍳', label: 'Hazırlanıyor',    desc: 'Aşçı yemeğinizi hazırlıyor'       },
  { status: 'ready',     emoji: '📦', label: 'Hazır',             desc: 'Yemeğiniz paketlendi'             },
  { status: 'on_way',    emoji: '🛵', label: 'Yolda',             desc: 'Siparişiniz kapınıza geliyor'     },
  { status: 'delivered', emoji: '🏠', label: 'Teslim Edildi',     desc: 'Afiyet olsun! 🎉'                },
]

const STATUS_ORDER: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'on_way', 'delivered']

export function getStepIndex(status: OrderStatus): number {
  return STATUS_ORDER.indexOf(status)
}

// ── Tahmini süre hesaplama ────────────────────────────────────────────────────

export function getETA(order: Order): { min: number; max: number } | null {
  if (['delivered', 'cancelled'].includes(order.status)) return null
  const currentIdx = getStepIndex(order.status as OrderStatus)
  const remaining  = STATUS_ORDER.length - 1 - currentIdx
  // Her adım ~7-10 dk → kaba tahmin
  return { min: remaining * 5, max: remaining * 12 }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface RealtimeOrderState {
  order:         Order | null
  loading:       boolean
  error:         string | null
  connected:     boolean          // Realtime bağlantı aktif mi
  lastUpdated:   Date | null
  statusHistory: { status: OrderStatus; at: Date }[]
}

export function useRealtimeOrder(orderId: string): RealtimeOrderState & {
  reload: () => void
} {
  const [state, setState] = useState<RealtimeOrderState>({
    order:        null,
    loading:      true,
    error:        null,
    connected:    false,
    lastUpdated:  null,
    statusHistory: [],
  })

  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase   = getSupabaseBrowserClient()

  // ── İlk yükle ─────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items ( id, item_name, item_price, quantity, line_total ),
          chef_profiles!inner (
            id, location_approx, avg_rating,
            users!inner ( full_name, avatar_url, phone )
          )
        `)
        .eq('id', orderId)
        .single()

      if (error || !data) throw new Error(error?.message ?? 'Sipariş bulunamadı.')

      setState(s => ({
        ...s,
        order:       data as unknown as Order,
        loading:     false,
        lastUpdated: new Date(),
        // İlk geçmişi durum zaman damgasından üret
        statusHistory: buildHistory(data as any),
      }))
    } catch (e: any) {
      setState(s => ({ ...s, loading: false, error: e.message }))
    }
  }, [orderId, supabase])

  // ── Durum geçmişi yardımcısı ──────────────────────────────────────────────

  function buildHistory(order: any): { status: OrderStatus; at: Date }[] {
    const pairs: [OrderStatus, string | null][] = [
      ['pending',   order.created_at],
      ['confirmed', order.confirmed_at],
      ['preparing', order.preparing_at],
      ['ready',     order.ready_at],
      ['on_way',    order.on_way_at],
      ['delivered', order.delivered_at],
    ]
    return pairs
      .filter(([, ts]) => !!ts)
      .map(([status, ts]) => ({ status, at: new Date(ts!) }))
  }

  // ── Realtime kanalı ───────────────────────────────────────────────────────

  useEffect(() => {
    load()

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
        payload => {
          const updated = payload.new as Order

          setState(s => ({
            ...s,
            order:       { ...(s.order ?? ({} as Order)), ...updated },
            lastUpdated: new Date(),
            // Yeni durumu geçmişe ekle (tekrar etmiyorsa)
            statusHistory: s.statusHistory.some(h => h.status === updated.status)
              ? s.statusHistory
              : [...s.statusHistory, { status: updated.status, at: new Date() }],
          }))
        }
      )
      .subscribe(subStatus => {
        setState(s => ({ ...s, connected: subStatus === 'SUBSCRIBED' }))
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, supabase, load])

  return { ...state, reload: load }
}

// ── useRealtimeBuyerOrders — Alıcının tüm aktif siparişleri ──────────────────

export function useRealtimeBuyerOrders(buyerId: string) {
  const [orders,  setOrders]  = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseBrowserClient()

  const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'on_way']

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*), chef_profiles!inner(id, users!inner(full_name, avatar_url))')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false })
      .limit(50)

    setOrders((data ?? []) as unknown as Order[])
    setLoading(false)
  }, [buyerId, supabase])

  useEffect(() => {
    load()

    // Kullanıcının tüm siparişlerini izle
    const channel = supabase
      .channel(`buyer-orders:${buyerId}`)
      .on('postgres_changes', {
        event:  '*',
        schema: 'public',
        table:  'orders',
        filter: `buyer_id=eq.${buyerId}`,
      }, payload => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new as unknown as Order, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev =>
            prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o)
          )
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [buyerId, supabase, load])

  const active    = orders.filter(o => ACTIVE_STATUSES.includes(o.status as OrderStatus))
  const completed = orders.filter(o => !ACTIVE_STATUSES.includes(o.status as OrderStatus))

  return { orders, active, completed, loading, reload: load }
}

// ── useRealtimeChefOrders — Aşçının bekleyen siparişleri ─────────────────────

export function useRealtimeChefOrders(chefId: string) {
  const [orders,  setOrders]  = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [newCount, setNewCount] = useState(0)  // Oturum başından yeni gelen
  const supabase = getSupabaseBrowserClient()

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*), users!buyer_id(full_name, phone, avatar_url)')
      .eq('chef_id', chefId)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'on_way'])
      .order('created_at', { ascending: false })

    setOrders((data ?? []) as unknown as Order[])
    setLoading(false)
  }, [chefId, supabase])

  useEffect(() => {
    load()

    const channel = supabase
      .channel(`chef-orders:${chefId}`)
      .on('postgres_changes', {
        event:  '*',
        schema: 'public',
        table:  'orders',
        filter: `chef_id=eq.${chefId}`,
      }, payload => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new as unknown as Order, ...prev])
          setNewCount(c => c + 1)
          // Tarayıcı bildirimi
          if (Notification.permission === 'granted') {
            new Notification('🛒 Yeni Sipariş!', {
              body: `#${(payload.new as any).order_number} numaralı sipariş geldi.`,
              icon: '/icons/icon-192.png',
            })
          }
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev =>
            prev
              .map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o)
              .filter(o => !['delivered', 'cancelled'].includes(o.status))
          )
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [chefId, supabase, load])

  return { orders, loading, newCount, clearNew: () => setNewCount(0), reload: load }
}
