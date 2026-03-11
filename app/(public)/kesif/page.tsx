// @ts-nocheck
'use client'

import { Suspense } from 'react'
import { useDiscovery } from '@/hooks/useDiscovery'
import { LocationPrompt } from '@/components/discover/LocationPrompt'
import { FilterBar }      from '@/components/discover/FilterBar'
import { ChefListCard }   from '@/components/discover/ChefListCard'
import { MapView }        from '@/components/discover/MapView'

// ── Skeleton ──────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div style={{
      height: 180,
      background: 'var(--warm)',
      borderRadius: 14,
      border: '1.5px solid rgba(232,224,212,0.7)',
      animation: 'shimmer 1.4s infinite',
      backgroundSize: '200% 100%',
      backgroundImage: 'linear-gradient(90deg,var(--gray-light)25%,var(--warm)50%,var(--gray-light)75%)',
    }} />
  )
}

// ── Ana sayfa ─────────────────────────────────────────────────────────────────
function KesifInner() {
  const {
    location,
    coords,
    requestLocation,
    setManualLocation,
    filters,
    updateFilter,
    resetFilters,
    result,
    isLoading,
    error,
    refresh,
    selectedId,
    selectedChef,
    selectChef,
  } = useDiscovery()

  const locationLabel = (() => {
    if (location.status === 'granted') return 'GPS konumunuz'
    if (location.status === 'manual')  return (location as any).label
    return 'Varsayılan konum (Adana)'
  })()

  // ── Henüz konum alınmadı ──
  if (location.status === 'idle') {
    return (
      <LocationPrompt
        location={location}
        onRequestLocation={requestLocation}
        onManualSelect={setManualLocation}
      />
    )
  }

  // ── Konum isteniyor ──
  if (location.status === 'requesting') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 16,
        color: 'var(--gray)',
      }}>
        <div style={{
          width: 48, height: 48,
          border: '4px solid var(--gray-light)',
          borderTopColor: 'var(--orange)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <div style={{ fontSize: 15, fontWeight: 600 }}>Konum alınıyor…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const chefs = result?.chefs ?? []
  const pins  = (result as any)?.pins ?? []

  return (
    <div className="kesif-wrap">

      {/* ── Filtre çubuğu ────────────────────────────────────────────── */}
      <FilterBar
        filters={filters}
        onUpdate={updateFilter}
        onReset={resetFilters}
        total={result?.total ?? 0}
        locationLabel={locationLabel}
        isLoading={isLoading}
      />

      {/* ── Hata ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="kesif-error">
          ⚠️ {error}
          <button className="retry-btn" onClick={refresh}>Yenile</button>
        </div>
      )}

      {/* ── İki sütun: liste + harita ─────────────────────────────── */}
      <div className="kesif-body">

        {/* Sol — Aşçı listesi */}
        <div className="kesif-list" role="list" aria-label="Yakındaki aşçılar">

          {/* Yükleniyor skeleton */}
          {isLoading && chefs.length === 0 && (
            <>
              {[...Array(4)].map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </>
          )}

          {/* Sonuç yok */}
          {!isLoading && chefs.length === 0 && !error && (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <div className="no-results-title">Bu bölgede aşçı bulunamadı</div>
              <div className="no-results-sub">
                Arama mesafesini artırın veya filtreleri sıfırlayın
              </div>
              <button className="retry-btn" onClick={resetFilters}>
                Filtreleri Sıfırla
              </button>
            </div>
          )}

          {/* Kartlar */}
          {chefs.map(chef => (
            <div key={chef.chef_id} role="listitem">
              <ChefListCard
                chef={chef}
                isSelected={chef.chef_id === selectedId}
                onSelect={() => selectChef(
                  chef.chef_id === selectedId ? null : chef.chef_id
                )}
              />
            </div>
          ))}

          {/* Yükleniyor — güncelleme durumunda soluk */}
          {isLoading && chefs.length > 0 && (
            <div className="updating-note">⏳ Güncelleniyor…</div>
          )}
        </div>

        {/* Sağ — Harita (sticky) */}
        <div className="kesif-map-col">
          <MapView
            pins={pins}
            center={coords}
            radiusKm={filters.radius_km}
            selectedId={selectedId}
            onPinClick={(id) => selectChef(id === selectedId ? null : id)}
            selectedChef={selectedChef}
          />
        </div>
      </div>

      <style>{`
        .kesif-wrap {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: calc(100vh - 140px);
        }

        .kesif-error {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background: #FEF2F2;
          border: 1.5px solid #FECACA;
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 13px;
          color: #DC2626;
        }

        .retry-btn {
          padding: 6px 14px;
          background: #DC2626;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.15s;
        }

        .retry-btn:hover { background: #B91C1C; }

        /* ── İki sütun ──────────────────────── */
        .kesif-body {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 16px;
          align-items: start;
          flex: 1;
        }

        @media (max-width: 900px) {
          .kesif-body { grid-template-columns: 1fr; }
          .kesif-map-col { order: -1; }
        }

        /* ── Liste ──────────────────────────── */
        .kesif-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: calc(100vh - 240px);
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: var(--gray-light) transparent;
          padding-right: 4px;
          padding-bottom: 16px;
        }

        .kesif-list::-webkit-scrollbar { width: 4px; }
        .kesif-list::-webkit-scrollbar-track { background: transparent; }
        .kesif-list::-webkit-scrollbar-thumb { background: var(--gray-light); border-radius: 4px; }

        /* ── Harita sütun ────────────────────── */
        .kesif-map-col {
          position: sticky;
          top: 72px;
          height: calc(100vh - 180px);
          min-height: 400px;
        }

        /* ── Boş durum ──────────────────────── */
        .no-results {
          background: var(--warm);
          border-radius: 14px;
          padding: 40px 24px;
          text-align: center;
          border: 1.5px dashed var(--gray-light);
        }

        .no-results-icon { font-size: 40px; margin-bottom: 12px; }

        .no-results-title {
          font-weight: 700;
          font-size: 15px;
          color: var(--brown);
          margin-bottom: 6px;
        }

        .no-results-sub {
          font-size: 13px;
          color: var(--gray);
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .updating-note {
          font-size: 12px;
          color: var(--gray);
          text-align: center;
          padding: 8px;
        }

        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}

export default function KesifPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        color: 'var(--gray)',
        fontSize: 13,
      }}>
        Yükleniyor…
      </div>
    }>
      <KesifInner />
    </Suspense>
  )
}
