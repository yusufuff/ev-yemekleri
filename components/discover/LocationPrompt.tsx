'use client'

import type { LocationState } from '@/hooks/useDiscovery'

// Popüler şehirler (hızlı seçim)
const POPULAR_CITIES = [
  { label: 'Adana, Seyhan',    lat: 37.0017, lng: 35.3289 },
  { label: 'İstanbul, Kadıköy', lat: 40.9912, lng: 29.0299 },
  { label: 'Ankara, Çankaya',   lat: 39.9334, lng: 32.8597 },
  { label: 'İzmir, Karşıyaka',  lat: 38.4570, lng: 27.1214 },
  { label: 'Bursa, Osmangazi',  lat: 40.1826, lng: 29.0667 },
  { label: 'Antalya, Muratpaşa',lat: 36.8841, lng: 30.7056 },
]

interface LocationPromptProps {
  location:           LocationState
  onRequestLocation:  () => void
  onManualSelect:     (lat: number, lng: number, label: string) => void
}

export function LocationPrompt({
  location,
  onRequestLocation,
  onManualSelect,
}: LocationPromptProps) {
  const isDenied     = location.status === 'denied'
  const isRequesting = location.status === 'requesting'

  return (
    <div className="loc-prompt">

      {/* Ana kart */}
      <div className="loc-card">
        <div className="loc-icon">📍</div>
        <div className="loc-head">
          <h2 className="loc-title">Yakınımdaki aşçıları göster</h2>
          <p className="loc-sub">
            {isDenied
              ? location.message
              : 'Konumunuzu paylaşın veya şehir seçin.'}
          </p>
        </div>

        {/* GPS butonu */}
        <button
          className={`loc-gps-btn ${isRequesting ? 'loading' : ''} ${isDenied ? 'denied' : ''}`}
          onClick={onRequestLocation}
          disabled={isRequesting}
          aria-busy={isRequesting}
        >
          {isRequesting ? (
            <><span className="loc-spinner" /> Konum alınıyor…</>
          ) : isDenied ? (
            <><span>🔄</span> Tekrar Dene</>
          ) : (
            <><span>🎯</span> Konumumu Kullan</>
          )}
        </button>

        <div className="loc-divider"><span>veya şehir seçin</span></div>

        {/* Şehir grid */}
        <div className="loc-city-grid">
          {POPULAR_CITIES.map(city => (
            <button
              key={city.label}
              className="loc-city-btn"
              onClick={() => onManualSelect(city.lat, city.lng, city.label)}
            >
              <span className="loc-city-pin">📍</span>
              {city.label}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .loc-prompt {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          padding: 24px;
        }

        .loc-card {
          background: var(--white);
          border-radius: 20px;
          padding: 40px;
          max-width: 480px;
          width: 100%;
          box-shadow: 0 4px 32px rgba(74,44,14,0.10);
          border: 1px solid rgba(232,224,212,0.8);
          text-align: center;
        }

        .loc-icon {
          font-size: 48px;
          margin-bottom: 16px;
          animation: bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1);
        }

        @keyframes bounce-in {
          0%   { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .loc-head { margin-bottom: 24px; }

        .loc-title {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 900;
          color: var(--brown);
          margin: 0 0 8px;
        }

        .loc-sub {
          font-size: 13px;
          color: var(--gray);
          line-height: 1.6;
          margin: 0;
        }

        .loc-gps-btn {
          width: 100%;
          padding: 14px;
          background: var(--orange);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          margin-bottom: 20px;
        }

        .loc-gps-btn:hover:not(:disabled) {
          background: #d4541e;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(232,98,42,0.4);
        }

        .loc-gps-btn:disabled { opacity: 0.8; cursor: wait; }

        .loc-gps-btn.denied {
          background: var(--warm);
          color: var(--brown);
          border: 2px solid var(--gray-light);
        }

        .loc-spinner {
          width: 18px; height: 18px;
          border: 2.5px solid rgba(255,255,255,0.35);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          display: inline-block;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .loc-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--gray);
          font-size: 12px;
          margin-bottom: 16px;
        }

        .loc-divider::before, .loc-divider::after {
          content: ''; flex: 1;
          height: 1px;
          background: var(--gray-light);
        }

        .loc-city-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .loc-city-btn {
          padding: 9px 12px;
          background: var(--warm);
          border: 1.5px solid var(--gray-light);
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          color: var(--brown-mid);
          cursor: pointer;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s;
        }

        .loc-city-btn:hover {
          border-color: var(--orange);
          background: #FFF5EF;
          color: var(--orange);
        }

        .loc-city-pin { font-size: 14px; }
      `}</style>
    </div>
  )
}
