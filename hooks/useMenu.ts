'use client'

import { useState, useEffect, useCallback } from 'react'
import type { MenuItem, MenuCategory } from '@/types/menu'

interface UseMenuOptions {
  category?: MenuCategory
  active?:   boolean
}

export function useMenu(opts: UseMenuOptions = {}) {
  const [items,    setItems]    = useState<MenuItem[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  // ── Yükle ─────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams()
    if (opts.category) params.set('category', opts.category)
    if (opts.active !== undefined) params.set('active', String(opts.active))

    try {
      const res  = await fetch(`/api/menu?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Menü yüklenemedi.')
      setItems(data.items)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [opts.category, opts.active])

  useEffect(() => { load() }, [load])

  // ── Oluştur ───────────────────────────────────────────────────────────────

  const create = useCallback(async (payload: Partial<MenuItem>): Promise<MenuItem> => {
    const res  = await fetch('/api/menu', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Yemek eklenemedi.')

    // Optimistic: listenin başına ekle
    setItems(prev => [data.item, ...prev])
    return data.item
  }, [])

  // ── Güncelle ──────────────────────────────────────────────────────────────

  const update = useCallback(async (id: string, payload: Partial<MenuItem>): Promise<MenuItem> => {
    // Optimistic update
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...payload } : item
    ))

    try {
      const res  = await fetch(`/api/menu/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        // Rollback
        await load()
        throw new Error(data.error ?? 'Güncelleme başarısız.')
      }
      // Sunucudan gelen doğrulanmış veriyle güncelle
      setItems(prev => prev.map(item => item.id === id ? data.item : item))
      return data.item
    } catch (e) {
      await load()
      throw e
    }
  }, [load])

  // ── Sil ───────────────────────────────────────────────────────────────────

  const remove = useCallback(async (id: string): Promise<void> => {
    // Optimistic: listeden çıkar
    setItems(prev => prev.filter(item => item.id !== id))

    const res  = await fetch(`/api/menu/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) {
      await load()
      throw new Error(data.error ?? 'Silme başarısız.')
    }
  }, [load])

  // ── Durum değiştir ────────────────────────────────────────────────────────

  const toggleActive = useCallback((id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    return update(id, { is_active: !item.is_active })
  }, [items, update])

  // ── Stok güncelle ─────────────────────────────────────────────────────────

  const updateStock = useCallback((id: string, remaining: number) => {
    return update(id, { remaining_stock: remaining })
  }, [update])

  // ── Fotoğraf yükle ────────────────────────────────────────────────────────

  const uploadPhoto = useCallback(async (
    file:    File,
    itemId?: string
  ): Promise<string> => {
    const form = new FormData()
    form.append('file', file)
    if (itemId) form.append('item_id', itemId)

    const res  = await fetch('/api/menu/upload', { method: 'POST', body: form })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Fotoğraf yüklenemedi.')

    // Yemek güncellendiğinde listeyi de yenile
    if (itemId) await load()

    return data.url
  }, [load])

  // ── Fotoğraf sil ─────────────────────────────────────────────────────────

  const deletePhoto = useCallback(async (
    url:    string,
    itemId?: string
  ): Promise<void> => {
    const res = await fetch('/api/menu/upload', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ url, item_id: itemId }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Fotoğraf silinemedi.')
    if (itemId) await load()
  }, [load])

  return {
    items,
    loading,
    error,
    reload:       load,
    create,
    update,
    remove,
    toggleActive,
    updateStock,
    uploadPhoto,
    deletePhoto,
  }
}
