'use client'

import { useState, useEffect, useCallback } from 'react'
import type { MenuItem } from '@/types/menu'
import type { ChefProfile, Review, WorkingHours } from '@/types/database'

// ── Profil API response tipi ──────────────────────────────────────────────────

export interface ChefProfileData {
  profile: ChefProfile & {
    users: {
      id:         string
      full_name:  string
      avatar_url: string | null
      created_at: string
    }
  }
  menu_items:     MenuItem[]
  reviews:        (Review & { users: { full_name: string; avatar_url: string | null } })[]
  review_count:   number
  review_pages:   number
  rating_dist:    Record<number, number>
  favorite_count: number
}

// ── Çalışma saati yardımcısı ──────────────────────────────────────────────────

const DAY_KEYS  = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const DAY_LABELS: Record<string, string> = {
  mon: 'Pzt', tue: 'Sal', wed: 'Çar',
  thu: 'Per', fri: 'Cum', sat: 'Cmt', sun: 'Paz',
}

export function formatWorkingHours(wh: WorkingHours | null): string {
  if (!wh) return 'Belirtilmemiş'
  const open = DAY_KEYS.filter(d => wh[d])
  if (open.length === 0) return 'Kapalı'
  // Sadece ilk ve son açık günü göster
  const first = open[0], last = open[open.length - 1]
  const hours = wh[first]
  const label = first === last
    ? DAY_LABELS[first]
    : `${DAY_LABELS[first]}–${DAY_LABELS[last]}`
  return hours ? `${label}  ${hours.open}–${hours.close}` : label
}

export function isTodayOpen(wh: WorkingHours | null): boolean {
  if (!wh) return false
  const day = DAY_KEYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
  return !!wh[day]
}

// ── Badge meta ────────────────────────────────────────────────────────────────

export const BADGE_META: Record<string, { label: string; emoji: string; cls: string }> = {
  new:     { label: 'Yeni Aşçı',  emoji: '🌱', cls: 'rozet-silver' },
  trusted: { label: 'Güvenilir',  emoji: '⭐', cls: 'rozet-green'  },
  master:  { label: 'Usta Eller', emoji: '🏅', cls: 'rozet-gold'   },
  chef:    { label: 'Ev Şefi',    emoji: '👑', cls: 'rozet-crown'  },
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useChefProfile(chefId: string) {
  const [data,         setData]         = useState<ChefProfileData | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [reviewPage,   setReviewPage]   = useState(1)
  const [isFavorited,  setIsFavorited]  = useState(false)
  const [favLoading,   setFavLoading]   = useState(false)

  // Profil yükle
  const load = useCallback(async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/chefs/${chefId}?reviews=${page}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Profil yüklenemedi.')
      setData(json)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [chefId])

  useEffect(() => { load(reviewPage) }, [chefId, reviewPage, load])

  // Favori durumu (oturum açıksa)
  useEffect(() => {
    fetch(`/api/favorites/${chefId}`)
      .then(r => r.json())
      .then(d => setIsFavorited(!!d.favorited))
      .catch(() => {})
  }, [chefId])

  const toggleFavorite = async () => {
    setFavLoading(true)
    try {
      const method = isFavorited ? 'DELETE' : 'POST'
      const res = await fetch(`/api/favorites/${chefId}`, { method })
      if (res.ok) setIsFavorited(!isFavorited)
    } finally {
      setFavLoading(false)
    }
  }

  return {
    data,
    loading,
    error,
    reviewPage,
    setReviewPage,
    isFavorited,
    favLoading,
    toggleFavorite,
    reload: () => load(reviewPage),
  }
}
