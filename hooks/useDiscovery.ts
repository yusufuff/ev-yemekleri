/**
 * useDiscovery
 * Keşif sayfası için merkezi state yönetimi.
 *
 * - Tarayıcı Geolocation API ile konum tespit
 * - URL searchParams ile filtre senkronizasyonu
 * - Debounced API çağrısı (300ms)
 * - Seçilen aşçı state'i (harita ↔ liste senkronizasyonu)
 */
'use client'

import {
  useState, useEffect, useCallback, useRef, useMemo
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type {
  DiscoverFilters, DiscoverResult, NearbyChef,
  SortBy, MenuCategory, DeliveryFilter,
} from '@/types/discover'

// ── Konum tipi ────────────────────────────────────────────────────────────────
export type LocationState =
  | { status: 'idle' }
  | { status: 'requesting' }
  | { status: 'granted'; lat: number; lng: number; city?: string }
  | { status: 'denied'; message: string }
  | { status: 'manual'; lat: number; lng: number; label: string }

// ── Varsayılan konum (İstanbul merkezi — kullanıcı izin vermezse) ─────────────
const DEFAULT_LOCATION = { lat: 37.0017, lng: 35.3289 }  // Adana Seyhan

// ── Filtre defaults ───────────────────────────────────────────────────────────
const DEFAULT_FILTERS: Omit<DiscoverFilters, 'lat' | 'lng'> = {
  radius_km: 5,
  category:  null,
  sort_by:   'distance',
  delivery:  'all',
  open_only: false,
}

// ── Debounce util ─────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

// ── Ana hook ──────────────────────────────────────────────────────────────────
export function useDiscovery() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  // ── Konum state ──
  const [location, setLocation] = useState<LocationState>({ status: 'idle' })

  // ── Filtreler (URL'den başlat) ──
  const [filters, setFilters] = useState<Omit<DiscoverFilters, 'lat' | 'lng'>>(() => ({
    radius_km: Number(searchParams.get('r')  ?? DEFAULT_FILTERS.radius_km),
    category:  (searchParams.get('cat')  as MenuCategory) ?? null,
    sort_by:   (searchParams.get('sort') as SortBy) ?? DEFAULT_FILTERS.sort_by,
    delivery:  (searchParams.get('del')  as DeliveryFilter) ?? DEFAULT_FILTERS.delivery,
    open_only: searchParams.get('open') === '1',
  }))

  // ── Sonuçlar ──
  const [result,     setResult]     = useState<DiscoverResult | null>(null)
  const [isLoading,  setIsLoading]  = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // ── Konum koordinatları ──
  const coords = useMemo(() => {
    if (location.status === 'granted' || location.status === 'manual') {
      return { lat: location.lat, lng: location.lng }
    }
    return DEFAULT_LOCATION
  }, [location])

  // ── Debounced filtreler (radius değişince 400ms bekle) ──
  const debouncedFilters = useDebounce(filters, 400)

  // ── API çağrısı ──
  const fetchChefs = useCallback(async () => {
    if (!mountedRef.current) return

    setIsLoading(true)
    setError(null)

    const params = new URLSearchParams({
      lat:       String(coords.lat),
      lng:       String(coords.lng),
      radius:    String(debouncedFilters.radius_km),
      sort:      debouncedFilters.sort_by,
      delivery:  debouncedFilters.delivery,
      open_only: debouncedFilters.open_only ? '1' : '0',
      ...(debouncedFilters.category ? { category: debouncedFilters.category } : {}),
    })

    try {
      const res  = await fetch(`/api/discover?${params}`)
      const json = await res.json()

      if (!res.ok) throw new Error(json.error)
      if (mountedRef.current) setResult(json)
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Bağlantı hatası')
      }
    } finally {
      if (mountedRef.current) setIsLoading(false)
    }
  }, [coords, debouncedFilters])

  // Filtre/konum değişince yeniden çek
  useEffect(() => {
    if (location.status !== 'idle' && location.status !== 'requesting') {
      fetchChefs()
    }
  }, [fetchChefs, location.status])

  // ── URL senkronizasyonu ──
  useEffect(() => {
    const p = new URLSearchParams()
    if (filters.radius_km !== 5)    p.set('r',    String(filters.radius_km))
    if (filters.category)            p.set('cat',  filters.category)
    if (filters.sort_by !== 'distance') p.set('sort', filters.sort_by)
    if (filters.delivery !== 'all')  p.set('del',  filters.delivery)
    if (filters.open_only)           p.set('open', '1')
    router.replace(`/kesif${p.size ? '?' + p.toString() : ''}`, { scroll: false })
  }, [filters, router])

  // ── Konum izni iste ──
  const requestLocation = useCallback(() => {
    setLocation({ status: 'requesting' })

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          status: 'granted',
          lat:    pos.coords.latitude,
          lng:    pos.coords.longitude,
        })
      },
      (err) => {
        const msg =
          err.code === 1 ? 'Konum izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.' :
          err.code === 2 ? 'Konum belirlenemedi.' :
          'Konum isteği zaman aşımına uğradı.'
        setLocation({ status: 'denied', message: msg })
        // İzin yoksa varsayılan konumla devam et
        fetchChefs()
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    )
  }, [fetchChefs])

  // ── Manuel konum ──
  const setManualLocation = useCallback((lat: number, lng: number, label: string) => {
    setLocation({ status: 'manual', lat, lng, label })
  }, [])

  // ── Filtre güncelle ──
  const updateFilter = useCallback(<K extends keyof typeof filters>(
    key: K,
    value: typeof filters[K]
  ) => {
    setFilters(f => ({ ...f, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  // ── Seçilen aşçı ──
  const selectedChef = result?.chefs.find(c => c.chef_id === selectedId) ?? null

  return {
    // Konum
    location,
    coords,
    requestLocation,
    setManualLocation,

    // Filtreler
    filters,
    updateFilter,
    resetFilters,

    // Sonuçlar
    result,
    isLoading,
    error,
    refresh: fetchChefs,

    // Seçim (liste ↔ harita)
    selectedId,
    selectedChef,
    selectChef: setSelectedId,
  }
}
