// @ts-nocheck
'use client'

import { useEffect, useRef, useState } from 'react'
import type { MapPin, NearbyChef } from '@/types/discover'

interface MapViewProps {
  pins:          MapPin[]
  center:        { lat: number; lng: number }
  radiusKm:      number
  selectedId:    string | null
  onPinClick:    (chefId: string) => void
  selectedChef?: NearbyChef | null
}

// ── Google Maps yükleyici (singleton) ────────────────────────────────────────
let mapsLoaded = false
let mapsLoading = false
const mapsCallbacks: (() => void)[] = []

function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    if (mapsLoaded) return resolve()
    if (mapsLoading) { mapsCallbacks.push(resolve); return }

    mapsLoading = true
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`
    script.async = true
    script.defer = true
    script.onload = () => {
      mapsLoaded = true
      mapsLoading = false
      resolve()
      mapsCallbacks.forEach(cb => cb())
      mapsCallbacks.length = 0
    }
    document.head.appendChild(script)
  })
}

// ── Pin renkleri ─────────────────────────────────────────────────────────────
function getPinColor(pin: MapPin, isSelected: boolean): string {
  if (isSelected)    return '#E8622A'  // turuncu (seçili)
  if (!pin.is_open)  return '#9CA3AF'  // gri (kapalı)
  return '#3D6B47'                      // yeşil (açık)
}

export function MapView({
  pins,
  center,
  radiusKm,
  selectedId,
  onPinClick,
  selectedChef,
}: MapViewProps) {
  const mapRef      = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<google.maps.Map | null>(null)
  const markersRef  = useRef<Map<string, google.maps.Marker>>(new Map())
  const circleRef   = useRef<google.maps.Circle | null>(null)
  const [isLoading, setIsLoading]     = useState(true)
  const [loadError, setLoadError]     = useState(false)
  const [popup,     setPopup]         = useState<{ pin: MapPin; x: number; y: number } | null>(null)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? ''

  // ── Haritayı başlat ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !apiKey) {
      setIsLoading(false)
      if (!apiKey) setLoadError(true)
      return
    }

    loadGoogleMaps(apiKey)
      .then(() => {
        if (!mapRef.current || mapInstance.current) return

        const map = new google.maps.Map(mapRef.current, {
          center:          { lat: center.lat, lng: center.lng },
          zoom:            13,
          mapTypeControl:  false,
          fullscreenControl: false,
          streetViewControl: false,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM,
          },
          styles: [
            { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit',      stylers: [{ visibility: 'off' }] },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#d4e6f1' }],
            },
            {
              featureType: 'landscape',
              elementType: 'geometry',
              stylers: [{ color: '#f5edd8' }],
            },
          ],
        })

        mapInstance.current = map
        setIsLoading(false)
      })
      .catch(() => {
        setIsLoading(false)
        setLoadError(true)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey])

  // ── Merkez değişince haritayı kaydır ─────────────────────────────────────
  useEffect(() => {
    if (!mapInstance.current) return
    mapInstance.current.panTo({ lat: center.lat, lng: center.lng })
  }, [center.lat, center.lng])

  // ── Yarıçap çemberi ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstance.current) return

    circleRef.current?.setMap(null)

    circleRef.current = new google.maps.Circle({
      map:           mapInstance.current,
      center:        { lat: center.lat, lng: center.lng },
      radius:        radiusKm * 1000,
      fillColor:     '#3D6B47',
      fillOpacity:   0.06,
      strokeColor:   '#3D6B47',
      strokeOpacity: 0.35,
      strokeWeight:  1.5,
    })
  }, [center.lat, center.lng, radiusKm])

  // ── Kullanıcı konumu marker ───────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstance.current) return

    new google.maps.Marker({
      map:      mapInstance.current,
      position: { lat: center.lat, lng: center.lng },
      title:    'Konumunuz',
      icon: {
        path:        google.maps.SymbolPath.CIRCLE,
        scale:       10,
        fillColor:   '#E8622A',
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 3,
      },
      zIndex: 1000,
    })
  }, [center.lat, center.lng])

  // ── Pin'leri güncelle ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstance.current) return

    // Eski marker'ları kaldır
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current.clear()

    pins.forEach(pin => {
      const isSelected = pin.chef_id === selectedId
      const color      = getPinColor(pin, isSelected)

      const marker = new google.maps.Marker({
        map:      mapInstance.current!,
        position: { lat: pin.lat, lng: pin.lng },
        title:    pin.full_name,
        icon: {
          path: `M 0,-20 C -8,-20 -14,-14 -14,-6
                 C -14,4 0,16 0,16
                 C 0,16 14,4 14,-6
                 C 14,-14 8,-20 0,-20 Z`,
          fillColor:    color,
          fillOpacity:  1,
          strokeColor:  'white',
          strokeWeight: 2,
          scale:        isSelected ? 1.3 : 1,
          anchor:       new google.maps.Point(0, 16),
          labelOrigin:  new google.maps.Point(0, -6),
        },
        label: {
          text:      '👩‍🍳',
          fontSize:  isSelected ? '14px' : '12px',
          fontWeight:'bold',
        },
        zIndex: isSelected ? 999 : pin.is_open ? 10 : 5,
        animation: isSelected ? google.maps.Animation.BOUNCE : undefined,
      })

      marker.addListener('click', () => {
        onPinClick(pin.chef_id)
      })

      markersRef.current.set(pin.chef_id, marker)
    })
  }, [pins, selectedId, onPinClick])

  // ── Seçili aşçı değişince haritayı orala ──────────────────────────────────
  useEffect(() => {
    if (!mapInstance.current || !selectedId) return
    const pin = pins.find(p => p.chef_id === selectedId)
    if (pin) {
      mapInstance.current.panTo({ lat: pin.lat, lng: pin.lng })
      mapInstance.current.setZoom(15)
    }
  }, [selectedId, pins])

  // ── API key yoksa placeholder ─────────────────────────────────────────────
  if (!apiKey || loadError) {
    return <MapPlaceholder pins={pins} selectedId={selectedId} onPinClick={onPinClick} />
  }

  return (
    <div className="map-wrap">
      {isLoading && (
        <div className="map-loading">
          <div className="map-spinner" />
          <span>Harita yükleniyor…</span>
        </div>
      )}

      <div
        ref={mapRef}
        className="map-container"
        style={{ opacity: isLoading ? 0 : 1 }}
        aria-label="Yakınındaki aşçılar haritası"
      />

      {/* Seçili aşçı özet kutusu */}
      {selectedChef && (
        <div className="map-chef-popup">
          <div className="mcp-name">{selectedChef.full_name}</div>
          <div className="mcp-meta">
            {selectedChef.avg_rating && (
              <span>⭐ {selectedChef.avg_rating.toFixed(1)}</span>
            )}
            <span>📍 {selectedChef.distance_km.toFixed(1)} km</span>
            {selectedChef.min_price && (
              <span>₺{selectedChef.min_price.toFixed(0)}'den</span>
            )}
          </div>
          <div className={`mcp-status ${selectedChef.is_open ? 'open' : 'closed'}`}>
            {selectedChef.is_open ? '✅ Şu an açık' : '⏰ Kapalı'}
          </div>
          <a href={`/asci/${selectedChef.chef_id}`} className="mcp-btn">
            Profili Gör →
          </a>
        </div>
      )}

      <style>{`
        .map-wrap {
          position: relative;
          border-radius: 14px;
          overflow: hidden;
          height: 100%;
          min-height: 400px;
          background: var(--warm);
          border: 1.5px solid var(--gray-light);
        }

        .map-loading {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 13px;
          color: var(--gray);
          z-index: 10;
          background: var(--warm);
        }

        .map-spinner {
          width: 32px; height: 32px;
          border: 3px solid var(--gray-light);
          border-top-color: var(--orange);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .map-container {
          width: 100%;
          height: 100%;
          min-height: 400px;
          transition: opacity 0.3s;
        }

        /* Seçili aşçı popup */
        .map-chef-popup {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--white);
          border-radius: 12px;
          padding: 12px 16px;
          box-shadow: 0 4px 24px rgba(74,44,14,0.2);
          border: 1.5px solid var(--orange);
          min-width: 200px;
          max-width: 280px;
          z-index: 100;
          animation: slide-up 0.2s ease;
        }

        @keyframes slide-up {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .mcp-name {
          font-weight: 700;
          font-size: 14px;
          color: var(--brown);
          margin-bottom: 5px;
        }

        .mcp-meta {
          display: flex;
          gap: 8px;
          font-size: 11.5px;
          color: var(--gray);
          margin-bottom: 5px;
        }

        .mcp-status {
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .mcp-status.open  { color: var(--green); }
        .mcp-status.closed{ color: var(--gray); }

        .mcp-btn {
          display: block;
          padding: 7px 14px;
          background: var(--orange);
          color: white;
          border-radius: 8px;
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
          text-align: center;
          transition: background 0.15s;
        }

        .mcp-btn:hover { background: #d4541e; }
      `}</style>
    </div>
  )
}

// ── API key yoksa statik SVG placeholder ──────────────────────────────────────
function MapPlaceholder({
  pins,
  selectedId,
  onPinClick,
}: {
  pins:       MapPin[]
  selectedId: string | null
  onPinClick: (id: string) => void
}) {
  return (
    <div className="map-placeholder-wrap">
      <div className="map-placeholder-inner">
        {/* Dekoratif ızgara */}
        <svg width="100%" height="100%" className="map-grid">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(61,107,71,0.1)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Merkez noktası */}
        <div className="placeholder-center">
          <div className="placeholder-pulse" />
          <span style={{ fontSize: 20, position: 'relative', zIndex: 1 }}>📍</span>
        </div>

        {/* Pin'ler (sahte pozisyon) */}
        {pins.slice(0, 8).map((pin, idx) => {
          const angle = (idx / Math.max(pins.length, 6)) * Math.PI * 2
          const r     = 80 + (idx % 3) * 30
          const x     = 50 + Math.cos(angle) * r * 0.3
          const y     = 50 + Math.sin(angle) * r * 0.2
          const color = getPinColor(pin, pin.chef_id === selectedId)

          return (
            <button
              key={pin.chef_id}
              className={`placeholder-pin ${pin.chef_id === selectedId ? 'pin-selected' : ''}`}
              style={{ left: `${x}%`, top: `${y}%`, background: color }}
              onClick={() => onPinClick(pin.chef_id)}
              title={pin.full_name}
              aria-label={pin.full_name}
            >
              👩‍🍳
            </button>
          )
        })}

        {/* Bilgi */}
        <div className="placeholder-note">
          🗺️ Gerçek harita için Google Maps API anahtarı gerekli
          <br />
          <code style={{ fontSize: 10 }}>NEXT_PUBLIC_GOOGLE_MAPS_KEY</code> env değişkenini ayarlayın
        </div>
      </div>

      <style>{`
        .map-placeholder-wrap {
          border-radius: 14px;
          overflow: hidden;
          height: 100%;
          min-height: 400px;
          background: linear-gradient(135deg, #E8F4E8, #D4EDD4);
          border: 2px dashed var(--green-light, #6BA37A);
          position: relative;
        }

        .map-placeholder-inner {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 400px;
        }

        .map-grid { position: absolute; inset: 0; }

        .placeholder-center {
          position: absolute;
          left: 50%; top: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .placeholder-pulse {
          position: absolute;
          width: 60px; height: 60px;
          background: rgba(232,98,42,0.15);
          border-radius: 50%;
          animation: expand 2s infinite;
        }

        @keyframes expand {
          0%   { transform: scale(0); opacity: 1; }
          100% { transform: scale(3); opacity: 0; }
        }

        .placeholder-pin {
          position: absolute;
          transform: translate(-50%, -50%);
          width: 32px; height: 32px;
          border-radius: 50%;
          border: 2.5px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.15s;
        }

        .placeholder-pin:hover { transform: translate(-50%, -50%) scale(1.2); }
        .pin-selected { transform: translate(-50%, -50%) scale(1.3) !important; }

        .placeholder-note {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(255,255,255,0.92);
          border-radius: 8px;
          padding: 8px 14px;
          font-size: 11px;
          color: var(--gray);
          text-align: center;
          white-space: nowrap;
          line-height: 1.8;
        }
      `}</style>
    </div>
  )
}
