// components/map/LeafletMap.tsx
'use client'
// @ts-nocheck
import { useEffect, useRef } from 'react'

interface Chef {
  chef_id: string
  full_name: string
  avg_rating: number | null
  distance_km: number
  is_open: boolean
  lat: number | null
  lng: number | null
  location_approx: string | null
}

interface LeafletMapProps {
  chefs: Chef[]
  userCoords: { lat: number; lng: number } | null
  radius: number
  onRadius: (v: number) => void
  selectedPin: string | null
  onPinClick: (id: string | null) => void
}

export default function LeafletMap({ chefs, userCoords, radius, onRadius, selectedPin, onPinClick }: LeafletMapProps) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const circleRef = useRef(null)
  const userMarkerRef = useRef(null)

  // Varsayılan merkez — Adana Seyhan
  const defaultCenter = { lat: 36.9914, lng: 35.3308 }
  const center = userCoords ?? defaultCenter

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Leaflet CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    import('leaflet').then(L => {
      // Marker icon düzeltmesi
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current, {
        center: [center.lat, center.lng],
        zoom: 13,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Kullanıcı konumu değişince haritayı güncelle
  useEffect(() => {
    if (!mapInstanceRef.current) return
    import('leaflet').then(L => {
      const map = mapInstanceRef.current

      // Eski user marker ve çemberi kaldır
      if (userMarkerRef.current) { userMarkerRef.current.remove(); userMarkerRef.current = null }
      if (circleRef.current) { circleRef.current.remove(); circleRef.current = null }

      const lat = userCoords?.lat ?? defaultCenter.lat
      const lng = userCoords?.lng ?? defaultCenter.lng

      // Kullanıcı marker
      const userIcon = L.divIcon({
        html: `<div style="font-size:28px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">📍</div>`,
        iconSize: [20, 40],
        iconAnchor: [14, 40],
        className: '',
      })
      userMarkerRef.current = L.marker([lat, lng], { icon: userIcon })
        .addTo(map)
        .bindPopup(userCoords ? '📍 Konumunuz' : '📍 Adana, Seyhan (varsayılan)')

      // Yarıçap çemberi
      circleRef.current = L.circle([lat, lng], {
        radius: radius * 1000,
        color: '#E8622A',
        fillColor: '#E8622A',
        fillOpacity: 0.05,
        weight: 2,
        dashArray: '8 4',
      }).addTo(map)

      map.setView([lat, lng], 13)
    })
  }, [userCoords])

  // Radius değişince çemberi güncelle
  useEffect(() => {
    if (!circleRef.current) return
    circleRef.current.setRadius(radius * 1000)
  }, [radius])

  // Aşçı pinlerini güncelle
  useEffect(() => {
    if (!mapInstanceRef.current) return
    import('leaflet').then(L => {
      const map = mapInstanceRef.current

      // Eski pinleri kaldır
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []

      chefs.forEach(chef => {
        if (!chef.lat || !chef.lng) return

        const isSelected = selectedPin === chef.chef_id
        const color = chef.is_open ? '#3D6B47' : '#9CA3AF'

        const icon = L.divIcon({
          html: `
            <div style="
              background:${color};
              width:${isSelected ? '40px' : '32px'};
              height:${isSelected ? '40px' : '32px'};
              border-radius:50%;
              border:2px solid white;
              box-shadow:0 2px 8px rgba(0,0,0,0.2);
              display:flex;align-items:center;justify-content:center;
              font-size:${isSelected ? '18px' : '14px'};
              transition:all 0.2s;
            ">👩‍🍳</div>
          `,
          iconSize: [isSelected ? 40 : 32, isSelected ? 40 : 32],
          iconAnchor: [isSelected ? 20 : 16, isSelected ? 20 : 16],
          className: '',
        })

        const marker = L.marker([chef.lat, chef.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:'DM Sans',sans-serif;min-width:160px">
              <div style="font-weight:700;font-size:14px;color:#4A2C0E;margin-bottom:4px">${chef.full_name}</div>
              <div style="font-size:12px;color:#E8622A;margin-bottom:2px">⭐ ${chef.avg_rating?.toFixed(1) ?? '—'}</div>
              <div style="font-size:12px;color:#8A7B6B;margin-bottom:8px">📍 ${chef.distance_km.toFixed(1)} km</div>
              <a href="/asci/${chef.chef_id}" style="display:block;text-align:center;padding:6px;background:#E8622A;color:white;border-radius:6px;font-size:12px;font-weight:700;text-decoration:none">Profile Git →</a>
            </div>
          `)

        marker.on('click', () => onPinClick(chef.chef_id))
        if (isSelected) marker.openPopup()

        markersRef.current.push(marker)
      })
    })
  }, [chefs, selectedPin])

  return (
   <div style={{ position: 'relative', top: '72px', margin: '0 48px' }}>
    <button
  onClick={async () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(pos => {
      onRadius && onRadius(radius)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([pos.coords.latitude, pos.coords.longitude], 14)
      }
    })
  }}
  style={{ position: 'absolute', top: 12, right: 12, zIndex: 999, width: 44, height: 44, borderRadius: '50%', background: 'white', border: '2px solid #ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
>
  
</button>
      {/* Mesafe slider */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '14px 16px', marginBottom: '12px',  boxShadow: '0 2px 12px rgba(74,44,14,0.08)', border: '1px solid #E8E0D4' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#8A7B6B', fontWeight: 600 }}> Mesafe:</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#E8622A' }}>{radius} km</span>
        </div>
        <input type="range" min={1} max={10} value={radius} onChange={e => onRadius(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#E8622A', cursor: 'pointer' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#8A7B6B', marginTop: '4px' }}>
          <span>1 km</span><span>10 km</span>
        </div>
      </div>

      {/* Harita */}
      <div style={{ position: 'relative' }}>
  <button onClick={() => { if (!navigator.geolocation) return; navigator.geolocation.getCurrentPosition(pos => { if (mapInstanceRef.current) mapInstanceRef.current.setView([pos.coords.latitude, pos.coords.longitude], 14) }) }} style={{ position: 'absolute', top: 8, right: 8, zIndex: 999, width: 40, height: 40, borderRadius: '50%', background: 'white', border: '2px solid #ef4444', cursor: 'pointer', fontSize: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📍</button>
  <div ref={mapRef} style={{ height: '320px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #E8E0D4', zIndex: 1 }} />
</div>

      {/* Açıklama */}
      <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: '#8A7B6B' }}>
        <span>🟢 Açık aşçı</span>
        <span>⚫ Kapalı</span>
        <span>🔴 Konumunuz</span>
      </div>
    </div>
  )
}